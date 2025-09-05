// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NameQuest Game Token
 * @dev ERC20 token for in-game rewards and transactions
 */
contract QuestToken is ERC20, Ownable {
    mapping(address => bool) public minters;

    constructor() ERC20("Quest Token", "QUEST") Ownable(msg.sender) {}

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
    }

    function mint(address to, uint256 amount) external {
        require(minters[msg.sender], "Not authorized to mint");
        _mint(to, amount);
    }
}
