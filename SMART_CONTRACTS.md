# SMART CONTRACTS

## Contract Ecosystem

The protocol consists of five interlocking smart contracts that manage the game's economy, assets, and rules.

### 1. `GameTokenV2.sol` (ERC-20)
The native currency of the game, `$GOLD`.
- **Role:** Reward currency and medium of exchange.
- **Permissions:** Only the `Monster.sol` contract (assigned as the Owner) has the authority to `mint()` new tokens into circulation.
- **Burn Mechanism:** Tokens are effectively burned or locked when spent on weapon upgrades or PvP arena fees.

### 2. `AIWeapon.sol` (ERC-721)
The dynamic NFT contract storing player weapons.
- **Role:** Stores all weapon data completely on-chain (Name, Lore, Level, and SVG code) using Base64 encoding. No IPFS or external servers are used.
- **Key Functions:**
  - `mintAIWeapon()`: Creates a new token.
  - `upgradeWeapon()`: Deducts `$GOLD` from the player and increments the weapon's `level` attribute on-chain, dynamically updating its `tokenURI`.

### 3. `Monster.sol` (PvE Engine)
The core decentralized game engine for Player vs. Environment combat.
- **Role:** Manages the active global Boss, tracks its Health Points (HP), calculates damage, and distributes `$GOLD`.
- **Mechanics:** - Validates that the caller actually owns the weapon they are attacking with.
  - Calculates damage based on the formula: `Base Damage (10) + (Weapon Level * 5)`.
  - Automatically mints `$GOLD` to the player and spawns a new Boss when HP reaches zero.

### 4. `PvPArena.sol` (PvP Engine)
The trustless matchmaking and wagering system.
- **Role:** Allows players to stake `$GOLD` in a winner-takes-all deathmatch.
- **Mechanics:**
  - Players create lobbies by locking 50 `$GOLD` and designating an equipped weapon.
  - Opponents join by matching the 50 `$GOLD` stake.
  - The contract immediately calculates the winner using weapon levels and pseudo-random luck `((Level * 10) + Roll(0-99))`.
  - Distributes the 100 `$GOLD` pot instantly.

### 5. `Marketplace.sol` (Escrow & Trade)
A decentralized exchange for weapons.
- **Role:** Allows players to list AIWeapons for sale, priced in `$GOLD`.
- **Mechanics:** Uses `ReentrancyGuard` to securely transfer the NFT from seller to buyer and `$GOLD` from buyer to seller in a single atomic transaction.
