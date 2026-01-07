const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("--> Testing with account:", signer.address);

  // 1. ATTACH TO CONTRACTS (Using the addresses you provided)
  const monsterAddress = "0x00c15f057BD4e5e3908182B571d4c9CA796Ad098";
  const tokenAddress = "0xd356F687BEFFB2A7c9cEec05CBF84165eFCbB703";
  const weaponAddress = "0x513b7D18ba1463F932665caBeBA8d90651f49a50";
  const WEAPON_ID_TO_TEST = 2; // <--- The ID you are trying to use

  const monster = await hre.ethers.getContractAt("Monster", monsterAddress);
  const token = await hre.ethers.getContractAt("GameToken", tokenAddress);
  const weapon = await hre.ethers.getContractAt("AIWeapon", weaponAddress);

  console.log("\n--- DIAGNOSTICS ---");

  // 2. CHECK WEAPON OWNERSHIP
  try {
    const ownerOfWeapon = await weapon.ownerOf(WEAPON_ID_TO_TEST);
    if (ownerOfWeapon === signer.address) {
      console.log(`✅ SUCCESS: You own Weapon #${WEAPON_ID_TO_TEST}`);
    } else {
      console.log(`❌ FAIL: You DO NOT own Weapon #${WEAPON_ID_TO_TEST}`);
      console.log(`   Owner is: ${ownerOfWeapon}`);
      console.log(`   You are:  ${signer.address}`);
    }
  } catch (e) {
    console.log(`❌ FAIL: Weapon #${WEAPON_ID_TO_TEST} might not exist.`);
  }

  // 3. CHECK IF MONSTER CAN MINT REWARDS
  // (Assuming your Token uses Ownable - adjust if using AccessControl)
  try {
    const tokenOwner = await token.owner();
    if (tokenOwner === monsterAddress) {
      console.log(
        "✅ SUCCESS: Monster contract IS the owner of the Token (can mint)."
      );
    } else {
      console.log("❌ FAIL: Monster contract is NOT the owner of the Token.");
      console.log(`   Token Owner: ${tokenOwner}`);
      console.log(`   Monster Addr: ${monsterAddress}`);
      console.log(
        "   -> If this fails, the attack will revert because Monster can't pay you."
      );
    }
  } catch (e) {
    console.log(
      "⚠️ WARNING: Could not check Token owner (maybe AccessControl is used instead of Ownable)."
    );
  }

  // 4. ATTEMPT THE ATTACK
  console.log("\n--- ATTEMPTING ATTACK ---");
  try {
    // We estimate gas first to catch the specific revert reason
    await monster.attack.estimateGas(WEAPON_ID_TO_TEST);
    console.log("✅ Simulation Passed! The transaction should succeed.");

    // If simulation passes, let's try the real thing
    // const tx = await monster.attack(WEAPON_ID_TO_TEST);
    // await tx.wait();
    // console.log("Attack Executed on-chain.");
  } catch (error) {
    console.log("❌ TRANSACTION REVERTED");
    // This digs out the actual error message
    if (error.reason) console.log("REASON:", error.reason);
    else if (error.message) console.log("MESSAGE:", error.message);
    else console.log(error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
