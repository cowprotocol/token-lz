// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {OFT} from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract COWOFT is OFT, ERC20Permit {
    constructor(address _lzEndpoint, address _delegate)
        ERC20Permit("CoW Protocol Token")
        OFT("CoW Protocol Token", "COW", _lzEndpoint, _delegate)
        Ownable(_delegate)
    {}
}
