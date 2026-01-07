// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameTokenV2 is ERC20, Ownable {
    // Pass the deployer's address to Ownable constructor
    constructor(address initialOwner) ERC20("Dungeon Gold", "GOLD") Ownable(initialOwner) {}

    // Only the "Owner" (The Monster Contract) can print money
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}