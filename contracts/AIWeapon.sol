// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // Import Token Interface

contract AIWeapon is ERC721URIStorage {
    using Strings for uint256;
    uint256 public tokenCounter;
    IERC20 public gameToken; // The Currency

    struct WeaponStats {
        string name;
        string description;
        uint256 level;
        string visual;
    }

    mapping(uint256 => WeaponStats) public weaponStats;

    // Pass Token Address in Constructor
    constructor(address _tokenAddress) ERC721("AI Weapon", "AIW"){
        tokenCounter = 0;
        gameToken = IERC20(_tokenAddress);
    }

    function mintAIWeapon(string memory _name, string memory _desc, uint256 _level, string memory _svgCode) public {
        uint256 newItemId = tokenCounter;
        _safeMint(msg.sender, newItemId);
        weaponStats[newItemId] = WeaponStats(_name, _desc, _level, _svgCode);
        tokenCounter++;
    }

    // --- NEW: THE UPGRADE SHOP ---
    function upgradeWeapon(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not your weapon!");
        
        // Cost: 10 GOLD (10 * 10^18)
        uint256 cost = 10 * 10**18;
        
        // 1. Payment: Pull tokens from user to this contract
        bool success = gameToken.transferFrom(msg.sender, address(this), cost);
        require(success, "Payment failed! Approve tokens first.");

        // 2. Upgrade: Increase Level
        weaponStats[tokenId].level++;
    }

    // Standard TokenURI function
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        WeaponStats memory stats = weaponStats[tokenId];
        string memory imageURI = string(abi.encodePacked(
            "data:image/svg+xml;base64,", Base64.encode(bytes(stats.visual))
        ));
        bytes memory json = abi.encodePacked(
            '{"name": "', stats.name, '",',
            '"description": "', stats.description, '",',
            '"attributes": [{"trait_type": "Level", "value": ', stats.level.toString(), '}],',
            '"image": "', imageURI, '"}'
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }
}