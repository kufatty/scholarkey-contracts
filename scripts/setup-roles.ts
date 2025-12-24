import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Import the TypeChain-generated type
import type { AcademicVerificationSystem } from "../typechain-types";

async function main() {
  console.log("👥 Setting up user roles...");
  
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    console.error("❌ No deployments found. Deploy contract first.");
    console.log("   Run: npm run deploy");
    process.exit(1);
  }
  
  const deploymentFiles = fs.readdirSync(deploymentsDir)
    .filter(file => file.endsWith(".json"))
    .sort()
    .reverse();
  
  if (deploymentFiles.length === 0) {
    console.error("❌ No deployment files found.");
    console.log("   Run: npm run deploy");
    process.exit(1);
  }
  
  const latestDeploymentFile = deploymentFiles[0];
  const deploymentPath = path.join(deploymentsDir, latestDeploymentFile);
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  console.log("📁 Using deployment:", latestDeploymentFile);
  console.log("📄 Contract address:", deploymentInfo.address);
  
  // Get the contract with proper typing
  const contractFactory = await ethers.getContractFactory("AcademicVerificationSystem");
  
  // Attach to the deployed address with proper typing
  const contract = contractFactory.attach(deploymentInfo.address) as AcademicVerificationSystem;
  
  const accounts = await ethers.getSigners();
  const universityAdmin = accounts[0];
  
  console.log("🔧 University Admin:", universityAdmin.address);
  
  if (accounts.length < 11) {
    console.error(`❌ Need at least 11 accounts, only have ${accounts.length}`);
    console.error("   Add more private keys to hardhat.config.ts");
    process.exit(1);
  }
  
  const roleAssignments = [
    { account: accounts[1], role: BigInt(2), name: "Teacher" },
    { account: accounts[2], role: BigInt(3), name: "Department Head" },
    { account: accounts[3], role: BigInt(4), name: "General Director" },
     // 4 students total
    { account: accounts[4], role: BigInt(1), name: "Student 1" },
    { account: accounts[5], role: BigInt(1), name: "Student 2" },
    { account: accounts[6], role: BigInt(1), name: "Student 3" },
    { account: accounts[7], role: BigInt(1), name: "Student 4" },
    // 3 external viewers
    { account: accounts[8], role: BigInt(0), name: "External Viewer 1" },
    { account: accounts[9], role: BigInt(0), name: "External Viewer 2" },
    { account: accounts[10], role: BigInt(0), name: "External Viewer 3" }
  ];
  
  console.log("📋 Assigning roles:");
  
  for (const assignment of roleAssignments) {
    try {
      console.log(`\n${assignment.name}: ${assignment.account.address}`);
      console.log(`  Role: ${assignment.name} (value: ${assignment.role})`);
      
      const currentRole = await contract.getUserRole(assignment.account.address);
      if (currentRole === assignment.role) {
        console.log(`  ✅ Already assigned`);
        continue;
      }
      
      // FIX: Pass BigInt to contract function
      const tx = await contract.connect(universityAdmin).assignRole(
        assignment.account.address,
        assignment.role  // This is already BigInt
      );
      
      await tx.wait();
      console.log(`  ✅ Assigned! Transaction: ${tx.hash}`);
      
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log("\n🎉 Role setup completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Role setup failed:", error);
    process.exit(1);
  });