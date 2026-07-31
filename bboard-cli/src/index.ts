// Private Medical Research Data Exchange CLI

import {
  BBoardAPI,
  type BBoardDerivedState,
  type BBoardProviders,
  type DeployedBBoardAPI,
  bboardPrivateStateKey,
} from '../../api/src/index.js';
import { type Logger, type PrivateStateId } from '../../api/src/index.js';
import * as BBoard from '../../contract/src/index.js';
import { type Config, StandaloneConfig } from './config.js';
import { createInterface, type Interface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type BBoardPrivateState, State } from '../../contract/src/index.js';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import * as utils from '../../api/src/utils/index.js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { nativeToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { type WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { generateDust } from './generate-dust.js';
import { syncWallet, waitForUnshieldedFunds } from './wallet-utils.js';

const deployOrJoin = async (
  providers: BBoardProviders,
  rli: Interface,
  logger: Logger,
): Promise<DeployedBBoardAPI | null> => {
  const choice = await rli.question(
    'Do you want to (1) Deploy a new Private Medical Research Data Exchange contract or (2) Join an existing one? ',
  );

  switch (choice) {
    case '1':
      return await BBoardAPI.deploy(providers, logger);
    case '2': {
      const contractAddress = await rli.question('Enter existing contract address: ');
      return await BBoardAPI.join(providers, contractAddress, logger);
    }
    default:
      logger.error(`Invalid choice: ${choice}`);
      return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const displayLedgerState = async (providers: BBoardProviders, deployedContract: FoundContract<any>, logger: Logger) => {
  const contractState = await providers.publicDataProvider.queryContractState(
    deployedContract.deployTxData.public.contractAddress,
  );
  if (contractState === null) {
    logger.info(`Contract state not found`);
  } else {
    const ledgerState = BBoard.ledger(contractState.data);
    logger.info(`Dataset Title: ${ledgerState.datasetTitle.is_some ? ledgerState.datasetTitle.value : 'None'}`);
    logger.info(`Dataset Count: ${ledgerState.datasetCount}`);
    logger.info(`Access State: ${State[ledgerState.state]}`);
    logger.info(`Audit Log Count: ${ledgerState.auditLogCount}`);
    logger.info(`Last Proof Hash: ${toHex(ledgerState.lastProofHash)}`);
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const displayPrivateState = async (providers: BBoardProviders, logger: Logger) => {
  const privateState = await providers.privateStateProvider.get(bboardPrivateStateKey);
  if (privateState === null) {
    logger.info(`No private state found`);
  } else {
    logger.info(`Secret Key: ${toHex(privateState.secretKey)}`);
  }
};

const displayDerivedState = (ledgerState: BBoardDerivedState | undefined, logger: Logger) => {
  if (ledgerState === undefined) {
    logger.info(`No derived state currently available`);
  } else {
    logger.info(`Access State: ${State[ledgerState.state]}`);
    logger.info(`Dataset Title: ${ledgerState.datasetTitle ?? 'none'}`);
    logger.info(`Dataset Count: ${ledgerState.datasetCount}`);
    logger.info(`Audit Log Count: ${ledgerState.auditLogCount}`);
    logger.info(`Last Proof Hash: ${toHex(ledgerState.lastProofHash)}`);
    logger.info(`Is Hospital Dataset Owner: ${ledgerState.isOwner ? 'YES' : 'NO'}`);
  }
};

const MAIN_LOOP_QUESTION = `
Private Medical Research Data Exchange Menu:
  1. Register a Medical Research Dataset (Hospital)
  2. Request Access with ZK Medical Credentials (Researcher)
  3. Grant Research Access Permission (Hospital Owner)
  4. Submit Dataset Access Proof (Researcher Audit)
  5. Revoke Research Permission (Hospital Admin)
  6. Display Ledger State
  7. Display Derived State
  8. Exit
Which action would you like to perform? `;

const mainLoop = async (providers: BBoardProviders, rli: Interface, logger: Logger): Promise<void> => {
  const bboardApi = await deployOrJoin(providers, rli, logger);
  if (bboardApi === null) {
    return;
  }
  let currentState: BBoardDerivedState | undefined;
  const stateObserver = {
    next: (state: BBoardDerivedState) => (currentState = state),
  };
  const subscription = bboardApi.state$.subscribe(stateObserver);
  try {
    while (true) {
      const choice = await rli.question(MAIN_LOOP_QUESTION);
      try {
        switch (choice) {
          case '1': {
            const title = await rli.question('Enter Medical Research Dataset Title: ');
            await bboardApi.registerDataset(title);
            break;
          }
          case '2': {
            const datasetIdHex = await rli.question('Enter Dataset ID (32-byte hex or leave empty for random): ');
            const datasetId = datasetIdHex.trim() ? Buffer.from(datasetIdHex, 'hex') : utils.randomBytes(32);
            await bboardApi.requestAccess(datasetId);
            break;
          }
          case '3': {
            const datasetIdHex = await rli.question('Enter Dataset ID hex: ');
            const researcherPkHex = await rli.question('Enter Active Researcher Public Key hex: ');
            await bboardApi.grantPermission(Buffer.from(datasetIdHex, 'hex'), Buffer.from(researcherPkHex, 'hex'));
            break;
          }
          case '4': {
            const datasetIdHex = await rli.question('Enter Dataset ID hex: ');
            const patientRecordHashHex = await rli.question('Enter Patient Record Hash hex: ');
            await bboardApi.submitAccessProof(
              Buffer.from(datasetIdHex, 'hex'),
              Buffer.from(patientRecordHashHex, 'hex'),
            );
            break;
          }
          case '5': {
            const datasetIdHex = await rli.question('Enter Dataset ID hex: ');
            await bboardApi.revokeAccess(Buffer.from(datasetIdHex, 'hex'));
            break;
          }
          case '6':
            await displayLedgerState(providers, bboardApi.deployedContract, logger);
            break;
          case '7':
            displayDerivedState(currentState, logger);
            break;
          case '8':
            logger.info('Exiting Private Medical Research Data Exchange CLI...');
            return;
          default:
            logger.error(`Invalid choice: ${choice}`);
        }
      } catch (e) {
        logError(logger, e);
        logger.info('Returning to main menu...');
      }
    }
  } finally {
    subscription.unsubscribe();
  }
};

const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

const WALLET_LOOP_QUESTION = `
Select Wallet Option:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Exit
Which would you like to do? `;

const buildWallet = async (config: Config, rli: Interface, logger: Logger): Promise<string | undefined> => {
  if (config instanceof StandaloneConfig) {
    return GENESIS_MINT_WALLET_SEED;
  }
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case '1':
        return toHex(utils.randomBytes(32));
      case '2':
        return await rli.question('Enter your wallet seed: ');
      case '3':
        logger.info('Exiting...');
        return undefined;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const run = async (config: Config, testEnv: any, logger: Logger): Promise<void> => {
  const rli = createInterface({ input, output, terminal: true });
  const providersToBeStopped: MidnightWalletProvider[] = [];
  try {
    const envConfiguration = await testEnv.start();
    logger.info(`Environment started with configuration: ${JSON.stringify(envConfiguration)}`);
    const seed = await buildWallet(config, rli, logger);
    if (seed === undefined) {
      return;
    }
    const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
    providersToBeStopped.push(walletProvider);
    const walletFacade: WalletFacade = walletProvider.wallet;

    await walletProvider.start();

    const token = nativeToken();
    const unshieldedState = await waitForUnshieldedFunds(logger, walletFacade, envConfiguration, token);
    const nightBalance = unshieldedState.balances[token.raw];
    if (nightBalance === undefined) {
      logger.info('No funds received, exiting...');
      return;
    }
    logger.info(`Your NIGHT wallet balance is: ${nightBalance}`);

    if (config.generateDust) {
      const dustGeneration = await generateDust(logger, seed, unshieldedState, walletFacade);
      if (dustGeneration) {
        logger.info(`Submitted dust generation registration transaction: ${dustGeneration}`);
        await syncWallet(logger, walletFacade);
      }
    }

    const zkConfigProvider = new NodeZkConfigProvider<
      'registerDataset' | 'requestAccess' | 'grantPermission' | 'submitAccessProof' | 'revokeAccess'
    >(config.zkConfigPath);

    const providers: BBoardProviders = {
      privateStateProvider: levelPrivateStateProvider<PrivateStateId, BBoardPrivateState>({
        privateStateStoreName: config.privateStateStoreName,
        signingKeyStoreName: `${config.privateStateStoreName}-signing-keys`,
        privateStoragePasswordProvider: () => {
          return 'MedEx-Test-2026!';
        },
        accountId: seed,
      }),
      publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
      zkConfigProvider: zkConfigProvider,
      proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
      walletProvider: walletProvider,
      midnightProvider: walletProvider,
    };
    await mainLoop(providers, rli, logger);
  } catch (e) {
    logError(logger, e);
    logger.info('Exiting...');
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
      logError(logger, e);
    } finally {
      try {
        for (const wallet of providersToBeStopped) {
          logger.info('Stopping wallet...');
          await wallet.stop();
        }
        if (testEnv) {
          logger.info('Stopping test environment...');
          await testEnv.shutdown();
        }
      } catch (e) {
        logError(logger, e);
      }
    }
  }
};

function logError(logger: Logger, e: unknown) {
  if (e instanceof Error) {
    logger.error(`Found error '${e.message}'`);
    logger.debug(`${e.stack}`);
  } else {
    logger.error(`Found error (unknown type)`);
  }
}
