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
