// Private Medical Research Data Exchange Witness Provider
// Copyright (C) Midnight Foundation

import { Ledger } from "./managed/bboard/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type BBoardPrivateState = {
  readonly secretKey: Uint8Array;
  readonly medicalCredentialSecret: Uint8Array;
  readonly patientRecordKey: Uint8Array;
};

export const createBBoardPrivateState = (
  secretKey: Uint8Array,
  medicalCredentialSecret?: Uint8Array,
  patientRecordKey?: Uint8Array,
): BBoardPrivateState => ({
  secretKey,
  medicalCredentialSecret: medicalCredentialSecret ?? secretKey,
  patientRecordKey: patientRecordKey ?? secretKey,
});

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, BBoardPrivateState>): [
    BBoardPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
  medicalCredentialSecret: ({
    privateState,
  }: WitnessContext<Ledger, BBoardPrivateState>): [
    BBoardPrivateState,
    Uint8Array,
  ] => [privateState, privateState.medicalCredentialSecret],
  patientRecordKey: ({
    privateState,
  }: WitnessContext<Ledger, BBoardPrivateState>): [
    BBoardPrivateState,
    Uint8Array,
  ] => [privateState, privateState.patientRecordKey],
};
