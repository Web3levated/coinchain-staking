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

            let lockupTime = await getBlockTime() + 600 
            let deposit: CoinchainStaking.DepositStruct = {
                user: addr1.address,
                amount: ethers.utils.parseEther("100"),
                lockUp: lockupTime,
                depositTime: await getBlockTime()
            }

            await expect( coinchainStaking.connect(addr1).deposit([deposit]))
                .to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("Should revert if zero address passed as user", async () => {
            let lockupTime = await getBlockTime() + 600 
            let deposit: CoinchainStaking.DepositStruct = {
                user: ethers.constants.AddressZero,
                amount: ethers.utils.parseEther("100"),
                lockUp: lockupTime,
                depositTime: await getBlockTime()
            }

            await expect( coinchainStaking.connect(owner).deposit([deposit]))
                .to.be.revertedWith("Error: Address cannot be zero address")
        })


    })
})