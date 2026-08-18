'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Logger } from 'pino';

export interface ContractState {
  owner: string;
  datasetTitle?: string;
  datasetCategory: string;
  datasetCount: bigint;
  maxAccessLimit: bigint;
  accessCount: bigint;
  auditLogCount: bigint;
  lastProofHash?: string;
  activeResearcherPk?: string;
}

export interface WalletInfo {
  name: string;
  icon?: string;
  rdns?: string;
  address?: string;
  network?: string;
}

export interface DeployedBoardState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  contractAddress?: string;
  contractState?: ContractState;
  connectedWallet?: WalletInfo;
  error?: string;
  circuitExecuting?: boolean;
}

export interface DeployedBoardContextType {
  state: DeployedBoardState;
  connectWallet: () => Promise<void>;
  registerDataset: (title: string, category: string) => Promise<void>;
  requestAccess: () => Promise<void>;
  grantPermission: () => Promise<void>;
  submitAccessProof: () => Promise<void>;
  renewAccessQuota: (newLimit: bigint) => Promise<void>;
  revokeAccess: () => Promise<void>;
}

const PREPROD_CONTRACT_ADDRESS = 'e603362546ca047cb7c596389c20fde9bdf1b27489f14137d68fd9cd4a939d97';

const initialContractState: ContractState = {
  owner: '02008f1c5d5e236319830211751bc97858c49e7b26d3023a1c6298539adbfef2b607',
  datasetTitle: 'Cardiology Patient Outcomes Multi-Center Cohort',
  datasetCategory: 'Cardiology',
  datasetCount: 1n,
  maxAccessLimit: 100n,
  accessCount: 12n,
  auditLogCount: 14n,
  lastProofHash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
  activeResearcherPk: '03a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
};

const defaultState: DeployedBoardState = {
  status: 'disconnected',
  contractAddress: PREPROD_CONTRACT_ADDRESS,
  contractState: initialContractState,
};

const DeployedBoardContext = createContext<DeployedBoardContextType>({
  state: defaultState,
  connectWallet: async () => {},
  registerDataset: async () => {},
  requestAccess: async () => {},
  grantPermission: async () => {},
  submitAccessProof: async () => {},
  renewAccessQuota: async () => {},
  revokeAccess: async () => {},
});

export const useDeployedBoardContext = () => useContext(DeployedBoardContext);

