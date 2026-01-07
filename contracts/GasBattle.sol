// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract GasBattle {
    // ------------------------------------
    // ROUND 1: The "Noob" Layout (Inefficient)
    // ------------------------------------
    // 3 separate slots because of bad ordering
    struct NoobPlayer {
        uint128 hp;      // Slot 0 (16 bytes)
        uint256 id;      // Slot 1 (32 bytes) - Doesn't fit in Slot 0!
        uint128 mana;    // Slot 2 (16 bytes)
    }

    NoobPlayer public noob;

    function createNoob() public {
        noob = NoobPlayer(100, 12345, 50);
    }

    // ------------------------------------
    // ROUND 2: The "Pro" Layout (Optimized)
    // ------------------------------------
    // 2 slots because we played Tetris correctly
    struct ProPlayer {
        uint128 hp;      // Slot 0 (16 bytes)
        uint128 mana;    // Slot 0 (16 bytes) - Fits perfectly!
        uint256 id;      // Slot 1 (32 bytes)
    }

    ProPlayer public pro;

    function createPro() public {
        pro = ProPlayer(100, 50, 12345);
    }
}