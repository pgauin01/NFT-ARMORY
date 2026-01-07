const { ethers } = require("hardhat");

async function main() {
  // 1. Setup
  const GasBattle = await ethers.getContractFactory("GasBattle");
  const contract = await GasBattle.deploy();
  await contract.waitForDeployment(); // Updated for newer Hardhat versions

  console.log("🔥 Gas Battle Arena Open! 🔥\n");

  // 2. Round 1: The Noob Transaction
  const tx1 = await contract.createNoob();
  const receipt1 = await tx1.wait();
  const gasNoob = receipt1.gasUsed;

  console.log(`❌ Noob Create (3 Slots): ${gasNoob.toString()} gas`);

  // 3. Round 2: The Pro Transaction
  const tx2 = await contract.createPro();
  const receipt2 = await tx2.wait();
  const gasPro = receipt2.gasUsed;

  console.log(`✅ Pro Create  (2 Slots): ${gasPro.toString()} gas`);

  // 4. The Results
  const savings = gasNoob - gasPro;
  console.log(`\n💰 Total Savings: ${savings.toString()} gas`);
  console.log(`(That's roughly 1 extra SSTORE operation saved!)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
