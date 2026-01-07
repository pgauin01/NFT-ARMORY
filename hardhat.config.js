require("@nomicfoundation/hardhat-toolbox");

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.28",
//   networks: {
//     // We add a new network called 'ganache'
//     ganache: {
//       url: "HTTP://172.19.224.1:8545", // The URL from the Ganache app
//       chainId: 1337, // Standard Ganache ID
//     },
//   },
// };

require("dotenv").config(); // Load environment variables
require("@nomicfoundation/hardhat-toolbox");

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
};
