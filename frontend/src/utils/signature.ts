import { ethers } from 'ethers'

// This utility mirrors the Node script: it packs the values, keccak256s them and signs the bytes
export async function generateSignatureForCreate(
  signer: any,
  student: string,
  courseCode: string,
  grade: number,
  semester: string,
  action: string
){
  if (!signer) throw new Error('No signer available')

  const message = ethers.solidityPackedKeccak256(
    ["address", "string", "uint256", "string", "address", "string", "string"],
    [student, courseCode, grade, semester, await signer.getAddress(), action, "UCAB Academic Verification System"]
  )

  const messageBytes = ethers.getBytes(message)
  const signature = await signer.signMessage(messageBytes)
  return signature
}

// Signature for an existing gradeId (used for verify/ratify)
export async function generateSignatureForExistingGrade(
  contract: any,
  signer: any,
  gradeId: number,
  action: string
){
  if (!signer) throw new Error('No signer available')
  if (!contract) throw new Error('No contract available')

  const gradeRecord = await contract.viewGrade(gradeId)

  const message = ethers.solidityPackedKeccak256(
    ["address", "string", "uint256", "string", "address", "string", "string"],
    [
      gradeRecord.student,
      gradeRecord.courseCode,
      gradeRecord.grade,
      gradeRecord.semester,
      await signer.getAddress(),
      action,
      "UCAB Academic Verification System"
    ]
  )

  const messageBytes = ethers.getBytes(message)
  const signature = await signer.signMessage(messageBytes)
  return signature
}
