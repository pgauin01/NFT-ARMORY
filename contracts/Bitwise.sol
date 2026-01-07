// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract BitMasking {
    // One single integer to hold up to 256 boolean flags!
    uint256 public playerFlags;

    // We define constants to map human names to bit positions
    uint256 constant IS_ALIVE = 1 << 0;       // ...000001 (1)
    uint256 constant HAS_GOLDEN_GUN = 1 << 1; // ...000010 (2)
    uint256 constant IS_POISONED = 1 << 2;    // ...000100 (4)

    // 1. Turn a flag ON (OR operation)
    // "Take whatever flags we have, OR combine them with the new one"
    function setPoisoned() public {
        playerFlags = playerFlags | IS_POISONED;
    }

    // 2. Check a flag (AND operation)
    // "If we filter ONLY the Poison bit, is the result non-zero?"
    function checkPoisoned() public view returns (bool) {
        return (playerFlags & IS_POISONED) == IS_POISONED;
    }

    // 3. Toggle multiple at once (Combo!)
    // Revive player AND give them the gun in one go
    function respawnWithGun() public {
        playerFlags = playerFlags | IS_ALIVE | HAS_GOLDEN_GUN;
    }
}