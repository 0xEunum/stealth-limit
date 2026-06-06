// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockPool {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IERC20 public immutable baseEth;
    uint256 public ethPriceInUsdc;
    address public owner;
    address public orderBook;

    error NotOwner();
    error NotOrderBook();

    constructor(address _usdc, address _baseEth, uint256 _initialPrice) {
        usdc = IERC20(_usdc);
        baseEth = IERC20(_baseEth);
        ethPriceInUsdc = _initialPrice;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyOrderBook() {
        if (msg.sender != orderBook) revert NotOrderBook();
        _;
    }

    function setOrderBook(address _orderBook) external onlyOwner {
        orderBook = _orderBook;
    }

    function setEthPrice(uint256 _newPrice) external onlyOwner {
        ethPriceInUsdc = _newPrice;
    }

    function seedLiquidity(uint256 usdcAmount, uint256 baseEthAmount) external onlyOwner {
        if (usdcAmount > 0) usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        if (baseEthAmount > 0) baseEth.safeTransferFrom(msg.sender, address(this), baseEthAmount);
    }

    function executeBuy(address trader, uint256 usdcAmount) external onlyOrderBook returns (uint256 baseEthOut) {
        baseEthOut = (usdcAmount * 1e18) / ethPriceInUsdc;
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        baseEth.safeTransfer(trader, baseEthOut);
    }

    function executeSell(address trader, uint256 baseEthAmount) external onlyOrderBook returns (uint256 usdcOut) {
        usdcOut = (baseEthAmount * ethPriceInUsdc) / 1e18;
        baseEth.safeTransferFrom(msg.sender, address(this), baseEthAmount);
        usdc.safeTransfer(trader, usdcOut);
    }
}
