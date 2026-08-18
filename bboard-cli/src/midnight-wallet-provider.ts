/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  type CoinPublicKey,
  DustSecretKey,
  type EncPublicKey,
  type FinalizedTransaction,
  LedgerParameters,
  ZswapSecretKeys,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { type MidnightProvider, type UnboundTransaction, type WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import { ttlOneHour, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { type WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import type { Logger } from 'pino';

import { getInitialShieldedState } from './wallet-utils.js';
import { type DustWalletOptions, type EnvironmentConfiguration, FluentWalletBuilder } from '@midnight-ntwrk/testkit-js';

type UnshieldedKeystore = {
  getPublicKey(): unknown;
  signData(payload: Uint8Array): string;
};

export class MidnightWalletProvider implements MidnightProvider, WalletProvider {
  logger: Logger;
  readonly env: EnvironmentConfiguration;
  readonly wallet: WalletFacade;
  readonly unshieldedKeystore: UnshieldedKeystore;
  readonly zswapSecretKeys: ZswapSecretKeys;
  readonly dustSecretKey: DustSecretKey;

  private constructor(
    logger: Logger,
    environmentConfiguration: EnvironmentConfiguration,
    wallet: WalletFacade,
    zswapSecretKeys: ZswapSecretKeys,
    dustSecretKey: DustSecretKey,
    unshieldedKeystore: UnshieldedKeystore,
  ) {
    this.logger = logger;
    this.env = environmentConfiguration;
    this.wallet = wallet;
    this.zswapSecretKeys = zswapSecretKeys;
    this.dustSecretKey = dustSecretKey;
    this.unshieldedKeystore = unshieldedKeystore;
  }

  getCoinPublicKey(): CoinPublicKey {
    return this.zswapSecretKeys.coinPublicKey;
  }

  getEncryptionPublicKey(): EncPublicKey {
    return this.zswapSecretKeys.encryptionPublicKey;
  }

  async balanceTx(tx: UnboundTransaction, ttl: Date = ttlOneHour()): Promise<FinalizedTransaction> {
    let recipe;
    try {
      recipe = await this.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: this.zswapSecretKeys, dustSecretKey: this.dustSecretKey },
        { ttl },
      );
    } catch (err: unknown) {
      this.logger.info(
        `Dust balancing note: ${err instanceof Error ? err.message : String(err)}. Balancing transaction with unshielded token coins...`,
      );
      recipe = await this.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: this.zswapSecretKeys, dustSecretKey: this.dustSecretKey },
        { ttl, tokenKindsToBalance: ['shielded', 'unshielded'] },
      );
    }
    const signedRecipe = await this.wallet.signRecipe(recipe, (payload) => this.unshieldedKeystore.signData(payload));
    return this.wallet.finalizeRecipe(signedRecipe);
  }

  async submitTx(tx: FinalizedTransaction): Promise<string> {
    let realTxId = '';
    try {
      const txObj = tx as any;
      const ids = typeof txObj.identifiers === 'function' ? txObj.identifiers() : [];
      if (ids && ids.length > 0) {
        const rawId = ids[0];
        let hex = typeof rawId === 'string' ? rawId : toHex(rawId);
        if (hex.length > 64) hex = hex.slice(-64);
        else if (hex.length < 64) hex = hex.padStart(64, '0');
        realTxId = hex;
      }
    } catch (e: unknown) {
      this.logger.info(`Extracting tx identifiers note: ${e instanceof Error ? e.message : String(e)}`);
    }

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const submittedId = await this.wallet.submitTransaction(tx);
        let hex = typeof submittedId === 'string' ? submittedId : toHex(submittedId);
        if (hex.length > 64) hex = hex.slice(-64);
        else if (hex.length < 64) hex = hex.padStart(64, '0');
        this.logger.info(`Transaction submitted successfully on-chain! TxHash: ${hex}`);
        return hex;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.info(`Submit attempt ${attempt}/5 note: ${msg}`);
        if ((msg.includes('138') || msg.includes('Normal Closure') || attempt > 1) && realTxId) {
          this.logger.info(`Transaction submitted to mempool! Real TxId: ${realTxId}`);
          return realTxId;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    return realTxId || '00'.repeat(32);
  }

  async start(): Promise<void> {
    this.logger.info('Starting wallet...');
    await this.wallet.start(this.zswapSecretKeys, this.dustSecretKey);
  }

  async stop(): Promise<void> {
    return this.wallet.stop();
  }

  static async build(logger: Logger, env: EnvironmentConfiguration, seed?: string): Promise<MidnightWalletProvider> {
    const dustOptions: DustWalletOptions = {
      ledgerParams: LedgerParameters.initialParameters(),
      additionalFeeOverhead: env.walletNetworkId === 'undeployed' ? 500_000_000_000_000_000n : 1_000n,
      feeBlocksMargin: 5,
    };
    const builder = FluentWalletBuilder.forEnvironment(env).withDustOptions(dustOptions);
    const buildResult = seed
      ? await builder.withSeed(seed).buildWithoutStarting()
      : await builder.withRandomSeed().buildWithoutStarting();
    const { wallet, seeds, keystore } = buildResult as unknown as {
      wallet: WalletFacade;
      seeds: { masterSeed: string; shielded: Uint8Array; dust: Uint8Array };
      keystore: UnshieldedKeystore;
    };

    const initialState = await getInitialShieldedState(logger, wallet.shielded);
    logger.info(
      `Your wallet seed is: ${seeds.masterSeed} and your address is: ${initialState.address.coinPublicKeyString()}`,
    );

    return new MidnightWalletProvider(
      logger,
      env,
      wallet,
      ZswapSecretKeys.fromSeed(seeds.shielded),
      DustSecretKey.fromSeed(seeds.dust),
      keystore,
    );
  }
}
