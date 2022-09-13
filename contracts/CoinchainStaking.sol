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

    struct LockupConfig {
        uint256 lockupTime;
        uint256 rate;
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
    // Mapping of address to mapping of deposit ID to deposit strcut
    mapping(address => mapping(uint256 => Deposit)) public deposits;
    // Mapping of
    mapping(uint256 => LockupConfig) public lockups;

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

    function getRewards(uint256 depositId) external view returns (uint256 rewards) {

    }

    function

    /*//////////////////////////////////////////////////////////////
                        PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function deposit(
        address[] memory users,
        uint256[] memory amounts,
        uint256[] memory lockups,
        uint256[] memory depositTimes
    ) external onlyOwner {
        require(users.length == amounts.length == lockups.length == depositTimes.length, "Error: List length mismatch");
        for (uint256 i = 0; i < amounts.length; i++) {
            require(users[i] != address(0), "Error: Address cannot be zero address");
            require(amounts[i] > 0, "Error: Invalid amount");

        }
    }

    function withdrawl(uint256 depositId) external onlyOwner {

    }

    function mint() external onlyOwner {

    }
}
