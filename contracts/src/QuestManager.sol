// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ExternalInterfaces.sol";
import "./CharacterRegistry.sol";
import "./ReputationOracle.sol";
import "./QuestToken.sol";
import "./AchievementNFT.sol";

/**
 * @title Quest Manager
 * @dev Manages quest completion, rewards, and daily rotations
 */
contract QuestManager is Ownable, ReentrancyGuard, Pausable {
    CharacterRegistry public immutable characterRegistry;
    ReputationOracle public immutable reputationOracle;
    QuestToken public immutable questToken;
    AchievementNFT public immutable achievementNFT;

    enum QuestType {
        CIPHER_CHAMBER,
        ELEMENTAL_FORGE,
        SHADOW_DUEL,
        MEMORY_VAULT,
        RESOURCE_RUSH
    }
    enum QuestDifficulty {
        EASY,
        MEDIUM,
        HARD,
        LEGENDARY
    }

    struct Quest {
        QuestType questType;
        QuestDifficulty difficulty;
        uint256 experienceReward;
        uint256 tokenReward;
        string achievementName;
        bool isActive;
        uint256 completionCount;
        mapping(address => uint256) lastCompleted; // player => timestamp
    }

    struct DailyQuest {
        uint256 questId;
        uint256 resetTime;
    }

    mapping(uint256 => Quest) public quests;
    mapping(uint256 => DailyQuest) public dailyQuests;
    mapping(address => mapping(uint256 => bool)) public hasCompletedQuest;

    uint256 public questCounter;
    uint256 public constant DAILY_RESET_INTERVAL = 24 hours;
    uint256 public constant QUEST_COOLDOWN = 1 hours;

    event QuestCompleted(
        address indexed player,
        uint256 indexed questId,
        uint256 experience,
        uint256 tokens
    );
    event QuestCreated(
        uint256 indexed questId,
        QuestType questType,
        QuestDifficulty difficulty
    );

    constructor(
        address _characterRegistry,
        address _reputationOracle,
        address _questToken,
        address _achievementNFT
    ) Ownable(msg.sender) {
        characterRegistry = CharacterRegistry(_characterRegistry);
        reputationOracle = ReputationOracle(_reputationOracle);
        questToken = QuestToken(_questToken);
        achievementNFT = AchievementNFT(_achievementNFT);

        _createInitialQuests();
    }

    function _createInitialQuests() internal {
        // Cipher Chamber - Easy
        _createQuest(
            QuestType.CIPHER_CHAMBER,
            QuestDifficulty.EASY,
            100,
            10 * 1e18,
            "Cipher Novice"
        );
        // Shadow Duel - Medium
        _createQuest(
            QuestType.SHADOW_DUEL,
            QuestDifficulty.MEDIUM,
            200,
            25 * 1e18,
            "Combat Veteran"
        );
        // Memory Vault - Hard
        _createQuest(
            QuestType.MEMORY_VAULT,
            QuestDifficulty.HARD,
            500,
            50 * 1e18,
            "Perfect Memory"
        );
    }

    function _createQuest(
        QuestType questType,
        QuestDifficulty difficulty,
        uint256 experienceReward,
        uint256 tokenReward,
        string memory achievementName
    ) internal {
        questCounter++;
        Quest storage quest = quests[questCounter];
        quest.questType = questType;
        quest.difficulty = difficulty;
        quest.experienceReward = experienceReward;
        quest.tokenReward = tokenReward;
        quest.achievementName = achievementName;
        quest.isActive = true;

        emit QuestCreated(questCounter, questType, difficulty);
    }

    function completeQuest(
        uint256 questId,
        bytes memory proof
    ) external nonReentrant whenNotPaused {
        Quest storage quest = quests[questId];
        require(quest.isActive, "Quest not active");
        // Allow first completion immediately; enforce cooldown only after first completion
        if (quest.lastCompleted[msg.sender] != 0) {
            require(
                block.timestamp >=
                    quest.lastCompleted[msg.sender] + QUEST_COOLDOWN,
                "Quest cooldown not met"
            );
        }

        // Verify quest completion (simplified - in practice, would verify proof)
        require(
            _verifyQuestCompletion(questId, msg.sender, proof),
            "Quest verification failed"
        );

        quest.lastCompleted[msg.sender] = block.timestamp;
        quest.completionCount++;

        // Calculate rewards with reputation multipliers
        uint256 baseExp = quest.experienceReward;
        uint256 baseTokens = quest.tokenReward;

        uint256 accessLevel = reputationOracle.getAccessLevel(msg.sender);
        uint256 multiplier = accessLevel * 25; // 25%, 50%, 75%, 100% bonus

        uint256 finalExp = baseExp + ((baseExp * multiplier) / 100);
        uint256 finalTokens = baseTokens + ((baseTokens * multiplier) / 100);

        // Award rewards
        characterRegistry.gainExperience(msg.sender, finalExp);
        questToken.mint(msg.sender, finalTokens);

        // Mint achievement if it's a first completion
        if (!hasCompletedQuest[msg.sender][questId]) {
            hasCompletedQuest[msg.sender][questId] = true;
            if (bytes(quest.achievementName).length > 0) {
                achievementNFT.mintAchievement(
                    msg.sender,
                    quest.achievementName,
                    "Quest completion achievement",
                    "",
                    uint256(quest.difficulty) + 1
                );
            }
        }

        emit QuestCompleted(msg.sender, questId, finalExp, finalTokens);
    }

    function _verifyQuestCompletion(
        uint256 questId,
        address player,
        bytes memory proof
    ) internal view returns (bool) {
        // Simplified verification - in practice, would implement proper proof verification
        // For different quest types, different verification methods would be used
        return true;
    }

    function createQuest(
        QuestType questType,
        QuestDifficulty difficulty,
        uint256 experienceReward,
        uint256 tokenReward,
        string memory achievementName
    ) external onlyOwner {
        _createQuest(
            questType,
            difficulty,
            experienceReward,
            tokenReward,
            achievementName
        );
    }

    function setQuestActive(uint256 questId, bool active) external onlyOwner {
        quests[questId].isActive = active;
    }

    function getQuestInfo(
        uint256 questId
    )
        external
        view
        returns (
            QuestType questType,
            QuestDifficulty difficulty,
            uint256 experienceReward,
            uint256 tokenReward,
            bool isActive,
            uint256 completionCount
        )
    {
        Quest storage quest = quests[questId];
        return (
            quest.questType,
            quest.difficulty,
            quest.experienceReward,
            quest.tokenReward,
            quest.isActive,
            quest.completionCount
        );
    }
}
