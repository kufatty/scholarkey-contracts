import React, { useState } from 'react'
import { ethers } from 'ethers'
import { getContract, getContractWithSigner } from '../services/contract'
import { generateSignatureForExistingGrade } from '../utils/signature'

export default function VerificationPanel(){
  const [gradeId, setGradeId] = useState('')
  const [studentForCourse, setStudentForCourse] = useState('')
  const [courseForVerify, setCourseForVerify] = useState('')
  const [output, setOutput] = useState('')

  async function requireMetaMask(){
    if (!(window as any).ethereum) throw new Error('MetaMask not detected')
  }

  async function withSignerAndContract(){
    await requireMetaMask()
    const provider = new ethers.BrowserProvider((window as any).ethereum)
    const signer = await provider.getSigner()
    const contract = await getContractWithSigner()
    if (!contract) throw new Error('Contract not configured')
    return { signer, contract }
  }

  async function onVerifyGrade(){
    try {
      if (!gradeId) throw new Error('Grade ID required')
      const { signer, contract } = await withSignerAndContract()
      const id = parseInt(gradeId, 10)
      setOutput('Generating department head signature...')
      const signature = await generateSignatureForExistingGrade(contract, signer, id, 'verify')
      setOutput('Sending verifyGrade transaction...')
      const tx = await contract.verifyGrade(id, signature)
      await tx.wait()
      setOutput(`Grade verified. Tx: ${tx.hash}`)
    } catch (e: any){
      setOutput('Error: ' + (e?.message || e))
    }
  }

  async function onRatifyGrade(){
    try {
      if (!gradeId) throw new Error('Grade ID required')
      const { signer, contract } = await withSignerAndContract()
      const id = parseInt(gradeId, 10)
      setOutput('Generating director signature...')
      const signature = await generateSignatureForExistingGrade(contract, signer, id, 'ratify')
      setOutput('Sending ratifyGrade transaction...')
      const tx = await contract.ratifyGrade(id, signature)
      await tx.wait()
      setOutput(`Grade ratified. Tx: ${tx.hash}`)
    } catch (e: any){
      setOutput('Error: ' + (e?.message || e))
    }
  }

  async function onVerifySignatures(){
    try {
      if (!gradeId) throw new Error('Grade ID required')
      const contract = await getContract()
      if (!contract) throw new Error('Contract not configured')
      const id = parseInt(gradeId, 10)
      const [teacherValid, deptValid, directorValid, allValid] = await contract.verifyGradeSignatures(id)
      const lines = [
        `Teacher signature: ${teacherValid ? 'VALID' : 'INVALID/Not set'}`,
        `Department signature: ${deptValid ? 'VALID' : 'INVALID/Not set'}`,
        `Director signature: ${directorValid ? 'VALID' : 'INVALID/Not set'}`,
        `All signatures valid: ${allValid ? 'YES' : 'NO'}`
      ]
      setOutput(lines.join('\n'))
    } catch (e: any){
      setOutput('Error: ' + (e?.message || e))
    }
  }

  async function onCheckFinalized(){
    try {
      if (!gradeId) throw new Error('Grade ID required')
      const contract = await getContract()
      if (!contract) throw new Error('Contract not configured')
      const id = parseInt(gradeId, 10)
      const finalized: boolean = await contract.isGradeFinalized(id)
      let text = finalized ? 'Grade is FINALIZED and immutable' : 'Grade is NOT finalized'
      try {
        const status: string = await contract.getGradeStatus(id)
        text += `\nStatus: ${status}`
      } catch {
        // optional
      }
      setOutput(text)
    } catch (e: any){
      setOutput('Error: ' + (e?.message || e))
    }
  }

  async function onGetStatus(){
    try {
      if (!gradeId) throw new Error('Grade ID required')
      const contract = await getContract()
      if (!contract) throw new Error('Contract not configured')
      const id = parseInt(gradeId, 10)
      const status: string = await contract.getGradeStatus(id)
      setOutput(`Status: ${status}`)
    } catch (e: any){
      setOutput('Error: ' + (e?.message || e))
    }
  }

  async function onVerifyStudentGrade(){
    try {
      if (!studentForCourse || !courseForVerify) throw new Error('Student and course required')
      const contract = await getContract()
      if (!contract) throw new Error('Contract not configured')
      const [exists, gradeValue, status] = await contract.verifyStudentGrade(studentForCourse, courseForVerify)
      if (!exists){
        setOutput('No grade found for this course')
        return
      }
      setOutput(`Grade: ${gradeValue.toString()}/20\nStatus: ${status}`)
    } catch (e: any){
      setOutput('Error: ' + (e?.message || e))
    }
  }

  return (
    <div style={{marginTop:24}}>
      <h3>Verification & Signatures</h3>
      <div style={{display:'grid', gap:8}}>
        <label>Grade ID</label>
        <input value={gradeId} onChange={e => setGradeId(e.target.value)} placeholder="Grade ID" />
        <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
          <button onClick={onVerifyGrade}>Verify grade (Dept head)</button>
          <button onClick={onRatifyGrade}>Ratify grade (Director)</button>
        </div>
        <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
          <button onClick={onVerifySignatures}>Verify signatures</button>
          <button onClick={onCheckFinalized}>Check if finalized</button>
          <button onClick={onGetStatus}>Get grade status</button>
        </div>

        <label>Verify student grade for course</label>
        <input value={studentForCourse} onChange={e => setStudentForCourse(e.target.value)} placeholder="Student address" />
        <input value={courseForVerify} onChange={e => setCourseForVerify(e.target.value)} placeholder="Course code" />
        <button onClick={onVerifyStudentGrade}>Verify student grade</button>
      </div>

      {output && (
        <pre style={{marginTop:12, background:'#f1f5f9', padding:12, borderRadius:4, whiteSpace:'pre-wrap'}}>
          {output}
        </pre>
      )}
    </div>
  )
}
