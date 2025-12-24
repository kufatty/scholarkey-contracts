import { ethers } from "hardhat";
import readline from "readline";
import * as fs from "fs";
import * as path from "path";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log("🤖 AcademicVerificationSystem Interactive Console");
  console.log("=".repeat(60));
  
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    console.error("❌ No deployments found.");
    console.log("   Run: npm run deploy");
    rl.close();
    process.exit(1);
  }
  
  const deploymentFiles = fs.readdirSync(deploymentsDir)
    .filter(file => file.endsWith(".json"))
    .sort()
    .reverse();
  
  const deploymentPath = path.join(deploymentsDir, deploymentFiles[0]);
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  console.log(`📄 Contract: ${deploymentInfo.address}`);
  
  const AcademicVerificationSystem = await ethers.getContractFactory(
    "AcademicVerificationSystem"
  );
  const contract: any = AcademicVerificationSystem.attach(deploymentInfo.address);
  
  const signers = await ethers.getSigners();
  
  console.log("\n📋 Available accounts:");
  console.log("-".repeat(40));
  
  for (let i = 0; i < Math.min(signers.length, 11); i++) {
    console.log(`${i}: ${signers[i].address}`);
  }

  console.log("\n🎭 Role Legend:");
  console.log("0: Admin/General Director");
  console.log("1: Teacher");
  console.log("2: Department Head");
  console.log("3: General Director (or backup)");
  console.log("4-7: Students");
  console.log("8-10: External Viewers");

  const accountChoice = await askQuestion("\nSelect account (0-10): ");
  const accountIndex = parseInt(accountChoice);
  
  if (isNaN(accountIndex) || accountIndex < 0 || accountIndex >= signers.length) {
    console.error("❌ Invalid account");
    rl.close();
    process.exit(1);
  }
  
  const user = signers[accountIndex];
  console.log(`\n✅ Connected as: ${user.address}`);
  
  // Get and display user role immediately
  try {
    const role = await contract.connect(user).getUserRole(user.address);
    const roleNames = ["None", "Student", "Teacher", "DepartmentHead", "GeneralDirector"];
    console.log(`🎭 Your role: ${roleNames[role]} (${role})`);
  } catch (error) {
    console.log("⚠️ Could not fetch role (contract might not be set up)");
  }
  
  while (true) {
    console.log("\n" + "=".repeat(50));
    console.log("📋 MAIN MENU");
    console.log("=".repeat(50));
    console.log("1. 🔍 View Information");
    console.log("2. ✏️  Create/Modify Records");
    console.log("3. 👥 Manage Access");
    console.log("4. ✅ Verification & Signatures");
    console.log("5. 🚪 Exit");
    
    const mainChoice = await askQuestion("\nSelect category (1-5): ");
    
    switch (mainChoice) {
      case '1':
        await viewInformationMenu(contract, user);
        break;
      case '2':
        await modifyRecordsMenu(contract, user);
        break;
      case '3':
        await accessManagementMenu(contract, user);
        break;
      case '4':
        await verificationMenu(contract, user);
        break;
      case '5':
        console.log("👋 Goodbye!");
        rl.close();
        process.exit(0);
      default:
        console.log("❌ Invalid choice");
    }
  }
}

async function viewInformationMenu(contract: any, user: any) {
  while (true) {
    console.log("\n" + "=".repeat(40));
    console.log("🔍 VIEW INFORMATION");
    console.log("=".repeat(40));
    console.log("1. Check my role");
    console.log("2. View total grades in system");
    console.log("3. View a specific grade by ID");
    console.log("4. View all my grades (Student only)");
    console.log("5. View all grades for a student");
    console.log("6. List all grade IDs in system");
    console.log("7. List all students with grades");
    console.log("8. List available courses");
    console.log("9. Back to main menu");
    
    const choice = await askQuestion("\nChoice (1-9): ");
    
    switch (choice) {
      case '1':
        await getMyRole(contract, user);
        break;
      case '2':
        await getTotalGrades(contract);
        break;
      case '3':
        await viewGradeById(contract, user);
        break;
      case '4':
        await viewMyGrades(contract, user);
        break;
      case '5':
        await viewStudentGrades(contract, user);
        break;
      case '6':
        await listAllGradeIds(contract, user);
        break;
      case '7':
        await listAllStudents(contract, user);
        break;
      case '8':
        await listAvailableCourses(contract, user);
        break;
      case '9':
        return;
      default:
        console.log("❌ Invalid choice");
    }
  }
}

