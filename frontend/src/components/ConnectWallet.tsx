import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function ConnectWallet() {
  const [addr, setAddr] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
    }
  }, []);

  async function connect() {
    if (!window.ethereum) {
      alert("MetaMask not detected");
      return;
    }

    try {
      const targetChainId = "0x539"; // 1337 in hex

      // Try to switch to the local Quorum/Hardhat network
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetChainId }],
        });
      } catch (switchError: any) {
        // If the chain is not added yet, request to add it
        if (switchError?.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetChainId,
                chainName: "Quorum Local (1337)",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const p = new ethers.BrowserProvider(window.ethereum);
      setProvider(p);
      const signer = await p.getSigner();
      const a = await signer.getAddress();
      setAddr(a);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div>
      <strong>Wallet:</strong>
      {addr ? (
        <div>
          <div>{addr}</div>
          <div style={{ marginTop: 8 }}>Connected</div>
        </div>
      ) : (
        <div>
          <button onClick={connect}>Connect MetaMask</button>
        </div>
      )}
    </div>
  );
}
