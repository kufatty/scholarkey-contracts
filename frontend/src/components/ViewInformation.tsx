import React, { useState } from "react";
import { ethers } from "ethers";
import { getContract, getContractWithSigner } from "../services/contract";

export default function ViewInformation() {
  const [output, setOutput] = useState<string>("");

  async function requireMetaMask() {
    if (!(window as any).ethereum) throw new Error("MetaMask not detected");
  }

  async function onMyRole() {
    try {
      await requireMetaMask();
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const contract = await getContractWithSigner();
      if (!contract) throw new Error("Contract not configured");
      const role: bigint = await contract.getUserRole(addr);
      const roleIndex = Number(role);
      const roleNames = [
        "None",
        "Student",
        "Teacher",
        "DepartmentHead",
        "GeneralDirector",
      ];
      setOutput(
        `Your role: ${roleNames[roleIndex] || "Unknown"} (${roleIndex})`
      );
    } catch (e: any) {
      setOutput("Error: " + (e?.message || e));
    }
  }

  async function onTotalGrades() {
    try {
      const contract = await getContract();
      if (!contract) throw new Error("Contract not configured");
      const total: bigint = await contract.getTotalGrades();
      setOutput(`Total grades in system: ${total.toString()}`);
    } catch (e: any) {
      setOutput("Error: " + (e?.message || e));
    }
  }

  async function onViewGradeById(id: string) {
    try {
      if (!id) throw new Error("Grade ID required");
      await requireMetaMask();
      const contract = await getContractWithSigner();
      if (!contract) throw new Error("Contract not configured");
      const gradeId = parseInt(id, 10);
      const [student, courseCode, grade, semester, status] =
        await contract.getGradeInfo(gradeId);
      setOutput(
        `Grade ${gradeId}\nStudent: ${student}\nCourse: ${courseCode}\nGrade: ${grade.toString()}/20\nSemester: ${semester}\nStatus: ${status}`
      );
    } catch (e: any) {
      setOutput("Error: " + (e?.message || e));
    }
  }

  async function onViewMyGrades() {
    try {
      await requireMetaMask();
      const contract = await getContractWithSigner();
      if (!contract) throw new Error("Contract not configured");
      const grades = await contract.viewMyGrades();
      if (!grades.length) {
        setOutput("No grades found for your account");
        return;
      }
      const lines = grades.map(
        (g: any, i: number) =>
          `${i + 1}. ${
            g.courseCode
          } - ${g.grade.toString()}/20 (ID ${g.id.toString()}, ${g.semester}, ${
            g.status
          })`
      );
      setOutput(lines.join("\n"));
    } catch (e: any) {
      setOutput("Error: " + (e?.message || e));
    }
  }

  async function onViewStudentGrades(student: string) {
    try {
      if (!student) throw new Error("Student address required");
      await requireMetaMask();
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const viewer = await signer.getAddress();
      const contract = await getContract();
      if (!contract) throw new Error("Contract not configured");

      const hasAccess: boolean = await contract.hasAccess(student, viewer);
      if (!hasAccess) {
        setOutput("You don't have access to this student's grades");
        return;
      }

      const grades = await contract.viewStudentGrades(student);
      if (!grades.length) {
        setOutput("No grades found for this student");
        return;
      }

      const lines = grades.map(
        (g: any, i: number) =>
          `${i + 1}. ${
            g.courseCode
          } - ${g.grade.toString()}/20 (ID ${g.id.toString()}, ${g.semester}, ${
            g.status
          })`
      );
      setOutput(lines.join("\n"));
    } catch (e: any) {
      setOutput("Error: " + (e?.message || e));
    }
  }

  async function onListGradeIds() {
    try {
      const contract = await getContract();
      if (!contract) throw new Error("Contract not configured");
      const ids: bigint[] = await contract.getAllGradeIds();
      if (!ids.length) {
        setOutput("No grades in system");
        return;
      }
      setOutput("Grade IDs: " + ids.map((id) => id.toString()).join(", "));
    } catch (e: any) {
      setOutput("Error: " + (e?.message || e));
    }
  }

  async function onListStudents() {
    try {
      const contract = await getContract();
      if (!contract) throw new Error("Contract not configured");
      const students: string[] = await contract.getAllStudentsWithGrades();
      if (!students.length) {
        setOutput("No students with grades");
        return;
      }
      setOutput(students.join("\n"));
    } catch (e: any) {
      setOutput("Error: " + (e?.message || e));
    }
  }

  async function onListCourses() {
    try {
      const contract = await getContract();
      if (!contract) throw new Error("Contract not configured");
      const courses: string[] = await contract.getAllCourseCodes();
      if (!courses.length) {
        setOutput("No courses registered in contract");
        return;
      }
      const lines: string[] = [];
      for (const code of courses) {
        const name: string = await contract.getCourseName(code);
        lines.push(`${code}: ${name}`);
      }
      setOutput(lines.join("\n"));
    } catch (e: any) {
      setOutput("Error: " + (e?.message || e));
    }
  }

  const [gradeIdInput, setGradeIdInput] = useState("");
  const [studentForView, setStudentForView] = useState("");

  return (
    <div style={{ marginTop: 24 }}>
      <h3>View Information</h3>
      <div style={{ display: "grid", gap: 8 }}>
        <button onClick={onMyRole}>Check my role</button>
        <button onClick={onTotalGrades}>View total grades</button>

        <div>
          <label>View grade by ID</label>
          <input
            value={gradeIdInput}
            onChange={(e) => setGradeIdInput(e.target.value)}
            placeholder="Grade ID"
          />
          <button onClick={() => onViewGradeById(gradeIdInput)}>
            View grade
          </button>
        </div>

        <button onClick={onViewMyGrades}>View all my grades</button>

        <div>
          <label>View all grades for a student</label>
          <input
            value={studentForView}
            onChange={(e) => setStudentForView(e.target.value)}
            placeholder="Student address"
          />
          <button onClick={() => onViewStudentGrades(studentForView)}>
            View student grades
          </button>
        </div>

        <button onClick={onListGradeIds}>List all grade IDs</button>
        <button onClick={onListStudents}>List students with grades</button>
        <button onClick={onListCourses}>List available courses</button>
      </div>

      {output && (
        <pre
          style={{
            marginTop: 12,
            background: "#f1f5f9",
            padding: 12,
            borderRadius: 4,
            whiteSpace: "pre-wrap",
          }}
        >
          {output}
        </pre>
      )}
    </div>
  );
}
