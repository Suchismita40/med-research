import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { nativeToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { createLogger } from './logger-utils.js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { BBoardAPI, type BBoardProviders, type PrivateStateId } from '../../api/src/index.js';
import { type BBoardPrivateState } from '../../contract/src/index.js';
import { generateDust } from './generate-dust.js';
import { syncWallet } from './wallet-utils.js';
import path from 'node:path';
import fs from 'node:fs';
import { currentDir } from './config.js';
import * as Rx from 'rxjs';

setNetworkId('preview');

const SEED = '73b8b58cae8acd896d8168a2a68b19f9170e340095030e820f27cd99c7971320';
const RESULT_FILE = path.resolve(currentDir, '..', 'preview-deployment-result.json');

const envConfiguration: EnvironmentConfiguration = {
  walletNetworkId: 'preview',
  networkId: 'preview',
  indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preview.midnight.network',
  nodeWS: 'wss://rpc.preview.midnight.network',
  faucet: 'https://midnight-tmnight-preview.nethermind.dev/',
  proofServer: 'http://localhost:6300',
};

async function main() {
  const logDir = path.resolve(currentDir, '..', 'logs', 'preview-deploy', `${Date.now()}.log`);
  const logger = await createLogger(logDir);

  logger.info('Starting Preview Contract Deployment...');

  const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, SEED);
  await walletProvider.start();

  logger.info('Fully syncing wallet state...');
  await syncWallet(logger, walletProvider.wallet);

  const token = nativeToken();
  const unshieldedState = await Rx.firstValueFrom(walletProvider.wallet.unshielded.state);
  const nightBalance = unshieldedState.balances[token.raw] ?? 0n;

  logger.info(`Synced NIGHT balance: ${nightBalance}`);
  logger.info(`Available coins count: ${unshieldedState.availableCoins.length}`);

  const dustState = await walletProvider.wallet.dust.waitForSyncedState();
  const dustBalance = dustState.balance(new Date());
  logger.info(`Current Dust balance: ${dustBalance}`);

  if (dustBalance === 0n && unshieldedState.availableCoins.length > 0) {
    logger.info('Registering NIGHT UTXOs for dust generation...');
    const dustTx = await generateDust(logger, SEED, unshieldedState, walletProvider.wallet);
    if (dustTx) {
      logger.info(`Submitted dust generation registration tx: ${dustTx}`);
      await syncWallet(logger, walletProvider.wallet);
    }
  }

  const zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'bboard');
  const zkConfigProvider = new NodeZkConfigProvider<
    'registerDataset' | 'requestAccess' | 'grantPermission' | 'submitAccessProof' | 'revokeAccess'
  >(zkConfigPath);

  const providers: BBoardProviders = {
    privateStateProvider: levelPrivateStateProvider<PrivateStateId, BBoardPrivateState>({
      privateStateStoreName: 'bboard-private-state-preview',
      signingKeyStoreName: 'bboard-private-state-preview-signing-keys',
      privateStoragePasswordProvider: () => 'MedEx-Preview-2026!',
      accountId: SEED,
    }),
    publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
    zkConfigProvider: zkConfigProvider,
    proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
    walletProvider: walletProvider,
    midnightProvider: walletProvider,
  };

  logger.info('Deploying BBoard Smart Contract to Preview Network...');
  const bboardApi = await BBoardAPI.deploy(providers, logger);

  const result = {
    status: 'SUCCESS',
    networkId: 'preview',
    contractAddress: bboardApi.deployedContractAddress,
    explorerUrl: `https://preview.midnight-explorer.com/contract/${bboardApi.deployedContractAddress}`,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2));
  logger.info(`Deployment complete. Result saved to ${RESULT_FILE}`);

  await walletProvider.stop();
}

main().catch((err) => {
  fs.writeFileSync(
    RESULT_FILE,
    JSON.stringify({ status: 'ERROR', error: err?.message || String(err), stack: err?.stack }, null, 2),
  );
  process.exit(1);
});
