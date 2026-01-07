const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. DEPLOY TOKEN (GameTokenV2)
  console.log("\n--- 1. Deploying Token ---");
  const GameToken = await hre.ethers.getContractFactory("GameTokenV2");
  const token = await GameToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`✅ Token deployed to: ${tokenAddress}`);

  // 2. DEPLOY WEAPON (AIWeapon)
  console.log("\n--- 2. Deploying Weapon ---");
  const AIWeapon = await hre.ethers.getContractFactory("AIWeapon");
  const weapon = await AIWeapon.deploy(tokenAddress);
  await weapon.waitForDeployment();
  const weaponAddress = await weapon.getAddress();
  console.log(`✅ Weapon deployed to: ${weaponAddress}`);

  // 3. DEPLOY MONSTER (Monster)
  console.log("\n--- 3. Deploying Monster ---");
  const Monster = await hre.ethers.getContractFactory("Monster");
  const monster = await Monster.deploy(weaponAddress, tokenAddress);
  await monster.waitForDeployment();
  const monsterAddress = await monster.getAddress();
  console.log(`✅ Monster deployed to: ${monsterAddress}`);

  // 4. DEPLOY MARKETPLACE
  console.log("\n--- 4. Deploying Marketplace ---");
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const market = await Marketplace.deploy(weaponAddress, tokenAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log(`✅ Marketplace deployed to: ${marketAddress}`);

  // 5. SETUP PERMISSIONS (Crucial!)
  console.log("\n--- 5. Authorizing Monster ---");
  const tx = await token.transferOwnership(monsterAddress);
  await tx.wait();
  console.log("✅ Ownership transferred! Monster can now mint rewards.");

  console.log("\n=================================================");
  console.log("COPY THESE ADDRESSES INTO YOUR FRONTEND (App.jsx):");
  console.log("=================================================");
  console.log(`TOKEN_ADDRESS   = "${tokenAddress}";`);
  console.log(`WEAPON_ADDRESS  = "${weaponAddress}";`);
  console.log(`MONSTER_ADDRESS = "${monsterAddress}";`);
  console.log(`MARKET_ADDRESS  = "${marketAddress}";`);
  console.log("=================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
