// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CharacterRegistry.sol";
import "./ReputationOracle.sol";

/**
 * @title Guild Manager
 * @dev Manages guild creation, membership, and collaborative activities
 */
contract GuildManager is Ownable, ReentrancyGuard {
    CharacterRegistry public immutable characterRegistry;
    ReputationOracle public immutable reputationOracle;

    struct Guild {
        string name;
        string description;
        address leader;
        address[] members;
        mapping(address => bool) isMember;
        uint256 totalPower; // Combined member reputation
        uint256 treasury; // Guild funds
        bool isActive;
        uint256 createdAt;
    }

    mapping(uint256 => Guild) public guilds;
    mapping(address => uint256) public playerGuild; // player => guild ID
    mapping(string => bool) public guildNameTaken;

    uint256 public guildCounter;
    // Minimum total members including leader; tests use leader + 1 initial member
    uint256 public constant MIN_MEMBERS_TO_CREATE = 2;
    uint256 public constant GUILD_CREATION_FEE = 0.1 ether;

    event GuildCreated(
        uint256 indexed guildId,
        string name,
        address indexed leader
    );
    event MemberJoined(uint256 indexed guildId, address indexed member);
    event MemberLeft(uint256 indexed guildId, address indexed member);
    event LeadershipTransferred(
        uint256 indexed guildId,
        address indexed oldLeader,
        address indexed newLeader
    );

    constructor(
        address _characterRegistry,
        address _reputationOracle
    ) Ownable(msg.sender) {
        characterRegistry = CharacterRegistry(_characterRegistry);
        reputationOracle = ReputationOracle(_reputationOracle);
    }

    function createGuild(
        string memory name,
        string memory description,
        address[] memory initialMembers
    ) external payable nonReentrant {
        require(
            msg.value >= GUILD_CREATION_FEE,
            "Insufficient guild creation fee"
        );
        require(!guildNameTaken[name], "Guild name already taken");
        require(
            initialMembers.length + 1 >= MIN_MEMBERS_TO_CREATE,
            "Not enough initial members"
        );
        require(playerGuild[msg.sender] == 0, "Already in a guild");

        guildCounter++;
        Guild storage guild = guilds[guildCounter];
        guild.name = name;
        guild.description = description;
        guild.leader = msg.sender;
        guild.isActive = true;
        guild.createdAt = block.timestamp;

        // Add leader
        guild.members.push(msg.sender);
        guild.isMember[msg.sender] = true;
        playerGuild[msg.sender] = guildCounter;
        guild.totalPower += reputationOracle.getAllyPower(msg.sender);

        // Add initial members
        for (uint i = 0; i < initialMembers.length; i++) {
            require(
                playerGuild[initialMembers[i]] == 0,
                "Member already in a guild"
            );
            guild.members.push(initialMembers[i]);
            guild.isMember[initialMembers[i]] = true;
            playerGuild[initialMembers[i]] = guildCounter;
            guild.totalPower += reputationOracle.getAllyPower(
                initialMembers[i]
            );
        }

        guildNameTaken[name] = true;
        emit GuildCreated(guildCounter, name, msg.sender);
    }

    function joinGuild(uint256 guildId) external {
        require(playerGuild[msg.sender] == 0, "Already in a guild");
        Guild storage guild = guilds[guildId];
        require(guild.isActive, "Guild not active");
        require(!guild.isMember[msg.sender], "Already a member");

        guild.members.push(msg.sender);
        guild.isMember[msg.sender] = true;
        playerGuild[msg.sender] = guildId;
        guild.totalPower += reputationOracle.getAllyPower(msg.sender);

        emit MemberJoined(guildId, msg.sender);
    }

    function leaveGuild() external {
        uint256 guildId = playerGuild[msg.sender];
        require(guildId > 0, "Not in a guild");

        Guild storage guild = guilds[guildId];
        require(
            guild.leader != msg.sender,
            "Leader cannot leave without transferring leadership"
        );

        guild.isMember[msg.sender] = false;
        playerGuild[msg.sender] = 0;
        guild.totalPower -= reputationOracle.getAllyPower(msg.sender);

        // Remove from members array
        for (uint i = 0; i < guild.members.length; i++) {
            if (guild.members[i] == msg.sender) {
                guild.members[i] = guild.members[guild.members.length - 1];
                guild.members.pop();
                break;
            }
        }

        emit MemberLeft(guildId, msg.sender);
    }

    function transferLeadership(address newLeader) external {
        uint256 guildId = playerGuild[msg.sender];
        require(guildId > 0, "Not in a guild");

        Guild storage guild = guilds[guildId];
        require(guild.leader == msg.sender, "Not the guild leader");
        require(guild.isMember[newLeader], "New leader must be a member");

        address oldLeader = guild.leader;
        guild.leader = newLeader;

        emit LeadershipTransferred(guildId, oldLeader, newLeader);
    }

    function getGuildMembers(
        uint256 guildId
    ) external view returns (address[] memory) {
        return guilds[guildId].members;
    }

    function getGuildInfo(
        uint256 guildId
    )
        external
        view
        returns (
            string memory name,
            string memory description,
            address leader,
            uint256 memberCount,
            uint256 totalPower,
            bool isActive
        )
    {
        Guild storage guild = guilds[guildId];
        return (
            guild.name,
            guild.description,
            guild.leader,
            guild.members.length,
            guild.totalPower,
            guild.isActive
        );
    }
}
