// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/ExternalInterfaces.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./QuestToken.sol";
import "./AchievementNFT.sol";

/**
 * @title Character Registry
 * @dev Maps ENS names to hero stats and manages character progression
 */
contract CharacterRegistry is Ownable, ReentrancyGuard {
    IENS public immutable ens;
    QuestToken public immutable questToken;
    AchievementNFT public immutable achievementNFT;

    struct Character {
        uint256 level;
        uint256 experience;
        uint256 questsCompleted;
        string primarySubname; // e.g., "warrior.alice.eth"
        mapping(string => bool) unlockedAbilities;
        mapping(string => uint256) stats; // strength, magic, agility, etc.
        uint256 lastActive;
        bool initialized;
        bytes32 ensNode; // zero if not linked
        bool ensVerified; // true if ENS ownership verified
    }

    mapping(bytes32 => Character) public characters; // node hash => character
    mapping(address => bytes32) public playerToNode; // player address => ENS node (zero if none)
    mapping(bytes32 => address) public nodeToPlayer; // ENS node => player address
    mapping(address => Character) private addrCharacters; // address-only characters (no ENS)

    uint256 public constant EXPERIENCE_PER_LEVEL = 1000;
    uint256 public constant ACTIVITY_DECAY_TIME = 7 days;

    // Authorized game systems allowed to grant XP and unlock abilities
    mapping(address => bool) public gameSystems;

    event CharacterCreated(
        address indexed player,
        bytes32 indexed node,
        string ensName
    );
    event LevelUp(address indexed player, uint256 newLevel);
    event ExperienceGained(address indexed player, uint256 amount);
    event SubnameSet(address indexed player, string subname);

    constructor(
        address _ens,
        address _questToken,
        address _achievementNFT
    ) Ownable(msg.sender) {
        ens = IENS(_ens);
        questToken = QuestToken(_questToken);
        achievementNFT = AchievementNFT(_achievementNFT);
    }

    function setGameSystem(address system, bool allowed) external onlyOwner {
        gameSystems[system] = allowed;
    }

    function createCharacter(bytes32 node) external {
        require(ens.owner(node) == msg.sender, "Not ENS owner");
        require(
            !characters[node].initialized &&
                !addrCharacters[msg.sender].initialized,
            "Character already exists"
        );

        playerToNode[msg.sender] = node;
        nodeToPlayer[node] = msg.sender;

        Character storage character = characters[node];
        _initCharacter(character);
        character.ensNode = node;
        character.ensVerified = true;

        emit CharacterCreated(msg.sender, node, "");
    }

    function gainExperience(address player, uint256 amount) external {
        require(
            gameSystems[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        bytes32 node = playerToNode[player];
        Character storage character = node != bytes32(0)
            ? characters[node]
            : addrCharacters[player];
        require(character.initialized, "Character not found");
        character.experience += amount;
        character.lastActive = block.timestamp;

        // Check for level up
        uint256 newLevel = (character.experience / EXPERIENCE_PER_LEVEL) + 1;
        if (newLevel > character.level) {
            character.level = newLevel;

            // Stat increases on level up
            character.stats["strength"] += 2;
            character.stats["magic"] += 2;
            character.stats["agility"] += 2;
            character.stats["intellect"] += 2;

            // Mint level-up achievement
            if (newLevel == 5) {
                achievementNFT.mintAchievement(
                    player,
                    "Novice Hero",
                    "Reached level 5",
                    "",
                    1
                );
            } else if (newLevel == 10) {
                achievementNFT.mintAchievement(
                    player,
                    "Experienced Adventurer",
                    "Reached level 10",
                    "",
                    2
                );
            } else if (newLevel == 25) {
                achievementNFT.mintAchievement(
                    player,
                    "Master Explorer",
                    "Reached level 25",
                    "",
                    3
                );
            }

            emit LevelUp(player, newLevel);
        }

        emit ExperienceGained(player, amount);
    }

    function setPrimarySubname(string memory subname) external {
        bytes32 node = playerToNode[msg.sender];
        if (node != bytes32(0)) {
            require(characters[node].initialized, "Character not found");
            characters[node].primarySubname = subname;
            characters[node].lastActive = block.timestamp;
        } else {
            require(
                addrCharacters[msg.sender].initialized,
                "Character not found"
            );
            addrCharacters[msg.sender].primarySubname = subname;
            addrCharacters[msg.sender].lastActive = block.timestamp;
        }

        emit SubnameSet(msg.sender, subname);
    }

    function unlockAbility(address player, string memory ability) external {
        require(
            gameSystems[msg.sender] || msg.sender == owner(),
            "Not authorized"
        );
        bytes32 node = playerToNode[player];
        if (node != bytes32(0)) {
            require(characters[node].initialized, "Character not found");
            characters[node].unlockedAbilities[ability] = true;
        } else {
            require(addrCharacters[player].initialized, "Character not found");
            addrCharacters[player].unlockedAbilities[ability] = true;
        }
    }

    function getCharacterStats(
        address player
    )
        external
        view
        returns (
            uint256 level,
            uint256 experience,
            uint256 questsCompleted,
            string memory primarySubname
        )
    {
        bytes32 node = playerToNode[player];
        Character storage character = node != bytes32(0)
            ? characters[node]
            : addrCharacters[player];
        require(character.initialized, "Character not found");

        return (
            character.level,
            character.experience,
            character.questsCompleted,
            character.primarySubname
        );
    }

    function getStat(
        address player,
        string memory statName
    ) external view returns (uint256) {
        bytes32 node = playerToNode[player];
        if (node != bytes32(0)) {
            return characters[node].stats[statName];
        }
        return addrCharacters[player].stats[statName];
    }

    function hasAbility(
        address player,
        string memory ability
    ) external view returns (bool) {
        bytes32 node = playerToNode[player];
        if (node != bytes32(0)) {
            return characters[node].unlockedAbilities[ability];
        }
        return addrCharacters[player].unlockedAbilities[ability];
    }

    // --- Address-only creation and ENS linking ---
    function createCharacter() external {
        require(playerToNode[msg.sender] == bytes32(0), "ENS already linked");
        require(
            !addrCharacters[msg.sender].initialized,
            "Character already exists"
        );
        Character storage character = addrCharacters[msg.sender];
        _initCharacter(character);
        character.ensNode = bytes32(0);
        character.ensVerified = false;
        emit CharacterCreated(msg.sender, bytes32(0), "");
    }

    function linkEns(bytes32 node) external {
        require(ens.owner(node) == msg.sender, "Not ENS owner");
        require(
            nodeToPlayer[node] == address(0) ||
                nodeToPlayer[node] == msg.sender,
            "Node already linked"
        );

        // Initialize ENS slot if needed
        if (!characters[node].initialized) {
            _initCharacter(characters[node]);
        }
        // Migrate address-only stats if present
        if (addrCharacters[msg.sender].initialized) {
            _migrate(addrCharacters[msg.sender], characters[node]);
            delete addrCharacters[msg.sender];
        }

        playerToNode[msg.sender] = node;
        nodeToPlayer[node] = msg.sender;
        characters[node].ensNode = node;
        characters[node].ensVerified = true;
    }

    function hasCharacter(address player) external view returns (bool) {
        bytes32 node = playerToNode[player];
        if (node != bytes32(0)) {
            return characters[node].initialized;
        }
        return addrCharacters[player].initialized;
    }

    function _initCharacter(Character storage character) internal {
        character.level = 1;
        character.experience = 0;
        character.questsCompleted = 0;
        character.lastActive = block.timestamp;
        character.initialized = true;
        character.stats["strength"] = 10;
        character.stats["magic"] = 10;
        character.stats["agility"] = 10;
        character.stats["intellect"] = 10;
    }

    function _migrate(
        Character storage fromChar,
        Character storage toChar
    ) internal {
        toChar.level = fromChar.level;
        toChar.experience = fromChar.experience;
        toChar.questsCompleted = fromChar.questsCompleted;
        toChar.primarySubname = fromChar.primarySubname;
        toChar.lastActive = fromChar.lastActive;
        toChar.initialized = true;
        toChar.stats["strength"] = fromChar.stats["strength"];
        toChar.stats["magic"] = fromChar.stats["magic"];
        toChar.stats["agility"] = fromChar.stats["agility"];
        toChar.stats["intellect"] = fromChar.stats["intellect"];
    }
}
