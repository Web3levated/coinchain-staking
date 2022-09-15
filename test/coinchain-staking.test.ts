import { EtherscanProvider } from "@ethersproject/providers";
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

    describe("setYieldConfig", async () => {
        it("Should set yieldConfig 0", async () => {
            let expectedYieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 600,
                rate: ethers.utils.parseEther("100")
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, expectedYieldConfig);
            expect((await coinchainStaking.yieldConfigs(0)).lockupTime).to.equal(expectedYieldConfig.lockupTime);
            expect((await coinchainStaking.yieldConfigs(0)).rate).to.equal(expectedYieldConfig.rate);
        })
    })

    describe("deposit", async () => {
        it("Should revert if caller is not the owner", async () => {

            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: ethers.utils.parseEther("100"),
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }

            await expect( coinchainStaking.connect(addr1).deposit([deposit]))
                .to.be.revertedWith("Ownable: caller is not the owner")
        });

        it("Should revert if zero address passed as user", async () => {
            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: ethers.constants.AddressZero,
                    amount: ethers.utils.parseEther("100"),
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }

            await expect( coinchainStaking.connect(owner).deposit([deposit]))
                .to.be.revertedWith("Error: Address cannot be zero address")
        });

        it("Should revert if zero amount is passed", async () => {
            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: ethers.constants.Zero,
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }

            await expect( coinchainStaking.connect(owner).deposit([deposit]))
                .to.be.revertedWith("Error: Invalid amount")
        });

        it("Should revert if lockup config not set", async () => {
            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: ethers.utils.parseEther("100"),
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }

            await expect( coinchainStaking.connect(owner).deposit([deposit]))
                .to.be.revertedWith("Error: invalid lockup")
        });

        it("Should create a single deposit", async () => {
            await coinchainTokenMock.mint(owner.address, ethers.utils.parseEther("100"));
            await coinchainTokenMock.approve(coinchainStaking.address, ethers.utils.parseEther("100"));
            let yieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 600,
                rate: ethers.utils.parseEther("100")
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig);
            let expectedDeposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: ethers.utils.parseEther("100"),
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }
            // coinchainStaking.on(coinchainStaking.filters.TokensDeposited)
            await expect(coinchainStaking.connect(owner).deposit([expectedDeposit]))
                .to.emit(
                    coinchainStaking,
                    "TokensDeposited"
                ).withArgs(
                    ethers.constants.One,
                    addr1.address,
                    ethers.utils.parseEther("100"),
                    ethers.constants.Zero,
                    expectedDeposit.data.depositTime
                )
            expect(await coinchainTokenMock.balanceOf(coinchainStaking.address)).to.equal(ethers.utils.parseEther("100"));
            expect(await coinchainTokenMock.balanceOf(owner.address)).to.equal(0);
            let actualDeposit = await coinchainStaking.deposits(ethers.constants.One);
            expect(actualDeposit.user).to.equal(expectedDeposit.data.user);
            expect(actualDeposit.amount).to.equal(expectedDeposit.data.amount);
            expect(actualDeposit.yieldConfigId).to.equal(expectedDeposit.data.yieldConfigId);
            expect(actualDeposit.depositTime).to.equal(expectedDeposit.data.depositTime);
            expect((await coinchainStaking.getDepositsByUser(addr1.address)).length).to.equal(1);
            expect((await coinchainStaking.getDepositsByUser(addr1.address))[0]).to.equal(1);
        })

        it("should create multiple deposits", async () => {
            await coinchainTokenMock.mint(owner.address, ethers.utils.parseEther("600"));
            await coinchainTokenMock.approve(coinchainStaking.address, ethers.utils.parseEther("600"));
            let yieldConfig0: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 600,
                rate: ethers.utils.parseEther("100")
            }
            let yieldConfig1: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 1200,
                rate: ethers.utils.parseEther("200")
            }
            let yieldConfig2: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 600,
                rate: ethers.utils.parseEther("100")
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig0);
            await coinchainStaking.connect(owner).setYieldConfig(1, yieldConfig1);
            await coinchainStaking.connect(owner).setYieldConfig(2, yieldConfig2);
            
            let expectedDeposits: CoinchainStaking.DepositStruct[] = [
                {
                    depositId: ethers.constants.One,
                    data: {
                        user: addr1.address,
                        amount: ethers.utils.parseEther("100"),
                        yieldConfigId: ethers.constants.Zero,
                        depositTime: await getBlockTime()
                    }
                },
                {
                    depositId: ethers.constants.Two,
                    data: {
                        user: addr2.address,
                        amount: ethers.utils.parseEther("200"),
                        yieldConfigId: ethers.constants.One,
                        depositTime: await getBlockTime()
                    }
                },
                {
                    depositId: ethers.BigNumber.from(3),
                    data: {
                        user: addr3.address,
                        amount: ethers.utils.parseEther("300"),
                        yieldConfigId: ethers.constants.Two,
                        depositTime: await getBlockTime()
                    }
                },
            ]

            await expect(coinchainStaking.connect(owner).deposit(expectedDeposits))
            .to.emit(
                coinchainStaking,
                "TokensDeposited"
            ).withArgs(
                expectedDeposits[0].depositId,
                expectedDeposits[0].data.user,
                expectedDeposits[0].data.amount,
                expectedDeposits[0].data.yieldConfigId,
                expectedDeposits[0].data.depositTime
            ).and.to.emit(
                coinchainStaking,
                "TokensDeposited"
            ).withArgs(
                expectedDeposits[1].depositId,
                expectedDeposits[1].data.user,
                expectedDeposits[1].data.amount,
                expectedDeposits[1].data.yieldConfigId,
                expectedDeposits[1].data.depositTime
            ).and.to.emit(
                coinchainStaking,
                "TokensDeposited"
            ).withArgs(
                expectedDeposits[2].depositId,
                expectedDeposits[2].data.user,
                expectedDeposits[2].data.amount,
                expectedDeposits[2].data.yieldConfigId,
                expectedDeposits[2].data.depositTime
            )

            expect(await coinchainTokenMock.balanceOf(coinchainStaking.address)).to.equal(ethers.utils.parseEther("600"));
            expect(await coinchainTokenMock.balanceOf(owner.address)).to.equal(0);

            let actualDeposit1 = await coinchainStaking.deposits(ethers.constants.One);
            expect(actualDeposit1.user).to.equal(expectedDeposits[0].data.user);
            expect(actualDeposit1.amount).to.equal(expectedDeposits[0].data.amount);
            expect(actualDeposit1.yieldConfigId).to.equal(expectedDeposits[0].data.yieldConfigId);
            expect(actualDeposit1.depositTime).to.equal(expectedDeposits[0].data.depositTime);
            expect((await coinchainStaking.getDepositsByUser(addr1.address)).length).to.equal(1);
            expect((await coinchainStaking.getDepositsByUser(addr1.address))[0]).to.equal(1);

            let actualDeposit2 = await coinchainStaking.deposits(ethers.constants.Two);
            expect(actualDeposit2.user).to.equal(expectedDeposits[1].data.user);
            expect(actualDeposit2.amount).to.equal(expectedDeposits[1].data.amount);
            expect(actualDeposit2.yieldConfigId).to.equal(expectedDeposits[1].data.yieldConfigId);
            expect(actualDeposit2.depositTime).to.equal(expectedDeposits[1].data.depositTime);
            expect((await coinchainStaking.getDepositsByUser(addr2.address)).length).to.equal(1);
            expect((await coinchainStaking.getDepositsByUser(addr2.address))[0]).to.equal(2);

            let actualDeposit3 = await coinchainStaking.deposits(ethers.BigNumber.from(3));
            expect(actualDeposit3.user).to.equal(expectedDeposits[2].data.user);
            expect(actualDeposit3.amount).to.equal(expectedDeposits[2].data.amount);
            expect(actualDeposit3.yieldConfigId).to.equal(expectedDeposits[2].data.yieldConfigId);
            expect(actualDeposit3.depositTime).to.equal(expectedDeposits[2].data.depositTime);
            expect((await coinchainStaking.getDepositsByUser(addr3.address)).length).to.equal(1);
            expect((await coinchainStaking.getDepositsByUser(addr3.address))[0]).to.equal(3);
        })


        it("Should revert if depositId already exists", async () => {
            await coinchainTokenMock.mint(owner.address, ethers.utils.parseEther("200"));
            await coinchainTokenMock.approve(coinchainStaking.address, ethers.utils.parseEther("200"));
            let yieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 600,
                rate: ethers.utils.parseEther("100")
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig);
            let expectedDeposits: CoinchainStaking.DepositStruct[] = [
                {
                    depositId: ethers.constants.One,
                    data: {
                        user: addr1.address,
                        amount: ethers.utils.parseEther("100"),
                        yieldConfigId: ethers.constants.Zero,
                        depositTime: await getBlockTime()
                    }
                },
                {
                    depositId: ethers.constants.One,
                    data: {
                        user: addr1.address,
                        amount: ethers.utils.parseEther("100"),
                        yieldConfigId: ethers.constants.Zero,
                        depositTime: await getBlockTime()
                    }
                }
            ]
            // coinchainStaking.on(coinchainStaking.filters.TokensDeposited)
            await expect(coinchainStaking.connect(owner).deposit(expectedDeposits))
                .to.be.revertedWith("DepositId already exists");

        })
    })
})