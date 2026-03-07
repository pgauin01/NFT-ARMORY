# GAMEPLAY

## The Core Gameplay Loop

The GenAI GameFi Armory relies on a continuous circular economy and progression system.

### Phase 1: The Forge (Creation)
Players begin by using the **Neural Weapon Forge**. By providing a simple text prompt, the AI backend generates a fully unique, SVG-based weapon along with its lore and base stats. The player pays the network gas fee to mint this creation permanently to the blockchain.

### Phase 2: The Armory (Preparation)
Players view their minted inventory in the Armory. Weapons are categorized by their on-chain Level (starting at Level 0). A player must explicitly **Equip** a weapon to make it their active armament for combat operations.

### Phase 3: The Arena (Combat & Earning)
With a weapon equipped, players enter the **Boss Arena**. 
- **Attacking:** Clicking "Attack Boss" sends a transaction to the `Monster.sol` contract. 
- **Damage Output:** Higher-level weapons deal more damage per transaction.
- **Rewards:** Landing the killing blow on the global boss rewards the player with a bounty of `$GOLD`. Bosses scale dynamically (e.g., Radioactive Goblins vs. Elder Cyber Dragons), offering varying HP pools and `$GOLD` bounties.

### Phase 4: The Upgrade Path (Progression)
To take down stronger bosses faster, players reinvest their earned `$GOLD`. 
- **Leveling Up:** Players spend 10 `$GOLD` in the Armory to upgrade an equipped weapon.
- **Dynamic Metadata:** The smart contract updates the weapon's metadata directly. The Level increases, instantly improving its damage multiplier for all future battles.

### Phase 5: High Stakes & Trading (Endgame)
Advanced players can engage in the endgame economy:
- **Global Market:** List highly-leveled weapons on the Marketplace to sell to new players for massive `$GOLD` profits.
- **PvP Arena:** Risk `$GOLD` in the High Stakes Arena. Players wager against each other, relying on their upgraded weapon levels and a slight RNG factor to take home the entire prize pot.
