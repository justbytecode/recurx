// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PayRecurx is ReentrancyGuard, Ownable {
    address public platformWallet;
    uint256 public platformFeeBps = 50; // 0.5%
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Minimum plan amounts
    uint256 public constant MINIMUM_AMOUNT_ETH = 10620000000000000; // 0.01062 ETH in wei
    uint256 public constant MINIMUM_AMOUNT_USDC_USDT = 19000000; // $19 in 6-decimal units

    struct Plan {
        address merchantWallet;
        uint256 amount;
        string currency;
        uint256 interval;
        bool active;
        string name;
        string description;
    }

    struct Subscription {
        address customer;
        uint256 planId;
        uint256 amount;
        uint256 nextPayment;
        bool active;
        uint256 spendLimit;
    }

    mapping(uint256 => Plan) public plans;
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) public merchantPlans;
    mapping(address => uint256[]) public userSubscriptions;
    uint256 public planCount;
    uint256 public subscriptionCount;

    mapping(string => address) public supportedTokens;
    mapping(string => bool) public supportedCurrencies;

    event PlanCreated(uint256 indexed planId, address indexed merchant, uint256 amount, string currency, uint256 interval, string name);
    event PlanUpdated(uint256 indexed planId, uint256 amount, string currency, uint256 interval, string name);
    event PlanDeleted(uint256 indexed planId, address indexed merchant);
    event SubscriptionCreated(uint256 indexed subscriptionId, uint256 indexed planId, address indexed customer, uint256 amount);
    event SubscriptionUpdated(uint256 indexed subscriptionId, uint256 spendLimit);
    event SubscriptionCancelled(uint256 indexed subscriptionId, address indexed customer);
    event PaymentProcessed(uint256 indexed subscriptionId, address indexed merchant, address indexed customer, uint256 amount, string currency, uint256 platformFee, uint256 merchantAmount);
    event PayLinkPayment(address indexed merchant, address indexed customer, uint256 amount, string currency, uint256 platformFee);

    constructor(address _platformWallet) Ownable(msg.sender) {
        platformWallet = _platformWallet;
        supportedCurrencies["ETH"] = true;
        supportedCurrencies["USDC"] = true;
        supportedCurrencies["USDT"] = true;
    }

    function setTokenAddress(string memory currency, address tokenAddress) external onlyOwner {
        supportedTokens[currency] = tokenAddress;
        supportedCurrencies[currency] = true;
    }

    function createPlan(
        address merchantWallet,
        uint256 amount,
        string memory currency,
        uint256 interval,
        string memory name,
        string memory description
    ) external nonReentrant returns (uint256) {
        require(merchantWallet != address(0), "Invalid merchant wallet");
        require(amount > 0, "Amount must be greater than 0");
        require(interval > 0, "Interval must be greater than 0");
        require(supportedCurrencies[currency], "Unsupported currency");
        require(bytes(name).length > 0, "Name required");

        // Enforce minimum amounts
        if (keccak256(bytes(currency)) == keccak256(bytes("ETH"))) {
            require(amount >= MINIMUM_AMOUNT_ETH, "Amount below minimum (0.01062 ETH)");
        } else if (
            keccak256(bytes(currency)) == keccak256(bytes("USDC")) ||
            keccak256(bytes(currency)) == keccak256(bytes("USDT"))
        ) {
            require(amount >= MINIMUM_AMOUNT_USDC_USDT, "Amount below minimum ($19)");
        }

        planCount++;
        uint256 planId = planCount;

        plans[planId] = Plan({
            merchantWallet: merchantWallet,
            amount: amount,
            currency: currency,
            interval: interval,
            active: true,
            name: name,
            description: description
        });
        merchantPlans[merchantWallet].push(planId);

        emit PlanCreated(planId, merchantWallet, amount, currency, interval, name);
        return planId;
    }

    function updatePlan(
        uint256 planId,
        uint256 amount,
        string memory currency,
        uint256 interval,
        string memory name,
        string memory description
    ) external nonReentrant {
        Plan storage plan = plans[planId];
        require(plan.merchantWallet == msg.sender, "Not plan owner");
        require(plan.active, "Plan not active");
        require(amount > 0, "Amount must be greater than 0");
        require(interval > 0, "Interval must be greater than 0");
        require(supportedCurrencies[currency], "Unsupported currency");
        require(bytes(name).length > 0, "Name required");

        // Enforce minimum amounts
        if (keccak256(bytes(currency)) == keccak256(bytes("ETH"))) {
            require(amount >= MINIMUM_AMOUNT_ETH, "Amount below minimum (0.01062 ETH)");
        } else if (
            keccak256(bytes(currency)) == keccak256(bytes("USDC")) ||
            keccak256(bytes(currency)) == keccak256(bytes("USDT"))
        ) {
            require(amount >= MINIMUM_AMOUNT_USDC_USDT, "Amount below minimum ($19)");
        }

        plan.amount = amount;
        plan.currency = currency;
        plan.interval = interval;
        plan.name = name;
        plan.description = description;

        emit PlanUpdated(planId, amount, currency, interval, name);
    }

    function deletePlan(uint256 planId) external nonReentrant {
        Plan storage plan = plans[planId];
        require(plan.merchantWallet == msg.sender, "Not plan owner");
        require(plan.active, "Plan not active");

        plan.active = false;
        emit PlanDeleted(planId, msg.sender);
    }

    function createSubscription(uint256 planId, uint256 spendLimit) external nonReentrant returns (uint256) {
        Plan storage plan = plans[planId];
        require(plan.active, "Plan not active");

        subscriptionCount++;
        uint256 subscriptionId = subscriptionCount;

        subscriptions[subscriptionId] = Subscription({
            customer: msg.sender,
            planId: planId,
            amount: plan.amount,
            nextPayment: block.timestamp + plan.interval,
            active: true,
            spendLimit: spendLimit
        });
        userSubscriptions[msg.sender].push(subscriptionId);

        emit SubscriptionCreated(subscriptionId, planId, msg.sender, plan.amount);
        return subscriptionId;
    }

    function updateSubscription(uint256 subscriptionId, uint256 spendLimit) external nonReentrant {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.customer == msg.sender, "Not subscription owner");
        require(sub.active, "Subscription not active");

        sub.spendLimit = spendLimit;
        emit SubscriptionUpdated(subscriptionId, spendLimit);
    }

    function cancelSubscription(uint256 subscriptionId) external nonReentrant {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.customer == msg.sender, "Not subscription owner");
        require(sub.active, "Subscription not active");

        sub.active = false;
        emit SubscriptionCancelled(subscriptionId, msg.sender);
    }

    function processSubscriptionPayment(uint256 subscriptionId) external payable nonReentrant {
        Subscription storage sub = subscriptions[subscriptionId];
        Plan storage plan = plans[sub.planId];
        require(sub.active, "Subscription not active");
        require(msg.sender == sub.customer, "Only customer can pay");
        require(block.timestamp >= sub.nextPayment, "Payment not due");
        require(sub.amount <= sub.spendLimit || sub.spendLimit == 0, "Exceeds spend limit");

        uint256 amount = sub.amount;
        uint256 fee = (amount * platformFeeBps) / FEE_DENOMINATOR;
        uint256 merchantAmount = amount - fee;

        if (supportedTokens[plan.currency] != address(0)) {
            IERC20 token = IERC20(supportedTokens[plan.currency]);

            require(token.transferFrom(msg.sender, plan.merchantWallet, merchantAmount), "Merchant transfer failed");
            require(token.transferFrom(msg.sender, platformWallet, fee), "Fee transfer failed");
        } else {
            require(msg.value >= amount, "Insufficient funds");

            (bool merchantSuccess, ) = plan.merchantWallet.call{value: merchantAmount}("");
            require(merchantSuccess, "Merchant transfer failed");
            (bool platformSuccess, ) = platformWallet.call{value: fee}("");
            require(platformSuccess, "Fee transfer failed");
        }

        sub.nextPayment += plan.interval;
        emit PaymentProcessed(subscriptionId, plan.merchantWallet, msg.sender, amount, plan.currency, fee, merchantAmount);
    }

    function processPayLinkPayment(address merchantWallet, uint256 amount, string memory currency) external payable nonReentrant {
        require(merchantWallet != address(0), "Invalid merchant wallet");
        require(amount > 0, "Amount must be greater than 0");
        require(supportedCurrencies[currency], "Unsupported currency");

        uint256 fee = (amount * platformFeeBps) / FEE_DENOMINATOR;

        if (supportedTokens[currency] != address(0)) {
            IERC20 token = IERC20(supportedTokens[currency]);
            uint256 merchantAmount = amount - fee;

            require(token.transferFrom(msg.sender, merchantWallet, merchantAmount), "Merchant transfer failed");
            require(token.transferFrom(msg.sender, platformWallet, fee), "Fee transfer failed");
        } else {
            require(msg.value >= amount, "Insufficient funds");
            uint256 merchantAmount = amount - fee;

            (bool merchantSuccess, ) = merchantWallet.call{value: merchantAmount}("");
            require(merchantSuccess, "Merchant transfer failed");
            (bool platformSuccess, ) = platformWallet.call{value: fee}("");
            require(platformSuccess, "Fee transfer failed");
        }

        emit PayLinkPayment(merchantWallet, msg.sender, amount, currency, fee);
    }

    receive() external payable {}
}