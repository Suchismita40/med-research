# 🏥 Project Proposal: Private Medical Research Data Exchange

## 1. Problem Statement
Medical research institutions, pharmaceutical developers, and academic hospitals frequently need to collaborate and train machine learning models on clinical data. However, healthcare data sharing faces severe legal, ethical, and cryptographic roadblocks:
- **HIPAA, GDPR, and Common Rule Compliance**: Exposing patient records or metadata on public blockchains is illegal and violates medical privacy.
- **Credential & License Exposure**: Medical researchers must prove their qualifications without publishing their personal identities, licenses, or institutional keys publicly.
- **Unauthorized Bulk Scraping**: Traditional permission models fail to enforce cryptographic access quotas per research session.

## 2. The Solution: Private Medical Research Data Exchange
A decentralized, privacy-first clinical dataset exchange built on the **Midnight Network** using the **Compact** smart contract language.

Key Capabilities:
- **Zero-Knowledge Dataset Registration**: Hospitals publish anonymized clinical cohorts with on-chain metadata categorization (*Oncology*, *Cardiology*, *Genomics*, *Neurology*).
- **Private Witness Authentication**: Researchers prove possession of medical credentials and authorized identity keys without disclosing them on the public ledger.
- **Rate-Limited Access Quotas**: Smart contracts strictly enforce access quotas (`maxAccessLimit` / `accessCount`) per dataset to prevent bulk scraping.
- **Cryptographic Quota Renewal**: Authorized dataset owners can extend researcher quotas dynamically.
- **Selective Disclosure Engine**: Interactive transparency toggle demonstrating the exact boundary between public ledger state and private ZK witnesses.

## 3. Why Midnight?
Midnight's dual-state architecture (private witness state + public ledger state) makes it the ideal platform for regulated healthcare applications:
- **Private Witnesses**: Remain in the researcher's browser/client environment.
- **Public State**: Immutable cryptographic commitments, sequence counters, access limits, and proof hashes.
- **Proof Server**: Generates zero-knowledge SNARK proofs locally or via trusted proof servers before submitting balanced transactions to the Substrate ledger.

## 4. Smart Contract Architecture (Compact Circuits)
The contract defines 6 zero-knowledge circuits in `contract/src/bboard.compact`:
1. `registerDataset(title: Opaque<"string">, category: Opaque<"string">)`: Initializes a dataset with category and default access quota.
2. `requestAccess(datasetId: Bytes[32])`: Submits researcher proof of authorization.
3. `grantPermission(datasetId: Bytes[32], researcherPk: Bytes[32])`: Dataset owner grants permission.
4. `submitAccessProof(datasetId: Bytes[32], patientRecordHash: Bytes[32])`: Enforces `accessCount < maxAccessLimit` quota check and registers proof hash on-chain.
5. `renewAccessQuota(datasetId: Bytes[32], additionalQuota: Uint<32>)`: Verified owner increases dataset quota limit.
6. `revokeAccess(datasetId: Bytes[32])`: Revokes researcher permissions immediately.

## 5. Official Midnight Preprod Deployment
- **Network**: Official Midnight Preprod (`preprod`)
- **Contract Address**: `e603362546ca047cb7c596389c20fde9bdf1b27489f14137d68fd9cd4a939d97`
- **Deployment Transaction Hash**: `636ea733d93f66febf110812f06573cc7c5d8f19569b0d2cc88420fdeabaf169`
- **Deployer Public Address**: `mn_addr_preprod1efmkmrfgcdxhxyx2f7kfmchgrfme6prmvmyx3y23aae2t9zmnuzsqnh8xv`
- **Explorer**: [https://preprod.midnightexplorer.com/contract/e603362546ca047cb7c596389c20fde9bdf1b27489f14137d68fd9cd4a939d97](https://preprod.midnightexplorer.com/contract/e603362546ca047cb7c596389c20fde9bdf1b27489f14137d68fd9cd4a939d97)

## 6. Frontend & User Experience
- **Framework**: Next.js App Router (14.2+) with TypeScript.
- **Design System**: Refined White & Olive palette (`#2D5A27`, `#E8EFE9`, `#FFFFFF`), glassmorphism, micro-animations, and full responsive design.
- **Wallet**: Authentic Midnight Lace Wallet integration (`window.midnight.mnLace`).

## 7. Verification & Testing
- **Test Suite**: 7/7 comprehensive Vitest unit tests covering all circuits, quotas, and permissions.
- **Next.js Production Build**: Static export (`output: 'export'`) verified with 0 errors.
- **CI/CD**: GitHub Actions pipeline for automated compilation, linting, testing, and secret leak scanning.
