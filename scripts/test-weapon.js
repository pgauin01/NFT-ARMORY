const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();

  // 1. Deploy
  const WeaponNFT = await ethers.getContractFactory("OnChainWeapon");
  const contract = await WeaponNFT.deploy();
  await contract.waitForDeployment();
  console.log("🔫 Contract Deployed to", contract.target);

  // 2. Mint
  console.log("Minting Weapon #0...");
  await contract.mint();

  // Check initial state
  let uri = await contract.tokenURI(0);
  let level = await contract.weaponLevels(0);
  console.log(`[Level ${level}] URI: ${uri}`); // Should be Rusty Gun

  // 3. LEVEL UP
  console.log("\n🆙 Leveling Up Weapon #0...");
  await contract.levelUp(0);

  // Check new state
  uri = await contract.tokenURI(0);
  level = await contract.weaponLevels(0);
  console.log(`[Level ${level}] URI: ${uri}`); // Should be Golden Gun
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
