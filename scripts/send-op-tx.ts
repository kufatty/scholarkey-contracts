import { ethers, network } from "hardhat";

async function main() {
  // Use ethers from Hardhat directly. Network selection should be done via Hardhat config/CLI.

  console.log("Sending transaction using the OP chain type");

  const [sender] = await ethers.getSigners();

  console.log("Sending 1 wei from", sender.address, "to itself");

  console.log("Sending L2 transaction");
  const tx = await sender.sendTransaction({
    to: sender.address,
    value: 1n,
  });

  await tx.wait();

  console.log("Transaction sent successfully");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
