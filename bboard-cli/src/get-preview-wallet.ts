import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FluentWalletBuilder, type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { LedgerParameters } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { createLogger } from './logger-utils.js';
import { getInitialShieldedState, getInitialUnshieldedState } from './wallet-utils.js';
import path from 'node:path';
import { currentDir } from './config.js';

setNetworkId('preview');

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
  const logDir = path.resolve(currentDir, '..', 'logs', 'preview-wallet', `${Date.now()}.log`);
  const logger = await createLogger(logDir);

  const dustOptions = {
    ledgerParams: LedgerParameters.initialParameters(),
    additionalFeeOverhead: 1_000n,
    feeBlocksMargin: 5,
  };

  const builder = FluentWalletBuilder.forEnvironment(envConfiguration).withDustOptions(dustOptions);
  
  // Use a fixed seed or generate a seed
  const buildResult = await builder.withRandomSeed().buildWithoutStarting();
  const { wallet, seeds } = buildResult as unknown as {
    wallet: any;
    seeds: { masterSeed: string; shielded: Uint8Array; dust: Uint8Array };
  };

  const shieldedState = await getInitialShieldedState(logger, wallet.shielded);
  const unshieldedState = await getInitialUnshieldedState(logger, wallet.unshielded);
  const unshieldedAddress = UnshieldedAddress.codec.encode('preview', unshieldedState.address);

  console.log('=== MIDNIGHT PREVIEW WALLET DETAILS ===');
  console.log(`Master Seed: ${seeds.masterSeed}`);
  console.log(`Unshielded Address: ${unshieldedAddress.toString()}`);
  console.log(`Shielded Coin Public Key: ${shieldedState.address.coinPublicKeyString()}`);
  console.log('=======================================');
}

main().catch(console.error);
