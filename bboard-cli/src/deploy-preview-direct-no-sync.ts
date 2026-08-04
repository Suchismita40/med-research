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
  proofServer: 'https://proof-server.preview.midnight.network',
};

async function main() {
  const logDir = path.resolve(currentDir, '..', 'logs', 'preview-deploy', `${Date.now()}.log`);
  const logger = await createLogger(logDir);

  console.log('=== STARTING MIDNIGHT PREVIEW DEPLOYMENT ===');
  logger.info('Starting Preview Contract Deployment...');

  const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, SEED);
  await walletProvider.start();

  console.log('Waiting 8 seconds for wallet state initialization...');
  await new Promise((r) => setTimeout(r, 8000));

  const token = nativeToken();
  const unshieldedState = await Rx.firstValueFrom(walletProvider.wallet.unshielded.state);
  const nightBalance = unshieldedState.balances[token.raw] ?? 0n;

  const dustState = await Rx.firstValueFrom(walletProvider.wallet.dust.state);
  let dustBalance = dustState.balance(new Date());

  console.log(`Unshielded NIGHT Balance: ${nightBalance}`);
  console.log(`Initial Dust Balance: ${dustBalance}`);

  if (dustBalance === 0n && unshieldedState.availableCoins.length > 0) {
    const unregistered = unshieldedState.availableCoins.filter((c) => !c.meta.registeredForDustGeneration);
    if (unregistered.length > 0) {
      console.log(`Registering ${unregistered.length} available UTXOs for dust generation...`);
      try {
        const dustTx = await generateDust(logger, SEED, unshieldedState, walletProvider.wallet);
        if (dustTx) console.log(`Submitted dust generation tx: ${dustTx}`);
      } catch (err: any) {
        console.log('Dust generation note:', err?.message || err);
      }
    } else {
      console.log('UTXOs already submitted for dust generation.');
    }

    console.log('Waiting 15 seconds for dust coin confirmation...');
    await new Promise((r) => setTimeout(r, 15000));

    const updatedDustState = await Rx.firstValueFrom(walletProvider.wallet.dust.state);
    dustBalance = updatedDustState.balance(new Date());
    console.log(`Updated Dust Balance: ${dustBalance}`);
  }

  const zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'bboard');
  const zkConfigProvider = new NodeZkConfigProvider<
    'registerDataset' | 'requestAccess' | 'grantPermission' | 'submitAccessProof' | 'revokeAccess'
  >(zkConfigPath);

  const providers: BBoardProviders = {
    privateStateProvider: levelPrivateStateProvider<PrivateStateId, BBoardPrivateState>({
      privateStateStoreName: `bboard-private-state-preview-${Date.now()}`,
      signingKeyStoreName: `bboard-private-state-preview-signing-keys-${Date.now()}`,
      privateStoragePasswordProvider: () => 'MedEx-Preview-2026!',
      accountId: SEED,
    }),
    publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
    zkConfigProvider: zkConfigProvider,
    proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
    walletProvider: walletProvider,
    midnightProvider: walletProvider,
  };

  console.log('Deploying BBoard Smart Contract to Midnight Preview Network...');
  const bboardApi = await BBoardAPI.deploy(providers, logger);

  const result = {
    status: 'SUCCESS',
    networkId: 'preview',
    contractAddress: bboardApi.deployedContractAddress,
    explorerUrl: `https://preview.midnight-explorer.com/contract/${bboardApi.deployedContractAddress}`,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2));
  console.log('=== DEPLOYMENT SUCCESSFUL ===');
  console.log(`Deployed Contract Address: ${bboardApi.deployedContractAddress}`);
  console.log(`Explorer URL: https://preview.midnight-explorer.com/contract/${bboardApi.deployedContractAddress}`);
  console.log('=============================');

  await walletProvider.stop();
}

main().catch((err) => {
  console.error('DEPLOYMENT FAILED WITH ERROR:', err);
  fs.writeFileSync(
    RESULT_FILE,
    JSON.stringify({ status: 'ERROR', error: err?.message || String(err), stack: err?.stack }, null, 2),
  );
  process.exit(1);
});
