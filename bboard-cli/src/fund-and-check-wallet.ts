import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FluentWalletBuilder, FaucetClient, type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { LedgerParameters, nativeToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { createLogger } from './logger-utils.js';
import { getInitialUnshieldedState, syncWallet } from './wallet-utils.js';
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

const SEED = '73b8b58cae8acd896d8168a2a68b19f9170e340095030e820f27cd99c7971320';

async function main() {
  const logDir = path.resolve(currentDir, '..', 'logs', 'preview-wallet', `${Date.now()}.log`);
  const logger = await createLogger(logDir);

  const dustOptions = {
    ledgerParams: LedgerParameters.initialParameters(),
    additionalFeeOverhead: 1_000n,
    feeBlocksMargin: 5,
  };

  const builder = FluentWalletBuilder.forEnvironment(envConfiguration).withDustOptions(dustOptions);
  const buildResult = await builder.withSeed(SEED).buildWithoutStarting();
  const { wallet, seeds } = buildResult as unknown as {
    wallet: any;
    seeds: { masterSeed: string; shielded: Uint8Array; dust: Uint8Array };
  };

  const unshieldedState = await getInitialUnshieldedState(logger, wallet.unshielded);
  const unshieldedAddress = UnshieldedAddress.codec.encode('preview', unshieldedState.address).toString();

  console.log(`Unshielded Address: ${unshieldedAddress}`);

  try {
    console.log('Attempting to request tokens from faucet...');
    const faucet = new FaucetClient(envConfiguration.faucet, logger);
    await faucet.requestTokens(unshieldedAddress);
    console.log('Faucet request submitted successfully!');
  } catch (err: any) {
    console.log(`Faucet request note/error: ${err.message || err}`);
  }

  await wallet.start();
  console.log('Syncing wallet state...');
  try {
    await syncWallet(logger, wallet);
    const token = nativeToken();
    const state = await wallet.unshielded.state();
    console.log(`Unshielded balances: ${JSON.stringify(state.balances)}`);
  } catch (e: any) {
    console.log(`Sync error: ${e.message || e}`);
  } finally {
    await wallet.stop();
  }
}

main().catch(console.error);
