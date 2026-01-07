require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // We add a new network called 'ganache'
    ganache: {
      url: "HTTP://172.19.224.1:8545", // The URL from the Ganache app
      chainId: 1337, // Standard Ganache ID
    },
  },
};
