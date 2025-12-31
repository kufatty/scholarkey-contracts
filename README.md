# ScholarKey: Decentralized Academic Verification System

A blockchain-based academic verification system built on Quorum, implementing a three-tier approval workflow with student-controlled privacy.

## 📋 Table of Contents
- [Overview](#-overview)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Detailed Setup Guide](#-detailed-setup-guide)
- [Testing & Development](#-testing--development)
- [Interacting with the System](#-interacting-with-the-system)
- [Frontend Integration](#-frontend-integration)
- [Network Management](#-network-management)
- [Troubleshooting](#-troubleshooting)
- [Project Structure](#-project-structure)

## 🎯 Overview

ScholarKey is a decentralized academic verification system that enables:
- **Multi-tier approval workflow** (Teacher → Department Head → General Director)
- **Student-controlled privacy** with granular access permissions
- **Cryptographic signatures** for each approval stage
- **Immutable academic records** on the blockchain
- **Zero-knowledge inspired privacy** for external verification

## 🏗 Architecture

### Smart Contract Features
- **Role-Based Access Control**: 5 distinct roles (Student, Teacher, Department Head, General Director, None)
- **Three-Tier Verification**: Grades require signatures from Teacher, Department Head, and General Director
- **Student Privacy Control**: Students can grant/revoke access to their grades
- **Course Management**: University can register courses with codes and names
- **Signature Verification**: All approvals are cryptographically signed and verifiable

### Tech Stack
- **Blockchain**: Quorum (Ethereum-compatible private blockchain)
- **Smart Contracts**: Solidity 0.8.28
- **Development Framework**: Hardhat with TypeScript
- **Testing**: Mocha/Chai
- **Network**: Docker Compose for local Quorum nodes

## 📋 Prerequisites

### Required Software
1. **Node.js & NPM** (v18 or later)
   ```bash
   node --version  # Should show v18+
   npm --version   # Should show v8+
   ```

2. **Docker Desktop**
   - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Must be running in the background
   - Windows users: Enable WSL2 for better performance

3. **Git** (for cloning the repository)
   ```bash
   git --version
   ```

4. **Recommended**: VS Code with extensions:
   - Solidity (Juan Blanco)
   - Hardhat (Nomic Foundation)
   - TypeScript and JavaScript

## 🚀 Quick Start

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/kufatty/scholarkey-contracts
cd scholarkey-contracts

# Install dependencies
npm install
```

### 2. Start Blockchain Network
```bash
# Navigate to network directory
cd quorum-test-network

# Start Quorum nodes (this may take 2-3 minutes)
docker compose up -d

# Wait about 1 minute for nodes to initialize 
# Either count 60 seconds or launch the command below
sleep 60

# Return to project root
cd ..

# Compile contracts
npm run compile

# Run all tests cases on Hardhat network (development network) to check everything is fine
npm test

```

### 3. Deploy and Configure
```bash
# Deploy the contracts to the Quorum network 
npm run deploy

# (Optional) Show existing accounts addresses 
npm run accounts

# Setup user roles for the base addresses registered
npm run setup-roles

# Register test courses
npm run register-courses
```

### 4. Start Interactive Console (Optional)
```bash
# Launch the interactive menu system
npm run interact
```

### Console Features
1. **View Information**
   - Check your role
   - View grades by ID
   - List all students/courses
   - Check access permissions

2. **Create/Modify Records**
   - Create grades (Teacher role)
   - Verify grades (Dept Head role)
   - Ratify grades (Director role)

3. **Manage Access**
   - Grant/revoke access to your grades
   - View granted access list
   - Check if you have access to a student

4. **Verification**
   - Verify digital signatures
   - Check if grade is finalized
   - Verify student grades for specific courses

### Example Workflow in Console
```
1. Select Account 1 (Teacher)
2. Create grade for Student (Account 4) in MAT101
3. Select Account 2 (Dept Head)
4. Verify the grade
5. Select Account 3 (Director)
6. Ratify the grade
7. Select Account 4 (Student)
8. View your grades
9. Grant access to Account 8
10. Select Account 8 (External Viewer)
11. Verify you can view the grade
```

## 🔗 Frontend Integration

### Required Information
To integrate with a frontend application, you need:

1. **Contract Address**
   ```javascript
   // From deployment output
   const CONTRACT_ADDRESS = "0x...";
   ```

2. **Contract ABI**
   ```bash
   # Location: artifacts/contracts/AcademicVerificationSystem.sol/AcademicVerificationSystem.json
   # Copy the "abi" array from this file
   ```

3. **Network Configuration**
   ```javascript
   const QUORUM_CONFIG = {
     url: "http://127.0.0.1:8545",
     chainId: 1337,
   };
   ```

### Integration Example (Web3.js)
```javascript
import { ethers } from 'ethers';
import AcademicVerificationSystemABI from './artifacts/AcademicVerificationSystem.json';

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = await provider.getSigner();
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  AcademicVerificationSystemABI.abi,
  signer
);

// Example: Create a grade (Teacher)
const tx = await contract.createGrade(
  studentAddress,
  "MAT101",
  18, // grade
  "2024-1" // semester
);
await tx.wait();
```

### Integration Example (Frontend with MetaMask)
```javascript
// Add Quorum network to MetaMask
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x539', // 1337 in hex
    chainName: 'Quorum Local',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['http://127.0.0.1:8545']
  }]
});
```

## 🌐 Network Management

### Starting/Stopping Network
```bash
# Start network (from quorum-test-network directory)
docker compose up -d

# Stop network
docker compose down

# Stop and remove volumes (clears all blockchain data)
docker compose down -v

# View network status
docker compose ps

# View logs
docker compose logs -f node1  # Specific node
docker compose logs -f        # All nodes
```

### Network Reset
If you need to start fresh:
```bash
# 1. Stop and remove network
cd quorum-test-network
docker compose down -v
cd ..

# 2. Clear deployment records
rm -rf deployments/
rm -rf artifacts/
rm -rf cache/

# 3. Re-deploy
docker compose up -d
sleep 60
npm run setup
```

### Network Configuration
The Quorum network consists of:
- **4 validator nodes** (node1, node2, node3, node4)
- **RPC endpoint**: http://127.0.0.1:8545
- **Chain ID**: 1337
- **Consensus**: QBFT (Istanbul BFT)
- **Block time**: 2 seconds


## 📁 Project Structure

```
schoarkey-contracts/
├── contracts/
│   └── AcademicVerificationSystem.sol   # Main smart contract
├── scripts/
│   ├── deploy.ts                       # Deployment script
│   ├── setup-roles.ts                  # Role assignment
│   ├── register-course.ts              # Course registration
│   ├── list-accounts.ts                # Account listing
│   ├── interact.ts                     # Interactive console
│   └── send-op-tx.ts                   # Transaction testing
├── test/
│   └── AcademicVerificationSystem.test.ts  # Test suite
├── quorum-test-network/
│   ├── docker-compose.yml              # Network configuration
│   └── config/                         # Quorum node configs
├── deployments/                        # Deployment records (auto-generated)
├── artifacts/                          # Compiled contracts (auto-generated)
├── cache/                              # Hardhat cache
├── hardhat.config.ts                   # Hardhat configuration
├── package.json                        # Dependencies and scripts
└── README.md                           # This file
```

### Smart Contract Functions
Key functions for different roles:

**University Admin** (Account 0):
- `assignRole(address user, Role role)`
- `revokeRole(address user)`
- `registerCourse(string courseCode, string courseName)`

**Teacher** (Account 1):
- `createGrade(address student, string courseCode, uint256 grade, string semester)`

**Department Head** (Account 2):
- `verifyGrade(uint256 gradeId)`

**General Director** (Account 3):
- `ratifyGrade(uint256 gradeId)`

**Student** (Accounts 4-7):
- `grantAccess(address viewer)`
- `revokeAccess(address viewer)`
- `viewMyGrades()`
- `viewMyGradesPublic()`

**External Viewer** (Accounts 8-10):
- `viewStudentGrades(address student)` (if granted access)
- `verifyStudentGrade(address student, string courseCode)`
