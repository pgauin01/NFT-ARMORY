// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // Security

contract Marketplace is ReentrancyGuard {
    IERC721 public nftContract;
    IERC20 public tokenContract;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    // Map Token ID -> Listing Details
    mapping(uint256 => Listing) public listings;

    event ItemListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event ItemSold(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event ItemCanceled(address indexed seller, uint256 indexed tokenId);

    constructor(address _nftAddress, address _tokenAddress) {
        nftContract = IERC721(_nftAddress);
        tokenContract = IERC20(_tokenAddress);
    }

    // 1. LIST ITEM (Seller sends NFT to Marketplace)
    function listItem(uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price must be > 0");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not the owner");

        // Transfer NFT to this contract (Escrow)
        nftContract.transferFrom(msg.sender, address(this), tokenId);

        listings[tokenId] = Listing(msg.sender, price, true);
        emit ItemListed(msg.sender, tokenId, price);
    }

    // 2. BUY ITEM (Buyer pays GOLD, gets NFT)
    function buyItem(uint256 tokenId) external nonReentrant {
        Listing memory item = listings[tokenId];
        require(item.active, "Item not for sale");
        
        // Transfer GOLD from Buyer to Seller
        bool success = tokenContract.transferFrom(msg.sender, item.seller, item.price);
        require(success, "Payment failed");

        // Transfer NFT from Marketplace to Buyer
        nftContract.transferFrom(address(this), msg.sender, tokenId);

        // Delete listing
        delete listings[tokenId];
        emit ItemSold(msg.sender, tokenId, item.price);
    }

    // 3. CANCEL LISTING (Seller gets NFT back)
    function cancelListing(uint256 tokenId) external nonReentrant {
        Listing memory item = listings[tokenId];
        require(item.seller == msg.sender, "Not your listing");
        require(item.active, "Not active");

        nftContract.transferFrom(address(this), msg.sender, tokenId);
        
        delete listings[tokenId];
        emit ItemCanceled(msg.sender, tokenId);
    }
}