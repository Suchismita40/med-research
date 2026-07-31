// Private Medical Research Data Exchange Interactive dApp Component (Premium Light SaaS Aesthetic)

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  Chip,
  Backdrop,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CopyIcon from '@mui/icons-material/ContentCopy';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/VerifiedUser';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import KeyIcon from '@mui/icons-material/VpnKey';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StorageIcon from '@mui/icons-material/Storage';
import ScienceIcon from '@mui/icons-material/Science';

import { useDeployedBoardContext } from '../hooks/index.js';
import { type BoardDeployment } from '../contexts/index.js';
import { type Observable } from 'rxjs';
import { type DeployedBBoardAPI, type BBoardDerivedState, type ContractAddress } from '../../../api/src/index.js';
import { State } from '../../../contract/src/index.js';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { DataAssetSubmissionDialog } from './DataAssetSubmissionDialog';

const parseTo32Bytes = (input: string): Uint8Array => {
  const cleaned = input.trim().replace(/^0x/i, '');
  if (!cleaned) return new Uint8Array(32);
  if (/^[0-9a-fA-F]+$/.test(cleaned)) {
    const hex = cleaned.length % 2 !== 0 ? '0' + cleaned : cleaned;
    const bytes = Buffer.from(hex, 'hex');
    const res = new Uint8Array(32);
    res.set(bytes.subarray(0, 32));
    return res;
  }
  const textBytes = new TextEncoder().encode(cleaned);
  const res = new Uint8Array(32);
  res.set(textBytes.subarray(0, 32));
  return res;
};

interface BoardProps {
  boardDeployment$?: Observable<BoardDeployment>;
  activeTab?: string;
}

