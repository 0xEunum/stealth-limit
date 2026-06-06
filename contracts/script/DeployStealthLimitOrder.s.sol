// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console2} from "forge-std/Script.sol";
import {MockUSDC} from "src/mocks/MockUSDC.sol";
import {MockBaseETH} from "src/mocks/MockBaseETH.sol";
import {MockPool} from "src/mocks/MockPool.sol";
import {StealthLimitOrder} from "src/core/StealthLimitOrder.sol";

contract DeployStealthLimitOrder is Script {
    uint256 internal constant INITIAL_ETH_PRICE_USDC = 2500e6;
    uint256 internal constant INITIAL_USDC_LIQUIDITY = 1_000_000e6;
    uint256 internal constant INITIAL_ETH_LIQUIDITY = 1_000e18;

    function run() external returns (MockUSDC usdc, MockBaseETH baseEth, MockPool pool, StealthLimitOrder orderBook) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        usdc = new MockUSDC();
        baseEth = new MockBaseETH();

        pool = new MockPool(address(usdc), address(baseEth), INITIAL_ETH_PRICE_USDC);
        orderBook = new StealthLimitOrder(address(usdc), address(baseEth), address(pool), deployer);

        pool.setOrderBook(address(orderBook));

        usdc.mint(deployer, INITIAL_USDC_LIQUIDITY);
        baseEth.mint(deployer, INITIAL_ETH_LIQUIDITY);

        usdc.approve(address(pool), INITIAL_USDC_LIQUIDITY);
        baseEth.approve(address(pool), INITIAL_ETH_LIQUIDITY);
        pool.seedLiquidity(INITIAL_USDC_LIQUIDITY, INITIAL_ETH_LIQUIDITY);

        vm.stopBroadcast();

        console2.log("Deployer:", deployer);
        console2.log("MockUSDC:", address(usdc));
        console2.log("MockBaseETH:", address(baseEth));
        console2.log("MockPool:", address(pool));
        console2.log("StealthLimitOrder:", address(orderBook));
    }
}
