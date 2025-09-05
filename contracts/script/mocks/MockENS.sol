// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockENS {
    mapping(bytes32 => address) public owners;
    mapping(bytes32 => address) public resolvers;

    function owner(bytes32 node) external view returns (address) {
        return owners[node];
    }

    function resolver(bytes32 node) external view returns (address) {
        return resolvers[node];
    }

    function setSubnodeOwner(
        bytes32 node,
        bytes32 label,
        address owner_
    ) external returns (bytes32) {
        bytes32 subnode = keccak256(abi.encodePacked(node, label));
        owners[subnode] = owner_;
        return subnode;
    }

    function setOwner(bytes32 node, address owner_) external {
        owners[node] = owner_;
    }
}
