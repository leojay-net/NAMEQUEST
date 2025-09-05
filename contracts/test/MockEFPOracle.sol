// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Mock EFP Oracle for Testing
 */
contract MockEFPOracle {
    mapping(address => uint256) public followerCounts;
    mapping(address => string[]) public attestations;
    mapping(address => uint256) public trustScores;
    
    function setFollowerCount(address user, uint256 count) external {
        followerCounts[user] = count;
    }
    
    function setTrustScore(address user, uint256 score) external {
        trustScores[user] = score;
    }
    
    function addAttestation(address user, string memory attestation) external {
        attestations[user].push(attestation);
    }
    
    function getFollowerCount(address user) external view returns (uint256) {
        return followerCounts[user];
    }
    
    function getAttestations(address user) external view returns (string[] memory) {
        return attestations[user];
    }
    
    function getTrustScore(address user) external view returns (uint256) {
        return trustScores[user];
    }
    
    function isFollowing(address follower, address target) external pure returns (bool) {
        return true; // Simplified for testing
    }
}