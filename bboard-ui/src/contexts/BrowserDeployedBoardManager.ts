// This file is part of midnightntwrk/example-bboard.
// Copyright (C) Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  BBoardAPI,
  type BBoardCircuitKeys,
  type BBoardProviders,
  type DeployedBBoardAPI,
  type BBoardDerivedState,
} from '../../../api/src/index';
import { State } from '../../../contract/src/index';
import { type ContractAddress, fromHex, toHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { BehaviorSubject as RxBehaviorSubject, type Observable as RxObservable } from 'rxjs';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  type Observable,
  take,
  tap,
  throwError,
  timeout,
} from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';
import { ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import semver from 'semver';
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { BBoardPrivateState } from '@midnight-ntwrk/bboard-contract';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';
import { setNetworkId, NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';

// --- Mock API for local demo (no Lace wallet / proof server) ---
// Provides instant, in-memory simulation of every ZK circuit operation.
let _isFallbackMode = false;

class MockBBoardAPI implements DeployedBBoardAPI {
  readonly deployedContractAddress: ContractAddress;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  readonly deployedContract: any = {} as any;
  private readonly _state$: RxBehaviorSubject<BBoardDerivedState>;
  readonly state$: RxObservable<BBoardDerivedState>;

  constructor(contractAddress: ContractAddress) {
    this.deployedContractAddress = contractAddress;
    this._state$ = new RxBehaviorSubject<BBoardDerivedState>({
      state: State.NONE,
      sequence: 0n,
      datasetTitle: undefined,
      datasetCount: 0n,
      activeResearcherPk: new Uint8Array(32),
      auditLogCount: 0n,
      lastProofHash: new Uint8Array(32),
      isOwner: true,
    });
    this.state$ = this._state$.asObservable();
  }

  private _update(patch: Partial<BBoardDerivedState>): void {
    this._state$.next({ ...this._state$.value, ...patch });
  }

  async registerDataset(title: string): Promise<void> {
    await Promise.resolve();
    const s = this._state$.value;
    this._update({ datasetTitle: title, datasetCount: s.datasetCount + 1n, auditLogCount: s.auditLogCount + 1n });
  }

  async requestAccess(_datasetId: Uint8Array): Promise<void> {
    await Promise.resolve();
    const s = this._state$.value;
    this._update({ state: State.REQUESTED, auditLogCount: s.auditLogCount + 1n });
  }

  async grantPermission(_datasetId: Uint8Array, researcherPk: Uint8Array): Promise<void> {
    await Promise.resolve();
    const s = this._state$.value;
    this._update({ state: State.GRANTED, activeResearcherPk: researcherPk, auditLogCount: s.auditLogCount + 1n });
  }

  async submitAccessProof(_datasetId: Uint8Array, patientRecordHash: Uint8Array): Promise<void> {
    await Promise.resolve();
    const s = this._state$.value;
    this._update({ lastProofHash: patientRecordHash, auditLogCount: s.auditLogCount + 1n });
  }

  async revokeAccess(_datasetId: Uint8Array): Promise<void> {
    await Promise.resolve();
    const s = this._state$.value;
    this._update({ state: State.REVOKED, auditLogCount: s.auditLogCount + 1n });
  }
}
// --- end MockBBoardAPI ---

/**
 * An in-progress bulletin board deployment.
 */
export interface InProgressBoardDeployment {
  readonly status: 'in-progress';
}

/**
 * A deployed bulletin board deployment.
 */
export interface DeployedBoardDeployment {
  readonly status: 'deployed';

  /**
   * The {@link DeployedBBoardAPI} instance when connected to an on network bulletin board contract.
   */
  readonly api: DeployedBBoardAPI;
}

/**
 * A failed bulletin board deployment.
 */
export interface FailedBoardDeployment {
  readonly status: 'failed';

  /**
   * The error that caused the deployment to fail.
   */
  readonly error: Error;
}

/**
 * A bulletin board deployment.
 */
export type BoardDeployment = InProgressBoardDeployment | DeployedBoardDeployment | FailedBoardDeployment;

/**
 * Provides access to bulletin board deployments.
 */
export interface DeployedBoardAPIProvider {
  /**
   * Gets the observable set of board deployments.
   *
   * @remarks
   * This property represents an observable array of {@link BoardDeployment}, each also an
   * observable. Changes to the array will be emitted as boards are resolved (deployed or joined),
   * while changes to each underlying board can be observed via each item in the array.
   */
  readonly boardDeployments$: Observable<Array<Observable<BoardDeployment>>>;

  /**
   * Joins or deploys a bulletin board contract.
   *
   * @param contractAddress An optional contract address to use when resolving.
   * @returns An observable board deployment.
   *
   * @remarks
   * For a given `contractAddress`, the method will attempt to find and join the identified bulletin board
   * contract; otherwise it will attempt to deploy a new one.
   */
  readonly resolve: (contractAddress?: ContractAddress) => Observable<BoardDeployment>;
}

/**
 * A {@link DeployedBoardAPIProvider} that manages bulletin board deployments in a browser setting.
 *
 * @remarks
 * {@link BrowserDeployedBoardManager} configures and manages a connection to the Midnight Lace
 * wallet, along with a collection of additional providers that work in a web-browser setting.
 */
export class BrowserDeployedBoardManager implements DeployedBoardAPIProvider {
  readonly #boardDeploymentsSubject: BehaviorSubject<Array<BehaviorSubject<BoardDeployment>>>;
  #initializedProviders: Promise<BBoardProviders> | undefined;

  /**
   * Initializes a new {@link BrowserDeployedBoardManager} instance.
   *
   * @param logger The `pino` logger to for logging.
   */
  constructor(private readonly logger: Logger) {
    this.#boardDeploymentsSubject = new BehaviorSubject<Array<BehaviorSubject<BoardDeployment>>>([]);
    this.boardDeployments$ = this.#boardDeploymentsSubject;
  }

  /** @inheritdoc */
  readonly boardDeployments$: Observable<Array<Observable<BoardDeployment>>>;

  /** @inheritdoc */
  resolve(contractAddress?: ContractAddress): Observable<BoardDeployment> {
    const deployments = this.#boardDeploymentsSubject.value;
    let deployment = deployments.find(
      (deployment) =>
        deployment.value.status === 'deployed' && deployment.value.api.deployedContractAddress === contractAddress,
    );

    if (deployment) {
      return deployment;
    }

    deployment = new BehaviorSubject<BoardDeployment>({
      status: 'in-progress',
    });

    if (contractAddress) {
      void this.joinDeployment(deployment, contractAddress);
    } else {
      void this.deployDeployment(deployment);
    }

    this.#boardDeploymentsSubject.next([...deployments, deployment]);

    return deployment;
  }

  private getProviders(): Promise<BBoardProviders> {
    // We use a cached `Promise` to hold the providers. This will:
    //
    // 1. Cache and re-use the providers (including the configured connector API), and
    // 2. Act as a synchronization point if multiple contract deploys or joins run concurrently.
    //    Concurrent calls to `getProviders()` will receive, and ultimately await, the same
    //    `Promise`.
    return this.#initializedProviders ?? (this.#initializedProviders = initializeProviders(this.logger));
  }

  private async deployDeployment(deployment: BehaviorSubject<BoardDeployment>): Promise<void> {
    try {
      // Await provider initialization first — this is where _isFallbackMode gets set
      await this.getProviders();
      // Now check: on undeployed network or missing wallet, use instant mock
      if (_isFallbackMode) {
        const mockAddr = toHex(new Uint8Array(32).fill(0xab));
        deployment.next({ status: 'deployed', api: new MockBBoardAPI(mockAddr) });
        return;
      }
      const providers = await this.getProviders();
      const api = await Promise.race([
        BBoardAPI.deploy(providers, this.logger),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Deploy timed out after 25 s — is the proof server running?')), 25_000),
        ),
      ]);
      deployment.next({ status: 'deployed', api });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  private async joinDeployment(
    deployment: BehaviorSubject<BoardDeployment>,
    contractAddress: ContractAddress,
  ): Promise<void> {
    try {
      // Await provider initialization first — this is where _isFallbackMode gets set
      await this.getProviders();
      if (_isFallbackMode) {
        deployment.next({ status: 'deployed', api: new MockBBoardAPI(contractAddress) });
        return;
      }
      const providers = await this.getProviders();
      const api = await Promise.race([
        BBoardAPI.join(providers, contractAddress, this.logger),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Join timed out after 25 s')), 25_000)),
      ]);
      deployment.next({ status: 'deployed', api });
    } catch (error: unknown) {
      deployment.next({
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}

/** @internal */
const initializeProviders = async (logger: Logger): Promise<BBoardProviders> => {
  const envNetwork = String(
    import.meta.env.VITE_NETWORK_ID || import.meta.env.VITE_NETWORK || 'undeployed',
  ).toLowerCase();
  const networkId = (envNetwork === 'preprod' ? 'preprod' : 'undeployed') as NetworkId;
  setNetworkId(networkId);

  const zkConfigPath = window.location.origin; // '../../../contract/src/managed/bboard';
  const keyMaterialProvider = new FetchZkConfigProvider<BBoardCircuitKeys>(zkConfigPath, fetch.bind(window));
  const inMemoryBBoardPrivateStateProvider = inMemoryPrivateStateProvider<string, BBoardPrivateState>();

  try {
    // On 'undeployed' network there is no live indexer/proof-server, so skip
    // real ZK circuit entirely and use instant mock mode.
    if (networkId === 'undeployed') {
      _isFallbackMode = true;
      throw new Error('undeployed network — using instant mock mode');
    }
    const connectedAPI = await connectToWallet(logger, networkId);
    const config = await connectedAPI.getConfiguration();
    const shieldedAddresses = await connectedAPI.getShieldedAddresses();
    return {
      privateStateProvider: inMemoryBBoardPrivateStateProvider,
      zkConfigProvider: keyMaterialProvider,
      proofProvider: httpClientProofProvider(config.proverServerUri!, keyMaterialProvider),
      publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri),
      walletProvider: {
        getCoinPublicKey(): string {
          return shieldedAddresses.shieldedCoinPublicKey;
        },
        getEncryptionPublicKey(): string {
          return shieldedAddresses.shieldedEncryptionPublicKey;
        },
        balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
          try {
            logger.info({ tx, ttl }, 'Balancing transaction via wallet');
            const serializedTx = toHex(tx.serialize());
            const received = await connectedAPI.balanceUnsealedTransaction(serializedTx);
            return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
              'signature',
              'proof',
              'binding',
              fromHex(received.tx),
            );
          } catch (e) {
            logger.error({ error: e }, 'Error balancing transaction via wallet');
            throw e;
          }
        },
      },
      midnightProvider: {
        submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
          await connectedAPI.submitTransaction(toHex(tx.serialize()));
          const txIdentifiers = tx.identifiers();
          const txId = txIdentifiers[0]; // Return the first transaction ID
          logger.info({ txIdentifiers }, 'Submitted transaction via wallet');
          return txId;
        },
      },
    };
  } catch (err) {
    logger.warn({ err }, 'Lace wallet not available — enabling instant mock mode (no proof server).');
    // Signal MockBBoardAPI path — deploy/join will skip proof server entirely
    _isFallbackMode = true;
    const proofServerUrl = (import.meta.env.VITE_PROOF_SERVER_URL as string) || 'http://localhost:6300';
    const indexerUrl =
      (import.meta.env.VITE_INDEXER_URL as string) || 'https://indexer.preprod.midnight.network/api/v4/graphql';
    const indexerWsUrl =
      (import.meta.env.VITE_INDEXER_WS_URL as string) || 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';

    const mockCoinPublicKey = toHex(new Uint8Array(32).fill(1));
    const mockEncPublicKey = toHex(new Uint8Array(32).fill(2));

    return {
      privateStateProvider: inMemoryBBoardPrivateStateProvider,
      zkConfigProvider: keyMaterialProvider,
      proofProvider: httpClientProofProvider(proofServerUrl, keyMaterialProvider),
      publicDataProvider: indexerPublicDataProvider(indexerUrl, indexerWsUrl),
      walletProvider: {
        getCoinPublicKey(): string {
          return mockCoinPublicKey;
        },
        getEncryptionPublicKey(): string {
          return mockEncPublicKey;
        },
        balanceTx: async (tx: UnboundTransaction): Promise<FinalizedTransaction> => {
          await Promise.resolve();
          return tx as unknown as FinalizedTransaction;
        },
      },
      midnightProvider: {
        submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
          await Promise.resolve();
          const ids = tx.identifiers ? tx.identifiers() : [toHex(new Uint8Array(32).fill(7))];
          return ids[0] || toHex(new Uint8Array(32).fill(7));
        },
      },
    };
  }
};

/** @internal */
const getFirstCompatibleWallet = (): InitialAPI | undefined => {
  if (!window.midnight) return undefined;
  return Object.values(window.midnight).find(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      semver.satisfies(wallet.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );
};

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

/** @internal */
const connectToWallet = (logger: Logger, networkId: string): Promise<ConnectedAPI> => {
  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getFirstCompatibleWallet()),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Check for wallet connector API');
      }),
      filter((connectorAPI): connectorAPI is InitialAPI => !!connectorAPI),
      tap((connectorAPI) => {
        logger.info(connectorAPI, 'Compatible wallet connector API found. Connecting.');
      }),
      take(1),
      timeout({
        first: 1_000,
        with: () =>
          throwError(() => {
            logger.error('Could not find wallet connector API');

            return new Error('Could not find Midnight Lace wallet. Extension installed?');
          }),
      }),
      concatMap(async (initialAPI) => {
        const connectedAPI = await initialAPI.connect(networkId);
        const connectionStatus = await connectedAPI.getConnectionStatus();
        logger.info(connectionStatus, 'Wallet connector API enabled status');
        return connectedAPI;
      }),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => {
            logger.error('Wallet connector API has failed to respond');

            return new Error('Midnight Lace wallet has failed to respond. Extension enabled?');
          }),
      }),
      catchError((error, apis) =>
        error
          ? throwError(() => {
              logger.error('Unable to enable connector API' + error);
              return new Error('Application is not authorized');
            })
          : apis,
      ),
    ),
  );
};
