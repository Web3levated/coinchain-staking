// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract CoinchainStaking {

  /*///////////////////////////////////////////////////////////////
                    GLOBAL STATE
    //////////////////////////////////////////////////////////////*/

    // CCH token
    IERC20 public CCH;

    constructor(address _CCHAddress) {
        CCH = IERC20(_CCHAddress);
    }    
}