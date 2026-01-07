// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AIWeapon.sol";
import "./GameTokenV2.sol";

contract Monster {
    AIWeapon public weaponContract;
    GameTokenV2 public tokenContract;

    // --- NEW: DYNAMIC MONSTER STATS ---
    string public monsterName;
    uint256 public maxHP;
    uint256 public currentHP;
    uint256 public goldReward;

    event Attack(address indexed player, uint256 damageDealt, uint256 monsterHPRemaining);
    event RewardLog(address indexed player, uint256 goldEarned);
    event MonsterSpawned(string name, uint256 hp);

    constructor(address _weaponAddress, address _tokenAddress) {
        weaponContract = AIWeapon(_weaponAddress);
        tokenContract = GameTokenV2(_tokenAddress);
        spawnNewMonster(); // Spawn first monster
    }

    // --- THE RANDOM SPAWNER ---
    function spawnNewMonster() internal {
        // Pseudo-random number generator (Good enough for games)
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.number)));
        uint256 roll = seed % 100; // 0 to 99

        if (roll < 50) {
            // 50% Chance: Weak Goblin
            monsterName = "Radioactive Goblin";
            maxHP = 40;
            goldReward = 5 * 10**18;
        } else if (roll < 85) {
            // 35% Chance: Mecha Orc
            monsterName = "Mecha Orc";
            maxHP = 120;
            goldReward = 15 * 10**18;
        } else {
            // 15% Chance: ELDER CYBER DRAGON
            monsterName = "ELDER CYBER DRAGON";
            maxHP = 400;
            goldReward = 100 * 10**18;
        }

        currentHP = maxHP;
        emit MonsterSpawned(monsterName, maxHP);
    }

    function attackMonster(uint256 weaponId) public {
        require(weaponContract.ownerOf(weaponId) == msg.sender, "Not your weapon");
        require(currentHP > 0, "Monster is already dead");

        // Calculate Damage (Base 10 + (Level * 5))
        // We read the stats from the Weapon Contract
        (,, uint256 level, ) = weaponContract.weaponStats(weaponId);
        uint256 damage = 10 + (level * 5);

        if (damage >= currentHP) {
            currentHP = 0;
            
            // PAY THE PLAYER
            tokenContract.mint(msg.sender, goldReward);
            emit RewardLog(msg.sender, goldReward);
            
            // SPAWN NEXT MONSTER
            spawnNewMonster();
        } else {
            currentHP -= damage;
        }

        emit Attack(msg.sender, damage, currentHP);
    }
}