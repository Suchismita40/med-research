import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum State { NONE = 0, REQUESTED = 1, GRANTED = 2, REVOKED = 3 }

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  medicalCredentialSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  patientRecordKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerDataset(context: __compactRuntime.CircuitContext<PS>, title_0: string): __compactRuntime.CircuitResults<PS, []>;
  requestAccess(context: __compactRuntime.CircuitContext<PS>,
                datasetId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  grantPermission(context: __compactRuntime.CircuitContext<PS>,
                  datasetId_0: Uint8Array,
                  researcherPk_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitAccessProof(context: __compactRuntime.CircuitContext<PS>,
                    datasetId_0: Uint8Array,
                    patientRecordHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revokeAccess(context: __compactRuntime.CircuitContext<PS>,
               datasetId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  registerDataset(context: __compactRuntime.CircuitContext<PS>, title_0: string): __compactRuntime.CircuitResults<PS, []>;
  requestAccess(context: __compactRuntime.CircuitContext<PS>,
                datasetId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  grantPermission(context: __compactRuntime.CircuitContext<PS>,
                  datasetId_0: Uint8Array,
                  researcherPk_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitAccessProof(context: __compactRuntime.CircuitContext<PS>,
                    datasetId_0: Uint8Array,
                    patientRecordHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revokeAccess(context: __compactRuntime.CircuitContext<PS>,
               datasetId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  publicKey(sk_0: Uint8Array, sequence_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  registerDataset(context: __compactRuntime.CircuitContext<PS>, title_0: string): __compactRuntime.CircuitResults<PS, []>;
  requestAccess(context: __compactRuntime.CircuitContext<PS>,
                datasetId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  grantPermission(context: __compactRuntime.CircuitContext<PS>,
                  datasetId_0: Uint8Array,
                  researcherPk_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitAccessProof(context: __compactRuntime.CircuitContext<PS>,
                    datasetId_0: Uint8Array,
                    patientRecordHash_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revokeAccess(context: __compactRuntime.CircuitContext<PS>,
               datasetId_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  publicKey(context: __compactRuntime.CircuitContext<PS>,
            sk_0: Uint8Array,
            sequence_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly state: State;
  readonly datasetTitle: { is_some: boolean, value: string };
  readonly datasetCount: bigint;
  readonly activeResearcherPk: Uint8Array;
  readonly auditLogCount: bigint;
  readonly lastProofHash: Uint8Array;
  readonly sequence: bigint;
  readonly owner: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
