const { ethers } = require("hardhat");

async function main() {
  const AIWeapon = await ethers.getContractFactory("AIWeapon");

  // ⚠️ REPLACE THIS WITH YOUR REAL TOKEN ADDRESS FROM deploy-economy.js
  const TOKEN_ADDRESS = "0xA39F0F97ebD816FBde2bc7fa73a5EfF3F5f2E680";

  console.log(`🤖 Deploying AIWeapon linked to Token: ${TOKEN_ADDRESS}...`);

  // ✅ FIX: Pass the address into deploy()
  const contract = await AIWeapon.deploy(TOKEN_ADDRESS);

  await contract.waitForDeployment();

  console.log(`✅ AIWeapon deployed to: ${contract.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
