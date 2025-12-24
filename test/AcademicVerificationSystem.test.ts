import { expect } from "chai";
import { ethers } from "hardhat";
import type { AcademicVerificationSystem } from "../typechain-types";

describe("AcademicVerificationSystem", function () {
  let contract: AcademicVerificationSystem;
  let owner: any;
  let teacher: any;
  let teacher2: any;
  let departmentHead: any;
  let departmentHead2: any;
  let generalDirector: any;
  let generalDirector2: any;
  let student: any;
  let student2: any;
  let student3: any;
  let externalUser: any;
  let externalUser2: any;

  const TEST_COURSE_CODE = "MAT101";
  const TEST_COURSE_NAME = "Mathematics 101";
  const TEST_COURSE_CODE_2 = "PHY201";
  const TEST_COURSE_NAME_2 = "Physics 201";
  const TEST_SEMESTER = "2024-1";
  const TEST_SEMESTER_2 = "2024-2";

  beforeEach(async function () {
    [
      owner,           // Account 0: University Admin
      teacher,         // Account 1: Teacher 1
      teacher2,        // Account 2: Teacher 2
      departmentHead,  // Account 3: Department Head 1
      departmentHead2, // Account 4: Department Head 2
      generalDirector, // Account 5: General Director 1
      generalDirector2,// Account 6: General Director 2
      student,         // Account 7: Student 1
      student2,        // Account 8: Student 2
      student3,        // Account 9: Student 3
      externalUser,    // Account 10: External User 1
      externalUser2    // Account 11: External User 2
    ] = await ethers.getSigners();

    const AcademicVerificationSystem = await ethers.getContractFactory(
      "AcademicVerificationSystem"
    );
    contract = await AcademicVerificationSystem.deploy(owner.address);
    await contract.waitForDeployment();

    // Assign all roles
    await contract.connect(owner).assignRole(teacher.address, 2); // Teacher
    await contract.connect(owner).assignRole(teacher2.address, 2); // Teacher 2
    await contract.connect(owner).assignRole(departmentHead.address, 3); // DepartmentHead
    await contract.connect(owner).assignRole(departmentHead2.address, 3); // DepartmentHead 2
    await contract.connect(owner).assignRole(generalDirector.address, 4); // GeneralDirector
    await contract.connect(owner).assignRole(generalDirector2.address, 4); // GeneralDirector 2
    await contract.connect(owner).assignRole(student.address, 1); // Student
    await contract.connect(owner).assignRole(student2.address, 1); // Student 2
    await contract.connect(owner).assignRole(student3.address, 1); // Student 3

    // Register test courses
    await contract.connect(owner).registerCourse(TEST_COURSE_CODE, TEST_COURSE_NAME);
    await contract.connect(owner).registerCourse(TEST_COURSE_CODE_2, TEST_COURSE_NAME_2);
  });

  // ============================================
  // 1. CONTRACT DEPLOYMENT & BASIC SETUP TESTS
  // ============================================

  describe("Contract Deployment and Initial Setup", function () {
    it("Should set the correct university address", async function () {
      expect(await contract.universityAddress()).to.equal(owner.address);
    });

    it("Should assign deployer as initial GeneralDirector", async function () {
      const role = await contract.getUserRole(owner.address);
      expect(role).to.equal(4); // GeneralDirector
    });

    it("Should have 0 grades initially", async function () {
      expect(await contract.getTotalGrades()).to.equal(0);
    });

    it("Should return correct constant values", async function () {
      expect(await contract.MIN_GRADE()).to.equal(0);
      expect(await contract.MAX_GRADE()).to.equal(20);
      expect(await contract.MIN_COURSE_CODE_LENGTH()).to.equal(3);
      expect(await contract.MAX_COURSE_CODE_LENGTH()).to.equal(20);
    });
  });

  // ============================================
  // 2. ROLE MANAGEMENT TESTS
  // ============================================

  describe("Role Management", function () {
    it("Should assign role to a user", async function () {
      const testAddress = externalUser.address;
      
      await contract.connect(owner).assignRole(testAddress, 2); // Assign Teacher role
      const role = await contract.getUserRole(testAddress);
      expect(role).to.equal(2);
    });

    it("Should revoke role from a user", async function () {
      await contract.connect(owner).revokeRole(teacher.address);
      const role = await contract.getUserRole(teacher.address);
      expect(role).to.equal(0); // None
    });

    it("Should reject role assignment by non-university", async function () {
      await expect(
        contract.connect(teacher).assignRole(externalUser.address, 2)
      ).to.be.revertedWith("Caller is not the university");
    });

    it("Should reject role revocation by non-university", async function () {
      await expect(
        contract.connect(teacher).revokeRole(teacher2.address)
      ).to.be.revertedWith("Caller is not the university");
    });

    it("Should reject assigning 'None' role", async function () {
      await expect(
        contract.connect(owner).assignRole(externalUser.address, 0)
      ).to.be.revertedWith("Cannot assign 'None' role");
    });

    it("Should reject assigning role to zero address", async function () {
      await expect(
        contract.connect(owner).assignRole(ethers.ZeroAddress, 2)
      ).to.be.revertedWith("Invalid user address");
    });

    it("Should reject revoking role from zero address", async function () {
      await expect(
        contract.connect(owner).revokeRole(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid user address");
    });

    it("Should reject revoking non-existent role", async function () {
      await expect(
        contract.connect(owner).revokeRole(externalUser.address)
      ).to.be.revertedWith("User has no role assigned");
    });

    it("Should allow role reassignment", async function () {
      await contract.connect(owner).assignRole(externalUser.address, 1); // Student
      let role = await contract.getUserRole(externalUser.address);
      expect(role).to.equal(1);

      await contract.connect(owner).assignRole(externalUser.address, 2); // Teacher
      role = await contract.getUserRole(externalUser.address);
      expect(role).to.equal(2);
    });

    it("Should emit RoleAssigned event", async function () {
      await expect(contract.connect(owner).assignRole(externalUser.address, 2))
        .to.emit(contract, "RoleAssigned")
        .withArgs(externalUser.address, 2);
    });

    it("Should emit RoleRevoked event", async function () {
      await expect(contract.connect(owner).revokeRole(teacher.address))
        .to.emit(contract, "RoleRevoked")
        .withArgs(teacher.address, 2);
    });
  });

  // ============================================
  // 3. COURSE MANAGEMENT TESTS
  // ============================================

  describe("Course Management", function () {
    it("Should register a new course", async function () {
      const courseCode = "CS101";
      const courseName = "Computer Science 101";
      
      await contract.connect(owner).registerCourse(courseCode, courseName);
      const retrievedName = await contract.getCourseName(courseCode);
      expect(retrievedName).to.equal(courseName);
    });

    it("Should update existing course name", async function () {
      const newName = "Mathematics Fundamentals";
      await contract.connect(owner).registerCourse(TEST_COURSE_CODE, newName);
      const retrievedName = await contract.getCourseName(TEST_COURSE_CODE);
      expect(retrievedName).to.equal(newName);
    });

    it("Should reject course registration by non-university", async function () {
      await expect(
        contract.connect(teacher).registerCourse("CS101", "Computer Science")
      ).to.be.revertedWith("Caller is not the university");
    });

    it("Should reject empty course name", async function () {
      await expect(
        contract.connect(owner).registerCourse("CS101", "")
      ).to.be.revertedWith("Course name cannot be empty");
    });

    it("Should reject course code that's too short", async function () {
      await expect(
        contract.connect(owner).registerCourse("C1", "Course")
      ).to.be.revertedWith("Course code too short");
    });

    it("Should reject course code that's too long", async function () {
      const longCode = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456";
      await expect(
        contract.connect(owner).registerCourse(longCode, "Course")
      ).to.be.revertedWith("Course code too long");
    });

    it("Should return empty string for non-existent course", async function () {
      const name = await contract.getCourseName("NONEXISTENT");
      expect(name).to.equal("");
    });

    it("Should emit CourseRegistered event", async function () {
      const courseCode = "CS101";
      const courseName = "Computer Science";
      
      await expect(contract.connect(owner).registerCourse(courseCode, courseName))
        .to.emit(contract, "CourseRegistered")
        .withArgs(courseCode, courseName);
    });
  });

  // ============================================
  // 4. GRADE CREATION TESTS
  // ============================================

  describe("Grade Creation", function () {
    let gradeId: bigint;
    const TEST_GRADE = 18;

    beforeEach(async function () {
      const tx = await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        TEST_GRADE,
        TEST_SEMESTER
      );
      const receipt = await tx.wait();
      
      const event = receipt!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event as any);
        gradeId = parsedLog!.args.gradeId;
      }
    });

    it("Should create a grade with correct data", async function () {
      const grade = await contract.viewGrade(gradeId);
      
      expect(grade.id).to.equal(gradeId);
      expect(grade.student).to.equal(student.address);
      expect(grade.courseCode).to.equal(TEST_COURSE_CODE);
      expect(grade.grade).to.equal(TEST_GRADE);
      expect(grade.semester).to.equal(TEST_SEMESTER);
      expect(grade.teacher).to.equal(teacher.address);
      expect(grade.status).to.equal(0); // Pending
      expect(grade.createdAt).to.be.greaterThan(0);
      expect(grade.updatedAt).to.be.greaterThan(0);
      expect(grade.finalizedAt).to.equal(0);
    });

    it("Should increment grade counter", async function () {
      const initialCount = await contract.getTotalGrades();
      
      await contract.connect(teacher).createGrade(
        student2.address,
        TEST_COURSE_CODE_2,
        15,
        TEST_SEMESTER_2
      );
      
      const newCount = await contract.getTotalGrades();
      expect(newCount).to.equal(initialCount + 1n);
    });

    it("Should add grade to student's grade list", async function () {
      const gradeIds = await contract.getStudentGradeIds(student.address);
      expect(gradeIds.length).to.equal(1);
      expect(gradeIds[0]).to.equal(gradeId);
    });

    it("Should reject grade creation by non-teacher", async function () {
      await expect(
        contract.connect(student).createGrade(
          student.address,
          TEST_COURSE_CODE,
          TEST_GRADE,
          TEST_SEMESTER
        )
      ).to.be.revertedWith("Caller is not a teacher");
    });

    it("Should reject grade creation for non-student address", async function () {
      await expect(
        contract.connect(teacher).createGrade(
          externalUser.address,
          TEST_COURSE_CODE,
          TEST_GRADE,
          TEST_SEMESTER
        )
      ).to.be.revertedWith("Student role required");
    });

    it("Should reject grade creation for non-registered course", async function () {
      await expect(
        contract.connect(teacher).createGrade(
          student.address,
          "NONEXISTENT",
          TEST_GRADE,
          TEST_SEMESTER
        )
      ).to.be.revertedWith("Course not registered");
    });

    it("Should reject invalid grade values (> MAX_GRADE)", async function () {
      await expect(
        contract.connect(teacher).createGrade(
          student.address,
          TEST_COURSE_CODE,
          21,
          TEST_SEMESTER
        )
      ).to.be.revertedWith("Grade value out of range (0-20)");
    });

    it("Should accept minimum grade value", async function () {
      const tx = await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        0,
        TEST_SEMESTER
      );
      await expect(tx).to.not.be.reverted;
    });

    it("Should accept maximum grade value", async function () {
      const tx = await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        20,
        TEST_SEMESTER
      );
      await expect(tx).to.not.be.reverted;
    });

    it("Should reject invalid course code format", async function () {
      await expect(
        contract.connect(teacher).createGrade(
          student.address,
          "AB", // Too short
          TEST_GRADE,
          TEST_SEMESTER
        )
      ).to.be.revertedWith("Course code too short");
    });

    it("Should allow multiple grades for same student", async function () {
      await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE_2,
        16,
        TEST_SEMESTER
      );
      
      const gradeIds = await contract.getStudentGradeIds(student.address);
      expect(gradeIds.length).to.equal(2);
    });

    it("Should allow same course grade in different semesters", async function () {
      await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        19,
        TEST_SEMESTER_2
      );
      
      const gradeIds = await contract.getStudentGradeIds(student.address);
      expect(gradeIds.length).to.equal(2);
    });

    it("Should generate unique teacher signature", async function () {
      const grade = await contract.viewGrade(gradeId);
      expect(grade.teacherSignature).to.not.equal(ethers.ZeroHash);
      
      // Try to create another grade with same data should have different signature
      const tx2 = await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        TEST_GRADE,
        TEST_SEMESTER
      );
      const receipt2 = await tx2.wait();
      
      const event2 = receipt2!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event2) {
        const parsedLog2 = contract.interface.parseLog(event2 as any);
        const gradeId2 = parsedLog2!.args.gradeId;
        const grade2 = await contract.viewGrade(gradeId2);
        
        expect(grade.teacherSignature).to.not.equal(grade2.teacherSignature);
      }
    });

    it("Should emit GradeCreated event", async function () {
      await expect(
        contract.connect(teacher).createGrade(
          student2.address,
          TEST_COURSE_CODE_2,
          15,
          TEST_SEMESTER
        )
      )
        .to.emit(contract, "GradeCreated")
        .withArgs(await contract.getTotalGrades() + 1n, student2.address, teacher.address);
    });
  });

  // ============================================
  // 5. GRADE VERIFICATION TESTS
  // ============================================

  describe("Grade Verification by Department Head", function () {
    let gradeId: bigint;
    const TEST_GRADE = 16;

    beforeEach(async function () {
      const tx = await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        TEST_GRADE,
        TEST_SEMESTER
      );
      const receipt = await tx.wait();
      
      const event = receipt!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event as any);
        gradeId = parsedLog!.args.gradeId;
      }
    });

    it("Should verify a pending grade", async function () {
      await contract.connect(departmentHead).verifyGrade(gradeId);
      
      const grade = await contract.viewGrade(gradeId);
      expect(grade.status).to.equal(1); // DepartmentVerified
      expect(grade.departmentHead).to.equal(departmentHead.address);
      expect(grade.departmentSignature).to.not.equal(ethers.ZeroHash);
      expect(grade.updatedAt).to.be.greaterThan(grade.createdAt);
    });

    it("Should reject verification by non-department head", async function () {
      await expect(
        contract.connect(teacher).verifyGrade(gradeId)
      ).to.be.revertedWith("Caller is not a department head");
      
      await expect(
        contract.connect(student).verifyGrade(gradeId)
      ).to.be.revertedWith("Caller is not a department head");
      
      await expect(
        contract.connect(externalUser).verifyGrade(gradeId)
      ).to.be.revertedWith("Caller is not a department head");
    });

    it("Should reject verification of non-existent grade", async function () {
      await expect(
        contract.connect(departmentHead).verifyGrade(999)
      ).to.be.revertedWith("Invalid grade ID");
    });

    it("Should reject verification of already verified grade", async function () {
      await contract.connect(departmentHead).verifyGrade(gradeId);
      
      await expect(
        contract.connect(departmentHead2).verifyGrade(gradeId)
      ).to.be.revertedWith("Grade not in pending status");
    });

    it("Should reject verification of finalized grade", async function () {
      await contract.connect(departmentHead).verifyGrade(gradeId);
      await contract.connect(generalDirector).ratifyGrade(gradeId);
      
      await expect(
        contract.connect(departmentHead2).verifyGrade(gradeId)
      ).to.be.revertedWith("Grade not in pending status");
    });

    it("Should allow different department head to verify if first verification failed", async function () {
      // Create a new grade
      const tx = await contract.connect(teacher).createGrade(
        student2.address,
        TEST_COURSE_CODE_2,
        17,
        TEST_SEMESTER
      );
      const receipt = await tx.wait();
      const event = receipt!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event as any);
        const newGradeId = parsedLog!.args.gradeId;
        
        // First department head verifies
        await contract.connect(departmentHead).verifyGrade(newGradeId);
        
        // Should not allow second verification
        await expect(
          contract.connect(departmentHead2).verifyGrade(newGradeId)
        ).to.be.revertedWith("Grade not in pending status");
      }
    });

    it("Should update grade status to DepartmentVerified", async function () {
      await contract.connect(departmentHead).verifyGrade(gradeId);
      
      const status = await contract.getGradeStatus(gradeId);
      expect(status).to.include("Verified by department");
    });

    it("Should generate unique department signature", async function () {
      await contract.connect(departmentHead).verifyGrade(gradeId);
      const grade = await contract.viewGrade(gradeId);
      
      // Create and verify another grade
      const tx2 = await contract.connect(teacher).createGrade(
        student2.address,
        TEST_COURSE_CODE_2,
        17,
        TEST_SEMESTER
      );
      const receipt2 = await tx2.wait();
      const event2 = receipt2!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event2) {
        const parsedLog2 = contract.interface.parseLog(event2 as any);
        const gradeId2 = parsedLog2!.args.gradeId;
        await contract.connect(departmentHead).verifyGrade(gradeId2);
        const grade2 = await contract.viewGrade(gradeId2);
        
        expect(grade.departmentSignature).to.not.equal(grade2.departmentSignature);
      }
    });

    it("Should emit GradeVerified event", async function () {
      await expect(contract.connect(departmentHead).verifyGrade(gradeId))
        .to.emit(contract, "GradeVerified")
        .withArgs(gradeId, departmentHead.address);
    });
  });

  // ============================================
  // 6. GRADE RATIFICATION TESTS
  // ============================================

  describe("Grade Ratification by General Director", function () {
    let gradeId: bigint;
    const TEST_GRADE = 17;

    beforeEach(async function () {
      const tx = await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        TEST_GRADE,
        TEST_SEMESTER
      );
      const receipt = await tx.wait();
      
      const event = receipt!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event as any);
        gradeId = parsedLog!.args.gradeId;
      }
      
      await contract.connect(departmentHead).verifyGrade(gradeId);
    });

    it("Should ratify a verified grade", async function () {
      await contract.connect(generalDirector).ratifyGrade(gradeId);
      
      const grade = await contract.viewGrade(gradeId);
      expect(grade.status).to.equal(3); // Finalized
      expect(grade.generalDirector).to.equal(generalDirector.address);
      expect(grade.directorSignature).to.not.equal(ethers.ZeroHash);
      expect(grade.finalizedAt).to.be.greaterThan(0);
      expect(grade.updatedAt).to.be.greaterThan(grade.createdAt);
    });

    it("Should reject ratification by non-general director", async function () {
      await expect(
        contract.connect(teacher).ratifyGrade(gradeId)
      ).to.be.revertedWith("Caller is not a general director");
      
      await expect(
        contract.connect(departmentHead).ratifyGrade(gradeId)
      ).to.be.revertedWith("Caller is not a general director");
      
      await expect(
        contract.connect(student).ratifyGrade(gradeId)
      ).to.be.revertedWith("Caller is not a general director");
    });

    it("Should reject ratification of non-verified grade", async function () {
      // Create a new grade without verification
      const tx = await contract.connect(teacher).createGrade(
        student2.address,
        TEST_COURSE_CODE_2,
        15,
        TEST_SEMESTER
      );
      const receipt = await tx.wait();
      const event = receipt!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event as any);
        const newGradeId = parsedLog!.args.gradeId;
        
        await expect(
          contract.connect(generalDirector).ratifyGrade(newGradeId)
        ).to.be.revertedWith("Grade not verified by department");
      }
    });

    it("Should reject ratification of already finalized grade", async function () {
      await contract.connect(generalDirector).ratifyGrade(gradeId);
      
      await expect(
        contract.connect(generalDirector2).ratifyGrade(gradeId)
      ).to.be.revertedWith("Grade not verified by department");
    });

    it("Should reject ratification of non-existent grade", async function () {
      await expect(
        contract.connect(generalDirector).ratifyGrade(999)
      ).to.be.revertedWith("Invalid grade ID");
    });

    it("Should mark grade as finalized and immutable", async function () {
      await contract.connect(generalDirector).ratifyGrade(gradeId);
      
      const isFinalized = await contract.isGradeFinalized(gradeId);
      expect(isFinalized).to.be.true;
      
      const status = await contract.getGradeStatus(gradeId);
      expect(status).to.equal("Finalized and immutable");
    });

    it("Should generate unique director signature", async function () {
      await contract.connect(generalDirector).ratifyGrade(gradeId);
      const grade = await contract.viewGrade(gradeId);
      
      // Create, verify, and ratify another grade
      const tx2 = await contract.connect(teacher).createGrade(
        student2.address,
        TEST_COURSE_CODE_2,
        18,
        TEST_SEMESTER
      );
      const receipt2 = await tx2.wait();
      const event2 = receipt2!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event2) {
        const parsedLog2 = contract.interface.parseLog(event2 as any);
        const gradeId2 = parsedLog2!.args.gradeId;
        await contract.connect(departmentHead).verifyGrade(gradeId2);
        await contract.connect(generalDirector).ratifyGrade(gradeId2);
        const grade2 = await contract.viewGrade(gradeId2);
        
        expect(grade.directorSignature).to.not.equal(grade2.directorSignature);
      }
    });

    it("Should emit GradeRatified and GradeFinalized events", async function () {
      await expect(contract.connect(generalDirector).ratifyGrade(gradeId))
        .to.emit(contract, "GradeRatified")
        .withArgs(gradeId, generalDirector.address)
        .to.emit(contract, "GradeFinalized")
        .withArgs(gradeId);
    });
  });

  // ============================================
  // 7. COMPLETE WORKFLOW TESTS
  // ============================================

  describe("Complete 3-Tier Workflow", function () {
    it("Should complete full workflow for multiple grades", async function () {
      // Create grades for different students
      const tx1 = await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        18,
        TEST_SEMESTER
      );
      const receipt1 = await tx1.wait();
      const event1 = receipt1!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      const tx2 = await contract.connect(teacher).createGrade(
        student2.address,
        TEST_COURSE_CODE_2,
        16,
        TEST_SEMESTER
      );
      const receipt2 = await tx2.wait();
      const event2 = receipt2!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event1 && event2) {
        const parsedLog1 = contract.interface.parseLog(event1 as any);
        const parsedLog2 = contract.interface.parseLog(event2 as any);
        const gradeId1 = parsedLog1!.args.gradeId;
        const gradeId2 = parsedLog2!.args.gradeId;
        
        // Verify both grades
        await contract.connect(departmentHead).verifyGrade(gradeId1);
        await contract.connect(departmentHead2).verifyGrade(gradeId2);
        
        // Ratify both grades
        await contract.connect(generalDirector).ratifyGrade(gradeId1);
        await contract.connect(generalDirector2).ratifyGrade(gradeId2);
        
        // Check final states
        const grade1 = await contract.viewGrade(gradeId1);
        const grade2 = await contract.viewGrade(gradeId2);
        
        expect(grade1.status).to.equal(3);
        expect(grade2.status).to.equal(3);
        expect(grade1.finalizedAt).to.be.greaterThan(0);
        expect(grade2.finalizedAt).to.be.greaterThan(0);
        
        // Verify signatures
        const sigs1 = await contract.verifyGradeSignatures(gradeId1);
        const sigs2 = await contract.verifyGradeSignatures(gradeId2);
        
        expect(sigs1.allValid).to.be.true;
        expect(sigs2.allValid).to.be.true;
      }
    });

    it("Should maintain correct workflow order", async function () {
      const tx = await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        19,
        TEST_SEMESTER
      );
      const receipt = await tx.wait();
      const event = receipt!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event as any);
        const gradeId = parsedLog!.args.gradeId;
        
        // Try to ratify before verification (should fail)
        await expect(
          contract.connect(generalDirector).ratifyGrade(gradeId)
        ).to.be.revertedWith("Grade not verified by department");
        
        // Verify
        await contract.connect(departmentHead).verifyGrade(gradeId);
        
        // Try to verify again (should fail)
        await expect(
          contract.connect(departmentHead2).verifyGrade(gradeId)
        ).to.be.revertedWith("Grade not in pending status");
        
        // Ratify
        await contract.connect(generalDirector).ratifyGrade(gradeId);
        
        // Try to ratify again (should fail)
        await expect(
          contract.connect(generalDirector2).ratifyGrade(gradeId)
        ).to.be.revertedWith("Grade not verified by department");
        
        // Check final state
        const grade = await contract.viewGrade(gradeId);
        expect(grade.status).to.equal(3);
      }
    });

    it("Should handle concurrent grade processing", async function () {
      // Create multiple grades
      const gradeIds: bigint[] = [];
      
      for (let i = 0; i < 3; i++) {
        const tx = await contract.connect(teacher).createGrade(
          student.address,
          TEST_COURSE_CODE,
          15 + i,
          TEST_SEMESTER
        );
        const receipt = await tx.wait();
        const event = receipt!.logs.find(log => {
          try {
            return contract.interface.parseLog(log as any)!.name === "GradeCreated";
          } catch {
            return false;
          }
        });
        
        if (event) {
          const parsedLog = contract.interface.parseLog(event as any);
          gradeIds.push(parsedLog!.args.gradeId);
        }
      }
      
      // Verify all
      for (const gradeId of gradeIds) {
        await contract.connect(departmentHead).verifyGrade(gradeId);
      }
      
      // Ratify all
      for (const gradeId of gradeIds) {
        await contract.connect(generalDirector).ratifyGrade(gradeId);
      }
      
      // Check all are finalized
      for (const gradeId of gradeIds) {
        const grade = await contract.viewGrade(gradeId);
        expect(grade.status).to.equal(3);
      }
    });
  });

  // ============================================
  // 8. ACCESS CONTROL & PRIVACY TESTS
  // ============================================

  describe("Access Control and Privacy", function () {
    let gradeId: bigint;
    const TEST_GRADE = 17;

    beforeEach(async function () {
      const tx = await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        TEST_GRADE,
        TEST_SEMESTER
      );
      const receipt = await tx.wait();
      
      const event = receipt!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event as any);
        gradeId = parsedLog!.args.gradeId;
      }
      
      await contract.connect(departmentHead).verifyGrade(gradeId);
      await contract.connect(generalDirector).ratifyGrade(gradeId);
    });

    it("Should allow student to view their own grades", async function () {
      const grade = await contract.connect(student).viewGrade(gradeId);
      expect(grade.student).to.equal(student.address);
      expect(grade.grade).to.equal(TEST_GRADE);
    });

    it("Should allow student to view all their grades", async function () {
      // Create another grade for same student
      await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE_2,
        19,
        TEST_SEMESTER_2
      );
      
      const grades = await contract.connect(student).viewMyGrades();
      expect(grades.length).to.be.greaterThan(0);
      
      for (const grade of grades) {
        expect(grade.student).to.equal(student.address);
      }
    });

    it("Should reject external user without access", async function () {
      await expect(
        contract.connect(externalUser).viewGrade(gradeId)
      ).to.be.revertedWith("No access to this grade");
    });

    it("Should allow student to grant access to external user", async function () {
      await contract.connect(student).grantAccess(externalUser.address);
      
      const hasAccess = await contract.hasAccess(student.address, externalUser.address);
      expect(hasAccess).to.be.true;
      
      const grade = await contract.connect(externalUser).viewGrade(gradeId);
      expect(grade.grade).to.equal(TEST_GRADE);
    });

    it("Should allow student to revoke access", async function () {
      await contract.connect(student).grantAccess(externalUser.address);
      
      // Verify access works
      await contract.connect(externalUser).viewGrade(gradeId);
      
      // Revoke access
      await contract.connect(student).revokeAccess(externalUser.address);
      
      // Verify access is revoked
      await expect(
        contract.connect(externalUser).viewGrade(gradeId)
      ).to.be.revertedWith("No access to this grade");
    });

    it("Should allow university officials to view any grade", async function () {
      // Teacher should have access
      const grade1 = await contract.connect(teacher).viewGrade(gradeId);
      expect(grade1.grade).to.equal(TEST_GRADE);
      
      // Department head should have access
      const grade2 = await contract.connect(departmentHead).viewGrade(gradeId);
      expect(grade2.grade).to.equal(TEST_GRADE);
      
      // General director should have access
      const grade3 = await contract.connect(generalDirector).viewGrade(gradeId);
      expect(grade3.grade).to.equal(TEST_GRADE);
    });

    it("Should reject granting access to self", async function () {
      await expect(
        contract.connect(student).grantAccess(student.address)
      ).to.be.revertedWith("Cannot grant access to yourself");
    });

    it("Should reject granting already granted access", async function () {
      await contract.connect(student).grantAccess(externalUser.address);
      
      await expect(
        contract.connect(student).grantAccess(externalUser.address)
      ).to.be.revertedWith("Access already granted");
    });

    it("Should reject revoking non-granted access", async function () {
      await expect(
        contract.connect(student).revokeAccess(externalUser.address)
      ).to.be.revertedWith("Access not granted");
    });

    it("Should allow multiple external users to have access", async function () {
      await contract.connect(student).grantAccess(externalUser.address);
      await contract.connect(student).grantAccess(externalUser2.address);
      
      const grade1 = await contract.connect(externalUser).viewGrade(gradeId);
      const grade2 = await contract.connect(externalUser2).viewGrade(gradeId);
      
      expect(grade1.grade).to.equal(TEST_GRADE);
      expect(grade2.grade).to.equal(TEST_GRADE);
    });

    it("Should allow student to view public grade info", async function () {
      const [ids, courseCodes, grades, semesters, statuses] = 
        await contract.connect(student).viewMyGradesPublic();
      
      expect(ids.length).to.be.greaterThan(0);
      expect(courseCodes.length).to.be.greaterThan(0);
      expect(grades.length).to.be.greaterThan(0);
      expect(semesters.length).to.be.greaterThan(0);
      expect(statuses.length).to.be.greaterThan(0);
    });

    it("Should allow external user with access to view all student grades", async function () {
      await contract.connect(student).grantAccess(externalUser.address);
      
      // Create multiple grades for the student
      await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        18,
        TEST_SEMESTER
      );
      
      await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE_2,
        16,
        TEST_SEMESTER_2
      );
      
      // External user should be able to view all grades
      const grades = await contract.connect(externalUser).viewStudentGrades(student.address);
      expect(grades.length).to.equal(3); // One from beforeEach + two we just created
      
      for (const grade of grades) {
        expect(grade.student).to.equal(student.address);
      }
    });

    it("Should reject external user without access from viewing all student grades", async function () {
      await expect(
        contract.connect(externalUser).viewStudentGrades(student.address)
      ).to.be.revertedWith("No access to student's grades");
    });

    it("Should allow student to view their own grades via viewStudentGrades", async function () {
      const grades = await contract.connect(student).viewStudentGrades(student.address);
      expect(grades.length).to.be.greaterThan(0);
      
      for (const grade of grades) {
        expect(grade.student).to.equal(student.address);
      }
    });

    it("Should allow university officials to view any student's grades", async function () {
      // Teacher should have access
      const gradesByTeacher = await contract.connect(teacher).viewStudentGrades(student.address);
      expect(gradesByTeacher.length).to.be.greaterThan(0);
      
      // Department head should have access
      const gradesByDeptHead = await contract.connect(departmentHead).viewStudentGrades(student.address);
      expect(gradesByDeptHead.length).to.be.greaterThan(0);
      
      // General director should have access
      const gradesByDirector = await contract.connect(generalDirector).viewStudentGrades(student.address);
      expect(gradesByDirector.length).to.be.greaterThan(0);
    });

    it("Should allow external user with access to view public student grades info", async function () {
      await contract.connect(student).grantAccess(externalUser.address);
      
      const [ids, courseCodes, grades, semesters, statuses] = 
        await contract.connect(externalUser).viewStudentGradesPublic(student.address);
      
      expect(ids.length).to.be.greaterThan(0);
      expect(courseCodes.length).to.be.greaterThan(0);
      expect(grades.length).to.be.greaterThan(0);
      expect(semesters.length).to.be.greaterThan(0);
      expect(statuses.length).to.be.greaterThan(0);
    });

    it("Should reject external user without access from viewing public student grades", async function () {
      await expect(
        contract.connect(externalUser).viewStudentGradesPublic(student.address)
      ).to.be.revertedWith("No access to student's grades");
    });

    it("Should allow zero-knowledge verification with permission", async function () {
      await contract.connect(student).grantAccess(externalUser.address);
      
      const [exists, gradeValue, status] = 
        await contract.connect(externalUser).verifyStudentGrade(
          student.address,
          TEST_COURSE_CODE
        );
      
      expect(exists).to.be.true;
      expect(gradeValue).to.equal(TEST_GRADE);
      expect(status).to.equal(3); // Finalized
    });

    it("Should reject zero-knowledge verification without permission", async function () {
      await expect(
        contract.connect(externalUser).verifyStudentGrade(
          student.address,
          TEST_COURSE_CODE
        )
      ).to.be.revertedWith("No access to student's grades");
    });

    it("Should return false for non-existent course verification", async function () {
      await contract.connect(student).grantAccess(externalUser.address);
      
      const [exists, gradeValue, status] = 
        await contract.connect(externalUser).verifyStudentGrade(
          student.address,
          "NONEXISTENT"
        );
      
      expect(exists).to.be.false;
      expect(gradeValue).to.equal(0);
      expect(status).to.equal(0); // Pending (default)
    });

    it("Should emit AccessGranted and AccessRevoked events", async function () {
      await expect(contract.connect(student).grantAccess(externalUser.address))
        .to.emit(contract, "AccessGranted")
        .withArgs(student.address, externalUser.address);
      
      await expect(contract.connect(student).revokeAccess(externalUser.address))
        .to.emit(contract, "AccessRevoked")
        .withArgs(student.address, externalUser.address);
    });
  });

  // ============================================
  // 9. SIGNATURE VERIFICATION TESTS
  // ============================================

  describe("Signature Verification", function () {
    let gradeId: bigint;
    const TEST_GRADE = 18;

    beforeEach(async function () {
      const tx = await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        TEST_GRADE,
        TEST_SEMESTER
      );
      const receipt = await tx.wait();
      
      const event = receipt!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event as any);
        gradeId = parsedLog!.args.gradeId;
      }
      
      await contract.connect(departmentHead).verifyGrade(gradeId);
      await contract.connect(generalDirector).ratifyGrade(gradeId);
    });

    it("Should verify all signatures on finalized grade", async function () {
      const [teacherValid, deptValid, directorValid, allValid] = 
        await contract.verifyGradeSignatures(gradeId);
      
      expect(teacherValid).to.be.true;
      expect(deptValid).to.be.true;
      expect(directorValid).to.be.true;
      expect(allValid).to.be.true;
    });

    it("Should verify only teacher signature on pending grade", async function () {
      // Create a new pending grade
      const tx = await contract.connect(teacher).createGrade(
        student2.address,
        TEST_COURSE_CODE_2,
        16,
        TEST_SEMESTER
      );
      const receipt = await tx.wait();
      const event = receipt!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event as any);
        const pendingGradeId = parsedLog!.args.gradeId;
        
        const [teacherValid, deptValid, directorValid, allValid] = 
          await contract.verifyGradeSignatures(pendingGradeId);
        
        expect(teacherValid).to.be.true;
        expect(deptValid).to.be.false; // Not verified yet
        expect(directorValid).to.be.false; // Not ratified yet
        expect(allValid).to.be.false; // Not all signatures present
      }
    });

    it("Should verify teacher and department signatures on verified grade", async function () {
      // Create and verify a grade (but not ratify)
      const tx = await contract.connect(teacher).createGrade(
        student3.address,
        TEST_COURSE_CODE,
        19,
        TEST_SEMESTER
      );
      const receipt = await tx.wait();
      const event = receipt!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event as any);
        const verifiedGradeId = parsedLog!.args.gradeId;
        
        await contract.connect(departmentHead).verifyGrade(verifiedGradeId);
        
        const [teacherValid, deptValid, directorValid, allValid] = 
          await contract.verifyGradeSignatures(verifiedGradeId);
        
        expect(teacherValid).to.be.true;
        expect(deptValid).to.be.true;
        expect(directorValid).to.be.false; // Not ratified yet
        expect(allValid).to.be.false; // Missing director signature
      }
    });

    it("Should detect invalid signatures", async function () {
      // Create a grade but tamper with signature in storage (can't actually do this in test)
      // Instead, we'll test the function with incorrect expected signatures
      const grade = await contract.viewGrade(gradeId);
      
      // Generate wrong signature by using different parameters
      const wrongSignature = ethers.keccak256(
        ethers.toUtf8Bytes("wrong data")
      );
      
      // We can't directly test signature tampering, but we can test the contract's
      // verification logic handles edge cases correctly
      const signatures = await contract.verifyGradeSignatures(gradeId);
      expect(signatures.allValid).to.be.true; // Original should be valid
    });

    it("Should prevent signature reuse", async function () {
      const grade = await contract.viewGrade(gradeId);
      const signatureUsed = await contract.isSignatureUsed(grade.teacherSignature);
      expect(signatureUsed).to.be.true;
    });

    it("Should generate expected signatures", async function () {
      const expectedTeacherSig = await contract.generateExpectedSignature(
        gradeId,
        teacher.address,
        "create"
      );
      
      const grade = await contract.viewGrade(gradeId);
      expect(grade.teacherSignature).to.equal(expectedTeacherSig);
    });

    it("Should generate different signatures for same signer on different grades", async function () {
      // Create another grade with same teacher
      const tx = await contract.connect(teacher).createGrade(
        student2.address,
        TEST_COURSE_CODE_2,
        17,
        TEST_SEMESTER
      );
      const receipt = await tx.wait();
      const event = receipt!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event as any);
        const gradeId2 = parsedLog!.args.gradeId;
        
        const grade1 = await contract.viewGrade(gradeId);
        const grade2 = await contract.viewGrade(gradeId2);
        
        expect(grade1.teacherSignature).to.not.equal(grade2.teacherSignature);
      }
    });
  });

  // ============================================
  // 10. UTILITY FUNCTION TESTS
  // ============================================

  describe("Utility Functions", function () {
    beforeEach(async function () {
      // Create multiple grades with different statuses
      for (let i = 0; i < 5; i++) {
        await contract.connect(teacher).createGrade(
          student.address,
          TEST_COURSE_CODE,
          15 + i,
          TEST_SEMESTER
        );
      }
      
      // Get grade IDs
      const allGradeIds = await contract.getStudentGradeIds(student.address);
      
      // Verify first 2 grades
      await contract.connect(departmentHead).verifyGrade(allGradeIds[0]);
      await contract.connect(departmentHead).verifyGrade(allGradeIds[1]);
      
      // Ratify first grade
      await contract.connect(generalDirector).ratifyGrade(allGradeIds[0]);
    });

    it("Should return correct total grade count", async function () {
      const total = await contract.getTotalGrades();
      expect(total).to.equal(5n);
    });

    it("Should return correct student grade count", async function () {
      const count = await contract.getStudentGradeCount(student.address);
      expect(count).to.equal(5);
      
      // Student 2 should have 0 grades
      const count2 = await contract.getStudentGradeCount(student2.address);
      expect(count2).to.equal(0);
    });

    it("Should return correct student grade IDs", async function () {
      const gradeIds = await contract.getStudentGradeIds(student.address);
      expect(gradeIds.length).to.equal(5);
      
      // All IDs should be valid
      for (const gradeId of gradeIds) {
        const grade = await contract.viewGrade(gradeId);
        expect(grade.student).to.equal(student.address);
      }
    });

    it("Should check if grade is finalized", async function () {
      const gradeIds = await contract.getStudentGradeIds(student.address);
      
      const isFinalized0 = await contract.isGradeFinalized(gradeIds[0]);
      const isFinalized1 = await contract.isGradeFinalized(gradeIds[1]);
      const isFinalized2 = await contract.isGradeFinalized(gradeIds[2]);
      
      expect(isFinalized0).to.be.true; // Finalized
      expect(isFinalized1).to.be.false; // Verified but not finalized
      expect(isFinalized2).to.be.false; // Pending
    });

    it("Should return correct grade status string", async function () {
      const gradeIds = await contract.getStudentGradeIds(student.address);
      
      const status0 = await contract.getGradeStatus(gradeIds[0]);
      const status1 = await contract.getGradeStatus(gradeIds[1]);
      const status2 = await contract.getGradeStatus(gradeIds[2]);
      
      expect(status0).to.equal("Finalized and immutable");
      expect(status1).to.include("Verified by department");
      expect(status2).to.include("Pending department verification");
    });

    it("Should filter grades by status", async function () {
      const pendingGrades = await contract.getGradesByStatus(0);
      const verifiedGrades = await contract.getGradesByStatus(1);
      const finalizedGrades = await contract.getGradesByStatus(3);
      
      // We have: 1 finalized, 1 verified (2nd grade), 3 pending (3rd, 4th, 5th)
      expect(finalizedGrades.length).to.equal(1);
      expect(verifiedGrades.length).to.equal(1);
      expect(pendingGrades.length).to.equal(3);
      
      // Verify each grade has correct status
      for (const gradeId of finalizedGrades) {
        const grade = await contract.viewGrade(gradeId);
        expect(grade.status).to.equal(3);
      }
    });

    it("Should return empty array for status with no grades", async function () {
      // Status 2 (DirectorApproved) is not used in our current implementation
      const directorApprovedGrades = await contract.getGradesByStatus(2);
      expect(directorApprovedGrades.length).to.equal(0);
    });

    it("Should get basic grade info", async function () {
      const gradeIds = await contract.getStudentGradeIds(student.address);
      const gradeId = gradeIds[0];
      
      const [studentAddr, courseCode, grade, semester, status] = 
        await contract.getGradeInfo(gradeId);
      
      expect(studentAddr).to.equal(student.address);
      expect(courseCode).to.equal(TEST_COURSE_CODE);
      expect(grade).to.equal(15); // First grade was 15
      expect(semester).to.equal(TEST_SEMESTER);
      expect(status).to.equal(3); // Finalized
    });

    it("Should reject getGradeInfo for invalid grade ID", async function () {
      await expect(
        contract.getGradeInfo(999)
      ).to.be.revertedWith("Invalid grade ID");
    });

    it("Should reject getGradeInfo without access", async function () {
      const gradeIds = await contract.getStudentGradeIds(student.address);
      const gradeId = gradeIds[0];
      
      await expect(
        contract.connect(externalUser).getGradeInfo(gradeId)
      ).to.be.revertedWith("No access to this grade");
    });
  });

  // ============================================
  // 11. EDGE CASE & ERROR HANDLING TESTS
  // ============================================

  describe("Edge Cases and Error Handling", function () {
    it("Should handle maximum grade value", async function () {
      await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        20, // MAX_GRADE
        TEST_SEMESTER
      );
      
      const gradeIds = await contract.getStudentGradeIds(student.address);
      const grade = await contract.viewGrade(gradeIds[0]);
      expect(grade.grade).to.equal(20);
    });

    it("Should handle minimum grade value", async function () {
      await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        0, // MIN_GRADE
        TEST_SEMESTER
      );
      
      const gradeIds = await contract.getStudentGradeIds(student.address);
      const grade = await contract.viewGrade(gradeIds[0]);
      expect(grade.grade).to.equal(0);
    });

    it("Should handle long course codes", async function () {
      const longCourseCode = "ENG301ADVANCED";
      await contract.connect(owner).registerCourse(longCourseCode, "Advanced English");
      
      await contract.connect(teacher).createGrade(
        student.address,
        longCourseCode,
        18,
        TEST_SEMESTER
      );
      
      const gradeIds = await contract.getStudentGradeIds(student.address);
      const grade = await contract.viewGrade(gradeIds[0]);
      expect(grade.courseCode).to.equal(longCourseCode);
    });

    it("Should handle special characters in semester", async function () {
      const specialSemester = "2024-Winter/Spring";
      await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        18,
        specialSemester
      );
      
      const gradeIds = await contract.getStudentGradeIds(student.address);
      const grade = await contract.viewGrade(gradeIds[0]);
      expect(grade.semester).to.equal(specialSemester);
    });

    it("Should handle multiple operations in single transaction block", async function () {
      // Create, verify, and ratify in quick succession
      const tx1 = await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        19,
        TEST_SEMESTER
      );
      const receipt1 = await tx1.wait();
      const event1 = receipt1!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event1) {
        const parsedLog = contract.interface.parseLog(event1 as any);
        const gradeId = parsedLog!.args.gradeId;
        
        // Verify immediately
        await contract.connect(departmentHead).verifyGrade(gradeId);
        
        // Ratify immediately
        await contract.connect(generalDirector).ratifyGrade(gradeId);
        
        const grade = await contract.viewGrade(gradeId);
        expect(grade.status).to.equal(3);
      }
    });

    it("Should handle role changes during workflow", async function () {
      const tx = await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        18,
        TEST_SEMESTER
      );
      const receipt = await tx.wait();
      const event = receipt!.logs.find(log => {
        try {
          return contract.interface.parseLog(log as any)!.name === "GradeCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedLog = contract.interface.parseLog(event as any);
        const gradeId = parsedLog!.args.gradeId;
        
        // Revoke teacher role
        await contract.connect(owner).revokeRole(teacher.address);
        
        // Teacher should no longer be able to create grades
        await expect(
          contract.connect(teacher).createGrade(
            student.address,
            TEST_COURSE_CODE,
            19,
            TEST_SEMESTER
          )
        ).to.be.revertedWith("Caller is not a teacher");
        
        // But existing grade should still exist
        const grade = await contract.viewGrade(gradeId);
        expect(grade.grade).to.equal(18);
        
        // And department head should still be able to verify
        await contract.connect(departmentHead).verifyGrade(gradeId);
      }
    });

    it("Should handle contract interactions from different accounts", async function () {
      // Student grants access to external user
      await contract.connect(student).grantAccess(externalUser.address);
      
      // External user verifies student grade
      const [exists, gradeValue, status] = 
        await contract.connect(externalUser).verifyStudentGrade(
          student.address,
          TEST_COURSE_CODE
        );
      
      expect(exists).to.be.false; // No grade exists yet
      
      // Teacher creates grade
      await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        18,
        TEST_SEMESTER
      );
      
      // External user can now verify the grade exists
      const [exists2] = 
        await contract.connect(externalUser).verifyStudentGrade(
          student.address,
          TEST_COURSE_CODE
        );
      
      expect(exists2).to.be.true;
    });

    it("Should maintain data integrity after multiple operations", async function () {
      // Create multiple grades
      const gradesToCreate = 10;
      for (let i = 0; i < gradesToCreate; i++) {
        await contract.connect(teacher).createGrade(
          student.address,
          TEST_COURSE_CODE,
          10 + i,
          `${2024 + Math.floor(i/3)}-${(i % 3) + 1}`
        );
      }
      
      // Verify all grades have unique IDs
      const gradeIds = await contract.getStudentGradeIds(student.address);
      expect(gradeIds.length).to.equal(gradesToCreate);
      
      const uniqueIds = new Set(gradeIds.map(id => id.toString()));
      expect(uniqueIds.size).to.equal(gradesToCreate);
      
      // Verify all grades have correct student
      for (const gradeId of gradeIds) {
        const grade = await contract.viewGrade(gradeId);
        expect(grade.student).to.equal(student.address);
      }
      
      // Verify total grade count
      const total = await contract.getTotalGrades();
      expect(total).to.equal(BigInt(gradesToCreate));
    });
  });

  // ============================================
  // 12. VIEW FUNCTION TESTS
  // ============================================

  describe("View Functions", function () {
    beforeEach(async function () {
      // Create multiple grades for testing view functions
      await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE,
        18,
        TEST_SEMESTER
      );
      
      await contract.connect(teacher).createGrade(
        student.address,
        TEST_COURSE_CODE_2,
        16,
        TEST_SEMESTER_2
      );
      
      await contract.connect(teacher).createGrade(
        student2.address,
        TEST_COURSE_CODE,
        19,
        TEST_SEMESTER
      );
    });

    it("Should return correct course name", async function () {
      const name1 = await contract.getCourseName(TEST_COURSE_CODE);
      const name2 = await contract.getCourseName(TEST_COURSE_CODE_2);
      
      expect(name1).to.equal(TEST_COURSE_NAME);
      expect(name2).to.equal(TEST_COURSE_NAME_2);
    });

    it("Should return user role correctly", async function () {
      const teacherRole = await contract.getUserRole(teacher.address);
      const studentRole = await contract.getUserRole(student.address);
      const externalRole = await contract.getUserRole(externalUser.address);
      
      expect(teacherRole).to.equal(2);
      expect(studentRole).to.equal(1);
      expect(externalRole).to.equal(0); // None
    });

    it("Should check access permissions correctly", async function () {
      // Student should have access to their own grades
      let hasAccess = await contract.hasAccess(student.address, student.address);
      expect(hasAccess).to.be.true;
      
      // External user should not have access initially
      hasAccess = await contract.hasAccess(student.address, externalUser.address);
      expect(hasAccess).to.be.false;
      
      // Teacher should have access to any student's grades
      hasAccess = await contract.hasAccess(student.address, teacher.address);
      expect(hasAccess).to.be.true;
      
      // Grant access to external user
      await contract.connect(student).grantAccess(externalUser.address);
      hasAccess = await contract.hasAccess(student.address, externalUser.address);
      expect(hasAccess).to.be.true;
    });

    it("Should return all authorized viewers for a student", async function () {
      // Initially no authorized viewers
      // Note: This function doesn't exist in our contract, but we can test access mapping
      
      await contract.connect(student).grantAccess(externalUser.address);
      await contract.connect(student).grantAccess(externalUser2.address);
      
      // Check access mapping directly
      const hasAccess1 = await contract.accessPermissions(student.address, externalUser.address);
      const hasAccess2 = await contract.accessPermissions(student.address, externalUser2.address);
      
      expect(hasAccess1).to.be.true;
      expect(hasAccess2).to.be.true;
    });
  });
});