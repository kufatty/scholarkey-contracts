Scholarkey Frontend
===================

Quick frontend scaffold to interact with the `AcademicVerificationSystem` smart contract using MetaMask.

Setup
------

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Provide the contract ABI and address:
- Copy the full artifact JSON produced by Hardhat (example: `artifacts/contracts/GradesLogic.sol/AcademicVerificationSystem.json`) into `frontend/src/abis/AcademicVerificationSystem.json`. Replace the placeholder content.
- Set the deployed contract address in `.env` at the `frontend` folder root:

```
VITE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

3. Run dev server:

```bash
npm run dev
```

Notes
------
- The frontend uses `ethers` v6 and the browser `window.ethereum` provider (MetaMask). It replicates the message packing and signing done by the Node interactive script. Ensure MetaMask is on the same network as your contract.
- This scaffold includes a `ConnectWallet` component and a `CreateGrade` form; add more components mirroring the terminal menu (`View`, `Verify`, `Access`) following the same pattern.
