// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./interfaces/ICoinchainToken.sol";

contract CoinchainStaking is AccessControlEnumerable {
    using EnumerableSet for EnumerableSet.UintSet;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

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

    // mintable allowance
    uint256 public mintAllowance;
    // CCH token
    address public CCH;
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

    constructor(
        address _CCHAddress,
        address admin,
        address operator,
        address manager
    ) {
        CCH = _CCHAddress;
        mintAllowance = 0;
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(OPERATOR_ROLE, operator);
        _setupRole(MANAGER_ROLE, manager);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function calculatePendingRewards(uint256 depositId) public view returns (uint256 rewards) {
        DepositData memory depositData = deposits[depositId];
        rewards = (((depositData.amount / 1000) * yieldConfigs[depositData.yieldConfigId].rate) / 31536000) * (block.timestamp - depositData.depositTime);  
    }

    function getDepositsByUser(address _user) external view returns(uint256[] memory){
        return depositsByAddress[_user].values();
    }


    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function deposit(
        Deposit[] calldata _deposits
    ) external onlyRole(OPERATOR_ROLE) {
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
        require(IERC20(CCH).transferFrom(msg.sender, address(this), total));
    }

    function withdraw(uint256 depositId) external onlyRole(OPERATOR_ROLE) {
        DepositData memory depositData = deposits[depositId];
        require(depositData.user != address(0), "Error: DepositId does not exist");
        require(yieldConfigs[depositData.yieldConfigId].lockupTime <= block.timestamp - depositData.depositTime, "Error: Minimum lockup time has not been met");
        mintAllowance += calculatePendingRewards(depositId);
        require(depositsByAddress[depositData.user].remove(depositId));
        delete deposits[depositId];
        emit TokensWithdrawn(depositId);
        require(IERC20(CCH).transfer(msg.sender, depositData.amount));
    }

    function withdrawNoReward(uint256 depositId) external onlyRole(OPERATOR_ROLE) {
        DepositData memory depositData = deposits[depositId];
        require(depositData.user != address(0), "Error: DepositId does not exist");
        depositsByAddress[depositData.user].remove(depositId);
        delete deposits[depositId];
        emit TokensWithdrawn(depositId);
        require(IERC20(CCH).transfer(msg.sender, depositData.amount)); 
    }

    function mint() external onlyRole(OPERATOR_ROLE) {
        uint256 allowance = mintAllowance;
        mintAllowance = 0;
        ICoinchainToken(CCH).mint(msg.sender, allowance);
    }

    function setYieldConfig(uint256 yieldConfigId, YieldConfig calldata config) external onlyRole(MANAGER_ROLE) {
        require(yieldConfigs[yieldConfigId].rate == 0, "Error: YieldConfig for id already configured");
        yieldConfigs[yieldConfigId] = config;
    }


    /**
     * @dev Calls the public grantRole() function which verifies that the sender is a role admin
     * @notice Grants the MANAGER_ROLE to given account
     * @param _account Address to grant the MANAGER_ROLE to
     */
    function grantManagerRole(address _account) external {
        grantRole(MANAGER_ROLE, _account);
    }

    /**
     * @dev Calls the public revokeRole() function which verifies that the sender is a role admin
     * @notice Revokes the MINTER_ROLE from given account
     * @param _account Address to revoke the MINTER_ROLE from 
     */
    function revokeManagaerRole(address _account) external {
        revokeRole(MANAGER_ROLE, _account);
    }

    /**
     * @dev Calls the public grantRole() function which verifies that the sender is a role admin
     * @notice Grants the OPERATOR_ROLE to given account
     * @param _account Address to grant the OPERATOR_ROLE to
     */
    function grantOperatorRole(address _account) external {
        grantRole(OPERATOR_ROLE, _account);
    }

    /**
     * @dev Calls the public revokeRole() function which verifies that the sender is a role admin
     * @notice Revokes the OPERATOR_ROLE from given account
     * @param _account Address to revoke the OPERATOR_ROLE from 
     */
    function revokeOperatorRole(address _account) external {
        revokeRole(OPERATOR_ROLE, _account);
    }
}
