// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FHE, ebool, euint64, InEuint64} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {MockPool} from "src/mocks/MockPool.sol";

contract StealthLimitOrder is Ownable {
    using SafeERC20 for IERC20;

    error StealthLimitOrder__DecryptFailed();

    enum Side {
        Buy,
        Sell
    }

    enum Status {
        Open,
        Executed,
        Cancelled
    }

    struct Order {
        uint256 id;
        address user;
        Side side;
        Status status;
        uint256 createdAt;
        uint256 executedAt;
        euint64 encryptedTargetPrice;
        euint64 encryptedAmount;
    }

    IERC20 public immutable usdc;
    IERC20 public immutable baseEth;
    MockPool public immutable pool;

    uint256 public nextOrderId;
    uint256[] public openOrderIds;

    mapping(uint256 => Order) private orders;
    mapping(address => uint256[]) private userOrders;
    mapping(uint256 => uint256) private openOrderIndexPlusOne;

    event OrderCreated(uint256 indexed orderId, address indexed user, Side side);
    event OrderCancelled(uint256 indexed orderId, address indexed user);
    event OrderExecuted(uint256 indexed orderId, address indexed user, uint256 marketPrice);

    error InvalidOrder();
    error NotOrderOwner();
    error OrderNotOpen();

    constructor(address _usdc, address _baseEth, address _pool, address initialOwner) Ownable(initialOwner) {
        usdc = IERC20(_usdc);
        baseEth = IERC20(_baseEth);
        pool = MockPool(_pool);
    }

    function createBuyOrder(InEuint64 calldata encryptedTargetPrice, InEuint64 calldata encryptedAmount)
        external
        returns (uint256 orderId)
    {
        euint64 amount = FHE.asEuint64(encryptedAmount);

        (uint256 depositAmount, bool decrypted) = FHE.getDecryptResultSafe(amount);
        if (!decrypted) {
            revert StealthLimitOrder__DecryptFailed();
        }
        usdc.safeTransferFrom(msg.sender, address(this), depositAmount);

        orderId = _storeOrder(Side.Buy, encryptedTargetPrice, encryptedAmount);
    }

    function createSellOrder(InEuint64 calldata encryptedTargetPrice, InEuint64 calldata encryptedAmount)
        external
        returns (uint256 orderId)
    {
        euint64 amount = FHE.asEuint64(encryptedAmount);
        (uint256 depositAmount, bool amountDecrypted) = FHE.getDecryptResultSafe(amount);
        if (!amountDecrypted) {
            revert StealthLimitOrder__DecryptFailed();
        }
        baseEth.safeTransferFrom(msg.sender, address(this), depositAmount);

        orderId = _storeOrder(Side.Sell, encryptedTargetPrice, encryptedAmount);
    }

    function cancelOrder(uint256 orderId) external {
        Order storage order = orders[orderId];
        if (order.user == address(0)) revert InvalidOrder();
        if (order.user != msg.sender) revert NotOrderOwner();
        if (order.status != Status.Open) revert OrderNotOpen();

        order.status = Status.Cancelled;
        _removeOpenOrder(orderId);

        (uint256 amount, bool decrypted) = FHE.getDecryptResultSafe(order.encryptedAmount);
        if (!decrypted) {
            revert StealthLimitOrder__DecryptFailed();
        }

        if (order.side == Side.Buy) {
            usdc.safeTransfer(order.user, amount);
        } else {
            baseEth.safeTransfer(order.user, amount);
        }

        emit OrderCancelled(orderId, msg.sender);
    }

    function executeOrder(uint256 orderId, uint256 currentPrice) external returns (bool executed) {
        Order storage order = orders[orderId];
        if (order.user == address(0)) revert InvalidOrder();
        if (order.status != Status.Open) revert OrderNotOpen();

        euint64 marketPrice = FHE.asEuint64(uint64(currentPrice));
        ebool trigger = order.side == Side.Buy
            ? FHE.lte(marketPrice, order.encryptedTargetPrice)
            : FHE.gte(marketPrice, order.encryptedTargetPrice);

        FHE.allowThis(trigger);
        (bool triggerResult, bool triggerDecrypted) = FHE.getDecryptResultSafe(trigger);
        if (!triggerDecrypted) {
            revert StealthLimitOrder__DecryptFailed();
        }

        if (!triggerResult) return false;

        (uint256 amount, bool decrypted) = FHE.getDecryptResultSafe(order.encryptedAmount);
        if (!decrypted) {
            revert StealthLimitOrder__DecryptFailed();
        }

        if (order.side == Side.Buy) {
            usdc.forceApprove(address(pool), amount);
            pool.executeBuy(order.user, amount);
        } else {
            baseEth.forceApprove(address(pool), amount);
            pool.executeSell(order.user, amount);
        }

        order.status = Status.Executed;
        order.executedAt = block.timestamp;
        _removeOpenOrder(orderId);

        emit OrderExecuted(orderId, order.user, currentPrice);
        return true;
    }

    function getOrderMeta(uint256 orderId)
        external
        view
        returns (uint256 id, address user, Side side, Status status, uint256 createdAt, uint256 executedAt)
    {
        Order storage order = orders[orderId];
        return (order.id, order.user, order.side, order.status, order.createdAt, order.executedAt);
    }

    function getMyOrderIds() external view returns (uint256[] memory) {
        return userOrders[msg.sender];
    }

    function getOpenOrderIds() external view returns (uint256[] memory) {
        return openOrderIds;
    }

    function getMyEncryptedTargetPrice(uint256 orderId) external view returns (euint64) {
        Order storage order = orders[orderId];
        if (order.user != msg.sender) revert NotOrderOwner();
        return order.encryptedTargetPrice;
    }

    function getMyEncryptedAmount(uint256 orderId) external view returns (euint64) {
        Order storage order = orders[orderId];
        if (order.user != msg.sender) revert NotOrderOwner();
        return order.encryptedAmount;
    }

    function _storeOrder(Side side, InEuint64 calldata encryptedTargetPrice, InEuint64 calldata encryptedAmount)
        internal
        returns (uint256 orderId)
    {
        orderId = nextOrderId++;

        Order storage order = orders[orderId];
        order.id = orderId;
        order.user = msg.sender;
        order.side = side;
        order.status = Status.Open;
        order.createdAt = block.timestamp;
        order.encryptedTargetPrice = FHE.asEuint64(encryptedTargetPrice);
        order.encryptedAmount = FHE.asEuint64(encryptedAmount);

        FHE.allowThis(order.encryptedTargetPrice);
        FHE.allowThis(order.encryptedAmount);
        FHE.allow(order.encryptedTargetPrice, msg.sender);
        FHE.allow(order.encryptedAmount, msg.sender);

        userOrders[msg.sender].push(orderId);
        _addOpenOrder(orderId);

        emit OrderCreated(orderId, msg.sender, side);
    }

    function _addOpenOrder(uint256 orderId) internal {
        openOrderIds.push(orderId);
        openOrderIndexPlusOne[orderId] = openOrderIds.length;
    }

    function _removeOpenOrder(uint256 orderId) internal {
        uint256 indexPlusOne = openOrderIndexPlusOne[orderId];
        if (indexPlusOne == 0) return;

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = openOrderIds.length - 1;

        if (index != lastIndex) {
            uint256 lastOrderId = openOrderIds[lastIndex];
            openOrderIds[index] = lastOrderId;
            openOrderIndexPlusOne[lastOrderId] = index + 1;
        }

        openOrderIds.pop();
        delete openOrderIndexPlusOne[orderId];
    }
}
