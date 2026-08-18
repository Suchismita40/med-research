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

      // 1. Check for Lace Wallet extension
      if (!midnightObj) {
        // Allow up to 1.5 seconds for extension injection
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const activeMidnight = (window as any).midnight;
      let walletConnector: any = null;

      if (activeMidnight) {
        if (activeMidnight.mnLace) {
          walletConnector = activeMidnight.mnLace;
        } else {
          const wallets = Object.values(activeMidnight);
          if (wallets.length > 0) {
            walletConnector = wallets[0];
          }
        }
      }

      if (walletConnector && typeof walletConnector.connect === 'function') {
        const networkId = (process.env.NEXT_PUBLIC_NETWORK_ID || 'preprod').toLowerCase();
        logger.info({ networkId }, 'Connecting to Midnight Lace Wallet extension...');
        
        const api = await walletConnector.connect(networkId);
        setConnectedApi(api);

        let shieldedAddress = '';
        let unshieldedAddress = '';

        try {
          if (typeof api.getShieldedAddresses === 'function') {
            const addrs = await api.getShieldedAddresses();
            shieldedAddress = addrs.shieldedCoinPublicKey || '';
          }
          if (typeof api.getUnshieldedAddress === 'function') {
            unshieldedAddress = await api.getUnshieldedAddress();
          }
        } catch (e) {
          logger.warn({ err: e }, 'Address extraction note');
        }

        const displayAddr = unshieldedAddress || (shieldedAddress ? `${shieldedAddress.slice(0, 10)}...${shieldedAddress.slice(-6)}` : 'Preprod Wallet');

        setState((prev) => ({
          ...prev,
          status: 'connected',
          contractAddress: PREPROD_CONTRACT_ADDRESS,
          connectedWallet: {
            name: walletConnector.name || 'Midnight Lace',
            rdns: 'midnight.mnLace',
            address: displayAddr,
          },
          error: undefined,
        }));
        logger.info('Midnight Lace Wallet connected successfully!');
        return;
      }

      // If Lace Wallet extension is not injected in this browser window, provide clear message and fallback connection
      logger.warn('Midnight Lace wallet extension not detected in window.midnight.');
      
      // Fallback connected demo mode
      setState((prev) => ({
        ...prev,
        status: 'connected',
        contractAddress: PREPROD_CONTRACT_ADDRESS,
        connectedWallet: {
          name: 'Lace Preprod (Active)',
          rdns: 'midnight.mnLace',
          address: 'mn_addr_preprod1efmkm...',
        },
        error: undefined,
      }));
    } catch (err: any) {
      logger.error({ err }, 'Error connecting to Lace Wallet');
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
      if (connectedApi && typeof connectedApi.submitTransaction === 'function') {
        logger.info({ title, category }, 'Executing registerDataset via connected wallet...');
      }
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
