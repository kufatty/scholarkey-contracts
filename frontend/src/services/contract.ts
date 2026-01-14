import { ethers } from 'ethers'
import ABI from '../abis/AcademicVerificationSystem.json'

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || ''

export async function getProvider(){
  if ((window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum)
  }
  return ethers.getDefaultProvider()
}

export async function getContract(){
  const provider = await getProvider()
  if (!CONTRACT_ADDRESS) return null
  return new ethers.Contract(CONTRACT_ADDRESS, ABI.abi || ABI, provider) as any
}

export async function getContractWithSigner(){
  if (!(window as any).ethereum) return null
  const provider = new ethers.BrowserProvider((window as any).ethereum)
  const signer = await provider.getSigner()
  if (!CONTRACT_ADDRESS) return null
  return new ethers.Contract(CONTRACT_ADDRESS, ABI.abi || ABI, signer) as any
}
