// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script} from "forge-std/Script.sol";
import {StrataRegistry} from "../src/StrataRegistry.sol";

/// @title Deploy
/// @notice Deploys the StrataRegistry to Base mainnet. Verify on Basescan in
///  the same minute, an unverified contract is not shipped.
contract Deploy is Script {
    function run() external returns (StrataRegistry registry) {
        vm.startBroadcast();
        registry = new StrataRegistry();
        vm.stopBroadcast();
    }
}
