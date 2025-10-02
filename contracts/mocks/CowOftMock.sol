// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CowOft} from "../CowOft.sol";

// @dev WARNING: This is for testing purposes only
contract CowOftMock is CowOft {
    constructor(address _lzEndpoint, address _delegate) CowOft(_lzEndpoint, _delegate) {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}
