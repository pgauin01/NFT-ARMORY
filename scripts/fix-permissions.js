const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();

  // Addresses from your App.jsx
  const MONSTER_ADDRESS = "0x08789d202f78851F31f33E4A22DE32A7cc7C0033";
  const TOKEN_ADDRESS = "0x1b196c8634c629823435A6e84a426124D69970e0";

  console.log(`Using Account: ${signer.address}`);
  console.log(`Checking permissions for Token: ${TOKEN_ADDRESS}`);

  // Connect to the Token Contract
  const token = await hre.ethers.getContractAt("GameTokenV2", TOKEN_ADDRESS);

  // Check current owner
  const currentOwner = await token.owner();
  console.log(`Current Token Owner: ${currentOwner}`);

  if (currentOwner.toLowerCase() === MONSTER_ADDRESS.toLowerCase()) {
    console.log("✅ Monster is ALREADY the owner. The error is elsewhere.");
    return;
  }

  // Transfer Ownership
  console.log("⚠️ Transferring ownership to Monster...");
  const tx = await token.transferOwnership(MONSTER_ADDRESS);
  await tx.wait();

  console.log("🎉 SUCCESS! Monster can now mint rewards.");
  console.log("Try attacking again - you should get your loot!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
