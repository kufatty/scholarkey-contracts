# Scholarkey Frontend

Quick frontend scaffold to interact with the `AcademicVerificationSystem` smart contract using MetaMask.

## Setup

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

## Notes

- The frontend uses `ethers` v6 and the browser `window.ethereum` provider (MetaMask). It replicates the message packing and signing done by the Node interactive script. Ensure MetaMask is on the same network as your contract.
- This scaffold includes a `ConnectWallet` component and a `CreateGrade` form; add more components mirroring the terminal menu (`View`, `Verify`, `Access`) following the same pattern.

## Using the frontend

1. **Start the Quorum network and deploy contracts** (from the repo root):

   ```bash
   npm run deploy
   npm run setup-roles
   npm run register-courses
   ```

2. **Point the frontend to the latest deployment**:

   - Find the newest file in `deployments/deployment-quorum-1337-*.json`.
   - Copy its `address` value into `frontend/.env`:

     ```dotenv
     VITE_CONTRACT_ADDRESS=0xDeployedContractAddress
     ```

3. **Run the dev server**:

   ```bash
   cd frontend
   npm run dev
   ```

4. **Connect MetaMask**:

   - Open the URL printed by Vite (for example, `http://localhost:5173`).
   - Click **Connect MetaMask** in the UI.
   - The dapp will request MetaMask to switch/add the local network:
     - RPC URL: `http://127.0.0.1:8545`
     - Chain ID: `1337` (`0x539`)
   - Approve the network add/switch prompts.

5. **Main sections in the UI**:

   - **ConnectWallet** – shows the connected address and ensures you are on the correct network.
   - **CreateGrade** – as a **Teacher**, create grades for **Student** accounts using the signature flow.
   - **AccessManagement** – as a **Student**:
     - `Grant access`: share your grades with a **viewer address** (e.g., External Viewer or Teacher/DepartmentHead/GeneralDirector) so they can read your grades.
     - `Revoke access`: remove a viewer's access.
     - `View who has access to my grades`: list all addresses you granted.
     - `Check access`: as any user (including Teacher, DepartmentHead, GeneralDirector, or External Viewer), check whether **you** have access to a given student's grades.
   - **VerificationPanel** – for **DepartmentHead** and **GeneralDirector** roles:
     - `Verify grade (Dept head)`: as DepartmentHead, verify a pending grade with your signature.
     - `Ratify grade (Director)`: as GeneralDirector, ratify a verified grade with your signature and finalize it.
     - `Verify signatures`, `Check if finalized`, `Get grade status`: read the current workflow status and signatures for a grade.
     - `Verify student grade`: check the grade and status for a specific student/course pair.
   - **ViewInformation** – read‑only views for all roles:
     - `Check my role`: shows your current role (None / Student / Teacher / DepartmentHead / GeneralDirector).
     - `View total grades`: total number of grades in the system.
     - `View grade by ID`: basic info about a specific grade.
     - `View all my grades`: as a Student, list all your grades.
     - `View student grades`: as a Teacher/DepartmentHead/GeneralDirector, or a viewer who was granted access, list all grades for a given student address.
     - `List all grade IDs`, `List students with grades`, `List available courses`: global overviews.

## Using Hardhat accounts in MetaMask (test setup)

For local testing, the Quorum/Hardhat networks use fixed private keys defined in `hardhat.config.ts`. You can import these accounts directly into MetaMask.

1. **Locate the private keys**:

   - Open `hardhat.config.ts` and look at the `networks.hardhat.accounts` or `networks.quorum.accounts` sections.
   - Each entry has a `privateKey` (hardhat) or a bare hex string (quorum) you can use.

2. **Import an account into MetaMask**:

   - In MetaMask, make sure the `Quorum Local` (chainId 1337) network is selected.
   - Click the account avatar → **Import account**.
   - Paste one of the private keys from `hardhat.config.ts` (without quotes).
   - Give the account a label, for example:
     - `Teacher` – corresponds to one of the accounts assigned Teacher role.
     - `Student 1`, `Student 2` – for student‑role accounts.
     - `External Viewer` – for viewer‑only accounts.

3. **Roles after running `npm run setup-roles`** (default mapping):

   - Account 0 (deployer) – GeneralDirector (admin)
   - Account 1 – Teacher
   - Account 2 – DepartmentHead
   - Account 3 – GeneralDirector (or backup)
   - Accounts 4–7 – Students
   - Accounts 8–10 – External Viewers

4. **Example test flow**:

   - Import **Student 1** and **External Viewer 1** into MetaMask.
   - Connect as **Student 1**:
     - Use **CreateGrade** to create a grade for Student 1 (if not already created by scripts).
     - In **AccessManagement**, enter the External Viewer 1 address and click **Grant access**.
   - Switch MetaMask to **External Viewer 1**:
     - In **AccessManagement**, use **Check access** with Student 1's address to verify "You HAVE access".
     - In **ViewInformation**, use **View student grades** with Student 1's address to see their grades.
