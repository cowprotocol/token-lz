// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CowOft} from "../CowOft.sol";

// @dev WARNING: This is for testing purposes only
contract CowOftMock is CowOft {
    constructor(string memory _name, string memory _symbol, address _lzEndpoint, address _delegate)
        CowOft(_lzEndpoint, _delegate)
    {}

    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }
}
