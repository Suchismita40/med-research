import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FluentWalletBuilder, FaucetClient, type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { LedgerParameters, nativeToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { createLogger } from './logger-utils.js';
import { syncWallet } from './wallet-utils.js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { BBoardAPI, type BBoardProviders, type PrivateStateId } from '../../api/src/index.js';
import { type BBoardPrivateState } from '../../contract/src/index.js';
import { generateDust } from './generate-dust.js';
import path from 'node:path';
import { currentDir } from './config.js';
import * as Rx from 'rxjs';

setNetworkId('preview');

const SEED = '73b8b58cae8acd896d8168a2a68b19f9170e340095030e820f27cd99c7971320';

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

  console.log('Starting Preview Contract Deployment Process...');

  const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, SEED);
  const walletFacade = walletProvider.wallet;

  await walletProvider.start();

  const token = nativeToken();
  let unshieldedState = await Rx.firstValueFrom(walletFacade.unshielded.state);
  let nightBalance = unshieldedState.balances[token.raw] ?? 0n;

  console.log(`Initial unshielded balance: ${nightBalance}`);

  if (nightBalance === 0n) {
    console.log('Polling unshielded state for received funds...');
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      unshieldedState = await Rx.firstValueFrom(walletFacade.unshielded.state);
      nightBalance = unshieldedState.balances[token.raw] ?? 0n;
      console.log(`Poll ${i + 1}/10 balance: ${nightBalance}`);
      if (nightBalance > 0n) break;
    }
  }

  console.log(`Final NIGHT balance for deployment: ${nightBalance}`);

  if (nightBalance > 0n) {
    console.log('Generating dust if required...');
    try {
      const dustTx = await generateDust(logger, SEED, unshieldedState, walletFacade);
      if (dustTx) {
        console.log(`Dust tx: ${dustTx}`);
        await syncWallet(logger, walletFacade);
      }
    } catch (e: any) {
      console.log('Dust generation note:', e?.message || e);
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

    console.log('Deploying BBoard Smart Contract to Midnight Preview Network...');
    const bboardApi = await BBoardAPI.deploy(providers, logger);

    console.log('=== DEPLOYMENT SUCCESSFUL ===');
    console.log(`Deployed Contract Address: ${bboardApi.deployedContractAddress}`);
    console.log(`Explorer URL: https://preview.midnight-explorer.com/contract/${bboardApi.deployedContractAddress}`);
    console.log('=============================');
  } else {
    console.log('Deployment halted: balance is 0.');
  }

  await walletProvider.stop();
}

main().catch((err) => {
  console.error('DEPLOYMENT ERROR DETAILS:', err);
  if (err && err.stack) console.error(err.stack);
  process.exit(1);
});