async function modifyRecordsMenu(contract: any, user: any) {
  while (true) {
    console.log("\n" + "=".repeat(40));
    console.log("✏️  CREATE/MODIFY RECORDS");
    console.log("=".repeat(40));
    console.log("1. Create grade (Teacher only)");
    console.log("2. Verify grade (Dept Head only)");
    console.log("3. Ratify grade (Director only)");
    console.log("4. Back to main menu");
    
    const choice = await askQuestion("\nChoice (1-4): ");
    
    switch (choice) {
      case '1':
        await createGrade(contract, user);
        break;
      case '2':
        await verifyGrade(contract, user);
        break;
      case '3':
        await ratifyGrade(contract, user);
        break;
      case '4':
        return;
      default:
        console.log("❌ Invalid choice");
    }
  }
}

async function accessManagementMenu(contract: any, user: any) {
  while (true) {
    console.log("\n" + "=".repeat(40));
    console.log("👥 MANAGE ACCESS");
    console.log("=".repeat(40));
    console.log("1. Grant access to my grades");
    console.log("2. Revoke access from someone");
    console.log("3. View who has access to my grades");
    console.log("4. Check if I have access to a student");
    console.log("5. Back to main menu");
    
    const choice = await askQuestion("\nChoice (1-5): ");
    
    switch (choice) {
      case '1':
        await grantAccess(contract, user);
        break;
      case '2':
        await revokeAccess(contract, user);
        break;
      case '3':
        await viewGrantedAccessList(contract, user);
        break;
      case '4':
        await checkAccessToStudent(contract, user);
        break;
      case '5':
        return;
      default:
        console.log("❌ Invalid choice");
    }
  }
}

async function verificationMenu(contract: any, user: any) {
  while (true) {
    console.log("\n" + "=".repeat(40));
    console.log("✅ VERIFICATION & SIGNATURES");
    console.log("=".repeat(40));
    console.log("1. Verify signatures for a grade");
    console.log("2. Check if grade is finalized");
    console.log("3. Get grade status");
    console.log("4. Verify student grade for specific course");
    console.log("5. Back to main menu");
    
    const choice = await askQuestion("\nChoice (1-5): ");
    
    switch (choice) {
      case '1':
        await verifySignatures(contract, user);
        break;
      case '2':
        await checkGradeFinalized(contract, user);
        break;
      case '3':
        await getGradeStatus(contract, user);
        break;
      case '4':
        await verifyStudentGrade(contract, user);
        break;
      case '5':
        return;
      default:
        console.log("❌ Invalid choice");
    }
  }
}

// ==================== IMPLEMENTATION FUNCTIONS ====================

