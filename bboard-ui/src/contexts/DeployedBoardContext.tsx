'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Logger } from 'pino';

export interface ContractState {
  owner: string;
  datasetCategory: string;
  maxAccessLimit: bigint;
  accessCount: bigint;
}

export interface WalletInfo {
  name: string;
  icon?: string;
  rdns?: string;
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
  requestAccess: () => Promise<void>;
  grantPermission: () => Promise<void>;
  submitAccessProof: () => Promise<void>;
  renewAccessQuota: (newLimit: bigint) => Promise<void>;
  revokeAccess: () => Promise<void>;
}

const defaultState: DeployedBoardState = {
  status: 'disconnected',
};

const DeployedBoardContext = createContext<DeployedBoardContextType>({
  state: defaultState,
  connectWallet: async () => {},
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
  const [boardManager, setBoardManager] = useState<any>(null);
  const [state, setState] = useState<DeployedBoardState>(defaultState);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let unsub: (() => void) | undefined;

    const init = async () => {
      try {
        // Use runtime import to isolate client-only Web3/WASM dependencies from Next.js SSR Webpack pass
        const mod = await eval("import('./BrowserDeployedBoardManager')");
        if (!isMounted) return;

        const manager = new mod.BrowserDeployedBoardManager(logger);
        setBoardManager(manager);

        const sub = manager.state$.subscribe((st: DeployedBoardState) => {
          if (isMounted) {
            setState(st);
          }
        });

        unsub = () => sub.unsubscribe();
      } catch (err: any) {
        console.warn('BrowserDeployedBoardManager fallback mode initialized:', err?.message || err);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (unsub) unsub();
    };
  }, [logger]);

  const connectWallet = async () => {
    if (boardManager) {
      await boardManager.connectWallet();
    } else {
      console.warn('Wallet connection fallback in mock mode');
    }
  };

  const requestAccess = async () => {
    if (boardManager) {
      await boardManager.requestAccess();
    } else {
      setState((prev) => ({ ...prev, circuitExecuting: true }));
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          circuitExecuting: false,
          contractState: prev.contractState
            ? { ...prev.contractState, accessCount: prev.contractState.accessCount + 1n }
            : { owner: '00'.repeat(32), datasetCategory: 'Genomics', maxAccessLimit: 100n, accessCount: 1n },
        }));
      }, 1000);
    }
  };

  const grantPermission = async () => {
    if (boardManager) {
      await boardManager.grantPermission();
    } else {
      setState((prev) => ({ ...prev, circuitExecuting: true }));
      setTimeout(() => setState((prev) => ({ ...prev, circuitExecuting: false })), 1000);
    }
  };

  const submitAccessProof = async () => {
    if (boardManager) {
      await boardManager.submitAccessProof();
    } else {
      setState((prev) => ({ ...prev, circuitExecuting: true }));
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          circuitExecuting: false,
          contractState: prev.contractState
            ? { ...prev.contractState, accessCount: prev.contractState.accessCount + 1n }
            : { owner: '00'.repeat(32), datasetCategory: 'Genomics', maxAccessLimit: 100n, accessCount: 1n },
        }));
      }, 1000);
    }
  };

  const renewAccessQuota = async (newLimit: bigint) => {
    if (boardManager) {
      await boardManager.renewAccessQuota(newLimit);
    } else {
      setState((prev) => ({ ...prev, circuitExecuting: true }));
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          circuitExecuting: false,
          contractState: prev.contractState
            ? { ...prev.contractState, maxAccessLimit: newLimit }
            : { owner: '00'.repeat(32), datasetCategory: 'Genomics', maxAccessLimit: newLimit, accessCount: 0n },
        }));
      }, 1000);
    }
  };

  const revokeAccess = async () => {
    if (boardManager) {
      await boardManager.revokeAccess();
    } else {
      setState((prev) => ({ ...prev, circuitExecuting: true }));
      setTimeout(() => setState((prev) => ({ ...prev, circuitExecuting: false })), 1000);
    }
  };

  return (
    <DeployedBoardContext.Provider
      value={{
        state,
        connectWallet,
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
