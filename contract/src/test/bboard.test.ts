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
    expect(ledgerState.datasetCategory.is_some).toEqual(false);
    expect(ledgerState.maxAccessLimit).toEqual(5n);
    expect(ledgerState.accessCount).toEqual(0n);
  });

  it("allows a hospital to register a new medical research dataset with category metadata", () => {
    const hospitalKey = randomBytes(32);
    const simulator = new BBoardSimulator(hospitalKey);
    const datasetTitle = "Genomic Oncology Study 2026 - Anonymized Cohort A";
    const datasetCategory = "Oncology & Genomics";

    simulator.registerDataset(datasetTitle, datasetCategory);
    const ledgerState = simulator.getLedger();

    expect(ledgerState.datasetTitle.is_some).toEqual(true);
    expect(ledgerState.datasetTitle.value).toEqual(datasetTitle);
    expect(ledgerState.datasetCategory.is_some).toEqual(true);
    expect(ledgerState.datasetCategory.value).toEqual(datasetCategory);
    expect(ledgerState.datasetCount).toEqual(2n);
  });

  it("allows a qualified researcher to submit a confidential access request", () => {
    const hospitalKey = randomBytes(32);
    const researcherKey = randomBytes(32);
    const medicalCredential = randomBytes(32);
    const datasetId = randomBytes(32);

    const simulator = new BBoardSimulator(hospitalKey);
    simulator.registerDataset(
      "Cardiology Patient Outcomes Dataset",
      "Cardiology",
    );

    simulator.switchUser(researcherKey, medicalCredential);
    simulator.requestAccess(datasetId);

    const ledgerState = simulator.getLedger();
    expect(ledgerState.state).toEqual(State.REQUESTED);
    expect(ledgerState.activeResearcherPk).not.toEqual(new Uint8Array(32));
  });

  it("allows hospital owner to grant research permission and researcher to submit dataset access proof within quota", () => {
    const hospitalKey = randomBytes(32);
    const researcherKey = randomBytes(32);
    const medicalCredential = randomBytes(32);
    const patientRecordKey = randomBytes(32);
    const datasetId = randomBytes(32);
    const patientRecordHash = randomBytes(32);

    const simulator = new BBoardSimulator(hospitalKey);
    simulator.registerDataset(
      "Rare Neurological Disorders Cohort",
      "Neurology",
    );

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
    expect(updatedLedger.accessCount).toEqual(1n);
    expect(updatedLedger.lastProofHash).not.toEqual(new Uint8Array(32));
  });

  it("allows hospital dataset owner to revoke access", () => {
    const hospitalKey = randomBytes(32);
    const researcherKey = randomBytes(32);
    const datasetId = randomBytes(32);

    const simulator = new BBoardSimulator(hospitalKey);
    simulator.registerDataset(
      "Immunology Clinical Trial Dataset",
      "Immunology",
    );

    simulator.switchUser(researcherKey, randomBytes(32));
    simulator.requestAccess(datasetId);

    simulator.switchUser(hospitalKey);
    simulator.revokeAccess(datasetId);

    expect(simulator.getLedger().state).toEqual(State.REVOKED);
  });

  it("enforces access quota limit and rejects proof submission when quota is exceeded", () => {
    const hospitalKey = randomBytes(32);
    const researcherKey = randomBytes(32);
    const medicalCredential = randomBytes(32);
    const patientRecordKey = randomBytes(32);
    const datasetId = randomBytes(32);

    const simulator = new BBoardSimulator(hospitalKey);
    simulator.registerDataset("Pediatric Rare Disease Cohort", "Pediatrics");

    simulator.switchUser(researcherKey, medicalCredential, patientRecordKey);
    simulator.requestAccess(datasetId);
    const researcherPk = simulator.getLedger().activeResearcherPk;

    simulator.switchUser(hospitalKey);
    simulator.grantPermission(datasetId, researcherPk);

    simulator.switchUser(researcherKey, medicalCredential, patientRecordKey);

    // Submit access proof 5 times (filling default quota of 5)
    for (let i = 0; i < 5; i++) {
      simulator.submitAccessProof(datasetId, randomBytes(32));
    }

    expect(simulator.getLedger().accessCount).toEqual(5n);
    expect(simulator.getLedger().maxAccessLimit).toEqual(5n);

    // Attempting 6th submission should throw quota error
    expect(() => {
      simulator.submitAccessProof(datasetId, randomBytes(32));
    }).toThrow("Dataset access quota exceeded");
  });

  it("allows hospital owner to renew dataset access quota", () => {
    const hospitalKey = randomBytes(32);
    const researcherKey = randomBytes(32);
    const medicalCredential = randomBytes(32);
    const patientRecordKey = randomBytes(32);
    const datasetId = randomBytes(32);

    const simulator = new BBoardSimulator(hospitalKey);
    simulator.registerDataset(
      "Longitudinal Diabetic Retinopathy Cohort",
      "Ophthalmology",
    );

    simulator.switchUser(researcherKey, medicalCredential, patientRecordKey);
    simulator.requestAccess(datasetId);
    const researcherPk = simulator.getLedger().activeResearcherPk;

    simulator.switchUser(hospitalKey);
    simulator.grantPermission(datasetId, researcherPk);

    // Hospital owner renews quota by adding 10 additional accesses
    simulator.renewAccessQuota(datasetId, 10);
    expect(simulator.getLedger().maxAccessLimit).toEqual(15n);

    // Researcher can now submit more than 5 proofs
    simulator.switchUser(researcherKey, medicalCredential, patientRecordKey);
    for (let i = 0; i < 7; i++) {
      simulator.submitAccessProof(datasetId, randomBytes(32));
    }
    expect(simulator.getLedger().accessCount).toEqual(7n);
  });
});
