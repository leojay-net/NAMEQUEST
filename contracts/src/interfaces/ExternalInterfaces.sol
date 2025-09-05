// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IENS {
    function owner(bytes32 node) external view returns (address);
    function resolver(bytes32 node) external view returns (address);
    function setSubnodeOwner(
        bytes32 node,
        bytes32 label,
        address owner
    ) external returns (bytes32);
}

interface IENSResolver {
    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external;
    function text(
        bytes32 node,
        string calldata key
    ) external view returns (string memory);
}

interface IEFPOracle {
    function getFollowerCount(address user) external view returns (uint256);
    function getAttestations(
        address user
    ) external view returns (string[] memory);
    function getTrustScore(address user) external view returns (uint256);
    function isFollowing(
        address follower,
        address target
    ) external view returns (bool);
}
