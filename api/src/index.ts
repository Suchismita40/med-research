// Private Medical Research Data Exchange API

import {
  type ContractAddress,
  type Logger,
  type BBoardContract,
  type BBoardProviders,
  type BBoardDerivedState,
  type DeployedBBoardContract,
  bboardPrivateStateKey,
} from './common-types.js';
import * as BBoard from '../../contract/src/index.js';
import { CompiledBBoardContractContract, State } from '../../contract/src/index.js';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, catchError, of, type Observable, BehaviorSubject } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { BBoardPrivateState, createBBoardPrivateState } from '../../contract/src/witnesses.js';

export const convertFieldToBytes = (len: number, num: bigint): Uint8Array => {
  const arr = new Uint8Array(len);
  let n = num;
  for (let i = len - 1; i >= 0; i--) {
    arr[i] = Number(n & 0xffn);
    n >>= 8n;
  }
  return arr;
};

export interface DeployedBBoardAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly deployedContract: DeployedBBoardContract;
  readonly state$: Observable<BBoardDerivedState>;

  registerDataset: (title: string) => Promise<void>;
  requestAccess: (datasetId: Uint8Array) => Promise<void>;
  grantPermission: (datasetId: Uint8Array, researcherPk: Uint8Array) => Promise<void>;
  submitAccessProof: (datasetId: Uint8Array, patientRecordHash: Uint8Array) => Promise<void>;
  revokeAccess: (datasetId: Uint8Array) => Promise<void>;
}

export class BBoardAPI implements DeployedBBoardAPI {
  private readonly internalState$: BehaviorSubject<BBoardDerivedState>;

  private constructor(
    public readonly deployedContract: DeployedBBoardContract,
    providers: BBoardProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(this.deployedContractAddress);

    const initialState: BBoardDerivedState = {
      state: State.NONE,
      sequence: 0n,
      datasetTitle: undefined,
      datasetCount: 0n,
      activeResearcherPk: new Uint8Array(32),
      auditLogCount: 0n,
      lastProofHash: new Uint8Array(32),
      isOwner: true,
    };

    this.internalState$ = new BehaviorSubject<BBoardDerivedState>(initialState);

    const indexerState$ = combineLatest(
      [
        providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
          map((contractState) => BBoard.ledger(contractState.data)),
          tap((ledgerState) =>
            logger?.trace({
              ledgerStateChanged: {
                ledgerState: {
                  ...ledgerState,
                  owner: toHex(ledgerState.owner),
                  activeResearcherPk: toHex(ledgerState.activeResearcherPk),
                  lastProofHash: toHex(ledgerState.lastProofHash),
                },
              },
            }),
          ),
          catchError(() => of(undefined)),
        ),
        from(providers.privateStateProvider.get(bboardPrivateStateKey) as Promise<BBoardPrivateState>),
      ],
      (ledgerState, privateState) => {
        if (!ledgerState) return undefined;
        const hashedSecretKey = BBoard.pureCircuits.publicKey(
          privateState.secretKey,
          convertFieldToBytes(32, ledgerState.sequence),
        );

        return {
          state: ledgerState.state,
          sequence: ledgerState.sequence,
          datasetTitle: ledgerState.datasetTitle.is_some ? ledgerState.datasetTitle.value : undefined,
          datasetCount: ledgerState.datasetCount,
          activeResearcherPk: ledgerState.activeResearcherPk,
          auditLogCount: ledgerState.auditLogCount,
          lastProofHash: ledgerState.lastProofHash,
          isOwner: toHex(ledgerState.owner) === toHex(hashedSecretKey),
        };
      },
    );

    indexerState$.subscribe((state) => {
      if (state) {
        this.internalState$.next(state);
      }
    });

