const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  // 1. DEPLOY TOKEN
  const GameToken = await ethers.getContractFactory("GameTokenV2");
  const token = await GameToken.deploy(deployer.address);
  await token.waitForDeployment();
  console.log("✅ Token deployed:", token.target);

  // 2. DEPLOY WEAPON
  const AIWeapon = await ethers.getContractFactory("AIWeapon");
  const weapon = await AIWeapon.deploy(token.target);
  await weapon.waitForDeployment();
  console.log("✅ Weapon deployed:", weapon.target);

  // 3. DEPLOY MONSTER
  const Monster = await ethers.getContractFactory("Monster");
  const monster = await Monster.deploy(weapon.target, token.target);
  await monster.waitForDeployment();
  console.log("✅ Monster deployed:", monster.target);

  // 4. DEPLOY MARKETPLACE (NEW!)
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const market = await Marketplace.deploy(weapon.target, token.target);
  await market.waitForDeployment();
  console.log("✅ Marketplace deployed:", market.target);

  // 5. SETUP
  await token.transferOwnership(monster.target);
  console.log("✅ Economy Live.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
