# CoinChain Staking Contract

## INTRODUCTION
Hardhat project that contains the contracts, unit tests and relevant scripts for the CoinChain staking contract.

## REQUIREMENTS
Nodejs and Node Package Manager(npm)

## INSALLATION
npm install

## NODE SCRIPTS
### Build
`npm run build`
- clears artifacts, cache, coverage and typechain
- compiles solidity contracts
- recompiles typechain
### Test
`npm test`
- runs all tests in test folder
### Coverage
`npm run coverage`
- runs [solidity-coverage](https://github.com/sc-forks/solidity-coverage) plugin
- generates coverage folder in the projects root directory with full test coverage report

## HARDHAT SCRIPTS
- hardhat scripts used to interact with deployed smart contracts
- scripts are stored in the scripts folder and can be run using the npx command:
    - `npx hardhat run --network [mainnet, goerli etc...] [scipts/path/to/script]`
### CoinChainStaking
#### token scripts are stored in scripts/coinchainToken
- [deploy.ts](scripts/deploy.ts)
    - deploys [CoinchainToken.sol](contracts/CoinchainStaking.sol) to chosen network and writes contract address to console
    - verifies contract in etherscan

