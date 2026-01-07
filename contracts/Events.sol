// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract GameScores {
    // 1. Define the Event
    // 'indexed' lets us search for this specific field later (like a database index)
    event NewHighScore(address indexed player, uint256 score, string mapName);

    mapping(address => uint256) public highestScores;

    function submitScore(uint256 _score, string memory _mapName) public {
        // ... Logic to check if it's a high score ...
        highestScores[msg.sender] = _score;

        // 2. Fire the Event
        // The contract forgets this immediately, but the blockchain logs keep it forever.
        emit NewHighScore(msg.sender, _score, _mapName);
    }
}