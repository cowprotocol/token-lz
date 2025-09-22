// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {COWOFTAdapter} from "../COWOFTAdapter.sol";

// @dev WARNING: This is for testing purposes only
contract COWOFTAdapterMock is COWOFTAdapter {
    constructor(address _token, address _lzEndpoint, address _delegate) COWOFTAdapter(_token, _lzEndpoint, _delegate) {}
}
