import React, { useState } from 'react'
import { ethers } from 'ethers'
import { generateSignatureForCreate } from '../utils/signature'
import { getContractWithSigner } from '../services/contract'

export default function CreateGrade(){
  const [student, setStudent] = useState('')
  const [course, setCourse] = useState('MAT101')
  const [grade, setGrade] = useState('15')
  const [semester, setSemester] = useState('2024-1')
  const [status, setStatus] = useState<string | null>(null)

  async function submit(e: React.FormEvent){
    e.preventDefault()

    if (!(window as any).ethereum) {
      alert('MetaMask not detected')
      return
    }

    const provider = new ethers.BrowserProvider((window as any).ethereum)
    const signer = await provider.getSigner()
    const contract = await getContractWithSigner()
    if (!contract) { alert('Contract not configured'); return }

    try {
      setStatus('Generating signature...')
      const sig = await generateSignatureForCreate(
        signer as any,
        student,
        course,
        parseInt(grade, 10),
        semester,
        'create'
      )

      setStatus('Sending transaction...')
      const tx = await contract.createGrade(student, course, parseInt(grade, 10), semester, sig)
      await tx.wait()
      setStatus(`Grade created. Tx: ${tx.hash}`)
    } catch (e: any){
      console.error(e)
      setStatus('Error: ' + (e?.message || e))
    }
  }

  return (
    <div>
      <h3>Create Grade</h3>
      <form onSubmit={submit}>
        <label>Student address</label>
        <input value={student} onChange={e => setStudent(e.target.value)} placeholder="0x..." />

        <label>Course code</label>
        <input value={course} onChange={e => setCourse(e.target.value)} />

        <label>Grade (0-20)</label>
        <input value={grade} onChange={e => setGrade(e.target.value)} />

        <label>Semester</label>
        <input value={semester} onChange={e => setSemester(e.target.value)} />

        <button type="submit">Create Grade</button>
      </form>

      {status && <div style={{marginTop:10}}><strong>Status:</strong> {status}</div>}
    </div>
  )
}
