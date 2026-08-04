import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FluentWalletBuilder, FaucetClient, type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { LedgerParameters, nativeToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
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

  console.log('=== STARTING FRESH MIDNIGHT PREVIEW DEPLOYMENT ===');

  // Build wallet with a new random seed
  const dustOptions = {
    ledgerParams: LedgerParameters.initialParameters(),
    additionalFeeOverhead: 1_000n,
    feeBlocksMargin: 5,
  };

  const builder = FluentWalletBuilder.forEnvironment(envConfiguration).withDustOptions(dustOptions);
  const buildResult = await builder.withRandomSeed().buildWithoutStarting();
  const { wallet, seeds } = buildResult as unknown as {
    wallet: any;
    seeds: { masterSeed: string };
  };

  const SEED = seeds.masterSeed;
  console.log(`Generated Deployment Seed: ${SEED}`);

  const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, SEED);
  await walletProvider.start();

  const token = nativeToken();
  const initialUnshieldedState = await Rx.firstValueFrom(walletProvider.wallet.unshielded.state);
  const unshieldedAddress = UnshieldedAddress.codec.encode('preview', initialUnshieldedState.address).toString();

  console.log(`Unshielded Address: ${unshieldedAddress}`);

  console.log('Requesting 5000 tNIGHT tokens from Preview Faucet...');
  const faucet = new FaucetClient(envConfiguration.faucet, logger);
  await faucet.requestTokens(unshieldedAddress);
  console.log('Faucet request OK!');

  let unshieldedState = await Rx.firstValueFrom(walletProvider.wallet.unshielded.state);
  let nightBalance = unshieldedState.balances[token.raw] ?? 0n;

  console.log('Waiting for unshielded funds to be indexed...');
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    unshieldedState = await Rx.firstValueFrom(walletProvider.wallet.unshielded.state);
    nightBalance = unshieldedState.balances[token.raw] ?? 0n;
    const coins = unshieldedState.availableCoins || [];
    console.log(`Poll ${i + 1}/20 -> Balance: ${nightBalance}, Available Coins: ${coins.length}`);
    if (nightBalance > 0n && coins.length > 0) break;
  }

  if (nightBalance > 0n && unshieldedState.availableCoins.length > 0) {
    console.log('Registering UTXO for dust generation...');
    const dustTx = await generateDust(logger, SEED, unshieldedState, walletProvider.wallet);
    console.log(`Dust generation tx: ${dustTx}`);

    console.log('Waiting 15s for dust activation...');
    await new Promise((r) => setTimeout(r, 15000));

    let dustState = await Rx.firstValueFrom(walletProvider.wallet.dust.state);
    let dustBalance = dustState.balance(new Date());
    console.log(`Dust Balance after registration: ${dustBalance}`);

    if (dustBalance === 0n) {
      for (let j = 0; j < 10; j++) {
        await new Promise((r) => setTimeout(r, 3000));
        dustState = await Rx.firstValueFrom(walletProvider.wallet.dust.state);
        dustBalance = dustState.balance(new Date());
        console.log(`Dust poll ${j + 1}/10 -> ${dustBalance}`);
        if (dustBalance > 0n) break;
      }
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
      seed: SEED,
      walletAddress: unshieldedAddress,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2));
    console.log('=== DEPLOYMENT SUCCESSFUL ===');
    console.log(`Deployed Contract Address: ${bboardApi.deployedContractAddress}`);
    console.log(`Explorer URL: https://preview.midnight-explorer.com/contract/${bboardApi.deployedContractAddress}`);
    console.log('=============================');
  } else {
    console.log('Deployment halted: No funds received.');
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
