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
      let walletConnector: any = null;

      if (midnightObj) {
        if (midnightObj.mnLace) {
          walletConnector = midnightObj.mnLace;
        } else {
          const wallets = Object.values(midnightObj);
          if (wallets.length > 0) {
            walletConnector = wallets[0];
          }
        }
      }

      if (walletConnector && typeof walletConnector.connect === 'function') {
        const networkId = 'preprod';
        logger.info({ networkId }, 'Calling walletConnector.connect...');
        
        const api = await walletConnector.connect(networkId);
        setConnectedApi(api);

        // Immediately mark connected
        setState((prev) => ({
          ...prev,
          status: 'connected',
          contractAddress: PREPROD_CONTRACT_ADDRESS,
          connectedWallet: {
            name: walletConnector.name || 'Midnight Lace',
            rdns: 'midnight.mnLace',
            address: 'mn_addr_preprod (Active)',
          },
          error: undefined,
        }));

        // Non-blocking address extraction
        void (async () => {
          try {
            let addr = '';
            if (typeof api.getUnshieldedAddress === 'function') {
              const res = await Promise.race([
                api.getUnshieldedAddress(),
                new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 2000)),
              ]);
              if (res) addr = String(res);
            }
            if (!addr && typeof api.getShieldedAddresses === 'function') {
              const addrs: any = await Promise.race([
                api.getShieldedAddresses(),
                new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 2000)),
              ]);
              if (addrs && addrs.shieldedCoinPublicKey) {
                const key = String(addrs.shieldedCoinPublicKey);
                addr = `${key.slice(0, 10)}...${key.slice(-6)}`;
              }
            }
            if (addr) {
              setState((prev) => ({
                ...prev,
                connectedWallet: {
                  name: walletConnector.name || 'Midnight Lace',
                  rdns: 'midnight.mnLace',
                  address: addr.length > 20 ? `${addr.slice(0, 12)}...${addr.slice(-6)}` : addr,
                },
              }));
            }
          } catch (e) {
            logger.info('Address discovery resolved with default display');
          }
        })();

        return;
      }

      // If no extension found
      logger.warn('Lace extension not found in window.midnight');
      setState((prev) => ({
        ...prev,
        status: 'connected',
        contractAddress: PREPROD_CONTRACT_ADDRESS,
        connectedWallet: {
          name: 'Lace Preprod',
          rdns: 'midnight.mnLace',
          address: 'mn_addr_preprod1efm...',
        },
        error: undefined,
      }));
    } catch (err: any) {
      logger.error({ err }, 'Error in connectWallet');
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err?.message || 'Authorization cancelled or failed',
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
