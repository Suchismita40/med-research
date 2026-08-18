/* eslint-disable @typescript-eslint/no-explicit-any */
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { nativeToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { createLogger } from './logger-utils.js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { createUnprovenDeployTx } from '@midnight-ntwrk/midnight-js-contracts';
import { type BBoardProviders, type PrivateStateId, bboardPrivateStateKey } from '../../api/src/index.js';
import {
  type BBoardPrivateState,
  createBBoardPrivateState,
  CompiledBBoardContractContract,
} from '../../contract/src/index.js';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { currentDir } from './config.js';
import * as Rx from 'rxjs';

setNetworkId('preprod');

const ENV_FILE = path.resolve(currentDir, '..', '.env.local');

function getOrGenerateSeed(): string {
  if (process.env.PREPROD_WALLET_SEED) return process.env.PREPROD_WALLET_SEED;
  if (process.env.WALLET_SEED) return process.env.WALLET_SEED;

  if (fs.existsSync(ENV_FILE)) {
    const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
    const match = envContent.match(/PREPROD_WALLET_SEED=([a-f0-9]{64})/i);
    if (match && match[1]) return match[1];
  }

  const seed = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(ENV_FILE, `PREPROD_WALLET_SEED=${seed}\n`, { flag: 'a' });
  return seed;
}

const SEED = getOrGenerateSeed();
const RESULT_FILE = path.resolve(currentDir, '..', 'preprod-deployment-result.json');

const envConfiguration: EnvironmentConfiguration = {
  walletNetworkId: 'preprod',
  networkId: 'preprod',
  indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preprod.midnight.network',
  nodeWS: 'wss://rpc.preprod.midnight.network',
  faucet: 'https://midnight-tmnight-preprod.nethermind.dev/',
  proofServer: 'https://proof-server.preprod.midnight.network',
};

async function main() {
  const logDir = path.resolve(currentDir, '..', 'logs', 'preprod-deploy', `${Date.now()}.log`);
  const logger = await createLogger(logDir);

  console.log('=== STARTING MIDNIGHT PREPROD DEPLOYMENT ===');
  logger.info('Starting Preprod Contract Deployment...');

  const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, SEED);
  await walletProvider.start();

  let unshieldedState = await Rx.firstValueFrom(walletProvider.wallet.unshielded.state);
  const publicUnshieldedAddress = UnshieldedAddress.codec.encode('preprod', unshieldedState.address).toString();
  const token = nativeToken();

  console.log(`PREPROD DEPLOYER ADDRESS: ${publicUnshieldedAddress}`);

  let nightBalance = 0n;
  for (let i = 0; i < 30; i++) {
    unshieldedState = await Rx.firstValueFrom(walletProvider.wallet.unshielded.state);
    nightBalance = unshieldedState.balances[token.raw] ?? 0n;
    const coins = unshieldedState.availableCoins || [];
    console.log(`Unshielded Poll ${i + 1}/30 -> Balance: ${nightBalance} tNIGHT, Available Coins: ${coins.length}`);
    if (nightBalance > 0n && coins.length > 0) break;
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (nightBalance === 0n) {
    console.log('=== PREPROD DEPLOYER ADDRESS INFO ===');
    console.log(`PREPROD DEPLOYER ADDRESS: ${publicUnshieldedAddress}`);
    console.log(`CURRENT BALANCE: ${nightBalance} tNIGHT`);
    console.log('STATUS: UNFUNDED — Requires tNIGHT from Midnight Preprod Faucet');
    console.log('====================================');

    const result = {
      status: 'UNFUNDED',
      networkId: 'preprod',
      deployerAddress: publicUnshieldedAddress,
      balance: nightBalance.toString(),
      timestamp: new Date().toISOString(),
    };
    fs.writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2));

    await walletProvider.stop();
    process.exit(2);
  }

  const zkConfigPath = path.resolve(currentDir, '..', '..', 'contract', 'src', 'managed', 'bboard');
  const zkConfigProvider = new NodeZkConfigProvider<
    'registerDataset' | 'requestAccess' | 'grantPermission' | 'submitAccessProof' | 'renewAccessQuota' | 'revokeAccess'
  >(zkConfigPath);

  const privateStateProvider = levelPrivateStateProvider<PrivateStateId, BBoardPrivateState>({
    privateStateStoreName: `bboard-private-state-preprod-deploy-${Date.now()}`,
    signingKeyStoreName: `bboard-private-state-preprod-signing-keys-deploy-${Date.now()}`,
    privateStoragePasswordProvider: () => 'MedEx-Preprod-2026!',
    accountId: SEED,
  });

  const providers: BBoardProviders = {
    privateStateProvider: privateStateProvider,
    publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
    zkConfigProvider: zkConfigProvider,
    proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
    walletProvider: walletProvider,
    midnightProvider: walletProvider,
  };

  console.log('Constructing Unproven Contract Deployment...');
  logger.info('Calling createUnprovenDeployTx...');

  const initialPrivateState = createBBoardPrivateState(crypto.randomBytes(32));
  const signingKey = crypto.randomBytes(32).toString('hex');
  const unprovenDeployTxData = await createUnprovenDeployTx(
    providers as any,
    {
      compiledContract: CompiledBBoardContractContract,
      initialPrivateState: initialPrivateState,
      signingKey: signingKey,
    } as any,
  );

  const contractAddress = unprovenDeployTxData.public.contractAddress;
  console.log(`DEPLOYED CONTRACT ADDRESS: ${contractAddress}`);
  logger.info(`Contract Address generated: ${contractAddress}`);

  console.log('Generating Zero-Knowledge Deployment Proofs with Proof Server...');
  logger.info('Calling proofProvider.proveTx...');
  const provenTx = await providers.proofProvider.proveTx(unprovenDeployTxData.private.unprovenTx);

  console.log('Balancing Preprod Transaction Fees...');
  logger.info('Calling walletProvider.balanceTx...');
  const finalizedTx = await providers.walletProvider.balanceTx(provenTx);

  console.log('Submitting Deployment Transaction to Official Midnight Preprod Network...');
  logger.info('Calling midnightProvider.submitTx...');
  const txHash = await providers.midnightProvider.submitTx(finalizedTx);

  console.log(`TRANSACTION SUBMITTED ON-CHAIN: ${txHash}`);
  logger.info(`TxHash: ${txHash}`);

  // Save private state & signing key locally
  providers.privateStateProvider.setContractAddress(contractAddress);
  await providers.privateStateProvider.set(bboardPrivateStateKey, initialPrivateState);
  await providers.privateStateProvider.setSigningKey(contractAddress, unprovenDeployTxData.private.signingKey);

  const result = {
    status: 'SUCCESS',
    networkId: 'preprod',
    contractAddress: contractAddress,
    deploymentTxHash: txHash,
    deployerAddress: publicUnshieldedAddress,
    explorerUrl: `https://preprod.midnight-explorer.com/contract/${contractAddress}`,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2));

  // Also update bboard-ui/.env.preprod
  const uiEnvPreprod = path.resolve(currentDir, '..', '..', 'bboard-ui', '.env.preprod');
  const envContent = `VITE_NETWORK_ID=preprod
VITE_INDEXER_URL=https://indexer.preprod.midnight.network/api/v4/graphql
VITE_INDEXER_WS_URL=wss://indexer.preprod.midnight.network/api/v4/graphql/ws
VITE_PROOF_SERVER_URL=https://proof-server.preprod.midnight.network
VITE_NODE_URL=https://rpc.preprod.midnight.network
VITE_CONTRACT_ADDRESS=${contractAddress}
`;
  fs.writeFileSync(uiEnvPreprod, envContent);

  console.log('=== DEPLOYMENT SUCCESSFUL ===');
  console.log(`PREPROD NETWORK: Midnight Preprod`);
  console.log(`CONTRACT ADDRESS: ${contractAddress}`);
  console.log(`DEPLOYMENT TX HASH: ${txHash}`);
  console.log(`DEPLOYER ADDRESS: ${publicUnshieldedAddress}`);
  console.log(`EXPLORER URL: https://preprod.midnight-explorer.com/contract/${contractAddress}`);
  console.log('=============================');

  await walletProvider.stop();
}

main().catch((err: unknown) => {
  console.error('PREPROD DEPLOYMENT ERROR:', err instanceof Error ? err.message : String(err));
  fs.writeFileSync(
    RESULT_FILE,
    JSON.stringify(
      {
        status: 'ERROR',
        error: err instanceof Error ? err.message : String(err),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
