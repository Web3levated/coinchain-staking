import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      chainId: 1337,
      blockGasLimit: 100000000000
    },
    goerli: {
      url: process.env.RPC_URL_GOERLI || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mumbai: {
      url: process.env.RPC_URL_MUMBAI || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: process.env.RPC_URL_RINKEBY || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: process.env.RPC_URL_MAIN || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    polygon: {
      url: process.env.RPC_URL_POLYGON || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: {
      mainnet:
        process.env.ETHERSCAN_API_KEY !== undefined
          ? process.env.ETHERSCAN_API_KEY
          : "",
      rinkeby:
        process.env.ETHERSCAN_API_KEY !== undefined
          ? process.env.ETHERSCAN_API_KEY
          : "",
      goerli:
        process.env.ETHERSCAN_API_KEY !== undefined
          ? process.env.ETHERSCAN_API_KEY
          : "",
      //polygon
      polygon:
        process.env.POLYGONSCAN_API_KEY != undefined
          ? process.env.POLYGONSCAN_API_KEY
          : "",
      polygonMumbai:
        process.env.POLYGONSCAN_API_KEY != undefined
          ? process.env.POLYGONSCAN_API_KEY
          : "",
    },
  },
};

export default config;
