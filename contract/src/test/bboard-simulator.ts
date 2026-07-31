// Private Medical Research Data Exchange Simulator
// Copyright (C) Midnight Foundation

import { Contract, Ledger, ledger } from "../managed/bboard/contract/index.js";
import {
  BBoardPrivateState,
  createBBoardPrivateState,
  witnesses,
} from "../witnesses.js";
import {
  CircuitContext,
  CostModel,
  QueryContext,
  sampleContractAddress,
  emptyZswapLocalState,
} from "@midnight-ntwrk/compact-runtime";
import { convertFieldToBytes } from "./utils.js";

export class BBoardSimulator {
  readonly contract: Contract<BBoardPrivateState>;
  circuitContext: CircuitContext<BBoardPrivateState>;

  constructor(
    secretKey: Uint8Array,
    medicalCredentialSecret?: Uint8Array,
    patientRecordKey?: Uint8Array,
  ) {
    this.contract = new Contract(witnesses);
    const initialPrivateState = createBBoardPrivateState(
      secretKey,
      medicalCredentialSecret,
      patientRecordKey,
    );
    const initialContractState = this.contract.initialState({
      initialPrivateState,
      initialZswapLocalState: emptyZswapLocalState({
        bytes: new Uint8Array(32),
      }),
    });
    this.circuitContext = {
      currentPrivateState: initialPrivateState,
      currentZswapLocalState: initialContractState.currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        initialContractState.currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  public switchUser(
    secretKey: Uint8Array,
    medicalCredentialSecret?: Uint8Array,
    patientRecordKey?: Uint8Array,
  ) {
    this.circuitContext.currentPrivateState = createBBoardPrivateState(
      secretKey,
      medicalCredentialSecret,
      patientRecordKey,
    );
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): BBoardPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public registerDataset(title: string): Ledger {
    this.circuitContext = this.contract.impureCircuits.registerDataset(
      this.circuitContext,
      title,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public requestAccess(datasetId: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.requestAccess(
      this.circuitContext,
      datasetId,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public grantPermission(
    datasetId: Uint8Array,
    researcherPk: Uint8Array,
  ): Ledger {
    this.circuitContext = this.contract.impureCircuits.grantPermission(
      this.circuitContext,
      datasetId,
      researcherPk,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public submitAccessProof(
    datasetId: Uint8Array,
    patientRecordHash: Uint8Array,
  ): Ledger {
    this.circuitContext = this.contract.impureCircuits.submitAccessProof(
      this.circuitContext,
      datasetId,
      patientRecordHash,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public revokeAccess(datasetId: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.revokeAccess(
      this.circuitContext,
      datasetId,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public publicKey(sequenceBytes?: Uint8Array): Uint8Array {
    const sequence =
      sequenceBytes ?? convertFieldToBytes(32, this.getLedger().sequence);
    return this.contract.circuits.publicKey(
      this.circuitContext,
      this.getPrivateState().secretKey,
      sequence,
    ).result;
  }
}
