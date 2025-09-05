// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";

interface IENSResolver {
    function resolve(
        bytes calldata name,
        bytes calldata data
    ) external view returns (bytes memory);
}

contract CCIPReadForkTest is Test {
    // L1Resolver mainnet address from Basenames docs
    address constant L1_RESOLVER = 0xde9049636F4a1dfE0a64d1bFe3155C0A14C54F31;

    function setUp() public virtual {
        string memory rpc = vm.envOr("MAINNET_RPC_URL", string(""));
        if (bytes(rpc).length == 0) return;
        vm.createSelectFork(rpc);
    }

    function _dnsEncode(
        string memory name
    ) internal pure returns (bytes memory out) {
        // Minimal DNS wire-format encoding for a dot-separated name
        bytes memory b = bytes(name);
        uint256 last = 0;
        for (uint256 i = 0; i <= b.length; i++) {
            if (i == b.length || b[i] == 0x2e) {
                uint256 len = i - last;
                out = bytes.concat(out, bytes(abi.encodePacked(uint8(len))));
                for (uint256 j = last; j < i; j++)
                    out = bytes.concat(out, bytes(abi.encodePacked(b[j])));
                last = i + 1;
            }
        }
        out = bytes.concat(out, hex"00");
    }

    function test_CcipReadResolve_greg_base_eth() public {
        // ABI-encode addr(bytes32) selector with dummy node; resolver will CCIP-Read based on encoded name
        bytes4 ADDR_SELECTOR = 0x3b3b57de; // addr(bytes32)
        bytes memory callData = abi.encodeWithSelector(
            ADDR_SELECTOR,
            bytes32(0)
        );
        bytes memory dnsName = _dnsEncode("greg.base.eth");
        // Only meaningful on mainnet fork
        if (block.chainid != 1) return;
        // Expect the OffchainLookup revert per EIP-3668
        bytes4 OFFCHAIN_LOOKUP_SELECTOR = bytes4(
            keccak256("OffchainLookup(address,string[],bytes,bytes4,bytes)")
        );
        vm.expectRevert(OFFCHAIN_LOOKUP_SELECTOR);
        IENSResolver(L1_RESOLVER).resolve(dnsName, callData);
    }
}
