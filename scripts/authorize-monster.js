const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // --- 1. DEPLOY TOKEN V2 ---
  console.log("\n1. Deploying GameTokenV2...");
  const GameToken = await hre.ethers.getContractFactory("GameTokenV2");
  // Pass deployer address as initialOwner
  const token = await GameToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`✅ GameTokenV2 deployed to: ${tokenAddress}`);

  // --- 2. DEPLOY MONSTER ---
  // (We use the existing AIWeapon address you shared previously)
  const WEAPON_ADDRESS = "0x513b7D18ba1463F932665caBeBA8d90651f49a50";

  console.log("\n2. Deploying Monster...");
  const Monster = await hre.ethers.getContractFactory("Monster");
  // Pass the Weapon Address AND the NEW Token Address
  const monster = await Monster.deploy(WEAPON_ADDRESS, tokenAddress);
  await monster.waitForDeployment();
  const monsterAddress = await monster.getAddress();
  console.log(`✅ Monster deployed to: ${monsterAddress}`);

  // --- 3. AUTHORIZE MONSTER ---
  console.log("\n3. Transferring Token Ownership to Monster...");
  // This allows the Monster to call .mint()
  const tx = await token.transferOwnership(monsterAddress);
  await tx.wait();
  console.log("✅ Ownership transferred! Monster can now mint rewards.");

  console.log("\n--- UPDATE YOUR FRONTEND ---");
  console.log("Update App.jsx with these new addresses:");
  console.log(`MONSTER_ADDRESS = "${monsterAddress}";`);
  console.log(`TOKEN_ADDRESS   = "${tokenAddress}";`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
