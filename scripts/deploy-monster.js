const { ethers } = require("hardhat");

async function main() {
  // PASTE YOUR EXISTING ADDRESSES HERE
  const WEAPON_ADDRESS = "0x513b7D18ba1463F932665caBeBA8d90651f49a50"; // <--- Paste from App.jsx
  const TOKEN_ADDRESS = "0xd356F687BEFFB2A7c9cEec05CBF84165eFCbB703"; // <--- Paste from App.jsx

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
