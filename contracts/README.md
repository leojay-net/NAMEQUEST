## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

## NameQuest: Base Sepolia Deployment

### 1) Environment

Create a `.env` from `.env.example` with:

- `PRIVATE_KEY` — funded deployer (0x-prefixed)
- `BASE_SEPOLIA_RPC_URL` — e.g. https://sepolia.base.org
- `BASESCAN_API_KEY` — for verification
- `ENS_REGISTRY_ADDRESS` — Base Sepolia ENS Registry: `0x1493b2567056c2181630115660963E13A8E32735`
- `EFP_ORACLE_ADDRESS` — your EFP oracle/adapter on Base Sepolia

`foundry.toml` already wires `rpc_endpoints.base-sepolia` and `etherscan.base_sepolia` to these envs.

### 2) Deploy

```
forge script contracts/script/deploy.s.sol:DeployNameQuest \
	--rpc-url $BASE_SEPOLIA_RPC_URL \
	--broadcast \
	--chain 84532
```

### 3) Verify (optional)

```
forge verify-contract --chain base-sepolia \
	--etherscan-api-key $BASESCAN_API_KEY \
	<address> <contract>
```

### ENS contracts on Base Sepolia (for reference)

- Registry: `0x1493b2567056c2181630115660963E13A8E32735`
- BaseRegistrar: `0xa0c70ec36c010b55e3c434d6c6ebeec50c705794`
- RegistrarController: `0x49ae3cc2e3aa768b1e5654f5d3c6002144a59581`
- Launch Price Oracle: `0x2afF926546f5fbe3E10315CC9C0827AF1A167aC8`
- Price Oracle: `0x2b73408052825e17e0fe464f92de85e8c7723231`
- ReverseRegistrar: `0x876eF94ce0773052a2f81921E70FF25a5e76841f`
- L2Resolver: `0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA`
- MigrationController: `0xE8A87034a06425476F2bD6fD14EA038332Cc5e10`

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