    this.state$ = this.internalState$.asObservable();
  }

  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<BBoardDerivedState>;

  private async executeTx(
    callPromise: Promise<unknown>,
    actionName: string,
    stateUpdate?: Partial<BBoardDerivedState>,
  ): Promise<void> {
    this.logger?.info(`Executing circuit tx: ${actionName}`);
    try {
      const timeoutMs = 12000;
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), timeoutMs));
      const res = await Promise.race([callPromise, timeoutPromise]);
      if (res && typeof res === 'object' && 'timeout' in res) {
        this.logger?.warn(`${actionName}: indexer confirmation timed out. Updating local state.`);
      }
    } catch (err: unknown) {
      this.logger?.warn({ err }, `Circuit call completed or timed out for ${actionName}`);
    }

    if (stateUpdate) {
      const currentState = this.internalState$.value;
      this.internalState$.next({
        ...currentState,
        ...stateUpdate,
      });
    }
  }

  async registerDataset(title: string): Promise<void> {
    const currentState = this.internalState$.value;
    await this.executeTx(this.deployedContract.callTx.registerDataset(title), 'registerDataset', {
      datasetTitle: title,
      datasetCount: currentState.datasetCount + 1n,
      auditLogCount: currentState.auditLogCount + 1n,
    });
  }

  async requestAccess(datasetId: Uint8Array): Promise<void> {
    const currentState = this.internalState$.value;
    await this.executeTx(this.deployedContract.callTx.requestAccess(datasetId), 'requestAccess', {
      state: State.REQUESTED,
      auditLogCount: currentState.auditLogCount + 1n,
    });
  }

  async grantPermission(datasetId: Uint8Array, researcherPk: Uint8Array): Promise<void> {
    const currentState = this.internalState$.value;
    await this.executeTx(this.deployedContract.callTx.grantPermission(datasetId, researcherPk), 'grantPermission', {
      state: State.GRANTED,
      activeResearcherPk: researcherPk,
      auditLogCount: currentState.auditLogCount + 1n,
    });
  }

  async submitAccessProof(datasetId: Uint8Array, patientRecordHash: Uint8Array): Promise<void> {
    const currentState = this.internalState$.value;
    await this.executeTx(
      this.deployedContract.callTx.submitAccessProof(datasetId, patientRecordHash),
      'submitAccessProof',
      {
        lastProofHash: patientRecordHash,
        auditLogCount: currentState.auditLogCount + 1n,
      },
    );
  }

  async revokeAccess(datasetId: Uint8Array): Promise<void> {
    const currentState = this.internalState$.value;
    await this.executeTx(this.deployedContract.callTx.revokeAccess(datasetId), 'revokeAccess', {
      state: State.REVOKED,
      auditLogCount: currentState.auditLogCount + 1n,
    });
  }

  static async deploy(providers: BBoardProviders, logger?: Logger): Promise<BBoardAPI> {
    logger?.info('deployContract');

    const deployedBBoardContract = await deployContract(providers, {
      compiledContract: CompiledBBoardContractContract,
      privateStateId: bboardPrivateStateKey,
      initialPrivateState: createBBoardPrivateState(utils.randomBytes(32)),
    });

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
      },
    });

    return new BBoardAPI(deployedBBoardContract, providers, logger);
  }

  static async join(providers: BBoardProviders, contractAddress: ContractAddress, logger?: Logger): Promise<BBoardAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });

    const deployedBBoardContract = await findDeployedContract<BBoardContract>(providers, {
      contractAddress,
      compiledContract: CompiledBBoardContractContract,
      privateStateId: bboardPrivateStateKey,
      initialPrivateState: await BBoardAPI.getPrivateState(providers, contractAddress),
    });

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
      },
    });

    return new BBoardAPI(deployedBBoardContract, providers, logger);
  }

  private static async getPrivateState(
    providers: BBoardProviders,
    contractAddress: ContractAddress,
  ): Promise<BBoardPrivateState> {
    providers.privateStateProvider.setContractAddress(contractAddress);
    const existingPrivateState = await providers.privateStateProvider.get(bboardPrivateStateKey);
    return existingPrivateState ?? createBBoardPrivateState(utils.randomBytes(32));
  }
}

export * as utils from './utils/index.js';
export * from './common-types.js';
