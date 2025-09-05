// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CharacterRegistry.sol";
import "./GuildManager.sol";
import "./QuestToken.sol";
import "./AchievementNFT.sol";

/**
 * @title Social Quest Manager
 * @dev Manages collaborative quests and guild activities
 */
contract SocialQuestManager is Ownable, ReentrancyGuard {
    CharacterRegistry public immutable characterRegistry;
    GuildManager public immutable guildManager;
    QuestToken public immutable questToken;
    AchievementNFT public immutable achievementNFT;

    enum SocialQuestType {
        ALLIANCE_RAID,
        GUILD_TOURNAMENT,
        TRUST_TRIAL,
        COLLABORATIVE_BUILD
    }
    enum QuestStatus {
        CREATED,
        ACTIVE,
        COMPLETED,
        FAILED
    }

    struct SocialQuest {
        SocialQuestType questType;
        uint256 minParticipants;
        uint256 maxParticipants;
        uint256 duration;
        uint256 experienceReward;
        uint256 tokenReward;
        address[] participants;
        mapping(address => bool) hasJoined;
        QuestStatus status;
        uint256 startTime;
        uint256 endTime;
        bytes32 questData; // Additional quest-specific data
    }

    mapping(uint256 => SocialQuest) public socialQuests;
    mapping(address => uint256[]) public playerActiveQuests;

    uint256 public questCounter;

    event SocialQuestCreated(
        uint256 indexed questId,
        SocialQuestType questType,
        uint256 minParticipants
    );
    event PlayerJoinedQuest(uint256 indexed questId, address indexed player);
    event QuestStarted(uint256 indexed questId, uint256 participantCount);
    event QuestCompleted(uint256 indexed questId, address[] participants);

    constructor(
        address _characterRegistry,
        address _guildManager,
        address _questToken,
        address _achievementNFT
    ) Ownable(msg.sender) {
        characterRegistry = CharacterRegistry(_characterRegistry);
        guildManager = GuildManager(_guildManager);
        questToken = QuestToken(_questToken);
        achievementNFT = AchievementNFT(_achievementNFT);
    }

    function createSocialQuest(
        SocialQuestType questType,
        uint256 minParticipants,
        uint256 maxParticipants,
        uint256 duration,
        uint256 experienceReward,
        uint256 tokenReward
    ) external returns (uint256) {
        questCounter++;

        SocialQuest storage quest = socialQuests[questCounter];
        quest.questType = questType;
        quest.minParticipants = minParticipants;
        quest.maxParticipants = maxParticipants;
        quest.duration = duration;
        quest.experienceReward = experienceReward;
        quest.tokenReward = tokenReward;
        quest.status = QuestStatus.CREATED;

        emit SocialQuestCreated(questCounter, questType, minParticipants);
        return questCounter;
    }

    function joinQuest(uint256 questId) external {
        SocialQuest storage quest = socialQuests[questId];
        require(
            quest.status == QuestStatus.CREATED,
            "Quest not available for joining"
        );
        require(!quest.hasJoined[msg.sender], "Already joined this quest");
        require(
            quest.participants.length < quest.maxParticipants,
            "Quest is full"
        );

        quest.participants.push(msg.sender);
        quest.hasJoined[msg.sender] = true;
        playerActiveQuests[msg.sender].push(questId);

        emit PlayerJoinedQuest(questId, msg.sender);

        // Auto-start if minimum participants reached
        if (quest.participants.length >= quest.minParticipants) {
            _startQuest(questId);
        }
    }

    function _startQuest(uint256 questId) internal {
        SocialQuest storage quest = socialQuests[questId];
        quest.status = QuestStatus.ACTIVE;
        quest.startTime = block.timestamp;
        quest.endTime = block.timestamp + quest.duration;

        emit QuestStarted(questId, quest.participants.length);
    }

    function completeQuest(uint256 questId, bytes memory proof) external {
        SocialQuest storage quest = socialQuests[questId];
        require(quest.status == QuestStatus.ACTIVE, "Quest not active");
        require(quest.hasJoined[msg.sender], "Not a participant");
        require(block.timestamp <= quest.endTime, "Quest expired");

        // Verify quest completion (simplified)
        require(
            _verifySocialQuestCompletion(questId, proof),
            "Quest verification failed"
        );

        quest.status = QuestStatus.COMPLETED;

        // Distribute rewards to all participants
        for (uint i = 0; i < quest.participants.length; i++) {
            address participant = quest.participants[i];
            characterRegistry.gainExperience(
                participant,
                quest.experienceReward
            );
            questToken.mint(participant, quest.tokenReward);

            // Award collaboration achievement
            if (quest.questType == SocialQuestType.ALLIANCE_RAID) {
                achievementNFT.mintAchievement(
                    participant,
                    "Alliance Raider",
                    "Successfully completed an alliance raid",
                    "",
                    2
                );
            }
        }

        emit QuestCompleted(questId, quest.participants);
    }

    function _verifySocialQuestCompletion(
        uint256 questId,
        bytes memory proof
    ) internal view returns (bool) {
        // Simplified verification - in practice would verify collaborative completion
        return true;
    }

    function expireQuest(uint256 questId) external {
        SocialQuest storage quest = socialQuests[questId];
        require(quest.status == QuestStatus.ACTIVE, "Quest not active");
        require(block.timestamp > quest.endTime, "Quest not yet expired");

        quest.status = QuestStatus.FAILED;

        // Remove from player active quests
        for (uint i = 0; i < quest.participants.length; i++) {
            _removeQuestFromPlayer(quest.participants[i], questId);
        }
    }

    function _removeQuestFromPlayer(address player, uint256 questId) internal {
        uint256[] storage activeQuests = playerActiveQuests[player];
        for (uint i = 0; i < activeQuests.length; i++) {
            if (activeQuests[i] == questId) {
                activeQuests[i] = activeQuests[activeQuests.length - 1];
                activeQuests.pop();
                break;
            }
        }
    }

    function getQuestParticipants(
        uint256 questId
    ) external view returns (address[] memory) {
        return socialQuests[questId].participants;
    }

    function getPlayerActiveQuests(
        address player
    ) external view returns (uint256[] memory) {
        return playerActiveQuests[player];
    }
}
