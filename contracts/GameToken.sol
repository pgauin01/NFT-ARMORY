// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GameToken is ERC20 {
    // Constructor runs once when you deploy
    constructor() ERC20("GameAmmo", "AMMO") {
        // Mint 1,000,000 tokens to the person who deploys this contract (You)
        // We multiply by 10**18 because tokens have 18 decimals (like cents)
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}