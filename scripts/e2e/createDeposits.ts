import { ethers } from "hardhat";
import { CoinchainStaking } from "../../typechain-types";

async function main() {

    const coinchainStakingAddress = "0x276f45322E0e1614C80f25faB8b3986DF0dC3777";
    const coinchainTokenAddress = "0xEA16DC0f1eB0c0f28d74Efceee21DDE735904472";
    const coinchainToken = await ethers.getContractAt("IERC20", coinchainTokenAddress);
    const coinchainStaking = await ethers.getContractAt("CoinchainStaking", coinchainStakingAddress);
    const depositTimeNow = Math.round(Date.now() / 1000);
    const deposit1: CoinchainStaking.DepositStruct = {
        depositId: 1,
        data: {
            user: "0x832f85e663a1b38078Fca464E02F06FC25dda59C",
            amount: ethers.utils.parseEther("31557600"),
            yieldConfigId: 1,
            depositTime: depositTimeNow
        }
    }

    const deposit2: CoinchainStaking.DepositStruct = {
        depositId: 2,
        data: {
            user: "0x9C33a17D74324a2aB320e3326B702d56C2A4b6D3",
            amount: ethers.utils.parseEther("31557600"),
            yieldConfigId: 2,
            depositTime: depositTimeNow
        }
    }

    const deposit3: CoinchainStaking.DepositStruct = {
        depositId: 3,
        data: {
            user: "0x4d0fe66fd84045f813e4AA13D664E343B72baB6e",
            amount: ethers.utils.parseEther("31557600"),
            yieldConfigId: 3,
            depositTime: depositTimeNow
        }
    }

    const deposits = [deposit1, deposit2, deposit3];
    const approvalTx = await coinchainToken.approve(coinchainStaking.address, ethers.utils.parseEther("94672800"));
    console.log("approvalTx: ", approvalTx.hash);
    await approvalTx.wait();
    const tx = await coinchainStaking.deposit(deposits);
    console.log("tx: ", tx.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})