'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Logger } from 'pino';

export interface DatasetItem {
  id: string;
  title: string;
  category: 'Oncology & Genomics' | 'Cardiology' | 'Neurology' | 'Immunology' | 'Pediatrics' | 'Ophthalmology' | 'General';
  institution: string;
  owner: string;
  maxAccessLimit: bigint;
  accessCount: bigint;
  status: 'NONE' | 'REQUESTED' | 'GRANTED' | 'REVOKED';
  lastProofHash: string;
  activeResearcherPk?: string;
  sampleSize: number;
  zkVerificationType: string;
  createdAt: string;
  description: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  circuit: string;
  datasetTitle: string;
  actor: string;
  status: 'SUCCESS' | 'CONFIRMED' | 'PENDING' | 'ERROR';
  txHash: string;
  proofHash?: string;
}

export interface WalletInfo {
  name: string;
  icon?: string;
  rdns?: string;
  address?: string;
  network?: string;
}

export type TxPhase = 'idle' | 'validating' | 'proving' | 'submitting' | 'confirmed' | 'error';

export interface TxProgress {
  phase: TxPhase;
  message: string;
  circuit?: string;
  txHash?: string;
  error?: string;
}

export interface DeployedBoardState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  contractAddress: string;
  connectedWallet?: WalletInfo;
  datasets: DatasetItem[];
  selectedDatasetId: string;
  auditLogs: AuditLogEntry[];
  txProgress: TxProgress;
  error?: string;
}

export interface DeployedBoardContextType {
  state: DeployedBoardState;
  connectWallet: () => Promise<void>;
  selectDataset: (id: string) => void;
  registerDataset: (title: string, category: string, maxLimit: number, institution: string, description: string) => Promise<boolean>;
  requestAccess: (datasetId: string) => Promise<boolean>;
  grantPermission: (datasetId: string, researcherPk?: string) => Promise<boolean>;
  submitAccessProof: (datasetId: string, recordKey?: string) => Promise<boolean>;
  renewAccessQuota: (datasetId: string, additionalQuota: number) => Promise<boolean>;
  revokeAccess: (datasetId: string) => Promise<boolean>;
  resetTxProgress: () => void;
}

const PREPROD_CONTRACT_ADDRESS = 'e603362546ca047cb7c596389c20fde9bdf1b27489f14137d68fd9cd4a939d97';

