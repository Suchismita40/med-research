import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FluentWalletBuilder, type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { LedgerParameters, nativeToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { createLogger } from './logger-utils.js';
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
  const logger = await createLogger(path.resolve(currentDir, '..', 'logs', 'test-sync.log'));
  const dustOptions = {
    ledgerParams: LedgerParameters.initialParameters(),
    additionalFeeOverhead: 1_000n,
    feeBlocksMargin: 5,
  };

  const builder = FluentWalletBuilder.forEnvironment(envConfiguration).withDustOptions(dustOptions);
  const buildResult = await builder.withSeed(SEED).buildWithoutStarting();
  const { wallet } = buildResult as unknown as { wallet: any };

  await wallet.start();

  console.log('Listening to wallet state emissions for 15 seconds...');
  const sub = wallet.state().subscribe((state: any) => {
    const token = nativeToken();
    const balance = state.unshielded?.balances?.[token.raw];
    console.log('State emission:', {
      unshieldedBalance: balance ? balance.toString() : '0',
      unshieldedProgress: state.unshielded?.progress,
      shieldedProgress: state.shielded?.state?.progress,
      dustProgress: state.dust?.state?.progress,
    });
  });

  await new Promise((r) => setTimeout(r, 15000));
  sub.unsubscribe();
  await wallet.stop();
}

main().catch(console.error);
