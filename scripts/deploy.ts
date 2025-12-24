import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting AcademicVerificationSystem deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "ETH");
  
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId + ")");
  
  console.log("⚙️  Deploying AcademicVerificationSystem contract...");
  const AcademicVerificationSystem = await ethers.getContractFactory(
    "AcademicVerificationSystem"
  );
  
  const contract = await AcademicVerificationSystem.deploy(deployer.address);
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);
  console.log("🎓 University address set to:", await contract.universityAddress());
  
  const deploymentTransaction = contract.deploymentTransaction();
  const txHash = deploymentTransaction?.hash || "unknown";
  const blockNumber = await ethers.provider.getBlockNumber();
  
  console.log("📦 Transaction hash:", txHash);
  console.log("🔗 Block number:", blockNumber);
  
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contract: "AcademicVerificationSystem",
    address: contractAddress,
    deployer: deployer.address,
    universityAddress: deployer.address,
    transactionHash: txHash,
    blockNumber: blockNumber.toString(),
    timestamp: new Date().toISOString(),
    abi: JSON.parse(AcademicVerificationSystem.interface.formatJson())
  };
  
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `deployment-${network.name}-${network.chainId}-${Date.now()}.json`;
  const filePath = path.join(deploymentsDir, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", filePath);
  console.log("🎉 Deployment completed!");
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });