// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.30;

import {CowOftAdapter} from "../CowOftAdapter.sol";

// @dev WARNING: This is for testing purposes only
contract CowOftAdapterMock is CowOftAdapter {
    constructor(address _token, address _lzEndpoint, address _delegate) CowOftAdapter(_token, _lzEndpoint, _delegate) {}
}