async function getMyRole(contract: any, user: any) {
  try {
    const role = await contract.connect(user).getUserRole(user.address);
    const roleNames = ["None", "Student", "Teacher", "DepartmentHead", "GeneralDirector"];
    console.log(`\n🎭 Your role: ${roleNames[role]} (${role})`);
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function getTotalGrades(contract: any) {
  try {
    const total = await contract.getTotalGrades();
    console.log(`\n📊 Total grades in system: ${total}`);
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function viewGradeById(contract: any, user: any) {
  try {
    const gradeId = await askQuestion("Enter Grade ID: ");
    
    // First get basic info
    console.log("\n⏳ Fetching grade info...");
    const [student, courseCode, grade, semester, status] = await contract.connect(user).getGradeInfo(parseInt(gradeId));
    
    console.log("\n📄 Grade Information:");
    console.log("-".repeat(40));
    console.log(`ID: ${gradeId}`);
    console.log(`Student: ${student}`);
    console.log(`Course: ${courseCode}`);
    console.log(`Grade: ${grade}/20`);
    console.log(`Semester: ${semester}`);
    console.log(`Status: ${status}`);
    
    // Ask if they want full details
    const fullDetails = await askQuestion("\nView full details including signatures? (y/n): ");
    if (fullDetails.toLowerCase() === 'y') {
      const fullGrade = await contract.connect(user).viewGrade(parseInt(gradeId));
      console.log("\n📋 Full Grade Record:");
      console.log("-".repeat(40));
      console.log(`Teacher: ${fullGrade.teacher}`);
      console.log(`Dept Head: ${fullGrade.departmentHead}`);
      console.log(`General Director: ${fullGrade.generalDirector}`);
      console.log(`Created: ${new Date(Number(fullGrade.createdAt) * 1000).toLocaleString()}`);
      console.log(`Updated: ${new Date(Number(fullGrade.updatedAt) * 1000).toLocaleString()}`);
      if (fullGrade.finalizedAt > 0) {
        console.log(`Finalized: ${new Date(Number(fullGrade.finalizedAt) * 1000).toLocaleString()}`);
      }
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function viewMyGrades(contract: any, user: any) {
  try {
    console.log("\n⏳ Fetching your grades...");
    const grades = await contract.connect(user).viewMyGrades();
    
    if (grades.length === 0) {
      console.log("\n📭 No grades found");
      return;
    }
    
    console.log(`\n📚 Found ${grades.length} grade(s):`);
    console.log("-".repeat(60));
    
    grades.forEach((grade: any, index: number) => {
      console.log(`\n${index + 1}. ${grade.courseCode} - ${grade.grade}/20`);
      console.log(`   ID: ${grade.id}, Semester: ${grade.semester}, Status: ${grade.status}`);
      console.log(`   Teacher: ${grade.teacher}`);
    });
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function viewStudentGrades(contract: any, user: any) {
  try {
    const studentAddress = await askQuestion("Enter student address: ");
    
    console.log("\n⏳ Fetching student grades...");
    
    // First check if we have access
    const hasAccess = await contract.hasAccess(studentAddress, user.address);
    if (!hasAccess) {
      console.log("❌ You don't have access to this student's grades");
      return;
    }
    
    const grades = await contract.viewStudentGrades(studentAddress);
    
    if (grades.length === 0) {
      console.log("\n📭 No grades found for this student");
      return;
    }
    
    console.log(`\n📚 Found ${grades.length} grade(s) for ${studentAddress}:`);
    console.log("-".repeat(60));
    
    grades.forEach((grade: any, index: number) => {
      console.log(`\n${index + 1}. ${grade.courseCode} - ${grade.grade}/20`);
      console.log(`   ID: ${grade.id}, Semester: ${grade.semester}, Status: ${grade.status}`);
      console.log(`   Teacher: ${grade.teacher}`);
    });
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function listAllGradeIds(contract: any, user: any) {
  try {
    console.log("\n⏳ Fetching all grade IDs...");
    
    // Try to use the new function if it exists
    try {
      const gradeIds = await contract.getAllGradeIds();
      console.log(`\n📋 All Grade IDs (${gradeIds.length} total):`);
      console.log("-".repeat(40));
      
      // Display in chunks of 10
      for (let i = 0; i < gradeIds.length; i += 10) {
        const chunk = gradeIds.slice(i, i + 10);
        console.log(chunk.join(", "));
      }
    } catch {
      // Fallback: get total and suggest manual entry
      const total = await contract.getTotalGrades();
      console.log(`\n⚠️  Function not available in contract.`);
      console.log(`Total grades in system: ${total}`);
      console.log(`Grade IDs range from 1 to ${total}`);
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function listAllStudents(contract: any, user: any) {
  try {
    console.log("\n⏳ Fetching all students...");
    
    // Try to use the new function if it exists
    try {
      const students = await contract.getAllStudentsWithGrades();
      console.log(`\n👥 Students with grades (${students.length} total):`);
      console.log("-".repeat(40));
      
      students.forEach((student: string, index: number) => {
        console.log(`${index + 1}. ${student}`);
      });
    } catch {
      console.log("\n⚠️  Function not available in contract.");
      console.log("Use accounts 4-7 for testing (they're pre-assigned as students)");
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function listAvailableCourses(contract: any, user: any) {
  try {
    console.log("\n⏳ Fetching available courses...");
    
    // Try to use the new function if it exists
    try {
      const courses = await contract.getAllCourseCodes();
      if (courses.length === 0) {
        console.log("\n📚 Available courses (from test data):");
        console.log("-".repeat(40));
        console.log("MAT101: Mathematics 101");
        console.log("PHY201: Physics 201");
        console.log("CS101: Computer Science 101");
        console.log("\nℹ️  Courses not registered in contract. Use 'register-courses' script.");
      } else {
        console.log(`\n📚 Available courses (${courses.length} total):`);
        console.log("-".repeat(40));
        
        for (const courseCode of courses) {
          const courseName = await contract.getCourseName(courseCode);
          console.log(`${courseCode}: ${courseName}`);
        }
      }
    } catch {
      console.log("\n📚 Available courses (from test data):");
      console.log("-".repeat(40));
      console.log("MAT101: Mathematics 101");
      console.log("PHY201: Physics 201");
      console.log("CS101: Computer Science 101");
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function createGrade(contract: any, user: any) {
  try {
    console.log("\n📝 Creating new grade:");
    // Show available accounts for reference
    const signers = await ethers.getSigners();
    console.log("\n📋 Available accounts for testing:");
    for (let i = 0; i < Math.min(signers.length, 11); i++) {
      console.log(`${i}: ${signers[i].address}`);
    }
    const student = await askQuestion("Student address (use accounts 4-7): ");
    const course = await askQuestion("Course code (e.g., MAT101): ");
    const grade = await askQuestion("Grade (0-20): ");
    const semester = await askQuestion("Semester (e.g., 2024-1): ");
    
    // Validate inputs
    if (parseInt(grade) < 0 || parseInt(grade) > 20) {
      console.log("❌ Grade must be between 0 and 20");
      return;
    }
    
    console.log("\n⏳ Creating grade...");
    const tx = await contract.connect(user).createGrade(student, course, parseInt(grade), semester);
    await tx.wait();
    console.log(`✅ Grade created! Tx: ${tx.hash}`);
    
    // Get the new grade ID
    const totalGrades = await contract.getTotalGrades();
    console.log(`New grade ID: ${totalGrades}`);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function verifyGrade(contract: any, user: any) {
  try {
    const gradeId = await askQuestion("Grade ID to verify: ");
    
    // Check current status first
    try {
      const [student, courseCode, grade, semester, status] = await contract.connect(user).getGradeInfo(parseInt(gradeId));
      console.log(`\n📄 Grade ${gradeId}: ${courseCode} - ${grade}/20`);
      console.log(`Current status: ${status}`);
    } catch (e) {
      // Ignore if we can't get info
    }
    
    const confirm = await askQuestion(`\nVerify grade ${gradeId}? (y/n): `);
    if (confirm.toLowerCase() !== 'y') return;
    
    console.log("\n⏳ Verifying...");
    const tx = await contract.connect(user).verifyGrade(parseInt(gradeId));
    await tx.wait();
    console.log(`✅ Verified! Tx: ${tx.hash}`);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function ratifyGrade(contract: any, user: any) {
  try {
    const gradeId = await askQuestion("Grade ID to ratify: ");
    
    // Check current status first
    try {
      const [student, courseCode, grade, semester, status] = await contract.connect(user).getGradeInfo(parseInt(gradeId));
      console.log(`\n📄 Grade ${gradeId}: ${courseCode} - ${grade}/20`);
      console.log(`Current status: ${status}`);
    } catch (e) {
      // Ignore if we can't get info
    }
    
    const confirm = await askQuestion(`\nRatify grade ${gradeId}? (y/n): `);
    if (confirm.toLowerCase() !== 'y') return;
    
    console.log("\n⏳ Ratifying...");
    const tx = await contract.connect(user).ratifyGrade(parseInt(gradeId));
    await tx.wait();
    console.log(`✅ Ratified! Tx: ${tx.hash}`);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function grantAccess(contract: any, user: any) {
  try {
    // Show available accounts for reference
    const signers = await ethers.getSigners();
    console.log("\n📋 Available accounts for testing:");
    for (let i = 0; i < Math.min(signers.length, 11); i++) {
      console.log(`${i}: ${signers[i].address}`);
    }

    const viewer = await askQuestion("Address to grant access: ");
    
    const confirm = await askQuestion(`\nGrant ${viewer} access to your grades? (y/n): `);
    if (confirm.toLowerCase() !== 'y') return;
    
    console.log("\n⏳ Granting access...");
    const tx = await contract.connect(user).grantAccess(viewer);
    await tx.wait();
    console.log(`✅ Access granted! Tx: ${tx.hash}`);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function revokeAccess(contract: any, user: any) {
  try {
    // First show who currently has access
    console.log("\n⏳ Checking granted access...");
    try {
      const grantedList = await contract.getGrantedAccessList(user.address);
      if (grantedList.length > 0) {
        console.log("\n👥 Addresses with access to your grades:");
        grantedList.forEach((addr: string, index: number) => {
          console.log(`${index + 1}. ${addr}`);
        });
      } else {
        console.log("📭 No one has been granted access to your grades");
      }
    } catch {
      console.log("⚠️  Cannot retrieve granted access list (function not available)");
    }
    
    const viewer = await askQuestion("\nAddress to revoke access from: ");
    
    const confirm = await askQuestion(`Revoke access from ${viewer}? (y/n): `);
    if (confirm.toLowerCase() !== 'y') return;
    
    console.log("\n⏳ Revoking access...");
    const tx = await contract.connect(user).revokeAccess(viewer);
    await tx.wait();
    console.log(`✅ Access revoked! Tx: ${tx.hash}`);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function viewGrantedAccessList(contract: any, user: any) {
  try {
    console.log("\n⏳ Checking granted access...");
    
    try {
      const grantedList = await contract.getGrantedAccessList(user.address);
      
      if (grantedList.length === 0) {
        console.log("\n📭 No one has been granted access to your grades");
      } else {
        console.log(`\n👥 ${grantedList.length} address(es) have access to your grades:`);
        console.log("-".repeat(40));
        
        grantedList.forEach((addr: string, index: number) => {
          console.log(`${index + 1}. ${addr}`);
        });
      }
    } catch {
      console.log("\n⚠️  Function not available in contract.");
      console.log("You can still grant/revoke access, but cannot view the list.");
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function checkAccessToStudent(contract: any, user: any) {
  try {
    const studentAddress = await askQuestion("Student address to check: ");
    
    const hasAccess = await contract.hasAccess(studentAddress, user.address);
    
    if (hasAccess) {
      console.log(`\n✅ You HAVE access to ${studentAddress}'s grades`);
      
      // Show how many grades they have
      const count = await contract.getStudentGradeCount(studentAddress);
      console.log(`They have ${count} grade(s) in the system`);
    } else {
      console.log(`\n❌ You do NOT have access to ${studentAddress}'s grades`);
      console.log("Ask the student to grant you access using 'grantAccess'");
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function verifySignatures(contract: any, user: any) {
  try {
    const gradeId = await askQuestion("Grade ID to verify signatures: ");
    
    console.log("\n⏳ Verifying signatures...");
    const [teacherValid, deptValid, directorValid, allValid] = await contract.verifyGradeSignatures(parseInt(gradeId));
    
    console.log("\n🔏 Signature Verification Results:");
    console.log("-".repeat(40));
    console.log(`Teacher Signature: ${teacherValid ? "✅ Valid" : "❌ Invalid/Not set"}`);
    console.log(`Department Signature: ${deptValid ? "✅ Valid" : "❌ Invalid/Not set"}`);
    console.log(`Director Signature: ${directorValid ? "✅ Valid" : "❌ Invalid/Not set"}`);
    console.log(`All Signatures Valid: ${allValid ? "✅ YES" : "❌ NO"}`);
    
    if (allValid) {
      console.log("\n🎉 All signatures are cryptographically valid!");
    } else {
      console.log("\n⚠️  Some signatures are missing or invalid");
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function checkGradeFinalized(contract: any, user: any) {
  try {
    const gradeId = await askQuestion("Grade ID to check: ");
    
    console.log("\n⏳ Checking...");
    const isFinalized = await contract.isGradeFinalized(parseInt(gradeId));
    
    if (isFinalized) {
      console.log(`\n✅ Grade ${gradeId} is FINALIZED and immutable`);
    } else {
      console.log(`\n⚠️  Grade ${gradeId} is NOT finalized`);
      
      // Get status for more info
      try {
        const statusText = await contract.getGradeStatus(parseInt(gradeId));
        console.log(`Status: ${statusText}`);
      } catch (e) {
        // Ignore if function not available
      }
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function getGradeStatus(contract: any, user: any) {
  try {
    const gradeId = await askQuestion("Grade ID: ");
    
    console.log("\n⏳ Fetching status...");
    const statusText = await contract.getGradeStatus(parseInt(gradeId));
    
    console.log(`\n📊 Grade ${gradeId} Status:`);
    console.log("-".repeat(40));
    console.log(statusText);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function verifyStudentGrade(contract: any, user: any) {
  try {
    const studentAddress = await askQuestion("Student address: ");
    const courseCode = await askQuestion("Course code: ");
    
    console.log("\n⏳ Verifying...");
    const [gradeExists, gradeValue, status] = await contract.verifyStudentGrade(studentAddress, courseCode);
    
    console.log("\n📊 Verification Results:");
    console.log("-".repeat(40));
    
    if (gradeExists) {
      console.log(`✅ Grade found for ${courseCode}`);
      console.log(`Grade: ${gradeValue}/20`);
      console.log(`Status: ${status}`);
    } else {
      console.log(`❌ No grade found for ${courseCode}`);
      console.log("Student may not have taken this course yet");
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
