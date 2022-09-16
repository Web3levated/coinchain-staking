// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract CoinchainStaking is Ownable {
    using EnumerableSet for EnumerableSet.UintSet;
    /*/////////////////////////////////////////////////////////////
                        DATA STRUCTURES 
    /////////////////////////////////////////////////////////////*/

    struct DepositData {
        address user;
        uint256 amount;
        uint256 yieldConfigId;
        uint256 depositTime;
    }
    struct Deposit {
        uint256 depositId;
        DepositData data;
    }

    struct YieldConfig {
        uint256 lockupTime;
        uint256 rate;
    }

    /*/////////////////////////////////////////////////////////////
                        GLOBAL STATE
    /////////////////////////////////////////////////////////////*/

    // Daily mintable allowance
    uint256 dailyMintAllowance;
    // CCH token
    IERC20 public CCH;
    // Mapping of depositIds to DepositData
    mapping(uint256 => DepositData) public deposits;
    // Mapping of user addresses to associated deposits
    mapping(address => EnumerableSet.UintSet) private depositsByAddress;
    // Mapping of YieldConfigIds to YieldConfig 
    mapping(uint256 => YieldConfig) public yieldConfigs;

    /*/////////////////////////////////////////////////////////////
                        EVENTS
    /////////////////////////////////////////////////////////////*/

    event TokensDeposited(
        uint256 indexed depositId, 
        address indexed user, 
        uint256 amount, 
        uint256 indexed yieldIdConfig, 
        uint256 depositTime
    );
    event TokensWithdrawn( uint256 indexed depositId );
    event TokensMinted();

    /*/////////////////////////////////////////////////////////////
                        CONSTRUCTOR
    /////////////////////////////////////////////////////////////*/

    constructor(address _CCHAddress) {
        CCH = IERC20(_CCHAddress);
        dailyMintAllowance = 0;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function calculatePendingRewards(uint256 depositId) public view returns (uint256 rewards) {
        DepositData memory depositData = deposits[depositId];
        rewards = (((depositData.amount / 100) * yieldConfigs[depositData.yieldConfigId].rate) / 31536000) * (block.timestamp - depositData.depositTime);  
    }

    function getDepositsByUser(address _user) external view returns(uint256[] memory){
        return depositsByAddress[_user].values();
    }


    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function deposit(
        Deposit[] calldata _deposits
    ) external onlyOwner {
        uint256 total = 0;
        for (uint256 i = 0; i < _deposits.length; i++) {
            require(_deposits[i].data.user != address(0), "Error: Address cannot be zero address");
            require(_deposits[i].data.amount > 0, "Error: Invalid amount");
            require(yieldConfigs[_deposits[i].data.yieldConfigId].rate != 0, "Error: invalid lockup");
            require(deposits[_deposits[i].depositId].user == address(0), "Error: DepositId already exists");
            total += _deposits[i].data.amount;
            deposits[_deposits[i].depositId] = _deposits[i].data;
            EnumerableSet.UintSet storage depositSet = depositsByAddress[_deposits[i].data.user];
            depositSet.add(_deposits[i].depositId);
            emit TokensDeposited(
                _deposits[i].depositId, 
                _deposits[i].data.user, 
                _deposits[i].data.amount,
                _deposits[i].data.yieldConfigId,
                _deposits[i].data.depositTime
            );
        }
        IERC20(CCH).transferFrom(msg.sender, address(this), total);
    }

    function withdraw(uint256 depositId) external onlyOwner {
        require(deposits[depositId].user != address(0), "Error: DepositId does not exist");
        require(IERC20(CCH).transfer(msg.sender, deposits[depositId].amount));
        depositsByAddress[deposits[depositId].user].remove(depositId);
        delete deposits[depositId];
        emit TokensWithdrawn(depositId);
    }

    function mint() external onlyOwner {

    }

    function setYieldConfig(uint256 yieldConfigId, YieldConfig calldata config) external onlyOwner {
        require(yieldConfigs[yieldConfigId].rate == 0, "Error: YieldConfig for id already configured");
        yieldConfigs[yieldConfigId] = config;
    }
}
