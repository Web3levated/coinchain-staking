// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CoinchainStaking {
    /*/////////////////////////////////////////////////////////////
                        DATA STRUCTURES 
    /////////////////////////////////////////////////////////////*/

    struct Deposit {
        address user;
        uint256 amount;
        uint256 lockUp;
        uint256 depositTime;
    }

    /*/////////////////////////////////////////////////////////////
                        GLOBAL STATE
    /////////////////////////////////////////////////////////////*/

    // Daily mintable allowance
    uint256 dailyMintAllowance;
    // Deposit ID incrementor
    uint256 depositId;
    // CCH token
    IERC20 public CCH;
    // Mapping of deposit ID to deposit strcut
    mapping(uint256 => Deposit) public deposits; 

    /*/////////////////////////////////////////////////////////////
                        EVENTS
    /////////////////////////////////////////////////////////////*/

    event Deposit();
    event withdrawl();
    event Mint();

    /*/////////////////////////////////////////////////////////////
                        CONSTRUCTOR
    /////////////////////////////////////////////////////////////*/

    constructor(address _CCHAddress) {
        CCH = IERC20(_CCHAddress);
        dailyMintAllowance = 0;
        depositId = 0;
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getDeposit(uint256 depositId) external view returns (Deposit) {

    }

    function getRewards(uint256 depositId) external view returns (uint256 rewards) {

    }

    /*//////////////////////////////////////////////////////////////
                        PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function deposit(
        address[] memory users,
        uint256[] memory amounts,
        uint256[] memory lockups,
        uint256[] memory depositTimes
    ) external onlyOwner {

    }

    function withdrawl(uint256 depositId) external onlyOwner {

    }

    function mint() external onlyOwner {

    }
}
