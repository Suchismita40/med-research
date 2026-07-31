// Private Medical Research Data Exchange Premium Header & Navigation

import React, { useState, useEffect } from 'react';
import { AppBar, Box, Typography, Button, Chip, Snackbar, Alert, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Security';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SchoolIcon from '@mui/icons-material/School';
import StorageIcon from '@mui/icons-material/Storage';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import type { InitialAPI, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const getMidnightWallet = (): InitialAPI | undefined => {
  if (typeof window === 'undefined' || !window.midnight) return undefined;
  if (window.midnight['mnLace'] && typeof window.midnight['mnLace'].connect === 'function') {
    return window.midnight['mnLace'];
  }
  return Object.values(window.midnight).find(
    (wallet): wallet is InitialAPI => !!wallet && typeof wallet === 'object' && typeof wallet.connect === 'function',
  );
};

const truncateAddress = (addr: string): string => {
  if (!addr || addr.length <= 16) return addr;
  return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
};

export const Header: React.FC<HeaderProps> = ({ activeTab = 'dashboard', onTabChange }) => {
  const [connecting, setConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [, setConnectedApi] = useState<ConnectedAPI | null>(null);
  const [connectedNetwork, setConnectedNetwork] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<'error' | 'warning' | 'info' | 'success'>('info');

  const envNetwork = String(import.meta.env.VITE_NETWORK_ID || import.meta.env.VITE_NETWORK || 'preprod').toUpperCase();

  useEffect(() => {
    // Check if wallet is available on window.midnight
    if (typeof window !== 'undefined') {
      const midnight = window.midnight;
      if (midnight) {
        console.log('[Midnight Wallet] window.midnight detected:', Object.keys(midnight));
      } else {
        console.log('[Midnight Wallet] window.midnight is not injected yet.');
      }
    }
  }, []);

  const handleConnectWallet = async () => {
    if (walletAddress) {
      console.log('[Midnight Wallet] Disconnecting wallet...');
      setWalletAddress(null);
      setConnectedApi(null);
      setConnectedNetwork(null);
      setAlertMessage('Wallet disconnected.');
      setAlertSeverity('info');
      return;
    }

    const wallet = getMidnightWallet();
    if (!wallet) {
      console.warn('[Midnight Wallet] No compatible Midnight wallet found on window.midnight');
      setAlertMessage(
        'Midnight Lace Wallet browser extension not detected. Please install or enable the Midnight Lace Wallet extension.',
      );
      setAlertSeverity('warning');
      return;
    }

    console.log(
      '[Midnight Wallet] Selected wallet:',
      wallet.name,
      'apiVersion:',
      wallet.apiVersion,
      'rdns:',
      wallet.rdns,
    );

    try {
      setConnecting(true);
      setAlertMessage(null);

      // Candidate network IDs supported by Midnight SDK
      const candidateNetworks = ['preprod', 'undeployed', 'preview', 'mainnet'];
      let connected: ConnectedAPI | null = null;
      let matchedNet = 'preprod';
      let lastError: unknown = null;

      for (const netId of candidateNetworks) {
        try {
          console.log(`[Midnight Wallet] Attempting connect to network: '${netId}'...`);
          connected = await wallet.connect(netId);
          matchedNet = netId;
          console.log(`[Midnight Wallet] Successfully connected on network '${netId}'!`);
          setNetworkId(netId);
          break;
        } catch (err: unknown) {
          lastError = err;
          const msg = String(err);
          console.log(`[Midnight Wallet] Connect attempt for '${netId}' returned:`, msg);

          if (
            msg.toLowerCase().includes('network id mismatch') ||
            msg.toLowerCase().includes('network mismatch') ||
            msg.toLowerCase().includes('unsupported network id') ||
            msg.toLowerCase().includes('network')
          ) {
            continue;
          }
          // If user explicitly closed or denied the popup
          throw err;
        }
      }

      if (!connected) {
        const errMsg =
          lastError instanceof Error
            ? lastError.message
            : 'Could not align wallet network ID after trying all networks.';
        throw new Error(errMsg);
      }

      setConnectedApi(connected);
      setConnectedNetwork(matchedNet.toUpperCase());

      // Fetch wallet addresses
      let address = '';
      try {
        const shielded = await connected.getShieldedAddresses();
        console.log('[Midnight Wallet] Shielded address retrieved:', shielded.shieldedAddress);
        address = shielded.shieldedAddress;
      } catch (errShielded) {
        console.warn('[Midnight Wallet] Shielded address lookup error:', errShielded);
        try {
          const unshielded = await connected.getUnshieldedAddress();
          console.log('[Midnight Wallet] Unshielded address retrieved:', unshielded.unshieldedAddress);
          address = unshielded.unshieldedAddress;
        } catch (errUnshielded) {
          console.warn('[Midnight Wallet] Unshielded address lookup error:', errUnshielded);
          address = 'Connected';
        }
      }

      setWalletAddress(address);
      setAlertMessage(
        `Successfully connected to ${wallet.name || 'Lace Wallet'} (${truncateAddress(address)}) on ${matchedNet.toUpperCase()}`,
      );
      setAlertSeverity('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Midnight Wallet] Wallet connection failed:', err);
      setAlertMessage(`Wallet connection failed: ${msg}`);
      setAlertSeverity('error');
    } finally {
      setConnecting(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Hospital Dashboard', icon: <LocalHospitalIcon fontSize="small" /> },
    { id: 'researcher', label: 'Researcher Portal', icon: <SchoolIcon fontSize="small" /> },
    { id: 'datasets', label: 'Dataset Registry', icon: <StorageIcon fontSize="small" /> },
    { id: 'records', label: 'Anonymous Patient Records', icon: <VisibilityOffIcon fontSize="small" /> },
    { id: 'zk-proofs', label: 'Selective Disclosure', icon: <VpnKeyIcon fontSize="small" /> },
    { id: 'audit', label: 'Audit Log & Verification', icon: <HistoryIcon fontSize="small" /> },
    { id: 'analytics', label: 'Research Analytics', icon: <AssessmentIcon fontSize="small" /> },
  ];

  return (
    <AppBar
      position="sticky"
      data-testid="header"
      sx={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        px: { xs: 2, md: 4 },
        py: 1.5,
      }}
    >
      {/* Top Header Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        {/* Logo & Application Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} data-testid="header-logo">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              backgroundColor: '#FFF7ED',
              border: '1px solid #FFEDD5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(249, 115, 22, 0.15)',
            }}
          >
            <ShieldIcon sx={{ color: '#F97316', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: '#EA580C', letterSpacing: '-0.02em', fontSize: '1.25rem' }}
            >
              Private Medical Research Data Exchange
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}
            >
              <LockIcon sx={{ fontSize: 13, color: '#10B981' }} /> Midnight ZK Confidential Credentials & Dataset Access
              Proofs
            </Typography>
          </Box>
        </Box>

        {/* Network & Wallet Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center' }}>
          <Chip
            label={`Network: ${connectedNetwork || envNetwork}`}
            size="small"
            icon={<ShieldIcon sx={{ fontSize: '14px !important', color: '#EA580C !important' }} />}
            sx={{
              backgroundColor: '#FFF7ED',
              color: '#EA580C',
              border: '1px solid #FFEDD5',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          />

          {connecting ? (
            <Button
              variant="contained"
              size="small"
              disabled
              startIcon={<CircularProgress size={16} color="inherit" />}
              sx={{
                backgroundColor: '#F97316',
                color: '#FFFFFF',
                fontWeight: 700,
                py: 0.8,
                px: 2.5,
              }}
            >
              Connecting...
            </Button>
          ) : walletAddress ? (
            <Button
              variant="outlined"
              size="small"
              onClick={handleConnectWallet}
              startIcon={<CheckCircleIcon sx={{ color: '#10B981' }} />}
              sx={{
                borderColor: '#10B981',
                color: '#059669',
                backgroundColor: '#ECFDF5',
                '&:hover': { borderColor: '#059669', backgroundColor: '#D1FAE5' },
                py: 0.8,
                px: 2,
                fontWeight: 700,
              }}
            >
              Lace ({truncateAddress(walletAddress)})
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              onClick={handleConnectWallet}
              startIcon={<AccountBalanceWalletIcon />}
              sx={{
                backgroundColor: '#F97316',
                color: '#FFFFFF',
                fontWeight: 700,
                py: 0.8,
                px: 2.5,
                '&:hover': { backgroundColor: '#EA580C' },
              }}
            >
              Connect Lace Wallet
            </Button>
          )}
        </Box>
      </Box>

      {/* Modern Premium Navigation Bar */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mt: 2,
          overflowX: 'auto',
          py: 0.5,
          px: 0.5,
          backgroundColor: '#FAFAFA',
          borderRadius: 3,
          border: '1px solid #E5E7EB',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Button
              key={item.id}
              size="small"
              onClick={() => onTabChange?.(item.id)}
              startIcon={React.cloneElement(item.icon, {
                sx: { color: isActive ? '#F97316' : '#6B7280', transition: 'color 0.2s' },
              })}
              sx={{
                color: isActive ? '#EA580C' : '#4B5563',
                backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                borderRadius: 2,
                px: 2,
                py: 0.9,
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
                border: isActive ? '1px solid #FFEDD5' : '1px solid transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  color: '#EA580C',
                  backgroundColor: isActive ? '#FFFFFF' : '#FFF7ED',
                },
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Box>

      {/* Snackbar feedback message */}
      <Snackbar
        open={!!alertMessage}
        autoHideDuration={6000}
        onClose={() => setAlertMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setAlertMessage(null)} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};
