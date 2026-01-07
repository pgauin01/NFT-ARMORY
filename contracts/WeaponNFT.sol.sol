// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WeaponNFT is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;

    // 1. Store the Level of each NFT on-chain
    mapping(uint256 => uint256) public weaponLevels;

    // 2. Define the "Skins" (IPFS Links)
    // In a real app, you would upload these JSON files to Pinata or IPFS
    string constant LEVEL_1_URI = "ipfs://QmNrRSmPd7CztbbKkJXKgbgZvUDiibdQpNPoKFLMnABqD3"; 
    string constant LEVEL_2_URI = "ipfs://QmeqMwPcL7jxM8nYd18uT2P2MxMmaFVC1GwP8SZ9gkzFWj";

    constructor() ERC721("FPS Weapon", "GUN") Ownable(msg.sender) {
        tokenCounter = 0;
    }

    // 3. Mint a new Weapon (Starts at Level 1)
    function mintWeapon() public {
        uint256 newItemId = tokenCounter;
        
        _safeMint(msg.sender, newItemId);
        
        // Initialize level
        weaponLevels[newItemId] = 1;
        
        // Set the initial visual appearance
        _setTokenURI(newItemId, LEVEL_1_URI);

        tokenCounter = tokenCounter + 1;
    }

    // 4. THE EVOLUTION MECHANIC 🆙
    function levelUp(uint256 tokenId) public {
        // Security: Only the owner of the gun can upgrade it
        require(ownerOf(tokenId) == msg.sender, "Not your gun!");

        // Increment Level
        uint256 currentLevel = weaponLevels[tokenId];
        weaponLevels[tokenId] = currentLevel + 1;

        // Change the Visuals based on the new level
        if (weaponLevels[tokenId] >= 2) {
            _setTokenURI(tokenId, LEVEL_2_URI);
        }
    }
}