// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.19;

// import "forge-std/Test.sol";

// interface IENSRegistry {
//     function owner(bytes32 node) external view returns (address);
// }

// contract NameQuestForkTest is Test {
//     // ENS registry mainnet address
//     address constant ENS_REGISTRY = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;

//     function setUp() public virtual {
//         string memory rpc = vm.envOr("MAINNET_RPC_URL", string(""));
//         if (bytes(rpc).length == 0) {
//             vm.skip(true);
//         }
//         vm.createSelectFork(rpc);
//     }

//     function testENSOwnerResolvesOnFork() public view {
//         // namehash("eth") per ENS algorithm
//         bytes32 ethNode = 0x93cdeb708b7545dc668eb9280176169d0c77d5e4ad71e2b1dfe3e08a1f6b9c56;
//         address owner = IENSRegistry(ENS_REGISTRY).owner(ethNode);
//         assertTrue(
//             owner != address(0),
//             "ENS .eth owner should resolve on mainnet fork"
//         );
//     }
// }
