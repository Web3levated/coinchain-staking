import { EtherscanProvider } from "@ethersproject/providers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CoinchainStaking, ERC20Mock } from "../typechain-types";
import { getBlockTime, increaseTime } from "./utils/helpers";

describe("CoinchainStaking", () => {
    let coinchainStaking: CoinchainStaking;
    let coinchainTokenMock: ERC20Mock;
    let [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9]: SignerWithAddress[] = [];

    beforeEach( async () => {
        [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9] = await ethers.getSigners();

        coinchainTokenMock = await( await ethers.getContractFactory("ERC20Mock")).deploy();
        await coinchainTokenMock.deployed();

        coinchainStaking = await( await ethers.getContractFactory("CoinchainStaking")).deploy(
            coinchainTokenMock.address,
            owner.address,
            addr1.address,
            owner.address
        );

        await coinchainStaking.deployed();
    })

    describe("constructor", async () => {
        it("Should return correct initial values", async () => {
            expect( await coinchainStaking.CCH() ).to.equal(coinchainTokenMock.address);
        })

        it("Should revert if CCH address is 0 address", async () => {
            let coinchainStakingFactory = await ethers.getContractFactory("CoinchainStaking");
            await expect(coinchainStakingFactory.deploy(
                ethers.constants.AddressZero,
                owner.address,
                addr1.address,
                owner.address
            )).to.be.revertedWith("Error: _CCHAddress can't be zero");
        })
    })

    describe("setYieldConfig", async () => {
        it("should revert if caller is not the manager", async () => {
            let expectedYieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 600,
                rate: ethers.utils.parseEther("100")
            }
            await expect(coinchainStaking.connect(addr2).setYieldConfig(0, expectedYieldConfig)).to.be.revertedWith("AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08");
        })

        it("Should set yieldConfig 0", async () => {
            let expectedYieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 600,
                rate: ethers.utils.parseEther("100")
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, expectedYieldConfig);
            expect((await coinchainStaking.yieldConfigs(0)).lockupTime).to.equal(expectedYieldConfig.lockupTime);
            expect((await coinchainStaking.yieldConfigs(0)).rate).to.equal(expectedYieldConfig.rate);
        })

        it("Should revert if yieldConfig already exists", async () => {
            let yieldConfig1: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 600,
                rate: ethers.utils.parseEther("100")
            }
            let yieldConfig2: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 1000,
                rate: ethers.utils.parseEther("500")
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig1);
            await expect(coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig2))
                .to.be.revertedWith("Error: YieldConfig for id already configured")
        })
    })

    describe("deposit", async () => {
        it("Should revert if caller is not the operator", async () => {

            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: ethers.utils.parseEther("100"),
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }

            await expect( coinchainStaking.connect(addr2).deposit([deposit]))
                .to.be.revertedWith("AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929")
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

            await expect( coinchainStaking.connect(addr1).deposit([deposit]))
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

            await expect( coinchainStaking.connect(addr1).deposit([deposit]))
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

            await expect( coinchainStaking.connect(addr1).deposit([deposit]))
                .to.be.revertedWith("Error: invalid lockup")
        });

        it("Should create a single deposit", async () => {
            await coinchainTokenMock.mint(addr1.address, ethers.utils.parseEther("100"));
            await coinchainTokenMock.connect(addr1).approve(coinchainStaking.address, ethers.utils.parseEther("100"));
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
            await expect(coinchainStaking.connect(addr1).deposit([expectedDeposit]))
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
            await coinchainTokenMock.mint(addr1.address, ethers.utils.parseEther("600"));
            await coinchainTokenMock.connect(addr1).approve(coinchainStaking.address, ethers.utils.parseEther("600"));
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

            await expect(coinchainStaking.connect(addr1).deposit(expectedDeposits))
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
            expect(await coinchainTokenMock.balanceOf(addr1.address)).to.equal(0);

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
            await coinchainTokenMock.mint(addr1.address, ethers.utils.parseEther("200"));
            await coinchainTokenMock.connect(addr1).approve(coinchainStaking.address, ethers.utils.parseEther("200"));
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
            await expect(coinchainStaking.connect(addr1).deposit(expectedDeposits))
                .to.be.revertedWith("Error: DepositId already exists");

        })
    })

    describe("withdraw", async () => {
        it("should revert if caller is not the operator", async () => {
            let stakeAmount = ethers.utils.parseEther("31536000");
            await coinchainTokenMock.mint(addr1.address, stakeAmount);
            await coinchainTokenMock.connect(addr1).approve(coinchainStaking.address, stakeAmount);
            let yieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 10080,
                rate: 100
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig);
            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: stakeAmount,
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }
            await coinchainStaking.connect(addr1).deposit([deposit])
            await increaseTime(10080);
            await expect(coinchainStaking.connect(addr2).withdraw(1))
                .to.be.revertedWith("AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929")
        })
        
        it("Should revert if depositId does not exist", async () => {
            await expect(coinchainStaking.connect(addr1).withdraw(1))
                .to.be.revertedWith("Error: DepositId does not exist");
        });

        it("Should revert if lock up time has not been exceeded", async () => {
            await coinchainTokenMock.mint(addr1.address, ethers.utils.parseEther("100"));
            await coinchainTokenMock.connect(addr1).approve(coinchainStaking.address, ethers.utils.parseEther("100"));
            let yieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 600,
                rate: ethers.utils.parseEther("100")
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig);
            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: ethers.utils.parseEther("100"),
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }
            await coinchainStaking.connect(addr1).deposit([deposit]);
            await expect(coinchainStaking.connect(addr1).withdraw(1))
                .to.be.revertedWith("Error: Minimum lockup time has not been met");
        })

        it("Should withdraw deposit", async () => {
            let stakeAmount = ethers.utils.parseEther("31536000");
            await coinchainTokenMock.mint(addr1.address, stakeAmount);
            await coinchainTokenMock.connect(addr1).approve(coinchainStaking.address, stakeAmount);
            let yieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 10080,
                rate: 100
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig);
            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: stakeAmount,
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }
            await coinchainStaking.connect(addr1).deposit([deposit])
            await increaseTime(10080);
            await expect(coinchainStaking.connect(addr1).withdraw(1))
                .to.emit(
                    coinchainStaking,
                    "TokensWithdrawn"
                ).withArgs(ethers.constants.One);
            expect(await coinchainTokenMock.balanceOf(coinchainStaking.address)).to.equal(0);
            expect(await coinchainTokenMock.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("31536000"));
            expect((await coinchainStaking.deposits(1)).user).to.equal(ethers.constants.AddressZero);
            expect((await coinchainStaking.getDepositsByUser(addr1.address)).length).to.equal(0);
            expect((await coinchainStaking.mintAllowance())).to.be.closeTo(
                ethers.utils.parseEther("1008"),
                ethers.utils.parseEther(".5")
            )
        })
    })

    describe("withdrawNoReward", async () => {
        it("should revert if caller is not the operator", async () => {
            let stakeAmount = ethers.utils.parseEther("31536000");
            await coinchainTokenMock.mint(addr1.address, stakeAmount);
            await coinchainTokenMock.connect(addr1).approve(coinchainStaking.address, stakeAmount);
            let yieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 10080,
                rate: 100
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig);
            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: stakeAmount,
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }
            await coinchainStaking.connect(addr1).deposit([deposit])
            await expect(coinchainStaking.connect(addr2).withdrawNoReward(1))
                .to.be.revertedWith("AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929")
        })
        
        it("should revert if lockup time has already been met", async () => {
            let stakeAmount = ethers.utils.parseEther("31536000");
            await coinchainTokenMock.mint(addr1.address, stakeAmount);
            await coinchainTokenMock.connect(addr1).approve(coinchainStaking.address, stakeAmount);
            let yieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 10080,
                rate: 100
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig);
            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: stakeAmount,
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }
            await coinchainStaking.connect(addr1).deposit([deposit])
            await increaseTime(10080);
            await expect(coinchainStaking.connect(addr1).withdrawNoReward(1))
                .to.be.rejectedWith("Error: Minimum lockup has already been met");

        })

        it("Should revert if depositId does not exist", async () => {
            await expect(coinchainStaking.connect(addr1).withdrawNoReward(1))
                .to.be.revertedWith("Error: DepositId does not exist");
        });

        it("Should withdraw deposit with no reward", async () => {
            let stakeAmount = ethers.utils.parseEther("31536000");
            await coinchainTokenMock.mint(addr1.address, stakeAmount);
            await coinchainTokenMock.connect(addr1).approve(coinchainStaking.address, stakeAmount);
            let yieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 10080,
                rate: 100
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig);
            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: stakeAmount,
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }
            await coinchainStaking.connect(addr1).deposit([deposit])
            await expect(coinchainStaking.connect(addr1).withdrawNoReward(1))
                .to.emit(
                    coinchainStaking,
                    "TokensWithdrawn"
                ).withArgs(ethers.constants.One);
            expect(await coinchainTokenMock.balanceOf(coinchainStaking.address)).to.equal(0);
            expect(await coinchainTokenMock.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("31536000"));
            expect((await coinchainStaking.deposits(1)).user).to.equal(ethers.constants.AddressZero);
            expect((await coinchainStaking.getDepositsByUser(addr1.address)).length).to.equal(0);
            expect((await coinchainStaking.mintAllowance())).to.equal(0);
        })
    })

    

    describe("calculatePendingRewards", async () => {
        it("Should calculate rewards", async () => {
            await coinchainTokenMock.mint(addr1.address, ethers.utils.parseEther("31536000"));
            await coinchainTokenMock.connect(addr1).approve(coinchainStaking.address, ethers.utils.parseEther("31536000"));
            let yieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 10080,
                rate: 55
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig);
            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: ethers.utils.parseEther("31536000"),
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }
            await coinchainStaking.connect(addr1).deposit([deposit])
            await increaseTime(10080);
            expect(await coinchainStaking.calculatePendingRewards(1)).to.be.closeTo(
                ethers.utils.parseEther("554.4"),
                ethers.utils.parseEther(".5")
            );
        })
    })

    describe("mint", async () => {
        it("Should revert if caller is not an operator", async () => {
            let stakeAmount = ethers.utils.parseEther("31536000");
            await coinchainTokenMock.mint(addr1.address, stakeAmount);
            await coinchainTokenMock.connect(addr1).approve(coinchainStaking.address, stakeAmount);
            let yieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 10080,
                rate: 100
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig);
            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: stakeAmount,
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }
            await coinchainStaking.connect(addr1).deposit([deposit]);
            await increaseTime(10080);
            await coinchainStaking.connect(addr1).withdraw(1);
            await expect(coinchainStaking.connect(addr2).mint()).to.be.revertedWith(
                "AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929"
            )
        })

        it("should revert if mint allowance is zero", async () => {
            await expect(coinchainStaking.connect(addr1).mint()).to.be.revertedWith("Error: Mint allowance can't be zero");
        })

        it("Should mint amount stored in mintAllowance to the operator", async () => {
            let stakeAmount = ethers.utils.parseEther("31536000");
            await coinchainTokenMock.mint(addr1.address, stakeAmount);
            await coinchainTokenMock.connect(addr1).approve(coinchainStaking.address, stakeAmount);
            let yieldConfig: CoinchainStaking.YieldConfigStruct = {
                lockupTime: 10080,
                rate: 100
            }
            await coinchainStaking.connect(owner).setYieldConfig(0, yieldConfig);
            let deposit: CoinchainStaking.DepositStruct = {
                depositId: ethers.constants.One,
                data: {
                    user: addr1.address,
                    amount: stakeAmount,
                    yieldConfigId: ethers.constants.Zero,
                    depositTime: await getBlockTime()
                }
            }
            await coinchainStaking.connect(addr1).deposit([deposit])
            await increaseTime(10080);
            await coinchainStaking.connect(addr1).withdraw(1)
            await coinchainStaking.connect(addr1).mint();

            expect(await coinchainTokenMock.balanceOf(addr1.address)).to.be.closeTo(
                ethers.utils.parseEther("31537008"),
                ethers.utils.parseEther(".5")
            );
            expect(await coinchainStaking.mintAllowance()).to.equal(0);
        })
    })

    describe("rbac", async () => {
        it("Should initialize roles correctly", async () => {
            const defaultAdminRole = await coinchainStaking.DEFAULT_ADMIN_ROLE();
            const operatorRole = await coinchainStaking.OPERATOR_ROLE();
            const managerRole = await coinchainStaking.MANAGER_ROLE();
            expect(await coinchainStaking.getRoleMemberCount(defaultAdminRole)).to.equal(1);
            expect(await coinchainStaking.getRoleMemberCount(operatorRole)).to.equal(1);
            expect(await coinchainStaking.getRoleMemberCount(managerRole)).to.equal(1);
            expect(await coinchainStaking.hasRole(defaultAdminRole, owner.address)).to.be.true;
            expect(await coinchainStaking.hasRole(operatorRole, addr1.address)).to.be.true;
            expect(await coinchainStaking.hasRole(managerRole, owner.address)).to.be.true;
        });

        it("Should revert if caller does not have default admin role", async () => {
            await expect(coinchainStaking.connect(addr2).grantManagerRole(addr1.address))
                .to.be.reverted;
            await expect(coinchainStaking.connect(addr2).grantOperatorRole(addr1.address))
                .to.be.reverted;
        });

        it("Should grant the MANAGER_ROLE", async () => {
            const managerRole = await coinchainStaking.MANAGER_ROLE();
            await coinchainStaking.connect(owner).grantManagerRole(addr2.address);
            expect(await coinchainStaking.getRoleMemberCount(managerRole)).to.equal(2);
            expect(await coinchainStaking.hasRole(managerRole, addr2.address)).to.be.true;
        });

        it("Should revoke the MANAGER_ROLE", async () => {
            const managerRole = await coinchainStaking.MANAGER_ROLE();
            await coinchainStaking.connect(owner).grantManagerRole(addr2.address);
            expect(await coinchainStaking.getRoleMemberCount(managerRole)).to.equal(2);
            expect(await coinchainStaking.hasRole(managerRole, addr2.address)).to.be.true;
            await coinchainStaking.connect(owner).revokeManagerRole(addr2.address);
            expect(await coinchainStaking.getRoleMemberCount(managerRole)).to.equal(1);
            expect(await coinchainStaking.hasRole(managerRole, addr2.address)).to.be.false;
        });

        it("Should grant the OPERATOR_ROLE", async () => {
            const operatorRole = await coinchainStaking.OPERATOR_ROLE();
            await coinchainStaking.connect(owner).grantOperatorRole(addr2.address);
            expect(await coinchainStaking.getRoleMemberCount(operatorRole)).to.equal(2);
            expect(await coinchainStaking.hasRole(operatorRole, addr2.address)).to.be.true;
        });

        it("Should revoke the OPERATOR_ROLE", async () => {
            const operatorRole = await coinchainStaking.OPERATOR_ROLE();
            await coinchainStaking.connect(owner).grantOperatorRole(addr2.address);
            expect(await coinchainStaking.getRoleMemberCount(operatorRole)).to.equal(2);
            expect(await coinchainStaking.hasRole(operatorRole, addr2.address)).to.be.true;
            await coinchainStaking.connect(owner).revokeOperatorRole(addr2.address);
            expect(await coinchainStaking.getRoleMemberCount(operatorRole)).to.equal(1);
            expect(await coinchainStaking.hasRole(operatorRole, addr2.address)).to.be.false;
        });

        it("Should revert when attempting to revoke without default admin role", async () => {
            const operatorRole = await coinchainStaking.OPERATOR_ROLE();
            const managerRole = await coinchainStaking.MANAGER_ROLE();
            await coinchainStaking.connect(owner).grantManagerRole(addr3.address);
            await coinchainStaking.connect(owner).grantOperatorRole(addr3.address);
            expect(await coinchainStaking.getRoleMemberCount(managerRole)).to.equal(2);
            expect(await coinchainStaking.hasRole(managerRole, addr3.address)).to.be.true;
            expect(await coinchainStaking.getRoleMemberCount(operatorRole)).to.equal(2);
            expect(await coinchainStaking.hasRole(operatorRole, addr3.address)).to.be.true;
            await expect(coinchainStaking.connect(addr4).revokeManagerRole(addr3.address))
                .to.be.reverted;
            await expect(coinchainStaking.connect(addr4).revokeOperatorRole(addr3.address))
                .to.be.reverted;
        });

    });
})