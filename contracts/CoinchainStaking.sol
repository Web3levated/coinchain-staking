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
    // Deposit ID incrementor
    // uint256 depositId;
    // CCH token
    IERC20 public CCH;
    // Mapping of address to mapping of deposit ID to deposit strcut
    // mapping(address => mapping(uint256 => Deposit)) public deposits;
    // mapping(address => Deposit[]) public deposits;
    mapping(uint256 => DepositData) public deposits;
    mapping(address => EnumerableSet.UintSet) private depositsByAddress;
    // depositIdToIndexMapping
    // Mapping of
    mapping(uint256 => YieldConfig) public yieldConfigs;

    /*/////////////////////////////////////////////////////////////
                        EVENTS
    /////////////////////////////////////////////////////////////*/

    event TokensDeposited(Deposit[] indexed deposits);
    event TokensWithdrawn();
    event TokensMinted();

    /*/////////////////////////////////////////////////////////////
                        CONSTRUCTOR
    /////////////////////////////////////////////////////////////*/

    constructor(address _CCHAddress) {
        CCH = IERC20(_CCHAddress);
        dailyMintAllowance = 0;
        // depositId = 0;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getRewards(uint256 depositId) public view returns (uint256 rewards) {

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
            total += _deposits[i].data.amount;
            deposits[_deposits[i].depositId] = _deposits[i].data;
            EnumerableSet.UintSet storage depositSet = depositsByAddress[_deposits[i].data.user];
            depositSet.add(_deposits[i].depositId);
            // depositId++;
        }
        IERC20(CCH).transferFrom(msg.sender, address(this), total);
        // emit TokensDeposited(_deposits);
    }

    function withdrawl(uint256 depositId) external onlyOwner {
        
    }

    function mint() external onlyOwner {

    }

    function setYieldConfig(uint256 yieldConfigId, YieldConfig calldata config) external onlyOwner {
        require(yieldConfigs[yieldConfigId].rate == 0, "Error: YieldConfig for id already configured");
        yieldConfigs[yieldConfigId] = config;
    }
}
