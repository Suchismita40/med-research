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

  const token = nativeToken();
  let unshieldedState = await Rx.firstValueFrom(walletProvider.wallet.unshielded.state);
  let nightBalance = unshieldedState.balances[token.raw] ?? 0n;

  console.log(`Initial unshielded balance: ${nightBalance}`);

  for (let i = 0; i < 20; i++) {
    unshieldedState = await Rx.firstValueFrom(walletProvider.wallet.unshielded.state);
    nightBalance = unshieldedState.balances[token.raw] ?? 0n;
    const coins = unshieldedState.availableCoins || [];
    console.log(`Unshielded Poll ${i + 1}/20 -> Balance: ${nightBalance}, Available Coins: ${coins.length}`);
    if (nightBalance > 0n && coins.length > 0) break;
    await new Promise((r) => setTimeout(r, 3000));
  }

  let dustState = await Rx.firstValueFrom(walletProvider.wallet.dust.state);
  let dustBalance = dustState.balance(new Date());
  console.log(`Initial Dust Balance: ${dustBalance}`);

  if (dustBalance === 0n && unshieldedState.availableCoins.length > 0) {
    console.log('Submitting dust generation transaction...');
    try {
      const dustTx = await generateDust(logger, SEED, unshieldedState, walletProvider.wallet);
      if (dustTx) console.log(`Submitted dust generation tx: ${dustTx}`);
    } catch (err: any) {
      console.log('Dust generation note:', err?.message || err);
    }
  }

  console.log('Polling for dust balance sync on Preview network...');
  for (let j = 0; j < 36; j++) {
    dustState = await Rx.firstValueFrom(walletProvider.wallet.dust.state);
    dustBalance = dustState.balance(new Date());
    console.log(`Dust Sync Poll ${j + 1}/36 -> Dust balance: ${dustBalance}`);
    if (dustBalance > 0n) break;
    await new Promise((r) => setTimeout(r, 5000));
  }

  console.log(`Final Dust Balance before deployment: ${dustBalance}`);

  if (dustBalance > 0n) {
    const zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'bboard');
    const zkConfigProvider = new NodeZkConfigProvider<
      'registerDataset' | 'requestAccess' | 'grantPermission' | 'submitAccessProof' | 'revokeAccess'
    >(zkConfigPath);

    const providers: BBoardProviders = {
      privateStateProvider: levelPrivateStateProvider<PrivateStateId, BBoardPrivateState>({
        privateStateStoreName: `bboard-private-state-preview-deploy-${Date.now()}`,
        signingKeyStoreName: `bboard-private-state-preview-signing-keys-deploy-${Date.now()}`,
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
      seed: SEED,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2));
    console.log('=== DEPLOYMENT SUCCESSFUL ===');
    console.log(`Deployed Contract Address: ${bboardApi.deployedContractAddress}`);
    console.log(`Explorer URL: https://preview.midnight-explorer.com/contract/${bboardApi.deployedContractAddress}`);
    console.log('=============================');
  } else {
    console.log('Deployment halted: Dust balance still 0.');
    fs.writeFileSync(
      RESULT_FILE,
      JSON.stringify({ status: 'FAILED', reason: 'Zero dust balance', timestamp: new Date().toISOString() }, null, 2),
    );
  }

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
