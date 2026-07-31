// Private Medical Research Data Exchange Common Types

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { State, BBoardPrivateState, Contract, Witnesses } from '../../contract/src/index.js';

export type ContractAddress = string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Logger = any;

export const bboardPrivateStateKey = 'bboardPrivateState';
export type PrivateStateId = typeof bboardPrivateStateKey;

export type PrivateStates = {
  readonly bboardPrivateState: BBoardPrivateState;
};

export type BBoardContract = Contract<BBoardPrivateState, Witnesses<BBoardPrivateState>>;

export type BBoardCircuitKeys = Exclude<keyof BBoardContract['impureCircuits'], number | symbol>;

export type BBoardProviders = MidnightProviders<BBoardCircuitKeys, PrivateStateId, BBoardPrivateState>;

export type DeployedBBoardContract = FoundContract<BBoardContract>;

export type BBoardDerivedState = {
  readonly state: State;
  readonly sequence: bigint;
  readonly datasetTitle: string | undefined;
  readonly datasetCount: bigint;
  readonly activeResearcherPk: Uint8Array;
  readonly auditLogCount: bigint;
  readonly lastProofHash: Uint8Array;
  readonly isOwner: boolean;
};
