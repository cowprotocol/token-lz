// SPDX-License-Identifier: LGPL-3.0-or-later
pragma solidity ^0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {OFT} from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract CowOft is OFT, ERC20Permit {
    constructor(address _lzEndpoint, address _delegate)
        ERC20Permit("CoW Protocol Token")
        OFT("CoW Protocol Token", "COW", _lzEndpoint, _delegate)
        Ownable(_delegate)
    {}
}
