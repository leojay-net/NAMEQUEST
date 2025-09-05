// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GuildManager.sol";
import "./CharacterRegistry.sol";
import "./QuestToken.sol";
import "./AchievementNFT.sol";

/**
 * @title Tournament Manager
 * @dev Manages competitive events and tournaments between guilds
 */
contract TournamentManager is Ownable, ReentrancyGuard {
    GuildManager public immutable guildManager;
    CharacterRegistry public immutable characterRegistry;
    QuestToken public immutable questToken;
    AchievementNFT public immutable achievementNFT;

    enum TournamentType {
        GUILD_VS_GUILD,
        BATTLE_ROYALE,
        SKILL_GAUNTLET
    }
    enum TournamentStatus {
        REGISTRATION,
        ACTIVE,
        COMPLETED
    }

    struct Tournament {
        TournamentType tournamentType;
        string name;
        uint256[] participatingGuilds;
        mapping(uint256 => bool) hasRegistered;
        uint256 registrationFee;
        uint256 prizePool;
        uint256 startTime;
        uint256 endTime;
        TournamentStatus status;
        uint256 winnerGuild;
        mapping(uint256 => uint256) guildScores;
    }

    mapping(uint256 => Tournament) public tournaments;
    uint256 public tournamentCounter;

    event TournamentCreated(
        uint256 indexed tournamentId,
        string name,
        TournamentType tournamentType
    );
    event GuildRegistered(
        uint256 indexed tournamentId,
        uint256 indexed guildId
    );
    event TournamentStarted(uint256 indexed tournamentId);
    event TournamentCompleted(
        uint256 indexed tournamentId,
        uint256 winnerGuildId
    );

    constructor(
        address _guildManager,
        address _characterRegistry,
        address _questToken,
        address _achievementNFT
    ) Ownable(msg.sender) {
        guildManager = GuildManager(_guildManager);
        characterRegistry = CharacterRegistry(_characterRegistry);
        questToken = QuestToken(_questToken);
        achievementNFT = AchievementNFT(_achievementNFT);
    }

    function createTournament(
        TournamentType tournamentType,
        string memory name,
        uint256 registrationFee,
        uint256 duration
    ) external onlyOwner returns (uint256) {
        tournamentCounter++;

        Tournament storage tournament = tournaments[tournamentCounter];
        tournament.tournamentType = tournamentType;
        tournament.name = name;
        tournament.registrationFee = registrationFee;
        tournament.startTime = block.timestamp + 1 days; // Registration period
        tournament.endTime = tournament.startTime + duration;
        tournament.status = TournamentStatus.REGISTRATION;

        emit TournamentCreated(tournamentCounter, name, tournamentType);
        return tournamentCounter;
    }

    function registerGuild(uint256 tournamentId) external payable {
        Tournament storage tournament = tournaments[tournamentId];
        require(
            tournament.status == TournamentStatus.REGISTRATION,
            "Registration not open"
        );
        require(
            msg.value >= tournament.registrationFee,
            "Insufficient registration fee"
        );

        uint256 guildId = guildManager.playerGuild(msg.sender);
        require(guildId > 0, "Not in a guild");
        require(!tournament.hasRegistered[guildId], "Guild already registered");

        // Check if sender is guild leader
        (, , address leader, , , ) = guildManager.getGuildInfo(guildId);
        require(leader == msg.sender, "Only guild leader can register");

        tournament.participatingGuilds.push(guildId);
        tournament.hasRegistered[guildId] = true;
        tournament.prizePool += msg.value;

        emit GuildRegistered(tournamentId, guildId);

        // Refund excess payment
        if (msg.value > tournament.registrationFee) {
            payable(msg.sender).transfer(
                msg.value - tournament.registrationFee
            );
        }
    }

    function startTournament(uint256 tournamentId) external onlyOwner {
        Tournament storage tournament = tournaments[tournamentId];
        require(
            tournament.status == TournamentStatus.REGISTRATION,
            "Tournament not in registration"
        );
        require(
            tournament.participatingGuilds.length >= 2,
            "Need at least 2 guilds"
        );
        require(
            block.timestamp >= tournament.startTime,
            "Tournament start time not reached"
        );

        tournament.status = TournamentStatus.ACTIVE;
        emit TournamentStarted(tournamentId);
    }

    function submitScore(
        uint256 tournamentId,
        uint256 guildId,
        uint256 score
    ) external onlyOwner {
        Tournament storage tournament = tournaments[tournamentId];
        require(
            tournament.status == TournamentStatus.ACTIVE,
            "Tournament not active"
        );
        require(tournament.hasRegistered[guildId], "Guild not registered");

        tournament.guildScores[guildId] = score;
    }

    function completeTournament(uint256 tournamentId) external onlyOwner {
        Tournament storage tournament = tournaments[tournamentId];
        require(
            tournament.status == TournamentStatus.ACTIVE,
            "Tournament not active"
        );
        require(
            block.timestamp >= tournament.endTime,
            "Tournament not yet ended"
        );

        // Find winner (highest score)
        uint256 winnerGuild = 0;
        uint256 highestScore = 0;

        for (uint i = 0; i < tournament.participatingGuilds.length; i++) {
            uint256 guildId = tournament.participatingGuilds[i];
            if (tournament.guildScores[guildId] > highestScore) {
                highestScore = tournament.guildScores[guildId];
                winnerGuild = guildId;
            }
        }

        tournament.status = TournamentStatus.COMPLETED;
        tournament.winnerGuild = winnerGuild;

        // Distribute prizes
        if (winnerGuild > 0) {
            _distributePrizes(tournamentId, winnerGuild);
        }

        emit TournamentCompleted(tournamentId, winnerGuild);
    }

    function _distributePrizes(
        uint256 tournamentId,
        uint256 winnerGuildId
    ) internal {
        Tournament storage tournament = tournaments[tournamentId];

        // Get guild members
        address[] memory members = guildManager.getGuildMembers(winnerGuildId);

        // Distribute prize pool equally among winners
        uint256 prizePerMember = tournament.prizePool / members.length;

        for (uint i = 0; i < members.length; i++) {
            // Award tokens
            questToken.mint(members[i], prizePerMember * 10); // Convert ETH to token amount

            // Award experience
            characterRegistry.gainExperience(members[i], 1000);

            // Award tournament achievement
            achievementNFT.mintAchievement(
                members[i],
                string(
                    abi.encodePacked("Tournament Champion: ", tournament.name)
                ),
                "Won a guild tournament",
                "",
                3 // Epic rarity
            );
        }
    }

    function getTournamentGuilds(
        uint256 tournamentId
    ) external view returns (uint256[] memory) {
        return tournaments[tournamentId].participatingGuilds;
    }

    function getGuildScore(
        uint256 tournamentId,
        uint256 guildId
    ) external view returns (uint256) {
        return tournaments[tournamentId].guildScores[guildId];
    }
}