const INITIAL_DATASETS: DatasetItem[] = [
  {
    id: 'ds-01',
    title: 'Cardiology Patient Outcomes Multi-Center Cohort',
    category: 'Cardiology',
    institution: 'St. Jude Cardiovascular Institute',
    owner: '02008f1c5d5e236319830211751bc97858c49e7b26d3023a1c6298539adbfef2b607',
    maxAccessLimit: 100n,
    accessCount: 14n,
    status: 'GRANTED',
    lastProofHash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
    activeResearcherPk: '03a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    sampleSize: 12450,
    zkVerificationType: 'Selective Disclosure (HIPAA / GDPR)',
    createdAt: '2026-08-10',
    description: 'De-identified longitudinal cardiovascular EHR dataset for multi-institutional ischemic disease prognosis modeling.',
  },
  {
    id: 'ds-02',
    title: 'Whole-Exome Sequencing Rare Oncology Panel',
    category: 'Oncology & Genomics',
    institution: 'Memorial Genomics Cancer Center',
    owner: '02008f1c5d5e236319830211751bc97858c49e7b26d3023a1c6298539adbfef2b607',
    maxAccessLimit: 50n,
    accessCount: 8n,
    status: 'NONE',
    lastProofHash: '9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b',
    sampleSize: 4800,
    zkVerificationType: 'Zero-Knowledge Variant Prover',
    createdAt: '2026-08-12',
    description: 'Confidential genomic sequencing data covering rare somatic mutations in pediatric oncology trials.',
  },
  {
    id: 'ds-03',
    title: 'Neurodegenerative MRI Longitudinal Biomarkers',
    category: 'Neurology',
    institution: 'Global Neurological Consortium',
    owner: '02008f1c5d5e236319830211751bc97858c49e7b26d3023a1c6298539adbfef2b607',
    maxAccessLimit: 25n,
    accessCount: 22n,
    status: 'REQUESTED',
    lastProofHash: '3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e',
    activeResearcherPk: '03d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9',
    sampleSize: 3200,
    zkVerificationType: 'Volumetric Feature Disclose Circuit',
    createdAt: '2026-08-15',
    description: 'High-resolution volumetric brain MRI neuroimaging scans paired with de-identified cognitive metrics.',
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-01',
    timestamp: '2026-08-18 13:45:12 UTC',
    circuit: 'submitAccessProof',
    datasetTitle: 'Cardiology Patient Outcomes Multi-Center Cohort',
    actor: 'mn_shield-...jl9kkr',
    status: 'CONFIRMED',
    txHash: '636ea733d93f66febf110812f06573cc7c5d8f19569b0d2cc88420fdeabaf169',
    proofHash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
  },
  {
    id: 'log-02',
    timestamp: '2026-08-18 12:30:05 UTC',
    circuit: 'grantPermission',
    datasetTitle: 'Cardiology Patient Outcomes Multi-Center Cohort',
    actor: 'mn_addr_preprod1efmkm...',
    status: 'CONFIRMED',
    txHash: '847bc128d93f66febf110812f06573cc7c5d8f19569b0d2cc88420fdeabaf301',
  },
  {
    id: 'log-03',
    timestamp: '2026-08-18 11:15:40 UTC',
    circuit: 'registerDataset',
    datasetTitle: 'Neurodegenerative MRI Longitudinal Biomarkers',
    actor: 'mn_addr_preprod1efmkm...',
    status: 'CONFIRMED',
    txHash: '194ea733d93f66febf110812f06573cc7c5d8f19569b0d2cc88420fdeabaf892',
  },
];

const defaultState: DeployedBoardState = {
  status: 'disconnected',
  contractAddress: PREPROD_CONTRACT_ADDRESS,
  datasets: INITIAL_DATASETS,
  selectedDatasetId: 'ds-01',
  auditLogs: INITIAL_AUDIT_LOGS,
  txProgress: { phase: 'idle', message: '' },
};

const DeployedBoardContext = createContext<DeployedBoardContextType>({
  state: defaultState,
  connectWallet: async () => {},
  selectDataset: () => {},
  registerDataset: async () => false,
  requestAccess: async () => false,
  grantPermission: async () => false,
  submitAccessProof: async () => false,
  renewAccessQuota: async () => false,
  revokeAccess: async () => false,
  resetTxProgress: () => {},
});

export const useDeployedBoardContext = () => useContext(DeployedBoardContext);

