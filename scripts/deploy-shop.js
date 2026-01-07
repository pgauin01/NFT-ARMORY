const { ethers } = require("hardhat");

async function main() {
  const [owner, buyer] = await ethers.getSigners();

  // --- DEPLOYMENT ---
  // 1. Deploy the Token
  const GameToken = await ethers.getContractFactory("GameToken");
  const token = await GameToken.deploy();
  await token.waitForDeployment();
  console.log(`🪙  Token deployed to: ${token.target}`);

  // 2. Deploy the Machine (telling it the Token address)
  const VendingMachine = await ethers.getContractFactory("VendingMachine");
  const machine = await VendingMachine.deploy(token.target);
  await machine.waitForDeployment();
  console.log(`🤖 Machine deployed to: ${machine.target}`);

  // --- SETUP ---
  // 3. Restock the Machine
  // The 'owner' currently holds all 1,000,000 tokens. Let's put 1,000 in the machine.
  // We use ethers.parseEther("1000") to handle the 18 decimals automatically.
  const amountToStock = ethers.parseEther("1000");
  await token.transfer(machine.target, amountToStock);
  console.log("📦 Machine Restocked with 1000 AMMO\n");

  // --- ACTION ---
  // 4. Buyer purchases tokens
  // Buying 1 ETH worth of tokens
  console.log("--------------- STARTING TRADE ---------------");
  console.log(
    "Buyer ETH Balance (Before):",
    await ethers.provider.getBalance(buyer.address)
  );

  // The buyer calls the function and sends 1 ETH along with it
  const tx = await machine.connect(buyer).buyAmmo({
    value: ethers.parseEther("1.0"),
  });
  await tx.wait();

  console.log("✅ Purchase Complete!");

  // Check Balances
  const buyerTokenBalance = await token.balanceOf(buyer.address);
  console.log("Buyer AMMO Balance:", ethers.formatEther(buyerTokenBalance));

  const machineEthBalance = await ethers.provider.getBalance(machine.target);
  console.log("Machine ETH Balance:", ethers.formatEther(machineEthBalance));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
