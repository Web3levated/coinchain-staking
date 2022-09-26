import { ethers } from "hardhat";
import { CoinchainStaking } from "../../typechain-types";

async function main() {

    const coinchainStakingAddress = "0x276f45322E0e1614C80f25faB8b3986DF0dC3777";
    const coinchainStaking = await ethers.getContractAt("CoinchainStaking", coinchainStakingAddress);
    
    const yieldConfig1: CoinchainStaking.YieldConfigStruct = {
        rate: 100,
        lockupTime: 1800
    }
    const yieldConfig2: CoinchainStaking.YieldConfigStruct = {
        rate: 200,
        lockupTime: 3600
    }
    const yieldConfig3: CoinchainStaking.YieldConfigStruct = {
        rate: 305,
        lockupTime: 5400
    }


    const tx1 = await coinchainStaking.setYieldConfig(1, yieldConfig1);
    console.log("tx1: ", tx1.hash);
    await tx1.wait();

    const tx2 = await coinchainStaking.setYieldConfig(2, yieldConfig2);
    console.log("tx2: ", tx2.hash);
    await tx2.wait();

    const tx3 = await coinchainStaking.setYieldConfig(3, yieldConfig3);
    console.log("tx3: ", tx3.hash);
    await tx3.wait();

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})