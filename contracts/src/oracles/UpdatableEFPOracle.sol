// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/ExternalInterfaces.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UpdatableEFPOracle
 * @notice Minimal on-chain oracle that conforms to IEFPOracle and can be
 *         updated by the owner or authorized updaters. Intended as a bridge
 *         until a canonical on-chain EFP reader/adapter is available.
 */
contract UpdatableEFPOracle is IEFPOracle, Ownable {
    struct Data {
        uint256 followerCount;
        uint256 trustScore;
        string[] attestations;
    }

    // user => data
    mapping(address => Data) private dataByUser;

    // following relationship cache (optional)
    mapping(address => mapping(address => bool)) private following; // follower => target => isFollowing

    mapping(address => bool) public authorizedUpdaters;

    event UpdaterSet(address updater, bool enabled);
    event UserDataUpdated(
        address indexed user,
        uint256 followerCount,
        uint256 trustScore,
        uint256 attestationsLen
    );
    event FollowingSet(
        address indexed follower,
        address indexed target,
        bool isFollowing
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyUpdater() {
        require(
            msg.sender == owner() || authorizedUpdaters[msg.sender],
            "Not authorized"
        );
        _;
    }

    function setAuthorizedUpdater(
        address updater,
        bool enabled
    ) external onlyOwner {
        authorizedUpdaters[updater] = enabled;
        emit UpdaterSet(updater, enabled);
    }

    // Batch setter for user reputation data
    function setUserData(
        address user,
        uint256 followerCount,
        uint256 trustScore,
        string[] calldata attestations
    ) external onlyUpdater {
        Data storage d = dataByUser[user];
        d.followerCount = followerCount;
        d.trustScore = trustScore;
        // replace attestations array
        delete d.attestations;
        for (uint256 i = 0; i < attestations.length; i++) {
            d.attestations.push(attestations[i]);
        }
        emit UserDataUpdated(
            user,
            followerCount,
            trustScore,
            attestations.length
        );
    }

    function setFollowing(
        address follower,
        address target,
        bool isF
    ) external onlyUpdater {
        following[follower][target] = isF;
        emit FollowingSet(follower, target, isF);
    }

    function setFollowingBatch(
        address[] calldata followers,
        address[] calldata targets,
        bool[] calldata flags
    ) external onlyUpdater {
        require(
            followers.length == targets.length &&
                targets.length == flags.length,
            "Length mismatch"
        );
        for (uint256 i = 0; i < followers.length; i++) {
            following[followers[i]][targets[i]] = flags[i];
            emit FollowingSet(followers[i], targets[i], flags[i]);
        }
    }

    // IEFPOracle views
    function getFollowerCount(
        address user
    ) external view override returns (uint256) {
        return dataByUser[user].followerCount;
    }

    function getAttestations(
        address user
    ) external view override returns (string[] memory) {
        return dataByUser[user].attestations;
    }

    function getTrustScore(
        address user
    ) external view override returns (uint256) {
        return dataByUser[user].trustScore;
    }

    function isFollowing(
        address follower,
        address target
    ) external view override returns (bool) {
        return following[follower][target];
    }
}