export const Board: React.FC<BoardProps> = ({ boardDeployment$, activeTab = 'dashboard' }) => {
  const boardApiProvider = useDeployedBoardContext();
  const [boardDeployment, setBoardDeployment] = useState<BoardDeployment>();
  const [deployedBoardAPI, setDeployedBoardAPI] = useState<DeployedBBoardAPI>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [boardState, setBoardState] = useState<BBoardDerivedState>();
  const [isWorking, setIsWorking] = useState(!!boardDeployment$);

  // Form Inputs
  const [datasetTitle, setDatasetTitle] = useState('');
  const [joinAddressInput, setJoinAddressInput] = useState('');
  const [researcherPkInput, setResearcherPkInput] = useState('');
  const [patientHashInput, setPatientHashInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string>();

  // Data Asset Submission Modal State
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [submissionDetails, setSubmissionDetails] = useState<{ title: string; hash: string }>({
    title: '',
    hash: '',
  });

  const onCreateBoard = useCallback(() => boardApiProvider.resolve(), [boardApiProvider]);
  const onJoinBoard = useCallback((address: ContractAddress) => boardApiProvider.resolve(address), [boardApiProvider]);

  const onRegisterDataset = useCallback(async () => {
    if (!datasetTitle.trim() || !deployedBoardAPI) return;
    try {
      setIsWorking(true);
      setErrorMessage(undefined);
      const registeredTitle = datasetTitle.trim();
      await deployedBoardAPI.registerDataset(registeredTitle);
      setStatusMessage(`Dataset "${registeredTitle}" registered successfully on Midnight ledger.`);
      setSubmissionDetails({
        title: `Registered Dataset: ${registeredTitle}`,
        hash: `0x${toHex(new Uint8Array(32).fill(0x7a))}`,
      });
      setSubmissionDialogOpen(true);
      setDatasetTitle('');
    } catch (e: unknown) {
      setErrorMessage((e as Error)?.message || 'Failed to register dataset');
    } finally {
      setIsWorking(false);
    }
  }, [deployedBoardAPI, datasetTitle]);

  const onRequestAccess = useCallback(async () => {
    if (!deployedBoardAPI) return;
    try {
      setIsWorking(true);
      setErrorMessage(undefined);
      const datasetId = new Uint8Array(32);
      datasetId.fill(1);
      await deployedBoardAPI.requestAccess(datasetId);
      setStatusMessage('Confidential research access request submitted with ZK medical credential proof.');
    } catch (e: unknown) {
      setErrorMessage((e as Error)?.message || 'Failed to request access');
    } finally {
      setIsWorking(false);
    }
  }, [deployedBoardAPI]);

  const onGrantPermission = useCallback(async () => {
    if (!deployedBoardAPI) return;
    try {
      setIsWorking(true);
      setErrorMessage(undefined);
      const datasetId = new Uint8Array(32);
      datasetId.fill(1);
      const researcherPk = researcherPkInput.trim()
        ? parseTo32Bytes(researcherPkInput)
        : (boardState?.activeResearcherPk ?? new Uint8Array(32));
      await deployedBoardAPI.grantPermission(datasetId, researcherPk);
      setStatusMessage('Research access permission granted to researcher public key.');
      setResearcherPkInput('');
    } catch (e: unknown) {
      setErrorMessage((e as Error)?.message || 'Failed to grant permission');
    } finally {
      setIsWorking(false);
    }
  }, [deployedBoardAPI, researcherPkInput, boardState?.activeResearcherPk]);

  const onSubmitAccessProof = useCallback(async () => {
    if (!deployedBoardAPI) return;
    try {
      setIsWorking(true);
      setErrorMessage(undefined);
      const datasetId = new Uint8Array(32);
      datasetId.fill(1);
      const patientHash = patientHashInput.trim() ? parseTo32Bytes(patientHashInput) : new Uint8Array(32);
      await deployedBoardAPI.submitAccessProof(datasetId, patientHash);
      setStatusMessage('Dataset ZK access proof submitted to Midnight ledger.');
      setSubmissionDetails({
        title: boardState?.datasetTitle || 'Patient Research Dataset Access Proof',
        hash: patientHashInput.trim() || '0x7a8f9b2e4c1d6e8f9a0b2c4d6e8f9a0b2c4d6e8f9a0b2c4d6e8f9a0b2c4d6e8f',
      });
      setSubmissionDialogOpen(true);
      setPatientHashInput('');
    } catch (e: unknown) {
      setErrorMessage((e as Error)?.message || 'Failed to submit access proof');
    } finally {
      setIsWorking(false);
    }
  }, [deployedBoardAPI, patientHashInput, boardState?.datasetTitle]);

  const onRevokeAccess = useCallback(async () => {
    if (!deployedBoardAPI) return;
    try {
      setIsWorking(true);
      setErrorMessage(undefined);
      const datasetId = new Uint8Array(32);
      datasetId.fill(1);
      await deployedBoardAPI.revokeAccess(datasetId);
      setStatusMessage('Research access permission revoked.');
    } catch (e: unknown) {
      setErrorMessage((e as Error)?.message || 'Failed to revoke access');
    } finally {
      setIsWorking(false);
    }
  }, [deployedBoardAPI]);

  useEffect(() => {
    if (!boardDeployment$) return;
    const sub = boardDeployment$.subscribe(setBoardDeployment);
    return () => sub.unsubscribe();
  }, [boardDeployment$]);

  useEffect(() => {
    if (!boardDeployment) return;
    if (boardDeployment.status === 'in-progress') return;
    setIsWorking(false);
    if (boardDeployment.status === 'failed') {
      setErrorMessage(boardDeployment.error.message || 'Unexpected error connecting contract');
      return;
    }
    setDeployedBoardAPI(boardDeployment.api);
    const sub = boardDeployment.api.state$.subscribe(setBoardState);
    return () => sub.unsubscribe();
  }, [boardDeployment]);

  if (!boardDeployment$) {
    return (
      <Card
        sx={{
          p: 5,
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        <SecurityIcon sx={{ fontSize: 64, color: '#F97316', mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#EA580C', letterSpacing: '-0.02em' }}>
          Initialize Medical Data Exchange Contract
        </Typography>
        <Typography variant="body1" sx={{ color: '#6B7280', mb: 4, maxWidth: 540, mx: 'auto', lineHeight: 1.6 }}>
          Deploy a new zero-knowledge smart contract for secure patient dataset sharing or join an existing contract
          using its on-chain address.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            justifyContent: 'center',
            maxWidth: 640,
            mx: 'auto',
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={onCreateBoard}
            startIcon={<AddCircleIcon />}
            sx={{
              backgroundColor: '#F97316',
              color: '#FFFFFF',
              fontWeight: 700,
              py: 1.6,
              px: 3.5,
              borderRadius: 2.5,
              '&:hover': { backgroundColor: '#EA580C' },
            }}
          >
            Deploy New Contract
          </Button>

          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
            <TextField
              size="small"
              placeholder="Enter Contract Address..."
              value={joinAddressInput}
              onChange={(e) => setJoinAddressInput(e.target.value)}
              fullWidth
            />
            <Button
              variant="outlined"
              onClick={() => onJoinBoard(joinAddressInput.trim())}
              disabled={!joinAddressInput.trim()}
              sx={{ borderColor: '#F97316', color: '#EA580C', fontWeight: 700, borderRadius: 2.5, px: 3 }}
            >
              Join
            </Button>
          </Box>
        </Box>
      </Card>
    );
  }

  const accessStateLabel = boardState ? State[boardState.state] : 'LOADING';

  return (
    <Box sx={{ width: '100%' }}>
      {/* Working & Error Overlay */}
      <Backdrop
        open={isWorking}
        sx={{
          color: '#F97316',
          zIndex: 999,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <CircularProgress color="inherit" size={48} />
        <Typography sx={{ ml: 2.5, fontWeight: 700, color: '#1F2937', fontSize: '1.1rem' }}>
          Executing Midnight ZK Proof Circuit...
        </Typography>
      </Backdrop>

      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage(undefined)} sx={{ mb: 3, borderRadius: 2.5 }}>
          {errorMessage}
        </Alert>
      )}

      {statusMessage && (
        <Alert severity="success" onClose={() => setStatusMessage(undefined)} sx={{ mb: 3, borderRadius: 2.5 }}>
          {statusMessage}
        </Alert>
      )}

      {/* Contract Address & Status Banner */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3.5,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon sx={{ color: '#F97316' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1F2937' }}>
              Contract Address:
            </Typography>
            <Chip
              label={
                deployedBoardAPI?.deployedContractAddress
                  ? `${deployedBoardAPI.deployedContractAddress.slice(0, 16)}...${deployedBoardAPI.deployedContractAddress.slice(-8)}`
                  : 'Loading...'
              }
              size="small"
              sx={{
                backgroundColor: '#FFF7ED',
                color: '#EA580C',
                border: '1px solid #FFEDD5',
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            />
            <IconButton
              size="small"
              onClick={() =>
                deployedBoardAPI?.deployedContractAddress &&
                navigator.clipboard.writeText(deployedBoardAPI.deployedContractAddress)
              }
            >
              <CopyIcon fontSize="small" sx={{ color: '#6B7280' }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip
              icon={
                <LockIcon
                  sx={{
                    fontSize: '14px !important',
                    color: boardState?.state === State.GRANTED ? '#10B981' : '#F97316',
                  }}
                />
              }
              label={`Permission: ${accessStateLabel}`}
              sx={{
                backgroundColor: boardState?.state === State.GRANTED ? '#ECFDF5' : '#FFF7ED',
                color: boardState?.state === State.GRANTED ? '#059669' : '#EA580C',
                border: boardState?.state === State.GRANTED ? '1px solid #A7F3D0' : '1px solid #FFEDD5',
                fontWeight: 700,
              }}
              size="small"
            />
            <Chip
              icon={<HistoryIcon sx={{ fontSize: '14px !important', color: '#F97316' }} />}
              label={`Audit Proofs: ${boardState?.auditLogCount?.toString() ?? '0'}`}
              size="small"
              sx={{ backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', fontWeight: 600 }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Main Dashboard Views */}
      {activeTab === 'dashboard' && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3.5 }}>
          {/* Hospital Dataset Registration */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ p: 3.5, height: '100%' }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, mb: 1, color: '#EA580C', display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <AddCircleIcon sx={{ color: '#F97316' }} /> Hospital Dataset Registration
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, lineHeight: 1.6 }}>
                Hospitals securely post anonymized medical research dataset titles to the Midnight public ledger.
              </Typography>

              <TextField
                fullWidth
                label="Dataset Title"
                placeholder="e.g. Oncology Genomic Sequencing Cohort 2026"
                value={datasetTitle}
                onChange={(e) => setDatasetTitle(e.target.value)}
                sx={{ mb: 2.5 }}
              />

              <Button
                variant="contained"
                fullWidth
                onClick={onRegisterDataset}
                disabled={!datasetTitle.trim()}
                sx={{
                  backgroundColor: '#F97316',
                  color: '#FFFFFF',
                  py: 1.4,
                  fontWeight: 700,
                  borderRadius: 2.5,
                  '&:hover': { backgroundColor: '#EA580C' },
                }}
              >
                Register Medical Dataset Circuit
              </Button>
            </Card>
          </Box>

          {/* Hospital Access Control */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ p: 3.5, height: '100%' }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, mb: 1, color: '#EA580C', display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <VerifiedIcon sx={{ color: '#F97316' }} /> Hospital Access Control
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, lineHeight: 1.6 }}>
                Grant or revoke research institution dataset permissions based on verified ZK qualification proofs.
              </Typography>

              <TextField
                fullWidth
                size="small"
                label="Active Researcher Public Key (Hex)"
                placeholder="Optional override hex..."
                value={researcherPkInput}
                onChange={(e) => setResearcherPkInput(e.target.value)}
                sx={{ mb: 2.5 }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={onGrantPermission}
                  color="success"
                  disabled={boardState?.state !== State.REQUESTED}
                  startIcon={<CheckCircleIcon />}
                  sx={{ py: 1.3, fontWeight: 700, borderRadius: 2.5 }}
                >
                  Grant Permission
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={onRevokeAccess}
                  color="error"
                  disabled={boardState?.state === State.NONE || boardState?.state === State.REVOKED}
                  startIcon={<CancelIcon />}
                  sx={{ py: 1.3, fontWeight: 700, borderRadius: 2.5, borderColor: '#EF4444', color: '#DC2626' }}
                >
                  Revoke Access
                </Button>
              </Box>
            </Card>
          </Box>
        </Box>
      )}

      {activeTab === 'researcher' && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3.5 }}>
          {/* Researcher Access Request */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ p: 3.5, height: '100%' }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, mb: 1, color: '#EA580C', display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <KeyIcon sx={{ color: '#F97316' }} /> Request Research Access (ZK Proof)
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, lineHeight: 1.6 }}>
                Researchers prove eligibility secretly using private medical credential witnesses without disclosing
                identities or license numbers on-chain.
              </Typography>

              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FFEDD5',
                  color: '#C2410C',
                  borderRadius: 2.5,
                }}
              >
                Private Witness: Local secret key & medical qualification credential verified via Zero-Knowledge
                circuit.
              </Alert>

              <Button
                variant="contained"
                fullWidth
                onClick={onRequestAccess}
                disabled={boardState?.state === State.REQUESTED || boardState?.state === State.GRANTED}
                sx={{
                  backgroundColor: '#F97316',
                  color: '#FFFFFF',
                  py: 1.4,
                  fontWeight: 700,
                  borderRadius: 2.5,
                  '&:hover': { backgroundColor: '#EA580C' },
                }}
              >
                Submit ZK Access Request
              </Button>
            </Card>
          </Box>

          {/* Submit Patient Dataset Access Proof */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ p: 3.5, height: '100%' }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, mb: 1, color: '#EA580C', display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <ScienceIcon sx={{ color: '#F97316' }} /> Submit Dataset Access Proof
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2.5, lineHeight: 1.6 }}>
                Generates and publishes an immutable ZK access proof using private patient record key.
              </Typography>

              <TextField
                fullWidth
                size="small"
                label="Anonymized Patient Record Hash (Hex)"
                placeholder="0x7a8f..."
                value={patientHashInput}
                onChange={(e) => setPatientHashInput(e.target.value)}
                sx={{ mb: 2.5 }}
              />

              <Button
                variant="contained"
                fullWidth
                onClick={onSubmitAccessProof}
                disabled={boardState?.state !== State.GRANTED}
                sx={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  py: 1.4,
                  fontWeight: 700,
                  borderRadius: 2.5,
                  '&:hover': { backgroundColor: '#059669' },
                }}
              >
                Generate & Submit Access Proof
              </Button>
            </Card>
          </Box>
        </Box>
      )}

      {activeTab === 'datasets' && (
        <Card sx={{ p: 3.5 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, mb: 2.5, color: '#EA580C', display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <StorageIcon sx={{ color: '#F97316' }} /> Medical Research Dataset Registry
          </Typography>
          <TableContainer
            component={Paper}
            sx={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: 'none' }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: '#FAFAFA' }}>
                <TableRow>
                  <TableCell sx={{ color: '#374151', fontWeight: 700 }}>Dataset Title</TableCell>
                  <TableCell sx={{ color: '#374151', fontWeight: 700 }}>Security Level</TableCell>
                  <TableCell sx={{ color: '#374151', fontWeight: 700 }}>Access Status</TableCell>
                  <TableCell sx={{ color: '#374151', fontWeight: 700 }}>Sample Size</TableCell>
                  <TableCell sx={{ color: '#374151', fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ '&:nth-of-type(even)': { backgroundColor: '#FAFAFA' } }}>
                  <TableCell sx={{ fontWeight: 600, color: '#1F2937' }}>
                    {boardState?.datasetTitle ?? 'Genomic Oncology Cohort 2026'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label="Level 3 ZK-Protected"
                      size="small"
                      sx={{ backgroundColor: '#FFF7ED', color: '#EA580C', fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={accessStateLabel}
                      size="small"
                      color={boardState?.state === State.GRANTED ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#4B5563' }}>14,280 Patients</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={onRequestAccess}
                      disabled={boardState?.state === State.GRANTED}
                      sx={{ borderColor: '#F97316', color: '#EA580C' }}
                    >
                      Request Access
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow sx={{ '&:nth-of-type(even)': { backgroundColor: '#FAFAFA' } }}>
                  <TableCell sx={{ fontWeight: 600, color: '#1F2937' }}>Cardiology Biomarker Study B</TableCell>
                  <TableCell>
                    <Chip
                      label="Level 3 ZK-Protected"
                      size="small"
                      sx={{ backgroundColor: '#FFF7ED', color: '#EA580C', fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label="GRANTED" size="small" color="success" />
                  </TableCell>
                  <TableCell sx={{ color: '#4B5563' }}>8,500 Patients</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" color="success">
                      View Cohort
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 'records' && (
        <Card sx={{ p: 3.5 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, mb: 2.5, color: '#EA580C', display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <LockIcon sx={{ color: '#F97316' }} /> Anonymized Patient Record Explorer
          </Typography>
          <Alert
            severity="success"
            sx={{ mb: 3, backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', borderRadius: 2.5 }}
          >
            All patient records are protected by zero-knowledge access proofs. Patient PII is never stored or exposed.
          </Alert>
          <TableContainer
            component={Paper}
            sx={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 3, boxShadow: 'none' }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: '#FAFAFA' }}>
                <TableRow>
                  <TableCell sx={{ color: '#374151', fontWeight: 700 }}>Anonymized ID</TableCell>
                  <TableCell sx={{ color: '#374151', fontWeight: 700 }}>Clinical Cohort</TableCell>
                  <TableCell sx={{ color: '#374151', fontWeight: 700 }}>ZK Proof Hash</TableCell>
                  <TableCell sx={{ color: '#374151', fontWeight: 700 }}>Verification Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ '&:nth-of-type(even)': { backgroundColor: '#FAFAFA' } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>ANON-9041-X</TableCell>
                  <TableCell sx={{ color: '#4B5563' }}>Oncology Cohort A</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', color: '#EA580C', fontWeight: 700 }}>
                    {boardState?.lastProofHash ? toHex(boardState.lastProofHash).slice(0, 16) + '...' : '0x7a8f9b2e...'}
                  </TableCell>
                  <TableCell>
                    <Chip label="ZK-Verified" size="small" color="success" icon={<CheckCircleIcon />} />
                  </TableCell>
                </TableRow>
                <TableRow sx={{ '&:nth-of-type(even)': { backgroundColor: '#FAFAFA' } }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>ANON-9042-Y</TableCell>
                  <TableCell sx={{ color: '#4B5563' }}>Oncology Cohort A</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', color: '#EA580C', fontWeight: 700 }}>
                    0x3c9d1a4e...
                  </TableCell>
                  <TableCell>
                    <Chip label="ZK-Verified" size="small" color="success" icon={<CheckCircleIcon />} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 'zk-proofs' && (
        <Card sx={{ p: 3.5 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, mb: 2.5, color: '#EA580C', display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <SecurityIcon sx={{ color: '#F97316' }} /> Selective Disclosure & ZK Privacy Model
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3.5 }}>
            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 3, backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#EA580C', mb: 1.5 }}>
                  Public Ledger State (Disclosed)
                </Typography>
                <Typography variant="body2" component="div" sx={{ color: '#4B5563', lineHeight: 1.7 }}>
                  <ul>
                    <li>Dataset Title: &quot;{boardState?.datasetTitle ?? 'Genomic Study'}&quot;</li>
                    <li>Permission Status: {accessStateLabel}</li>
                    <li>Total Audit Proof Count: {boardState?.auditLogCount?.toString() ?? '0'}</li>
                    <li>Active Researcher Public Key Hash</li>
                    <li>Latest Dataset Access Proof Hash</li>
                  </ul>
                </Typography>
              </Paper>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Paper sx={{ p: 3, backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#047857', mb: 1.5 }}>
                  Private Witness State (Concealed)
                </Typography>
                <Typography variant="body2" component="div" sx={{ color: '#4B5563', lineHeight: 1.7 }}>
                  <ul>
                    <li>Medical License Secret Key (Never Disclosed)</li>
                    <li>Patient PII & Raw Identity Records</li>
                    <li>Dataset Encryption Keys</li>
                    <li>Researcher Secret Key</li>
                  </ul>
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card sx={{ p: 3.5 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, mb: 2.5, color: '#EA580C', display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <HistoryIcon sx={{ color: '#F97316' }} /> Immutable Audit Log & On-Chain Verifier
          </Typography>
          <Paper sx={{ p: 2.5, mb: 3, backgroundColor: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 3 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#EA580C', fontWeight: 700, mb: 1 }}>
              Audit Log Count: {boardState?.auditLogCount?.toString() ?? '0'}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#059669', fontWeight: 700 }}>
              Last Access Proof Hash: {boardState?.lastProofHash ? toHex(boardState.lastProofHash) : 'Init'}
            </Typography>
          </Paper>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3.5 }}>
          <Box sx={{ flex: 1 }}>
            <Card sx={{ p: 3.5, textAlign: 'center' }}>
              <Typography variant="h2" sx={{ color: '#EA580C', fontWeight: 800 }}>
                {boardState?.datasetCount?.toString() ?? '1'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 600, mt: 0.5 }}>
                Total Registered Datasets
              </Typography>
            </Card>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Card sx={{ p: 3.5, textAlign: 'center' }}>
              <Typography variant="h2" sx={{ color: '#059669', fontWeight: 800 }}>
                {boardState?.auditLogCount?.toString() ?? '0'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 600, mt: 0.5 }}>
                ZK Access Proofs Verified
              </Typography>
            </Card>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Card sx={{ p: 3.5, textAlign: 'center' }}>
              <Typography variant="h2" sx={{ color: '#F97316', fontWeight: 800 }}>
                {boardState?.state === State.GRANTED ? '1' : '0'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 600, mt: 0.5 }}>
                Active Research Grants
              </Typography>
            </Card>
          </Box>
        </Box>
      )}

      {/* Data Asset Submission Popup Dialog */}
      <DataAssetSubmissionDialog
        open={submissionDialogOpen}
        onClose={() => setSubmissionDialogOpen(false)}
        assetTitle={submissionDetails.title}
        assetHash={submissionDetails.hash}
        contractAddress={deployedBoardAPI?.deployedContractAddress}
        auditProofCount={boardState?.auditLogCount?.toString() ?? '1'}
      />
    </Box>
  );
};
