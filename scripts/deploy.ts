import { ethers } from "hardhat";

async function main() {
    const hre = require("hardhat");

    const CCHAddress = "";
    const defaultAdminAddress = "";
    const operatorAddress = "";
    const managerAddress = "";

    let coinchainStaking  = await (await ethers.getContractFactory("CoinchainStaking")).deploy(
        CCHAddress,
        defaultAdminAddress,
        operatorAddress,
        managerAddress
    );
    await coinchainStaking.deployed()
    console.log("CoinchainStaking Address: ", coinchainStaking.address);

    setTimeout(async () => {
        try{
            await hre.run("verify:verify", {
                address: coinchainStaking.address,
                constructorArguments: [
                    CCHAddress,
                    defaultAdminAddress,
                    operatorAddress,
                    managerAddress
                ]
            })
        }catch(e){
            console.log("Unable to verify: ", e);
        }
    }, 120000)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});