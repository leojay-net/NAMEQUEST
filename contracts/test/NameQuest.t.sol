// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/interfaces/ExternalInterfaces.sol";
import "../src/QuestToken.sol";
import "../src/AchievementNFT.sol";
import "../src/CharacterRegistry.sol";
import "../src/ReputationOracle.sol";
import "../src/QuestManager.sol";
import "../src/SubNameFactory.sol";
import "../src/GuildManager.sol";
import "../src/SocialQuestManager.sol";
import "../src/TournamentManager.sol";
import "../src/MarketPlace.sol";
import "./MockENS.sol";
import "./MockEFPOracle.sol";

/**
 * @title NameQuest Core Tests
 */
contract NameQuestTest is Test {
    // Core contracts
    QuestToken questToken;
    AchievementNFT achievementNFT;
    CharacterRegistry characterRegistry;
    ReputationOracle reputationOracle;
    QuestManager questManager;
    SubnameFactory subnameFactory;
    GuildManager guildManager;
    SocialQuestManager socialQuestManager;
    TournamentManager tournamentManager;
    Marketplace marketplace;

    // Mock contracts
    MockENS mockENS;
    MockEFPOracle mockEFPOracle;

    // Test accounts
    address owner = address(this);
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");
    address david = makeAddr("david");

    // ENS nodes
    bytes32 aliceNode = keccak256("alice.eth");
    bytes32 bobNode = keccak256("bob.eth");
    bytes32 carolNode = keccak256("carol.eth");
    bytes32 davidNode = keccak256("david.eth");

    function setUp() public {
        // Deploy mock contracts
        mockENS = new MockENS();
        mockEFPOracle = new MockEFPOracle();

        // Set up ENS ownership
        mockENS.setOwner(aliceNode, alice);
        mockENS.setOwner(bobNode, bob);
        mockENS.setOwner(carolNode, carol);
        mockENS.setOwner(davidNode, david);

        // Deploy core contracts
        questToken = new QuestToken();
        achievementNFT = new AchievementNFT();

        characterRegistry = new CharacterRegistry(
            address(mockENS),
            address(questToken),
            address(achievementNFT)
        );

        reputationOracle = new ReputationOracle(address(mockEFPOracle));

        questManager = new QuestManager(
            address(characterRegistry),
            address(reputationOracle),
            address(questToken),
            address(achievementNFT)
        );

        subnameFactory = new SubnameFactory(
            address(mockENS),
            address(characterRegistry),
            address(reputationOracle)
        );

        guildManager = new GuildManager(
            address(characterRegistry),
            address(reputationOracle)
        );

        socialQuestManager = new SocialQuestManager(
            address(characterRegistry),
            address(guildManager),
            address(questToken),
            address(achievementNFT)
        );

        tournamentManager = new TournamentManager(
            address(guildManager),
            address(characterRegistry),
            address(questToken),
            address(achievementNFT)
        );

        marketplace = new Marketplace(
            address(achievementNFT),
            address(reputationOracle),
            address(questToken)
        );

        // Set up permissions
        questToken.addMinter(address(questManager));
        questToken.addMinter(address(socialQuestManager));
        questToken.addMinter(address(tournamentManager));
        questToken.addMinter(address(marketplace));

        achievementNFT.addMinter(address(characterRegistry));
        achievementNFT.addMinter(address(questManager));
        achievementNFT.addMinter(address(socialQuestManager));
        achievementNFT.addMinter(address(tournamentManager));

        reputationOracle.addAuthorizedUpdater(address(questManager));

        // Authorize game systems to modify character stats
        characterRegistry.setGameSystem(address(questManager), true);
        characterRegistry.setGameSystem(address(socialQuestManager), true);
        characterRegistry.setGameSystem(address(tournamentManager), true);
        characterRegistry.setGameSystem(address(subnameFactory), true);

        // Set up test reputation data
        mockEFPOracle.setFollowerCount(alice, 100);
        mockEFPOracle.setTrustScore(alice, 800);
        mockEFPOracle.addAttestation(alice, "Verified Developer");

        mockEFPOracle.setFollowerCount(bob, 50);
        mockEFPOracle.setTrustScore(bob, 400);

        mockEFPOracle.setFollowerCount(carol, 25);
        mockEFPOracle.setTrustScore(carol, 200);

        // Fund test accounts
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(carol, 10 ether);
        vm.deal(david, 10 ether);
    }

    function testCharacterCreation() public {
        vm.startPrank(alice);

        characterRegistry.createCharacter(aliceNode);

        (
            uint256 level,
            uint256 experience,
            uint256 questsCompleted,
            string memory primarySubname
        ) = characterRegistry.getCharacterStats(alice);

        assertEq(level, 1);
        assertEq(experience, 0);
        assertEq(questsCompleted, 0);
        assertEq(characterRegistry.getStat(alice, "strength"), 10);

        vm.stopPrank();
    }

    function testExperienceGainAndLevelUp() public {
        vm.startPrank(alice);
        characterRegistry.createCharacter(aliceNode);
        vm.stopPrank();

        // Owner gains experience for alice
        characterRegistry.gainExperience(alice, 1500);

        (uint256 level, uint256 experience, , ) = characterRegistry
            .getCharacterStats(alice);
        assertEq(level, 2); // 1500 / 1000 + 1 = 2
        assertEq(experience, 1500);
        assertEq(characterRegistry.getStat(alice, "strength"), 12); // 10 + 2
    }

    function testQuestCompletion() public {
        vm.startPrank(alice);
        characterRegistry.createCharacter(aliceNode);

        // Update reputation first
        reputationOracle.updateReputation(alice);

        // Complete a quest
        bytes memory proof = "simple_proof";
        questManager.completeQuest(1, proof); // Quest ID 1 should exist from setup

        // Check rewards
        assertTrue(questToken.balanceOf(alice) > 0);

        (uint256 level, uint256 experience, , ) = characterRegistry
            .getCharacterStats(alice);
        assertTrue(experience > 0);

        vm.stopPrank();
    }

    function testSubnameMinting() public {
        vm.startPrank(alice);
        characterRegistry.createCharacter(aliceNode);

        // Mint warrior subname
        subnameFactory.mintSubname{value: 0.01 ether}("warrior", aliceNode);

        assertTrue(subnameFactory.playerOwnsSubname(alice, "warrior"));
        assertTrue(characterRegistry.hasAbility(alice, "warrior_abilities"));

        vm.stopPrank();
    }

    function testGuildCreation() public {
        // Create characters
        vm.prank(alice);
        characterRegistry.createCharacter(aliceNode);
        vm.prank(bob);
        characterRegistry.createCharacter(bobNode);
        vm.prank(carol);
        characterRegistry.createCharacter(carolNode);

        // Alice creates a guild
        address[] memory initialMembers = new address[](2);
        initialMembers[0] = bob;
        initialMembers[1] = carol;

        vm.prank(alice);
        guildManager.createGuild{value: 0.1 ether}(
            "Test Guild",
            "A test guild",
            initialMembers
        );

        // Check guild was created
        (
            string memory name,
            string memory description,
            address leader,
            uint256 memberCount,
            ,

        ) = guildManager.getGuildInfo(1);

        assertEq(name, "Test Guild");
        assertEq(leader, alice);
        assertEq(memberCount, 3); // Alice + 2 initial members

        // Check memberships
        assertEq(guildManager.playerGuild(alice), 1);
        assertEq(guildManager.playerGuild(bob), 1);
        assertEq(guildManager.playerGuild(carol), 1);
    }

    function testSocialQuest() public {
        // Set up characters and guild
        vm.prank(alice);
        characterRegistry.createCharacter(aliceNode);
        vm.prank(bob);
        characterRegistry.createCharacter(bobNode);
        vm.prank(carol);
        characterRegistry.createCharacter(carolNode);

        address[] memory initialMembers = new address[](2);
        initialMembers[0] = bob;
        initialMembers[1] = carol;

        vm.prank(alice);
        guildManager.createGuild{value: 0.1 ether}(
            "Test Guild",
            "A test guild",
            initialMembers
        );

        // Create social quest
        uint256 questId = socialQuestManager.createSocialQuest(
            SocialQuestManager.SocialQuestType.ALLIANCE_RAID,
            3, // min participants
            5, // max participants
            1 hours, // duration
            500, // experience reward
            100 * 1e18 // token reward
        );

        // Players join quest
        vm.prank(alice);
        socialQuestManager.joinQuest(questId);
        vm.prank(bob);
        socialQuestManager.joinQuest(questId);
        vm.prank(carol);
        socialQuestManager.joinQuest(questId);

        // Complete quest
        bytes memory proof = "collaboration_proof";
        vm.prank(alice);
        socialQuestManager.completeQuest(questId, proof);

        // Check all participants received rewards
        assertTrue(questToken.balanceOf(alice) > 0);
        assertTrue(questToken.balanceOf(bob) > 0);
        assertTrue(questToken.balanceOf(carol) > 0);
    }

    function testTournament() public {
        // Set up two guilds
        vm.prank(alice);
        characterRegistry.createCharacter(aliceNode);
        vm.prank(bob);
        characterRegistry.createCharacter(bobNode);
        vm.prank(carol);
        characterRegistry.createCharacter(carolNode);
        vm.prank(david);
        characterRegistry.createCharacter(davidNode);

        // Guild 1: Alice + Bob
        address[] memory guild1Members = new address[](1);
        guild1Members[0] = bob;
        vm.prank(alice);
        guildManager.createGuild{value: 0.1 ether}(
            "Guild Alpha",
            "First guild",
            guild1Members
        );

        // Guild 2: Carol + David
        address[] memory guild2Members = new address[](1);
        guild2Members[0] = david;
        vm.prank(carol);
        guildManager.createGuild{value: 0.1 ether}(
            "Guild Beta",
            "Second guild",
            guild2Members
        );

        // Create tournament
        uint256 tournamentId = tournamentManager.createTournament(
            TournamentManager.TournamentType.GUILD_VS_GUILD,
            "Test Tournament",
            0.05 ether,
            2 hours
        );

        // Register guilds
        vm.prank(alice);
        tournamentManager.registerGuild{value: 0.05 ether}(tournamentId);
        vm.prank(carol);
        tournamentManager.registerGuild{value: 0.05 ether}(tournamentId);

        // Start tournament
        vm.warp(block.timestamp + 1 days + 1);
        tournamentManager.startTournament(tournamentId);

        // Submit scores
        tournamentManager.submitScore(tournamentId, 1, 100); // Guild 1 score
        tournamentManager.submitScore(tournamentId, 2, 150); // Guild 2 score

        // Complete tournament
        vm.warp(block.timestamp + 2 hours + 1);
        tournamentManager.completeTournament(tournamentId);

        // Check winners received rewards
        assertTrue(questToken.balanceOf(carol) > 0);
        assertTrue(questToken.balanceOf(david) > 0);
    }

    function testMarketplace() public {
        vm.startPrank(alice);
        characterRegistry.createCharacter(aliceNode);

        // Update reputation
        reputationOracle.updateReputation(alice);

        // Complete quest to get achievement NFT
        bytes memory proof = "quest_proof";
        questManager.completeQuest(1, proof);

        // Check alice has an NFT
        assertTrue(achievementNFT.balanceOf(alice) > 0);
        uint256 tokenId = achievementNFT.tokenOfOwnerByIndex(alice, 0);

        // Approve marketplace
        achievementNFT.approve(address(marketplace), tokenId);

        // List item
        marketplace.listItem(tokenId, 1 ether, 0);

        vm.stopPrank();

        // Bob buys the item
        vm.startPrank(bob);
        characterRegistry.createCharacter(bobNode);
        reputationOracle.updateReputation(bob);

        marketplace.buyItem{value: 1 ether}(1);

        // Check ownership transferred
        assertEq(achievementNFT.ownerOf(tokenId), bob);

        vm.stopPrank();
    }

    function testReputationIntegration() public {
        vm.startPrank(alice);
        characterRegistry.createCharacter(aliceNode);

        // Update reputation
        reputationOracle.updateReputation(alice);

        // Check reputation data
        assertEq(reputationOracle.getAllyPower(alice), 100);
        assertTrue(
            reputationOracle.hasAttestation(alice, "Verified Developer")
        );
        assertEq(reputationOracle.getAccessLevel(alice), 3); // 800 trust score = level 3

        vm.stopPrank();
    }

    function test_RevertWhen_NotEnsOwner_CreateCharacter() public {
        vm.prank(bob);
        vm.expectRevert("Not ENS owner");
        characterRegistry.createCharacter(aliceNode);
    }

    function test_RevertWhen_InsufficientLevel_MintSubname() public {
        vm.startPrank(alice);
        characterRegistry.createCharacter(aliceNode);

        // Try to mint legendary subname (requires level 25)
        vm.expectRevert("Level requirement not met");
        subnameFactory.mintSubname{value: 1 ether}("legendary", aliceNode);

        vm.stopPrank();
    }

    function test_RevertWhen_AlreadyMember_JoinGuild() public {
        vm.prank(alice);
        characterRegistry.createCharacter(aliceNode);
        vm.prank(bob);
        characterRegistry.createCharacter(bobNode);

        address[] memory initialMembers = new address[](1);
        initialMembers[0] = bob;

        vm.prank(alice);
        guildManager.createGuild{value: 0.1 ether}(
            "Test Guild",
            "A test guild",
            initialMembers
        );

        // Bob tries to join again
        vm.prank(bob);
        vm.expectRevert("Already in a guild");
        guildManager.joinGuild(1);
    }

    function test_RevertWhen_CooldownNotMet() public {
        vm.startPrank(alice);
        characterRegistry.createCharacter(aliceNode);
        reputationOracle.updateReputation(alice);

        bytes memory proof = "quest_proof";
        questManager.completeQuest(1, proof);

        // Try to complete same quest immediately
        vm.expectRevert("Quest cooldown not met");
        questManager.completeQuest(1, proof);

        vm.stopPrank();
    }
}
