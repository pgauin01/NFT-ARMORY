const { ethers } = require("hardhat");

async function main() {
  // PASTE YOUR EXISTING ADDRESSES HERE
  const WEAPON_ADDRESS = "0x9c385BdF2330D1c4b1D23baf5118B4E5A0741fac"; // <--- Paste from App.jsx
  const TOKEN_ADDRESS = "0xA39F0F97ebD816FBde2bc7fa73a5EfF3F5f2E680"; // <--- Paste from App.jsx

  const Monster = await ethers.getContractFactory("Monster");

  // Pass them into deploy()
  const monster = await Monster.deploy(WEAPON_ADDRESS, TOKEN_ADDRESS);

  await monster.waitForDeployment();
  console.log("✅ NEW Monster deployed:", monster.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
