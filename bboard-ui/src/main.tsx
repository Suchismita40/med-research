// Private Medical Research Data Exchange Main Entry Point

import './globals';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material';
import { setNetworkId, type NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import App from './App';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './config/theme';
import '@midnight-ntwrk/dapp-connector-api';
import * as pino from 'pino';
import { DeployedBoardProvider } from './contexts';

const envNetwork = String(
  import.meta.env.VITE_NETWORK_ID || import.meta.env.VITE_NETWORK || 'undeployed',
).toLowerCase();
const networkId = (envNetwork === 'preprod' ? 'preprod' : 'undeployed') as NetworkId;

// Ensure that the network ID is properly set in Midnight SDK before any wallet/contract calls.
setNetworkId(networkId);

// Create a default `pino` logger and configure it with the configured logging level.
export const logger = pino.pino({
  level: (import.meta.env.VITE_LOGGING_LEVEL as string) || 'info',
});

logger.trace(`networkId = ${networkId}`);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <CssBaseline />
    <ThemeProvider theme={theme}>
      <DeployedBoardProvider logger={logger}>
        <App />
      </DeployedBoardProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
