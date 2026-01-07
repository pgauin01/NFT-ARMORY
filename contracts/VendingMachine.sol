// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// We need the interface to talk to the Token contract
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract VendingMachine {
    address public owner;
    IERC20 public token;
    
    // Price: 100 Tokens per 1 ETH
    //uint256 public constant TOKENS_PER_ETH = 100;
    uint256 public tokensPerEth = 100;



    event Purchased(address buyer, uint256 amountOfETH, uint256 amountOfTokens);

    constructor(address _tokenAddress) {
        owner = msg.sender;
        token = IERC20(_tokenAddress); // Connect to the specific "AMMO" token
    }

    // 2. The Setter Function
    function setPrice(uint256 _newPrice) public {
        // 3. THE SECURITY CHECK (The "Gatekeeper")
        require(msg.sender == owner, "Only the Boss can change prices");
        
        // 4. Update the state
        tokensPerEth = _newPrice;
    }

    // 1. BUY FUNCTION
    // "payable" allows this function to accept ETH
    function buyAmmo() public payable {
        require(msg.value > 0, "Send ETH to buy ammo");

        // Calculate amount to give
        uint256 amountToBuy = msg.value * tokensPerEth;

        // Check if the machine has enough ammo in stock
        uint256 vendorBalance = token.balanceOf(address(this));
        require(vendorBalance >= amountToBuy, "Vendor is out of stock!");

        // Transfer tokens FROM the machine TO the buyer
        bool sent = token.transfer(msg.sender, amountToBuy);
        require(sent, "Failed to transfer token");

        emit Purchased(msg.sender, msg.value, amountToBuy);
    }

    // 2. WITHDRAW ETH (For the Owner)
    // You want to collect the profits
    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        
        // Transfer all ETH in the contract to the owner
        (bool sent, ) = owner.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
    }
}