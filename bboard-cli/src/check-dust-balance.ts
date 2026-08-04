import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { nativeToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { createLogger } from './logger-utils.js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { currentDir } from './config.js';
import path from 'node:path';
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
  const logger = await createLogger(path.resolve(currentDir, '..', 'logs', 'check-dust.log'));
  const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, SEED);
  await walletProvider.start();

  const token = nativeToken();
  const unshieldedState = await Rx.firstValueFrom(walletProvider.wallet.unshielded.state);
  const nightBalance = unshieldedState.balances[token.raw] ?? 0n;

  console.log(`Unshielded NIGHT Balance: ${nightBalance}`);

  const dustState = await Rx.firstValueFrom(walletProvider.wallet.dust.state);
  const dustBalance = dustState.balance(new Date());
  console.log(`Dust Balance: ${dustBalance}`);

  await walletProvider.stop();
}

main().catch(console.error);
