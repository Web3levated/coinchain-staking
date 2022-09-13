import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CoinchainStaking, ERC20Mock } from "../typechain-types";
import { getBlockTime } from "./utils/helpers";

describe("CoinchainStaking", () => {
    let coinchainStaking: CoinchainStaking;
    let coinchainTokenMock: ERC20Mock;
    let [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9]: SignerWithAddress[] = [];

    beforeEach( async () => {
        [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9] = await ethers.getSigners();

        coinchainTokenMock = await( await ethers.getContractFactory("ERC20Mock")).deploy();
        await coinchainTokenMock.deployed();

        coinchainStaking = await( await ethers.getContractFactory("CoinchainStaking")).deploy(
            coinchainTokenMock.address
        );

        await coinchainStaking.deployed();
    })

    describe("constructor", async () => {
        it("Should return correct initial values", async () => {
            expect( await coinchainStaking.CCH() ).to.equal(coinchainTokenMock.address);
        })
    })

    describe("deposit", async () => {
        it("Should revert if caller is not the owner", async () => {
            let users = [
                addr1.address
            ];
            let amounts = [
                ethers.utils.parseEther("100")
            ];
            let lockup = await getBlockTime() + 600 
            let lockups = [
                lockup 
            ];
            let depositTimes = [
                await getBlockTime()
            ];

            await expect( coinchainStaking.connect(addr1).deposit(
                users,
                amounts,
                lockups,
                depositTimes
            ) ).to.be.revertedWith("Ownable: caller is not the owner")
        })
    })
})