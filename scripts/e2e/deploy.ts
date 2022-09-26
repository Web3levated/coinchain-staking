import { ethers } from "hardhat";

async function main() {
    const hre = require("hardhat");

    const CCHAddress = "0xEA16DC0f1eB0c0f28d74Efceee21DDE735904472";
    const defaultAdminAddress = "0x2C8C6D4b360bf3ce7B2b641B27D0c7534A63E99F";
    const operatorAddress = "0x2C8C6D4b360bf3ce7B2b641B27D0c7534A63E99F";
    const managerAddress = "0x2C8C6D4b360bf3ce7B2b641B27D0c7534A63E99F";

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
