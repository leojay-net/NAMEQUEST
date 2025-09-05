// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/ExternalInterfaces.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CharacterRegistry.sol";
import "./ReputationOracle.sol";

/**
 * @title Subname Factory
 * @dev Mints trait-based subnames and manages ability unlocking
 */
contract SubnameFactory is Ownable, ReentrancyGuard {
    IENS public immutable ens;
    CharacterRegistry public immutable characterRegistry;
    ReputationOracle public immutable reputationOracle;

    struct SubnameType {
        string name;
        string description;
        uint256 minLevel;
        uint256 minTrustScore;
        string requiredAttestation;
        uint256 price;
        bool isActive;
        mapping(string => uint256) abilityBoosts; // ability name => boost amount
    }

    mapping(string => SubnameType) public subnameTypes;
    mapping(address => mapping(string => bool)) public playerOwnsSubname;
    mapping(string => uint256) public subnameSupply;
    mapping(string => uint256) public maxSupply;

    string[] public availableSubnames;

    event SubnameMinted(address indexed player, string subname, bytes32 node);
    event SubnameTypeCreated(string name, uint256 price);

    constructor(
        address _ens,
        address _characterRegistry,
        address _reputationOracle
    ) Ownable(msg.sender) {
        ens = IENS(_ens);
        characterRegistry = CharacterRegistry(_characterRegistry);
        reputationOracle = ReputationOracle(_reputationOracle);

        _createInitialSubnames();
    }

    function _createInitialSubnames() internal {
        // Warrior subname
        _createSubnameType(
            "warrior",
            "Fierce melee combatant with enhanced physical abilities",
            1, // minLevel
            0, // minTrustScore
            "", // no required attestation
            0.01 ether // price
        );
        _setAbilityBoost("warrior", "strength", 20);
        _setAbilityBoost("warrior", "combat_damage", 25);

        // Mage subname
        _createSubnameType(
            "mage",
            "Master of arcane arts and magical puzzles",
            1,
            0,
            "",
            0.01 ether
        );
        _setAbilityBoost("mage", "magic", 20);
        _setAbilityBoost("mage", "puzzle_bonus", 15);

        // Legendary subname
        _createSubnameType(
            "legendary",
            "Ultra-rare subname with unique powers",
            25,
            1000,
            "",
            1 ether
        );
        maxSupply["legendary"] = 100; // Limited supply
        _setAbilityBoost("legendary", "all_stats", 50);
    }

    function _createSubnameType(
        string memory name,
        string memory description,
        uint256 minLevel,
        uint256 minTrustScore,
        string memory requiredAttestation,
        uint256 price
    ) internal {
        SubnameType storage subnameType = subnameTypes[name];
        subnameType.name = name;
        subnameType.description = description;
        subnameType.minLevel = minLevel;
        subnameType.minTrustScore = minTrustScore;
        subnameType.requiredAttestation = requiredAttestation;
        subnameType.price = price;
        subnameType.isActive = true;

        availableSubnames.push(name);

        emit SubnameTypeCreated(name, price);
    }

    function _setAbilityBoost(
        string memory subnameType,
        string memory ability,
        uint256 boost
    ) internal {
        subnameTypes[subnameType].abilityBoosts[ability] = boost;
    }

    function mintSubname(
        string memory subnameType,
        bytes32 parentNode
    ) external payable nonReentrant {
        SubnameType storage subname = subnameTypes[subnameType];
        require(subname.isActive, "Subname type not active");
        require(msg.value >= subname.price, "Insufficient payment");
        require(
            !playerOwnsSubname[msg.sender][subnameType],
            "Already owns this subname"
        );

        // Check supply limit
        if (maxSupply[subnameType] > 0) {
            require(
                subnameSupply[subnameType] < maxSupply[subnameType],
                "Max supply reached"
            );
        }

        // Check requirements
        (uint256 level, , , ) = characterRegistry.getCharacterStats(msg.sender);
        require(level >= subname.minLevel, "Level requirement not met");

        if (subname.minTrustScore > 0) {
            require(
                reputationOracle.getAccessLevel(msg.sender) * 250 >=
                    subname.minTrustScore,
                "Trust score requirement not met"
            );
        }

        if (bytes(subname.requiredAttestation).length > 0) {
            require(
                reputationOracle.hasAttestation(
                    msg.sender,
                    subname.requiredAttestation
                ),
                "Required attestation not found"
            );
        }

        // Mint subname
        bytes32 label = keccak256(bytes(subnameType));
        bytes32 subnameNode = ens.setSubnodeOwner(
            parentNode,
            label,
            msg.sender
        );

        playerOwnsSubname[msg.sender][subnameType] = true;
        subnameSupply[subnameType]++;

        // Unlock abilities based on subname
        characterRegistry.unlockAbility(
            msg.sender,
            string(abi.encodePacked(subnameType, "_abilities"))
        );

        emit SubnameMinted(msg.sender, subnameType, subnameNode);

        // Refund excess payment
        if (msg.value > subname.price) {
            payable(msg.sender).transfer(msg.value - subname.price);
        }
    }

    function createSubnameType(
        string memory name,
        string memory description,
        uint256 minLevel,
        uint256 minTrustScore,
        string memory requiredAttestation,
        uint256 price,
        uint256 _maxSupply
    ) external onlyOwner {
        _createSubnameType(
            name,
            description,
            minLevel,
            minTrustScore,
            requiredAttestation,
            price
        );
        if (_maxSupply > 0) {
            maxSupply[name] = _maxSupply;
        }
    }

    function setAbilityBoost(
        string memory subnameType,
        string memory ability,
        uint256 boost
    ) external onlyOwner {
        _setAbilityBoost(subnameType, ability, boost);
    }

    function getAbilityBoost(
        string memory subnameType,
        string memory ability
    ) external view returns (uint256) {
        return subnameTypes[subnameType].abilityBoosts[ability];
    }

    function getAvailableSubnames() external view returns (string[] memory) {
        return availableSubnames;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
