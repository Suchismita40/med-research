// Private Medical Research Data Exchange Data Asset Submission Popup Dialog

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Divider,
  IconButton,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ScienceIcon from '@mui/icons-material/Science';

export interface DataAssetSubmissionDialogProps {
  open: boolean;
  onClose: () => void;
  assetTitle?: string;
  assetHash?: string;
  contractAddress?: string;
  auditProofCount?: string | bigint;
}

export const DataAssetSubmissionDialog: React.FC<DataAssetSubmissionDialogProps> = ({
  open,
  onClose,
  assetTitle = 'Anonymized Clinical Dataset Asset',
  assetHash = '0x7a8f9b2e4c1d6e8f9a0b2c4d6e8f9a0b2c4d6e8f9a0b2c4d6e8f9a0b2c4d6e8f',
  contractAddress = 'abababababababababababababababababababababababababababababababab',
  auditProofCount = '1',
}) => {
  const displayHash = assetHash || '0x7a8f9b2e4c1d6e8f...';
  const displayAddr = contractAddress
    ? `${contractAddress.slice(0, 16)}...${contractAddress.slice(-8)}`
    : '0xabab...abab';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            p: 1,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid #FFEDD5',
          },
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle sx={{ pb: 1, pt: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircleIcon sx={{ color: '#059669', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1F2937', lineHeight: 1.2 }}>
              Data Asset Submitted
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <ShieldIcon sx={{ fontSize: 13 }} /> Midnight Level 3 ZK Access Proof Verified
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {/* Success Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            backgroundColor: '#FFF7ED',
            border: '1px solid #FFEDD5',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ScienceIcon sx={{ color: '#F97316' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#EA580C' }}>
                {assetTitle}
              </Typography>
              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                On-Chain Audit Sequence #{auditProofCount.toString()}
              </Typography>
            </Box>
          </Box>
          <Chip
            label="ZK-CONFIDENTIAL"
            size="small"
            sx={{ backgroundColor: '#F97316', color: '#FFFFFF', fontWeight: 800, fontSize: '0.7rem' }}
          />
        </Paper>

        {/* Technical Detail Grid */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Asset Hash */}
          <Box>
            <Typography
              variant="caption"
              sx={{ color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Anonymized Record / Asset Hash
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mt: 0.5,
                backgroundColor: '#FAFAFA',
                border: '1px solid #E5E7EB',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#EA580C', wordBreak: 'break-all' }}
              >
                {displayHash}
              </Typography>
              <IconButton size="small" onClick={() => navigator.clipboard.writeText(assetHash)}>
                <ContentCopyIcon fontSize="small" sx={{ color: '#9CA3AF' }} />
              </IconButton>
            </Paper>
          </Box>

          {/* Contract Address */}
          <Box>
            <Typography
              variant="caption"
              sx={{ color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Midnight Smart Contract Address
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mt: 0.5,
                backgroundColor: '#FAFAFA',
                border: '1px solid #E5E7EB',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#374151' }}>
                {displayAddr}
              </Typography>
              <Chip
                label="VERIFIED ON LEDGER"
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.65rem' }}
              />
            </Paper>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          {/* Zero-Knowledge Witness Status Summary */}
          <Typography
            variant="caption"
            sx={{ color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Zero-Knowledge Witness Disclosure Model
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Paper
              elevation={0}
              sx={{ p: 1.5, backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 2 }}
            >
              <Typography
                variant="caption"
                sx={{ color: '#047857', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <LockIcon sx={{ fontSize: 13 }} /> Private Witness Key
              </Typography>
              <Typography variant="body2" sx={{ color: '#065F46', fontWeight: 600, mt: 0.5 }}>
                Concealed (Zero-Knowledge)
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{ p: 1.5, backgroundColor: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: 2 }}
            >
              <Typography
                variant="caption"
                sx={{ color: '#EA580C', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <ShieldIcon sx={{ fontSize: 13 }} /> On-Chain Proof Hash
              </Typography>
              <Typography variant="body2" sx={{ color: '#9A3412', fontWeight: 600, mt: 0.5 }}>
                Immutable Ledger Disclosed
              </Typography>
            </Paper>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onClose}
          sx={{
            backgroundColor: '#F97316',
            color: '#FFFFFF',
            fontWeight: 700,
            py: 1.2,
            borderRadius: 2.5,
            '&:hover': { backgroundColor: '#EA580C' },
          }}
        >
          Close & View Audit Log
        </Button>
      </DialogActions>
    </Dialog>
  );
};