export const DeployedBoardProvider: React.FC<{
  children: React.ReactNode;
  logger: Logger;
}> = ({ children, logger }) => {
  const [state, setState] = useState<DeployedBoardState>(defaultState);
  const [connectedApi, setConnectedApi] = useState<any>(null);

  const connectWallet = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'connecting', error: undefined }));

    try {
      if (typeof window === 'undefined') return;

      const midnightObj = (window as any).midnight;
      let wallet: any = null;

      if (midnightObj) {
        if (midnightObj.mnLace) {
          wallet = midnightObj.mnLace;
        } else {
          const wallets = Object.values(midnightObj);
          if (wallets.length > 0) {
            wallet = wallets[0];
          }
        }
      }

      if (!wallet || typeof wallet.connect !== 'function') {
        logger.warn('Lace wallet extension not found in window.midnight.');
        setState((prev) => ({
          ...prev,
          status: 'connected',
          contractAddress: PREPROD_CONTRACT_ADDRESS,
          connectedWallet: {
            name: 'Midnight Lace (Simulated)',
            rdns: 'midnight.mnLace',
            address: 'mn_addr_preprod1efmkm...',
            network: 'PREPROD',
          },
          error: undefined,
        }));
        return;
      }

      logger.info({ walletName: wallet.name }, 'Found Midnight Lace Wallet. Negotiating network...');

      const candidateNetworks = ['preprod', 'undeployed', 'preview', 'mainnet'];
      let connected: any = null;
      let matchedNet = 'preprod';
      let lastError: unknown = null;

      for (const netId of candidateNetworks) {
        try {
          logger.info(`[Midnight Wallet] Attempting connect to network: '${netId}'...`);
          connected = await wallet.connect(netId);
          matchedNet = netId;
          logger.info(`[Midnight Wallet] Successfully connected on network '${netId}'!`);
          break;
        } catch (err: unknown) {
          lastError = err;
          const msg = String(err);
          logger.info(`[Midnight Wallet] Connect attempt for '${netId}' returned: ${msg}`);

          if (
            msg.toLowerCase().includes('network id mismatch') ||
            msg.toLowerCase().includes('network mismatch') ||
            msg.toLowerCase().includes('unsupported network id') ||
            msg.toLowerCase().includes('network')
          ) {
            continue;
          }
          throw err;
        }
      }

      if (!connected) {
        const errMsg =
          lastError instanceof Error
            ? lastError.message
            : 'Could not connect to Midnight Lace wallet. Please check extension network setting.';
        throw new Error(errMsg);
      }

      setConnectedApi(connected);

      // Fetch wallet address
      let address = '';
      try {
        if (typeof connected.getShieldedAddresses === 'function') {
          const shielded = await connected.getShieldedAddresses();
          address = shielded?.shieldedAddress || shielded?.shieldedCoinPublicKey || '';
        }
      } catch (errShielded) {
        logger.warn({ err: errShielded }, 'Shielded address lookup error');
      }

      if (!address) {
        try {
          if (typeof connected.getUnshieldedAddress === 'function') {
            const unshielded = await connected.getUnshieldedAddress();
            address = unshielded?.unshieldedAddress || String(unshielded) || '';
          }
        } catch (errUnshielded) {
          logger.warn({ err: errUnshielded }, 'Unshielded address lookup error');
        }
      }

      if (!address) {
        address = 'mn_addr_preprod1efmkm...';
      }

      const displayAddress = address.length > 20 ? `${address.slice(0, 10)}...${address.slice(-6)}` : address;

      setState((prev) => ({
        ...prev,
        status: 'connected',
        contractAddress: PREPROD_CONTRACT_ADDRESS,
        connectedWallet: {
          name: wallet.name || 'Midnight Lace',
          rdns: 'midnight.mnLace',
          address: displayAddress,
          network: matchedNet.toUpperCase(),
        },
        error: undefined,
      }));

      logger.info('Midnight Lace Wallet connected successfully!');
    } catch (err: any) {
      logger.error({ err }, 'Wallet connection error');
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err?.message || 'Failed to connect to Midnight Lace Wallet',
      }));
    }
  }, [logger]);

  const registerDataset = async (title: string, category: string) => {
    setState((prev) => ({ ...prev, circuitExecuting: true }));
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setState((prev) => ({
        ...prev,
        circuitExecuting: false,
        contractState: prev.contractState
          ? {
              ...prev.contractState,
              datasetTitle: title,
              datasetCategory: category,
              datasetCount: prev.contractState.datasetCount + 1n,
              auditLogCount: prev.contractState.auditLogCount + 1n,
            }
          : initialContractState,
      }));
    } catch (e) {
      setState((prev) => ({ ...prev, circuitExecuting: false }));
    }
  };

  const requestAccess = async () => {
    setState((prev) => ({ ...prev, circuitExecuting: true }));
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setState((prev) => ({
        ...prev,
        circuitExecuting: false,
        contractState: prev.contractState
          ? {
              ...prev.contractState,
              accessCount: prev.contractState.accessCount + 1n,
              auditLogCount: prev.contractState.auditLogCount + 1n,
            }
          : initialContractState,
      }));
    } catch (e) {
      setState((prev) => ({ ...prev, circuitExecuting: false }));
    }
  };

  const grantPermission = async () => {
    setState((prev) => ({ ...prev, circuitExecuting: true }));
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setState((prev) => ({
        ...prev,
        circuitExecuting: false,
        contractState: prev.contractState
          ? {
              ...prev.contractState,
              auditLogCount: prev.contractState.auditLogCount + 1n,
            }
          : initialContractState,
      }));
    } catch (e) {
      setState((prev) => ({ ...prev, circuitExecuting: false }));
    }
  };

  const submitAccessProof = async () => {
    setState((prev) => ({ ...prev, circuitExecuting: true }));
    try {
      await new Promise((r) => setTimeout(r, 1400));
      const mockHash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      setState((prev) => ({
        ...prev,
        circuitExecuting: false,
        contractState: prev.contractState
          ? {
              ...prev.contractState,
              lastProofHash: mockHash,
              accessCount: prev.contractState.accessCount + 1n,
              auditLogCount: prev.contractState.auditLogCount + 1n,
            }
          : initialContractState,
      }));
    } catch (e) {
      setState((prev) => ({ ...prev, circuitExecuting: false }));
    }
  };

  const renewAccessQuota = async (newLimit: bigint) => {
    setState((prev) => ({ ...prev, circuitExecuting: true }));
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setState((prev) => ({
        ...prev,
        circuitExecuting: false,
        contractState: prev.contractState
          ? {
              ...prev.contractState,
              maxAccessLimit: newLimit,
              auditLogCount: prev.contractState.auditLogCount + 1n,
            }
          : initialContractState,
      }));
    } catch (e) {
      setState((prev) => ({ ...prev, circuitExecuting: false }));
    }
  };

  const revokeAccess = async () => {
    setState((prev) => ({ ...prev, circuitExecuting: true }));
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setState((prev) => ({
        ...prev,
        circuitExecuting: false,
        contractState: prev.contractState
          ? {
              ...prev.contractState,
              auditLogCount: prev.contractState.auditLogCount + 1n,
            }
          : initialContractState,
      }));
    } catch (e) {
      setState((prev) => ({ ...prev, circuitExecuting: false }));
    }
  };

  return (
    <DeployedBoardContext.Provider
      value={{
        state,
        connectWallet,
        registerDataset,
        requestAccess,
        grantPermission,
        submitAccessProof,
        renewAccessQuota,
        revokeAccess,
      }}
    >
      {children}
    </DeployedBoardContext.Provider>
  );
};
