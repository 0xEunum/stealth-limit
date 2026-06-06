// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console2} from "forge-std/Script.sol";
import {MockUSDC} from "src/mocks/MockUSDC.sol";
import {MockBaseETH} from "src/mocks/MockBaseETH.sol";
import {MockPool} from "src/mocks/MockPool.sol";

contract SeedPool is Script {
    address public constant USDC_TOKEN = 0xeb2c9000e6acdB5b661bB143dBf30856F2A655e9;
    address public constant BASEETH_TOKEN = 0x861fBbA0ca51FFDe6a2F306f3a03Ac1da363a8da;
    address public constant POOL_ADDRESS = 0xae35F226c3E86c5C4FcA2DF59B84394008BB539F;

    uint256 public constant USDC_AMOUNT = 1_000_000e6; // 1,000,000 USDC
    uint256 public constant ETH_AMOUNT = 1_000e18; // 1,000 mBETH

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deployer:", deployer);
        console2.log("USDC token:", USDC_TOKEN);
        console2.log("BaseETH token:", BASEETH_TOKEN);
        console2.log("Pool:", POOL_ADDRESS);

        vm.startBroadcast(deployerPrivateKey);

        MockUSDC usdc = MockUSDC(USDC_TOKEN);
        MockBaseETH baseEth = MockBaseETH(BASEETH_TOKEN);
        MockPool pool = MockPool(POOL_ADDRESS);

        usdc.mint(deployer, USDC_AMOUNT);
        baseEth.mint(deployer, ETH_AMOUNT);

        usdc.approve(POOL_ADDRESS, USDC_AMOUNT);
        baseEth.approve(POOL_ADDRESS, ETH_AMOUNT);

        pool.seedLiquidity(USDC_AMOUNT, ETH_AMOUNT);

        vm.stopBroadcast();

        console2.log("Minted USDC:", USDC_AMOUNT);
        console2.log("Minted BaseETH:", ETH_AMOUNT);
        console2.log("Approved pool for both tokens");
        console2.log("Pool liquidity seeded");
    }
}
