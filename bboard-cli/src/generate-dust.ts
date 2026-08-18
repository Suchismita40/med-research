import { type WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { createKeystore, UnshieldedWalletState } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { Logger } from 'pino';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import * as rx from 'rxjs';

export const getUnshieldedSeed = (seed: string): Uint8Array<ArrayBufferLike> => {
  const seedBuffer = Buffer.from(seed, 'hex');
  const hdWalletResult = HDWallet.fromSeed(seedBuffer);

  const { hdWallet } = hdWalletResult as {
    type: 'seedOk';
    hdWallet: HDWallet;
  };

  const derivationResult = hdWallet.selectAccount(0).selectRole(Roles.NightExternal).deriveKeyAt(0);

  if (derivationResult.type === 'keyOutOfBounds') {
    throw new Error('Key derivation out of bounds');
  }

  return derivationResult.key;
};

export const generateDust = async (
  logger: Logger,
  walletSeed: string,
  _initialUnshieldedState: UnshieldedWalletState,
  walletFacade: WalletFacade,
) => {
  const networkId = getNetworkId();
  const unshieldedKeystore = createKeystore(getUnshieldedSeed(walletSeed), networkId);

  let txId: string | undefined;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const currentUnshieldedState = await rx.firstValueFrom(walletFacade.unshielded.state);
      const currentDustState = await rx.firstValueFrom(walletFacade.dust.state);
      const utxos = currentUnshieldedState.availableCoins;

      if (!utxos || utxos.length === 0) {
        logger.info('No UTXOs found for dust generation.');
        return;
      }

      logger.info(`Attempt ${attempt}: Registering dust with ${utxos.length} UTXOs on ${networkId}...`);

      const recipe = await walletFacade.registerNightUtxosForDustGeneration(
        utxos,
        unshieldedKeystore.getPublicKey(),
        (payload) => unshieldedKeystore.signData(payload),
        currentDustState.address,
      );
      const transaction = await walletFacade.finalizeRecipe(recipe);
      txId = await walletFacade.submitTransaction(transaction);
      logger.info(`Dust generation transaction successfully submitted on-chain! TxId: ${txId}`);
      break;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.info(`Dust generation attempt ${attempt} note: ${msg}`);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  return txId;
};
