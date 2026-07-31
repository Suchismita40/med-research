// Private Medical Research Data Exchange Smart Contract Unit Tests
// Copyright (C) Midnight Foundation

import { BBoardSimulator } from "./bboard-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";
import { State } from "../managed/bboard/contract/index.js";

setNetworkId("undeployed");

describe("Private Medical Research Data Exchange Contract", () => {
  it("properly initializes ledger state and private witness state", () => {
    const secretKey = randomBytes(32);
    const simulator = new BBoardSimulator(secretKey);
    const ledgerState = simulator.getLedger();

    expect(ledgerState.sequence).toEqual(1n);
    expect(ledgerState.state).toEqual(State.NONE);
    expect(ledgerState.datasetCount).toEqual(1n);
    expect(ledgerState.auditLogCount).toEqual(0n);
    expect(ledgerState.datasetTitle.is_some).toEqual(false);
  });

  it("allows a hospital to register a new medical research dataset", () => {
    const hospitalKey = randomBytes(32);
    const simulator = new BBoardSimulator(hospitalKey);
    const datasetTitle = "Genomic Oncology Study 2026 - Anonymized Cohort A";

    simulator.registerDataset(datasetTitle);
    const ledgerState = simulator.getLedger();

    expect(ledgerState.datasetTitle.is_some).toEqual(true);
    expect(ledgerState.datasetTitle.value).toEqual(datasetTitle);
    expect(ledgerState.datasetCount).toEqual(2n);
  });

  it("allows a qualified researcher to submit a confidential access request", () => {
    const hospitalKey = randomBytes(32);
    const researcherKey = randomBytes(32);
    const medicalCredential = randomBytes(32);
    const datasetId = randomBytes(32);

    const simulator = new BBoardSimulator(hospitalKey);
    simulator.registerDataset("Cardiology Patient Outcomes Dataset");

    simulator.switchUser(researcherKey, medicalCredential);
    simulator.requestAccess(datasetId);

    const ledgerState = simulator.getLedger();
    expect(ledgerState.state).toEqual(State.REQUESTED);
    expect(ledgerState.activeResearcherPk).not.toEqual(new Uint8Array(32));
  });

  it("allows hospital owner to grant research permission and researcher to submit dataset access proof", () => {
    const hospitalKey = randomBytes(32);
    const researcherKey = randomBytes(32);
    const medicalCredential = randomBytes(32);
    const patientRecordKey = randomBytes(32);
    const datasetId = randomBytes(32);
    const patientRecordHash = randomBytes(32);

    const simulator = new BBoardSimulator(hospitalKey);
    simulator.registerDataset("Rare Neurological Disorders Cohort");

    // Researcher requests access
    simulator.switchUser(researcherKey, medicalCredential, patientRecordKey);
    simulator.requestAccess(datasetId);
    const researcherPk = simulator.getLedger().activeResearcherPk;

    // Hospital owner grants permission
    simulator.switchUser(hospitalKey);
    simulator.grantPermission(datasetId, researcherPk);
    expect(simulator.getLedger().state).toEqual(State.GRANTED);

    // Researcher submits proof of access using private patient record key
    simulator.switchUser(researcherKey, medicalCredential, patientRecordKey);
    simulator.submitAccessProof(datasetId, patientRecordHash);

    const updatedLedger = simulator.getLedger();
    expect(updatedLedger.auditLogCount).toEqual(1n);
    expect(updatedLedger.lastProofHash).not.toEqual(new Uint8Array(32));
  });

  it("allows hospital dataset owner to revoke access", () => {
    const hospitalKey = randomBytes(32);
    const researcherKey = randomBytes(32);
    const datasetId = randomBytes(32);

    const simulator = new BBoardSimulator(hospitalKey);
    simulator.registerDataset("Immunology Clinical Trial Dataset");

    simulator.switchUser(researcherKey, randomBytes(32));
    simulator.requestAccess(datasetId);

    simulator.switchUser(hospitalKey);
    simulator.revokeAccess(datasetId);

    expect(simulator.getLedger().state).toEqual(State.REVOKED);
  });
});
