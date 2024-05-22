require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const INFURA_URL = process.env.NEXT_PUBLIC_INFURA_URL as string;
const PKEY = process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY as string;
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY as string;

if (!INFURA_URL || !PKEY || !ETHERSCAN_API_KEY) {
  throw new Error(
    "Missing INFURA_KEY, PRIVATE_KEY or ETHERSCAN_API_KEY in a .env file"
  );
}

module.exports = {
  solidity: "0.8.24",
  defaultNetwork: "hardhat",
  networks: {
    sepolia: {
      url: INFURA_URL,
      accounts: [PKEY],
    },
  },
  paths: {
    root: "./solidity",
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
