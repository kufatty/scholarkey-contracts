import React, { useState } from 'react'
import { ethers } from 'ethers'
import { getContract, getContractWithSigner } from '../services/contract'

export default function AccessManagement(){
  const [output, setOutput] = useState('')
  const [target, setTarget] = useState('')

  async function requireMetaMask(){
    if (!(window as any).ethereum) throw new Error('MetaMask not detected')
  }

  async function onGrant(){
    try {
      await requireMetaMask()
      const contract = await getContractWithSigner()
      if (!contract) throw new Error('Contract not configured')
      if (!target) throw new Error('Viewer address required')
      setOutput('Granting access...')
      const tx = await contract.grantAccess(target)
      await tx.wait()
      setOutput(`Access granted. Tx: ${tx.hash}`)
    } catch (e: any){
      setOutput('Error: ' + (e?.message || e))
    }
  }

  async function onRevoke(){
    try {
      await requireMetaMask()
      const contract = await getContractWithSigner()
      if (!contract) throw new Error('Contract not configured')
      if (!target) throw new Error('Viewer address required')
      setOutput('Revoking access...')
      const tx = await contract.revokeAccess(target)
      await tx.wait()
      setOutput(`Access revoked. Tx: ${tx.hash}`)
    } catch (e: any){
      setOutput('Error: ' + (e?.message || e))
    }
  }

  async function onViewGrantedList(){
    try {
      await requireMetaMask()
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      const owner = await signer.getAddress()
      const contract = await getContract()
      if (!contract) throw new Error('Contract not configured')
      const granted: string[] = await contract.getGrantedAccessList(owner)
      if (!granted.length){
        setOutput('No one has been granted access to your grades')
        return
      }
      setOutput(granted.map((a, i) => `${i + 1}. ${a}`).join('\n'))
    } catch (e: any){
      setOutput('Error: ' + (e?.message || e))
    }
  }

  const [studentToCheck, setStudentToCheck] = useState('')

  async function onCheckAccess(){
    try {
      if (!studentToCheck) throw new Error('Student address required')
      await requireMetaMask()
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      const viewer = await signer.getAddress()
      const contract = await getContract()
      if (!contract) throw new Error('Contract not configured')
      const hasAccess: boolean = await contract.hasAccess(studentToCheck, viewer)
      if (hasAccess){
        const count: bigint = await contract.getStudentGradeCount(studentToCheck)
        setOutput(`You HAVE access. Student has ${count.toString()} grade(s).`)
      } else {
        setOutput("You do NOT have access to this student's grades.")
      }
    } catch (e: any){
      setOutput('Error: ' + (e?.message || e))
    }
  }

  return (
    <div style={{marginTop:24}}>
      <h3>Access Management</h3>
      <div style={{display:'grid', gap:8}}>
        <label>Address to grant/revoke access</label>
        <input value={target} onChange={e => setTarget(e.target.value)} placeholder="0x viewer address" />
        <div style={{display:'flex', gap:8}}>
          <button onClick={onGrant}>Grant access</button>
          <button onClick={onRevoke}>Revoke access</button>
        </div>

        <button onClick={onViewGrantedList}>View who has access to my grades</button>

        <label>Check if I have access to a student</label>
        <input value={studentToCheck} onChange={e => setStudentToCheck(e.target.value)} placeholder="Student address" />
        <button onClick={onCheckAccess}>Check access</button>
      </div>

      {output && (
        <pre style={{marginTop:12, background:'#f1f5f9', padding:12, borderRadius:4, whiteSpace:'pre-wrap'}}>
          {output}
        </pre>
      )}
    </div>
  )
}
