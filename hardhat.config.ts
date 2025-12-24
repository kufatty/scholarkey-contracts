import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "solidity-coverage";

// This configuration object defines how Hardhat will compile and deploy
// our smart contracts. The TypeScript typing ensures we get autocompletion
// and type checking for all configuration options.
const config: HardhatUserConfig = {
  // We're using Solidity version 0.8.28 which has important security features
  // like checked arithmetic and explicit visibility modifiers. The optimizer
  // reduces gas costs by simplifying the compiled bytecode.
  solidity: {
    version: "0.8.28",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  // Network configurations allow us to deploy to different blockchains.
  // Each network has its own RPC URL, chain ID, and account configuration.
    networks: {
    // Hardhat's local network for testing
    // data is ephemeral and resets on restart.
    // Ideal for quick tests and development.
    hardhat: {
      chainId: 1337,
      accounts: [
        {
          privateKey: "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63",
          balance: "100000000000000000000000" // 100,000 ETH
        },
        {
          privateKey: "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
          balance: "100000000000000000000000"
        },
        {
          privateKey: "0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
          balance: "100000000000000000000000"
        },
        {
          privateKey: "0x0dbbe8e4ae425a6d2687f1a7e3ba17bc98c673636790f1b8ad91193c05875ef1",
          balance: "100000000000000000000000"
        },
        {
          privateKey: "0xc88b703fb08cbea894b6aeff5a544fb92e78a18e19814cd85da83b71f772aa6c",
          balance: "100000000000000000000000"
        },
        {
          privateKey: "0x388c684f0ba1ef5017716adb5d21a053ea8e90277d0868337519f97bede61418",
          balance: "100000000000000000000000"
        },
        {
          privateKey: "0x659cbb0e2411a44db63778987b1e22153c086a95eb6b18bdf89de078917abc63",
          balance: "100000000000000000000000"
        },
        {
          privateKey: "0x82d052c865f5763aad42add438569276c00d3d88a2d062d36b2bae914d58b8c8",
          balance: "100000000000000000000000"
        },
        {
          privateKey: "0xaa3680d5d48a8283413f7a108367c7299ca73f553735860a87b08f39395618b7",
          balance: "100000000000000000000000"
        },
        {
          privateKey: "0x0f62d96d6675f32685bbdb8ac13cda7c23436f63efbb9d07700d8669ff12b7c4",
          balance: "100000000000000000000000"
        },
        {
          privateKey: "0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61", 
          balance: "100000000000000000000000"
        },
        {
          privateKey: "0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0", // Account 11
          balance: "100000000000000000000000"
        }
      ]
    },
    // Quorum network configuration
    // used for deploying to a local Quorum node where
    // data is persisted across restarts.  
    quorum: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      accounts: [
        "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63", // Account 0
        "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3", // Account 1
        "0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f", // Account 2
        "0x0dbbe8e4ae425a6d2687f1a7e3ba17bc98c673636790f1b8ad91193c05875ef1", // Account 3
        "0xc88b703fb08cbea894b6aeff5a544fb92e78a18e19814cd85da83b71f772aa6c", // Account 4
        "0x388c684f0ba1ef5017716adb5d21a053ea8e90277d0868337519f97bede61418", // Account 5
        "0x659cbb0e2411a44db63778987b1e22153c086a95eb6b18bdf89de078917abc63", // Account 6
        "0x82d052c865f5763aad42add438569276c00d3d88a2d062d36b2bae914d58b8c8", // Account 7
        "0xaa3680d5d48a8283413f7a108367c7299ca73f553735860a87b08f39395618b7", // Account 8
        "0x0f62d96d6675f32685bbdb8ac13cda7c23436f63efbb9d07700d8669ff12b7c4", // Account 9
        "0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61", // Account 10
        "0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0"  // Account 11
      ]
    },
    // Localhost network
    // used for connecting to a local Ethereum node.
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    }
  },
  
  // Gas reporter helps us understand how much gas our functions consume.
  // This is important because gas costs real money on mainnet and affects
  // the user experience on any Ethereum-compatible blockchain.
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  
  // Contract sizer shows us how large our compiled contracts are.
  // Ethereum has a 24KB contract size limit, so we need to monitor this.
  // Even on private networks, smaller contracts are easier to work with.
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  
  // Mocha configuration for running tests. The timeout is increased
  // because blockchain operations can take longer than typical API calls.
  // Quorum consensus adds additional latency compared to test networks.
  mocha: {
    timeout: 60000
  }
};

// Export the configuration so Hardhat can use it. The type annotation
// ensures we're exporting a properly typed configuration object.
export default config;