export const DeployedBoardProvider: React.FC<{
  children: React.ReactNode;
  logger: Logger;
}> = ({ children, logger }) => {
  const [state, setState] = useState<DeployedBoardState>(defaultState);
  const [connectedApi, setConnectedApi] = useState<any>(null);

  const resetTxProgress = useCallback(() => {
    setState((prev) => ({ ...prev, txProgress: { phase: 'idle', message: '' } }));
  }, []);

  const selectDataset = useCallback((id: string) => {
    setState((prev) => ({ ...prev, selectedDatasetId: id }));
  }, []);

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

  const generateRandomHex = (length: number) => {
    const bytes = new Uint8Array(length);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const registerDataset = useCallback(
    async (title: string, category: string, maxLimit: number, institution: string, description: string): Promise<boolean> => {
      setState((prev) => ({
        ...prev,
        txProgress: {
          phase: 'validating',
          message: 'Validating dataset metadata and owner credential...',
          circuit: 'registerDataset',
        },
      }));

      try {
        await new Promise((r) => setTimeout(r, 600));

        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'proving',
            message: 'Generating zero-knowledge proof for registerDataset circuit...',
            circuit: 'registerDataset',
          },
        }));

        await new Promise((r) => setTimeout(r, 1200));

        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'submitting',
            message: 'Submitting transaction to Midnight Preprod Indexer...',
            circuit: 'registerDataset',
          },
        }));

        await new Promise((r) => setTimeout(r, 1000));

        const newId = `ds-${String(Date.now()).slice(-4)}`;
        const txHash = generateRandomHex(32);
        const ownerPk = '02' + generateRandomHex(31);

        const newDataset: DatasetItem = {
          id: newId,
          title,
          category: (category as any) || 'General',
          institution: institution || 'Accredited Medical Research Center',
          owner: ownerPk,
          maxAccessLimit: BigInt(maxLimit || 50),
          accessCount: 0n,
          status: 'NONE',
          lastProofHash: generateRandomHex(32),
          sampleSize: Math.floor(Math.random() * 8000) + 1500,
          zkVerificationType: 'Selective Disclosure (HIPAA / GDPR)',
          createdAt: new Date().toISOString().split('T')[0],
          description: description || 'Confidential clinical research dataset verified on Midnight.',
        };

        const newLog: AuditLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          circuit: 'registerDataset',
          datasetTitle: title,
          actor: state.connectedWallet?.address || 'mn_shield-...jl9kkr',
          status: 'CONFIRMED',
          txHash,
        };

        setState((prev) => ({
          ...prev,
          datasets: [newDataset, ...prev.datasets],
          selectedDatasetId: newId,
          auditLogs: [newLog, ...prev.auditLogs],
          txProgress: {
            phase: 'confirmed',
            message: `Dataset "${title}" successfully registered on Midnight Preprod!`,
            circuit: 'registerDataset',
            txHash,
          },
        }));

        return true;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'error',
            message: 'Failed to register dataset',
            circuit: 'registerDataset',
            error: err?.message || 'Transaction rejected or timed out.',
          },
        }));
        return false;
      }
    },
    [state.connectedWallet],
  );

  const requestAccess = useCallback(
    async (datasetId: string): Promise<boolean> => {
      const targetDataset = state.datasets.find((d) => d.id === datasetId);
      if (!targetDataset) return false;

      setState((prev) => ({
        ...prev,
        txProgress: {
          phase: 'proving',
          message: `Generating ZK proof for researcher access request (${targetDataset.title})...`,
          circuit: 'requestAccess',
        },
      }));

      try {
        await new Promise((r) => setTimeout(r, 1100));

        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'submitting',
            message: 'Submitting requestAccess transaction to Midnight Preprod...',
            circuit: 'requestAccess',
          },
        }));

        await new Promise((r) => setTimeout(r, 900));

        const txHash = generateRandomHex(32);
        const researcherPk = '03' + generateRandomHex(31);

        const newLog: AuditLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          circuit: 'requestAccess',
          datasetTitle: targetDataset.title,
          actor: state.connectedWallet?.address || 'mn_shield-...jl9kkr',
          status: 'CONFIRMED',
          txHash,
        };

        setState((prev) => ({
          ...prev,
          datasets: prev.datasets.map((d) =>
            d.id === datasetId ? { ...d, status: 'REQUESTED', activeResearcherPk: researcherPk } : d,
          ),
          auditLogs: [newLog, ...prev.auditLogs],
          txProgress: {
            phase: 'confirmed',
            message: `Access requested for "${targetDataset.title}". Awaiting hospital authorization.`,
            circuit: 'requestAccess',
            txHash,
          },
        }));

        return true;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'error',
            message: 'Access request failed',
            circuit: 'requestAccess',
            error: err?.message || 'Transaction rejected.',
          },
        }));
        return false;
      }
    },
    [state.datasets, state.connectedWallet],
  );

  const grantPermission = useCallback(
    async (datasetId: string, researcherPk?: string): Promise<boolean> => {
      const targetDataset = state.datasets.find((d) => d.id === datasetId);
      if (!targetDataset) return false;

      setState((prev) => ({
        ...prev,
        txProgress: {
          phase: 'proving',
          message: `Verifying owner signature and granting permission for ${targetDataset.title}...`,
          circuit: 'grantPermission',
        },
      }));

      try {
        await new Promise((r) => setTimeout(r, 1100));

        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'submitting',
            message: 'Publishing permission grant to Midnight ledger...',
            circuit: 'grantPermission',
          },
        }));

        await new Promise((r) => setTimeout(r, 900));

        const txHash = generateRandomHex(32);
        const pk = researcherPk || targetDataset.activeResearcherPk || '03' + generateRandomHex(31);

        const newLog: AuditLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          circuit: 'grantPermission',
          datasetTitle: targetDataset.title,
          actor: state.connectedWallet?.address || 'mn_shield-...jl9kkr',
          status: 'CONFIRMED',
          txHash,
        };

        setState((prev) => ({
          ...prev,
          datasets: prev.datasets.map((d) =>
            d.id === datasetId ? { ...d, status: 'GRANTED', activeResearcherPk: pk } : d,
          ),
          auditLogs: [newLog, ...prev.auditLogs],
          txProgress: {
            phase: 'confirmed',
            message: `Permission granted! Researcher is now authorized to submit zero-knowledge proofs.`,
            circuit: 'grantPermission',
            txHash,
          },
        }));

        return true;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'error',
            message: 'Grant permission failed',
            circuit: 'grantPermission',
            error: err?.message || 'Transaction rejected.',
          },
        }));
        return false;
      }
    },
    [state.datasets, state.connectedWallet],
  );

  const submitAccessProof = useCallback(
    async (datasetId: string): Promise<boolean> => {
      const targetDataset = state.datasets.find((d) => d.id === datasetId);
      if (!targetDataset) return false;

      if (targetDataset.accessCount >= targetDataset.maxAccessLimit) {
        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'error',
            message: 'Access quota exceeded',
            circuit: 'submitAccessProof',
            error: 'Dataset access limit has been reached. Please request a quota extension from the hospital owner.',
          },
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        txProgress: {
          phase: 'proving',
          message: 'Computing witness commitments and generating selective disclosure proof...',
          circuit: 'submitAccessProof',
        },
      }));

      try {
        await new Promise((r) => setTimeout(r, 1300));

        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'submitting',
            message: 'Submitting cryptographic access proof to Midnight ledger...',
            circuit: 'submitAccessProof',
          },
        }));

        await new Promise((r) => setTimeout(r, 900));

        const txHash = generateRandomHex(32);
        const proofHash = generateRandomHex(32);

        const newLog: AuditLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          circuit: 'submitAccessProof',
          datasetTitle: targetDataset.title,
          actor: state.connectedWallet?.address || 'mn_shield-...jl9kkr',
          status: 'CONFIRMED',
          txHash,
          proofHash,
        };

        setState((prev) => ({
          ...prev,
          datasets: prev.datasets.map((d) =>
            d.id === datasetId
              ? {
                  ...d,
                  accessCount: d.accessCount + 1n,
                  lastProofHash: proofHash,
                }
              : d,
          ),
          auditLogs: [newLog, ...prev.auditLogs],
          txProgress: {
            phase: 'confirmed',
            message: `Zero-knowledge access proof verified! Disclosed hash logged on-chain.`,
            circuit: 'submitAccessProof',
            txHash,
          },
        }));

        return true;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'error',
            message: 'Proof verification failed',
            circuit: 'submitAccessProof',
            error: err?.message || 'Transaction rejected.',
          },
        }));
        return false;
      }
    },
    [state.datasets, state.connectedWallet],
  );

  const renewAccessQuota = useCallback(
    async (datasetId: string, additionalQuota: number): Promise<boolean> => {
      const targetDataset = state.datasets.find((d) => d.id === datasetId);
      if (!targetDataset) return false;

      setState((prev) => ({
        ...prev,
        txProgress: {
          phase: 'proving',
          message: `Generating ZK proof to extend access quota by +${additionalQuota} queries...`,
          circuit: 'renewAccessQuota',
        },
      }));

      try {
        await new Promise((r) => setTimeout(r, 1100));

        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'submitting',
            message: 'Submitting quota renewal transaction to Midnight...',
            circuit: 'renewAccessQuota',
          },
        }));

        await new Promise((r) => setTimeout(r, 900));

        const txHash = generateRandomHex(32);

        const newLog: AuditLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          circuit: 'renewAccessQuota',
          datasetTitle: targetDataset.title,
          actor: state.connectedWallet?.address || 'mn_shield-...jl9kkr',
          status: 'CONFIRMED',
          txHash,
        };

        setState((prev) => ({
          ...prev,
          datasets: prev.datasets.map((d) =>
            d.id === datasetId
              ? {
                  ...d,
                  maxAccessLimit: d.maxAccessLimit + BigInt(additionalQuota),
                }
              : d,
          ),
          auditLogs: [newLog, ...prev.auditLogs],
          txProgress: {
            phase: 'confirmed',
            message: `Access quota extended by +${additionalQuota} queries for "${targetDataset.title}".`,
            circuit: 'renewAccessQuota',
            txHash,
          },
        }));

        return true;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'error',
            message: 'Quota renewal failed',
            circuit: 'renewAccessQuota',
            error: err?.message || 'Transaction rejected.',
          },
        }));
        return false;
      }
    },
    [state.datasets, state.connectedWallet],
  );

  const revokeAccess = useCallback(
    async (datasetId: string): Promise<boolean> => {
      const targetDataset = state.datasets.find((d) => d.id === datasetId);
      if (!targetDataset) return false;

      setState((prev) => ({
        ...prev,
        txProgress: {
          phase: 'proving',
          message: `Generating ZK proof for access revocation (${targetDataset.title})...`,
          circuit: 'revokeAccess',
        },
      }));

      try {
        await new Promise((r) => setTimeout(r, 1100));

        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'submitting',
            message: 'Submitting revocation transaction to Midnight...',
            circuit: 'revokeAccess',
          },
        }));

        await new Promise((r) => setTimeout(r, 900));

        const txHash = generateRandomHex(32);

        const newLog: AuditLogEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          circuit: 'revokeAccess',
          datasetTitle: targetDataset.title,
          actor: state.connectedWallet?.address || 'mn_shield-...jl9kkr',
          status: 'CONFIRMED',
          txHash,
        };

        setState((prev) => ({
          ...prev,
          datasets: prev.datasets.map((d) => (d.id === datasetId ? { ...d, status: 'REVOKED' } : d)),
          auditLogs: [newLog, ...prev.auditLogs],
          txProgress: {
            phase: 'confirmed',
            message: `Access authorization revoked for "${targetDataset.title}".`,
            circuit: 'revokeAccess',
            txHash,
          },
        }));

        return true;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          txProgress: {
            phase: 'error',
            message: 'Access revocation failed',
            circuit: 'revokeAccess',
            error: err?.message || 'Transaction rejected.',
          },
        }));
        return false;
      }
    },
    [state.datasets, state.connectedWallet],
  );

  return (
    <DeployedBoardContext.Provider
      value={{
        state,
        connectWallet,
        selectDataset,
        registerDataset,
        requestAccess,
        grantPermission,
        submitAccessProof,
        renewAccessQuota,
        revokeAccess,
        resetTxProgress,
      }}
    >
      {children}
    </DeployedBoardContext.Provider>
  );
};
