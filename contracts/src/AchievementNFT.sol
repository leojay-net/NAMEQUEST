// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// Removed unused OZ imports and Counters; use a simple uint256 counter instead.

/**
 * @title Achievement NFTs
 * @dev ERC721 tokens representing in-game achievements
 */
contract AchievementNFT is ERC721, ERC721Enumerable, Ownable {
    // Local token ID counter to replace removed OpenZeppelin Counters library
    uint256 private _tokenIds;

    struct Achievement {
        string name;
        string description;
        string imageURI;
        uint256 rarity; // 1=common, 2=rare, 3=epic, 4=legendary
        uint256 timestamp;
    }

    mapping(uint256 => Achievement) public achievements;
    mapping(address => bool) public minters;
    // Track achievements per player to allow same-named achievements for different players
    mapping(address => mapping(string => bool)) public hasAchievement;

    event AchievementMinted(
        address indexed player,
        uint256 indexed tokenId,
        string achievementName
    );

    constructor()
        ERC721("NameQuest Achievements", "NQACH")
        Ownable(msg.sender)
    {}

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
    }

    function mintAchievement(
        address to,
        string memory name,
        string memory description,
        string memory imageURI,
        uint256 rarity
    ) external returns (uint256) {
        require(minters[msg.sender], "Not authorized to mint");
        require(
            !hasAchievement[to][name],
            "Achievement already exists for this player"
        );

        _tokenIds += 1;
        uint256 tokenId = _tokenIds;

        achievements[tokenId] = Achievement({
            name: name,
            description: description,
            imageURI: imageURI,
            rarity: rarity,
            timestamp: block.timestamp
        });

        hasAchievement[to][name] = true;
        _mint(to, tokenId);

        emit AchievementMinted(to, tokenId, name);
        return tokenId;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        // In OZ v5, _exists was removed; use _ownerOf to check existence
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return achievements[tokenId].imageURI;
    }

    // Required overrides for ERC721Enumerable (OZ v5)
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
}
