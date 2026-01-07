// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol"; // To convert uint to string

contract OnChainWeapon is ERC721URIStorage {
    using Strings for uint256;

    uint256 public tokenCounter;
    mapping(uint256 => uint256) public weaponLevels;

    constructor() ERC721("OnChainGun", "OCG") {
        tokenCounter = 0;
    }

    function mint() public {
        uint256 newItemId = tokenCounter;
        _safeMint(msg.sender, newItemId);
        weaponLevels[newItemId] = 1; // Start at Level 1
        tokenCounter++;
    }

    function levelUp(uint256 tokenId) public {
        weaponLevels[tokenId]++;
    }

    // --- THE HARDCORE PART ---
    
    // 1. Generate the Raw SVG Code
    function generateSVG(uint256 tokenId) internal view returns (string memory) {
        uint256 level = weaponLevels[tokenId];
        
        // We build the SVG string. It's just HTML-like code.
        // We create a black box with white text showing the Level.
        bytes memory svg = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">',
            '<style>.base { fill: white; font-family: serif; font-size: 24px; }</style>',
            '<rect width="100%" height="100%" fill="black" />',
            '<text x="50%" y="50%" class="base" dominant-baseline="middle" text-anchor="middle">',
            'Weapon Level: ', level.toString(),
            '</text>',
            '</svg>'
        );
        
        return string(abi.encodePacked(
            "data:image/svg+xml;base64,",
            Base64.encode(svg)
        ));
    }

    // 2. Generate the JSON Metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        string memory imageURI = generateSVG(tokenId);
        
        // We construct the JSON manually
        bytes memory json = abi.encodePacked(
            '{"name": "Weapon #', tokenId.toString(), '",',
            '"description": "An on-chain SVG weapon.",',
            '"attributes": [{"trait_type": "Level", "value": ', weaponLevels[tokenId].toString(), '}],',
            '"image": "', imageURI, '"}'
        );

        // Encode the JSON itself into Base64
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(json)
        ));
    }
}