const { ethers } = require("hardhat");

async function main() {
  // 1. Get the Contract Factory
  // Make sure the name inside getContractFactory matches the class name in your Solidity file
  const AIWeapon = await ethers.getContractFactory("AIWeapon");

  console.log("🤖 Deploying AIWeapon contract...");

  // 2. Deploy
  const contract = await AIWeapon.deploy();

  // 3. Wait for it to finish
  await contract.waitForDeployment();

  // 4. Log the address
  console.log(`✅ AIWeapon deployed to: ${contract.target}`);
  console.log("👉 Copy this address into your React App.jsx!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
