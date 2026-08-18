'use client';

import React from 'react';
import { DeployedBoardProvider } from '../src/contexts/DeployedBoardContext';
import pino from 'pino';

const logger = pino({ level: 'info' });

export function Providers({ children }: { children: React.ReactNode }) {
  return <DeployedBoardProvider logger={logger}>{children}</DeployedBoardProvider>;
}
