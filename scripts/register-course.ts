import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Import the TypeChain-generated type
import type { AcademicVerificationSystem } from "../typechain-types";

async function main() {
  console.log("📚 Registering test courses...");
  
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFiles = fs.readdirSync(deploymentsDir)
    .filter(file => file.endsWith(".json"))
    .sort()
    .reverse();
  
  if (deploymentFiles.length === 0) {
    console.error("❌ No deployment found.");
    console.log("   Run: npm run deploy");
    process.exit(1);
  }
  
  const deploymentPath = path.join(deploymentsDir, deploymentFiles[0]);
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  // Get the contract with proper typing
  const contractFactory = await ethers.getContractFactory("AcademicVerificationSystem");
  
  // Attach to the deployed address with proper typing
  const contract = contractFactory.attach(deploymentInfo.address) as AcademicVerificationSystem;
  
  const [universityAdmin] = await ethers.getSigners();
  
  const testCourses = [
    { code: "MAT101", name: "Mathematics 101" },
    { code: "PHY201", name: "Physics 201" },
    { code: "CS101", name: "Computer Science 101" },
  ];
  
  console.log(`Registering ${testCourses.length} courses...`);
  
  for (const course of testCourses) {
    try {
      console.log(`\n${course.code}: ${course.name}`);
      
      // Type-safe method call
      const tx = await contract.connect(universityAdmin).registerCourse(
        course.code,
        course.name
      );
      
      await tx.wait();
      console.log(`✅ Registered`);
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log("\n🎉 Course registration completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });