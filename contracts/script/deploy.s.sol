// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
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
import "../src/oracles/UpdatableEFPOracle.sol";

/**
 * @title Deploy Script for NameQuest on Base
 */
contract DeployNameQuest is Script {
    // Base network addresses
    // Mainnet ENS registry; for other networks, provide ENS_REGISTRY_ADDRESS via env.
    address constant MAINNET_ENS = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;

    // Deployment configuration
    struct DeploymentConfig {
        address ensRegistry;
        address efpOracle;
        uint256 initialQuestCount;
        uint256 initialSubnameTypes;
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying from address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        DeploymentConfig memory config = getDeploymentConfig();

        // Deploy core contracts
        (
            QuestToken questToken,
            AchievementNFT achievementNFT,
            CharacterRegistry characterRegistry,
            ReputationOracle reputationOracle,
            QuestManager questManager,
            SubnameFactory subnameFactory,
            GuildManager guildManager,
            SocialQuestManager socialQuestManager,
            TournamentManager tournamentManager,
            Marketplace marketplace
        ) = deployContracts(config);

        // Set up permissions and initial data
        setupPermissions(
            questToken,
            achievementNFT,
            characterRegistry,
            reputationOracle,
            questManager,
            subnameFactory,
            guildManager,
            socialQuestManager,
            tournamentManager,
            marketplace
        );

        // Create initial content
        createInitialContent(questManager, subnameFactory, tournamentManager);

        vm.stopBroadcast();

        // Log deployment addresses
        logDeploymentAddresses(
            address(questToken),
            address(achievementNFT),
            address(characterRegistry),
            address(reputationOracle),
            address(questManager),
            address(subnameFactory),
            address(guildManager),
            address(socialQuestManager),
            address(tournamentManager),
            address(marketplace)
        );

        // Generate deployment verification script
        generateVerificationScript();
    }

    function getDeploymentConfig()
        internal
        view
        returns (DeploymentConfig memory)
    {
        uint256 chainId = block.chainid;
        address ensAddr;
        address efpAddr;

        if (chainId == 1) {
            // Ethereum mainnet
            ensAddr = MAINNET_ENS;
            efpAddr = vm.envAddress("EFP_ORACLE_ADDRESS");
        } else if (chainId == 8453) {
            // Base mainnet – provide ENS registry (L1) address and EFP oracle via env
            ensAddr = vm.envAddress("ENS_REGISTRY_ADDRESS");
            efpAddr = vm.envAddress("EFP_ORACLE_ADDRESS");
        } else {
            // Any other network – require explicit addresses, no mocks
            ensAddr = vm.envAddress("ENS_REGISTRY_ADDRESS");
            efpAddr = vm.envAddress("EFP_ORACLE_ADDRESS");
        }

        return
            DeploymentConfig({
                ensRegistry: ensAddr,
                efpOracle: efpAddr,
                initialQuestCount: 3,
                initialSubnameTypes: 3
            });
    }

    function deployContracts(
        DeploymentConfig memory config
    )
        internal
        returns (
            QuestToken questToken,
            AchievementNFT achievementNFT,
            CharacterRegistry characterRegistry,
            ReputationOracle reputationOracle,
            QuestManager questManager,
            SubnameFactory subnameFactory,
            GuildManager guildManager,
            SocialQuestManager socialQuestManager,
            TournamentManager tournamentManager,
            Marketplace marketplace
        )
    {
        console.log("Deploying NameQuest contracts...");

        // Use provided on-chain addresses; do not mock
        address ensRegistry = config.ensRegistry;
        address efpOracle = config.efpOracle;
        require(ensRegistry != address(0), "ENS_REGISTRY_ADDRESS required");
        require(efpOracle != address(0), "EFP_ORACLE_ADDRESS required");

        // Deploy core token contracts
        questToken = new QuestToken();
        console.log("Deployed QuestToken at:", address(questToken));

        achievementNFT = new AchievementNFT();
        console.log("Deployed AchievementNFT at:", address(achievementNFT));

        // Deploy game logic contracts
        characterRegistry = new CharacterRegistry(
            ensRegistry,
            address(questToken),
            address(achievementNFT)
        );
        console.log(
            "Deployed CharacterRegistry at:",
            address(characterRegistry)
        );

        reputationOracle = new ReputationOracle(efpOracle);
        console.log("Deployed ReputationOracle at:", address(reputationOracle));

        questManager = new QuestManager(
            address(characterRegistry),
            address(reputationOracle),
            address(questToken),
            address(achievementNFT)
        );
        console.log("Deployed QuestManager at:", address(questManager));

        subnameFactory = new SubnameFactory(
            ensRegistry,
            address(characterRegistry),
            address(reputationOracle)
        );
        console.log("Deployed SubnameFactory at:", address(subnameFactory));

        guildManager = new GuildManager(
            address(characterRegistry),
            address(reputationOracle)
        );
        console.log("Deployed GuildManager at:", address(guildManager));

        socialQuestManager = new SocialQuestManager(
            address(characterRegistry),
            address(guildManager),
            address(questToken),
            address(achievementNFT)
        );
        console.log(
            "Deployed SocialQuestManager at:",
            address(socialQuestManager)
        );

        tournamentManager = new TournamentManager(
            address(guildManager),
            address(characterRegistry),
            address(questToken),
            address(achievementNFT)
        );
        console.log(
            "Deployed TournamentManager at:",
            address(tournamentManager)
        );

        marketplace = new Marketplace(
            address(achievementNFT),
            address(reputationOracle),
            address(questToken)
        );
        console.log("Deployed Marketplace at:", address(marketplace));

        console.log("All contracts deployed successfully!");
    }

    function setupPermissions(
        QuestToken questToken,
        AchievementNFT achievementNFT,
        CharacterRegistry characterRegistry,
        ReputationOracle reputationOracle,
        QuestManager questManager,
        SubnameFactory subnameFactory,
        GuildManager guildManager,
        SocialQuestManager socialQuestManager,
        TournamentManager tournamentManager,
        Marketplace marketplace
    ) internal {
        console.log("Setting up permissions...");

        // Quest Token minting permissions
        questToken.addMinter(address(questManager));
        questToken.addMinter(address(socialQuestManager));
        questToken.addMinter(address(tournamentManager));
        questToken.addMinter(address(marketplace));

        // Achievement NFT minting permissions
        achievementNFT.addMinter(address(characterRegistry));
        achievementNFT.addMinter(address(questManager));
        achievementNFT.addMinter(address(socialQuestManager));
        achievementNFT.addMinter(address(tournamentManager));

        // Reputation Oracle authorized updaters
        reputationOracle.addAuthorizedUpdater(address(questManager));
        reputationOracle.addAuthorizedUpdater(address(socialQuestManager));

        // Allow game systems to grant XP / unlock abilities
        characterRegistry.setGameSystem(address(questManager), true);
        characterRegistry.setGameSystem(address(socialQuestManager), true);
        characterRegistry.setGameSystem(address(tournamentManager), true);
        characterRegistry.setGameSystem(address(subnameFactory), true);

        console.log("Permissions set up complete!");
    }

    function createInitialContent(
        QuestManager questManager,
        SubnameFactory subnameFactory,
        TournamentManager tournamentManager
    ) internal {
        console.log("Creating initial content...");

        // Create additional quests beyond the default ones
        questManager.createQuest(
            QuestManager.QuestType.ELEMENTAL_FORGE,
            QuestManager.QuestDifficulty.MEDIUM,
            300,
            30 * 1e18,
            "Master Crafter"
        );

        questManager.createQuest(
            QuestManager.QuestType.RESOURCE_RUSH,
            QuestManager.QuestDifficulty.EASY,
            150,
            15 * 1e18,
            "Speed Miner"
        );

        // Create additional subname types beyond the default ones
        subnameFactory.createSubnameType(
            "explorer",
            "Intrepid adventurer with enhanced discovery abilities",
            1,
            0,
            "",
            0.005 ether,
            0 // No supply limit
        );

        subnameFactory.createSubnameType(
            "scholar",
            "Master of knowledge and ancient lore",
            5,
            100,
            "Verified Developer",
            0.02 ether,
            0
        );

        subnameFactory.createSubnameType(
            "champion",
            "Elite warrior proven in tournament combat",
            15,
            500,
            "",
            0.1 ether,
            50 // Limited supply
        );

        // Create initial tournament
        tournamentManager.createTournament(
            TournamentManager.TournamentType.GUILD_VS_GUILD,
            "Genesis Tournament",
            0.05 ether,
            7 days
        );

        console.log("Initial content created!");
    }

    function logDeploymentAddresses(
        address questToken,
        address achievementNFT,
        address characterRegistry,
        address reputationOracle,
        address questManager,
        address subnameFactory,
        address guildManager,
        address socialQuestManager,
        address tournamentManager,
        address marketplace
    ) internal view {
        console.log("\n=== NAMEQUEST DEPLOYMENT ADDRESSES ===");
        console.log("QuestToken:", questToken);
        console.log("AchievementNFT:", achievementNFT);
        console.log("CharacterRegistry:", characterRegistry);
        console.log("ReputationOracle:", reputationOracle);
        console.log("QuestManager:", questManager);
        console.log("SubnameFactory:", subnameFactory);
        console.log("GuildManager:", guildManager);
        console.log("SocialQuestManager:", socialQuestManager);
        console.log("TournamentManager:", tournamentManager);
        console.log("Marketplace:", marketplace);
        console.log("=====================================\n");
    }

    function generateVerificationScript() internal {
        // This would generate a script for contract verification on Basescan
        console.log("Generating verification commands...");
        console.log("Use the following commands to verify contracts:");
        console.log(
            "forge verify-contract --chain base --etherscan-api-key $BASESCAN_API_KEY <address> <contract>"
        );
    }
}

contract DeployEFPOracle is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        UpdatableEFPOracle oracle = new UpdatableEFPOracle(vm.addr(pk));
        console.log("UpdatableEFPOracle:", address(oracle));
        vm.stopBroadcast();
    }
}

/**
 * @title Upgrade Script for NameQuest
 */
contract UpgradeNameQuest is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Load existing contract addresses from environment or config
        address questManager = vm.envAddress("QUEST_MANAGER_ADDRESS");
        address subnameFactory = vm.envAddress("SUBNAME_FACTORY_ADDRESS");

        // Perform upgrades (if using upgradeable contracts)
        // For now, these are not upgradeable, so this would involve deploying new versions
        // and migrating state

        console.log("Upgrade operations completed");

        vm.stopBroadcast();
    }
}

/**
 * @title Configuration Update Script
 */
contract UpdateConfiguration is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Load contract addresses
        QuestManager questManager = QuestManager(
            vm.envAddress("QUEST_MANAGER_ADDRESS")
        );
        SubnameFactory subnameFactory = SubnameFactory(
            vm.envAddress("SUBNAME_FACTORY_ADDRESS")
        );
        TournamentManager tournamentManager = TournamentManager(
            vm.envAddress("TOURNAMENT_MANAGER_ADDRESS")
        );

        // Add new quest types
        questManager.createQuest(
            QuestManager.QuestType.MEMORY_VAULT,
            QuestManager.QuestDifficulty.LEGENDARY,
            1000,
            100 * 1e18,
            "Legendary Scholar"
        );

        // Add seasonal subname
        subnameFactory.createSubnameType(
            "winter2024",
            "Limited winter 2024 commemorative subname",
            1,
            0,
            "",
            0.01 ether,
            1000 // Limited supply
        );

        // Create seasonal tournament
        tournamentManager.createTournament(
            TournamentManager.TournamentType.BATTLE_ROYALE,
            "Winter Champions League",
            0.1 ether,
            14 days
        );

        console.log("Configuration updates completed");

        vm.stopBroadcast();
    }
}

/**
 * @title Emergency Pause Script
 */
// contract EmergencyPause is Script {
//     function run() external {
//         uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
//         vm.startBroadcast(deployerPrivateKey);

//         // Load contract addresses and pause if they support it
//         QuestManager questManager = QuestManager(vm.envAddress("QUEST_MANAGER_ADDRESS"));

//         // Pause the quest manager (assuming it inherits from Pausable)
//         questManager.pause();

//         console.log("Emergency pause activated");

//         vm.stopBroadcast();
//     }
// }

// /**
//  * @title Local Development Setup
//  */
// contract SetupLocalDev is Script {
//     function run() external {
//         vm.startBroadcast();

//         // Deploy mock ENS and EFP Oracle
//         MockENS mockENS = new MockENS();
//         MockEFPOracle mockEFPOracle = new MockEFPOracle();

//         // Set up test data
//         bytes32 testNode = keccak256("test.eth");
//         mockENS.setOwner(testNode, msg.sender);

//         mockEFPOracle.setFollowerCount(msg.sender, 100);
//         mockEFPOracle.setTrustScore(msg.sender, 800);
//         mockEFPOracle.addAttestation(msg.sender, "Verified Developer");

//         console.log("Local development environment set up");
//         console.log("Mock ENS:", address(mockENS));
//         console.log("Mock EFP Oracle:", address(mockEFPOracle));

//         vm.stopBroadcast();
//     }
// }
