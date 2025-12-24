import { ethers } from "hardhat";

async function main() {
  console.log("📋 Listing available accounts in Quorum network...");
  
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log("=".repeat(80));
  
  const signers = await ethers.getSigners();
  
  console.log("AVAILABLE ACCOUNTS (with suggested testing roles):");
  console.log("=".repeat(80));
  
  for (let i = 0; i < signers.length; i++) {
    const signer = signers[i];
    const balance = await provider.getBalance(signer.address);
    const formattedBalance = ethers.formatEther(balance);
    
    // Assign suggested roles based on account index
    let suggestedRole = "👁️  External Viewer";
    let emoji = "👁️";
    
    if (i === 0) {
      suggestedRole = "🏛️  University Admin (Deployer)";
      emoji = "🏛️";
    } else if (i === 1) {
      suggestedRole = "👨‍🏫 Teacher";
      emoji = "👨‍🏫";
    } else if (i === 2) {
      suggestedRole = "👨‍💼 Department Head";
      emoji = "👨‍💼";
    } else if (i === 3) {
      suggestedRole = "👨‍💼 General Director";
      emoji = "👨‍💼";
    } else if (i >= 4 && i <= 7) {
      suggestedRole = "🎓 Student";
      emoji = "🎓";
    }
    
    console.log(`\nAccount ${i}: ${emoji}`);
    console.log(`  Address: ${signer.address}`);
    console.log(`  Balance: ${formattedBalance} ETH`);
    console.log(`  Role:    ${suggestedRole}`);
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("📝 TESTING WORKFLOW SETUP INSTRUCTIONS:");
  console.log("=".repeat(80));
  console.log("\n1. First, deploy the contract:");
  console.log("   npm run deploy");
  console.log("\n2. Then, setup roles automatically:");
  console.log("   npx hardhat run scripts/setup-roles.ts --network quorum");
  console.log("\n3. Register test courses:");
  console.log("   npx hardhat run scripts/register-course.ts --network quorum");
  console.log("\n4. Test the interactive console:");
  console.log("   npx ts-node scripts/interact.ts");
  
  console.log("\n" + "=".repeat(80));
  console.log("🎯 ROLE MAPPING FOR TESTING:");
  console.log("=".repeat(80));
  console.log("Account 0: University Admin (deploys contract, assigns roles)");
  console.log("Account 1: Teacher (creates grades)");
  console.log("Account 2: Department Head (verifies grades)");
  console.log("Account 3: General Director (ratifies grades)");
  console.log("Account 4-7: Students (view grades, manage access)");
  console.log("Account 8-10: External Viewers (need student permission)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error listing accounts:", error.message);
    process.exit(1);
  });