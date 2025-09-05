// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/ExternalInterfaces.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Reputation Oracle
 * @dev Integrates with EFP data and calculates social power multipliers
 */
contract ReputationOracle is Ownable {
    IEFPOracle public efpOracle;

    struct ReputationData {
        uint256 followerCount;
        uint256 trustScore;
        string[] attestations;
        uint256 lastUpdate;
    }

    mapping(address => ReputationData) public reputationData;
    mapping(address => bool) public authorizedUpdaters;

    uint256 public constant UPDATE_COOLDOWN = 1 hours;

    event ReputationUpdated(
        address indexed user,
        uint256 followerCount,
        uint256 trustScore
    );

    constructor(address _efpOracle) Ownable(msg.sender) {
        efpOracle = IEFPOracle(_efpOracle);
    }

    function addAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
    }

    function updateReputation(address user) external {
        require(
            authorizedUpdaters[msg.sender] || msg.sender == user,
            "Not authorized to update"
        );
        // Allow the first update immediately; enforce cooldown thereafter
        if (reputationData[user].lastUpdate != 0) {
            require(
                block.timestamp >=
                    reputationData[user].lastUpdate + UPDATE_COOLDOWN,
                "Update cooldown not met"
            );
        }

        ReputationData storage data = reputationData[user];
        data.followerCount = efpOracle.getFollowerCount(user);
        data.trustScore = efpOracle.getTrustScore(user);
        data.attestations = efpOracle.getAttestations(user);
        data.lastUpdate = block.timestamp;

        emit ReputationUpdated(user, data.followerCount, data.trustScore);
    }

    function getAllyPower(address user) external view returns (uint256) {
        return reputationData[user].followerCount;
    }

    function hasAttestation(
        address user,
        string memory attestation
    ) external view returns (bool) {
        string[] memory attestations = reputationData[user].attestations;
        for (uint i = 0; i < attestations.length; i++) {
            if (
                keccak256(bytes(attestations[i])) ==
                keccak256(bytes(attestation))
            ) {
                return true;
            }
        }
        return false;
    }

    function getAccessLevel(address user) external view returns (uint256) {
        uint256 trust = reputationData[user].trustScore;
        if (trust >= 1000) return 4; // Legendary
        if (trust >= 500) return 3; // Epic
        if (trust >= 100) return 2; // Rare
        return 1; // Common
    }
}
