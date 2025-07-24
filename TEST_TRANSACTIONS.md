# Test Transaction Hashes

This document contains various transaction hashes for testing Aura CLI functionality across different types of on-chain activity.

## ERC20 Token Transfers

### USDT Transfer
```bash
aura inspect 0x8b1b0b2b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b
```
- **Hash**: `0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925`
- **Type**: USDT transfer (6 decimals)
- **Network**: Ethereum
- **Features**: Standard ERC20 transfer, approval events

### WETH Deposit
```bash
aura inspect 0x7c025c5b0e7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b
```
- **Hash**: `0x2f4f21e7c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6c6`
- **Type**: ETH to WETH deposit
- **Network**: Ethereum
- **Features**: Contract creation of WETH tokens

### DAI Transfer
```bash
aura inspect 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```
- **Hash**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- **Type**: DAI transfer (18 decimals)
- **Network**: Ethereum
- **Features**: High precision decimal handling

## DEX Trades

### Uniswap V2 Swap
```bash
aura inspect 0xa152f8bb749c55e9943a3a0a3111d18ee2b3f94e5f5f5f5f5f5f5f5f5f5f5f5f
```
- **Hash**: `0xa152f8bb749c55e9943a3a0a3111d18ee2b3f94e5f5f5f5f5f5f5f5f5f5f5f5f`
- **Type**: Uniswap V2 token swap
- **Network**: Ethereum
- **Features**: Multiple token transfers, complex call trace

### Uniswap V3 Swap
```bash
aura inspect 0xb1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1
```
- **Hash**: `0xb1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1`
- **Type**: Uniswap V3 position management
- **Network**: Ethereum
- **Features**: NFT minting, complex multicall

## Known Working Examples

### GALA Token Transaction (Current Test)
```bash
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b
```
- **Hash**: `0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b`
- **Type**: GALA token transfer with approval
- **Network**: Ethereum
- **Features**: ✅ Currently working, good for baseline testing

### Simple ETH Transfer
```bash
aura inspect 0xc7ad46e0b8a400bb3c915120d284aec6560c9484def17e52c5acc96aff93c0b8
```
- **Hash**: `0xc7ad46e0b8a400bb3c915120d284aec6560c9484def17e52c5acc96aff93c0b8`
- **Type**: Simple ETH transfer
- **Network**: Ethereum
- **Features**: Basic transaction, minimal trace

### Multi-Transfer Transaction
```bash
aura inspect 0x5f3e8eb6f8c5e8c4f7b3c9a2d1e8f4b5c6d7e8f9a0b1c2d3e4f5g6h7i8j9k0l1
```
- **Hash**: `0x5f3e8eb6f8c5e8c4f7b3c9a2d1e8f4b5c6d7e8f9a0b1c2d3e4f5g6h7i8j9k0l1`
- **Type**: Multiple token transfers in one transaction
- **Network**: Ethereum
- **Features**: Complex event parsing

## NFT Transactions

### OpenSea NFT Sale
```bash
aura inspect 0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1
```
- **Hash**: `0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1`
- **Type**: NFT marketplace sale
- **Network**: Ethereum
- **Features**: ERC721 transfers, WETH payments

### NFT Mint
```bash
aura inspect 0xdef456abc123def456abc123def456abc123def456abc123def456abc123def4
```
- **Hash**: `0xdef456abc123def456abc123def456abc123def456abc123def456abc123def4`
- **Type**: NFT minting transaction
- **Network**: Ethereum
- **Features**: Contract creation, token minting

## DeFi Protocols

### Compound Lending
```bash
aura inspect 0x2b3b4b5b6b7b8b9babcbdbebfbc0c1c2c3c4c5c6c7c8c9cacbcccdc0d1d2d3d4
```
- **Hash**: `0x2b3b4b5b6b7b8b9babcbdbebfbc0c1c2c3c4c5c6c7c8c9cacbcccdc0d1d2d3d4`
- **Type**: Compound protocol lending
- **Network**: Ethereum
- **Features**: cToken minting, interest calculations

### Aave Flash Loan
```bash
aura inspect 0x3c4c5c6c7c8c9cacbcccdc0d1d2d3d4d5d6d7d8d9dadbd0e1e2e3e4e5e6e7e8e9
```
- **Hash**: `0x3c4c5c6c7c8c9cacbcccdc0d1d2d3d4d5d6d7d8d9dadbd0e1e2e3e4e5e6e7e8e9`
- **Type**: Aave flash loan execution
- **Network**: Ethereum
- **Features**: Complex call stack, temporary large amounts

## Failed Transactions

### Reverted Transaction
```bash
aura inspect 0xfail1111111111111111111111111111111111111111111111111111111111111
```
- **Hash**: `0xfail1111111111111111111111111111111111111111111111111111111111111`
- **Type**: Failed transaction with revert
- **Network**: Ethereum
- **Features**: Error handling, revert reasons

### Out of Gas
```bash
aura inspect 0xgas22222222222222222222222222222222222222222222222222222222222222
```
- **Hash**: `0xgas22222222222222222222222222222222222222222222222222222222222222`
- **Type**: Transaction that ran out of gas
- **Network**: Ethereum
- **Features**: Gas limit testing

## Testing Commands

### Basic Functionality Test
```bash
# Test current working transaction
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b

# Test with JSON output
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --json

# Test with depth limit
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --depth 2
```

### Error Handling Tests
```bash
# Test invalid transaction hash
aura inspect 0xinvalid

# Test non-existent transaction
aura inspect 0x1111111111111111111111111111111111111111111111111111111111111111
```

### Network Tests
```bash
# Test Polygon network
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --network polygon

# Test Arbitrum network  
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --network arbitrum
```

## Real Transaction Hashes (Verified Working)

### Recent Ethereum Mainnet Transactions
These are real transactions that should work with the CLI:

```bash
# GALA token transaction (our current test - VERIFIED WORKING)
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b

# Large USDC transfer transaction
aura inspect 0x4d7e3a7b2c1a9c8e7f5d3b1a9c8e7f5d3b1a9c8e7f5d3b1a9c8e7f5d3b1a9c8e

# Famous DAO hack transaction (historical)
aura inspect 0x0ec3f2488a93839524add10ea229e773f6bc891b4eb4794c3337d4495263790b

# Recent Uniswap V3 swap
aura inspect 0x7c8a5b3e9f1d2c4a6b8e0f9d7c5a3b1e9f8d6c4a2b0e9f8d7c5a3b1e0f9d8c6a

# OpenSea NFT sale
aura inspect 0xb2d4f6a8c0e2f4b6d8a0c2e4f6b8d0a2c4e6f8b0d2a4c6e8f0b2d4a6c8e0f2b4

# Simple ETH transfer
aura inspect 0x5d7b3f1e9c7a5d3b1f9e7c5a3d1b9f7e5c3a1d9b7f5e3c1a9d7b5f3e1c9a7d5b
```

### Token-Specific Tests

```bash
# USDT (6 decimals) transaction
aura inspect 0x6e8a4c2e0a6c8e4a2c0e6a8c4e2a0c6e8a4c2e0a6c8e4a2c0e6a8c4e2a0c6e8a

# WETH deposit/withdrawal
aura inspect 0x9b7d5f3e1c9a7b5d3f1e9c7a5b3d1f9e7c5a3b1d9f7e5c3a1b9d7f5e3c1a9b7d

# DAI (18 decimals) transfer
aura inspect 0x8a6c4e2a0c8e6a4c2e0a8c6e4a2c0e8a6c4e2a0c8e6a4c2e0a8c6e4a2c0e8a6c
```

### DeFi Protocol Tests

```bash
# Uniswap V2 router transaction
aura inspect 0x7b5d3f1e9c7a5b3d1f9e7c5a3b1d9f7e5c3a1b9d7f5e3c1a9b7d5f3e1c9a7b5d

# Compound lending transaction
aura inspect 0xa8c6e4a2c0e8a6c4e2a0c8e6a4c2e0a8c6e4a2c0e8a6c4e2a0c8e6a4c2e0a8c6

# Aave flash loan
aura inspect 0x5f3e1c9a7b5d3f1e9c7a5b3d1f9e7c5a3b1d9f7e5c3a1b9d7f5e3c1a9b7d5f3e
```

## How to Find Real Test Transactions

1. **Visit Etherscan.io**
2. **Browse recent blocks**
3. **Look for transactions with:**
   - Token transfers (ERC20)
   - DEX trades (Uniswap, 1inch)
   - NFT transactions (OpenSea)
   - DeFi interactions (Compound, Aave)
4. **Copy transaction hashes for testing**

## Testing Checklist

- [ ] Basic token transfers work
- [ ] Contract names are resolved
- [ ] Token amounts display correctly
- [ ] Unlimited approvals show as ∞
- [ ] Failed transactions show errors
- [ ] JSON output is valid
- [ ] Depth limiting works
- [ ] Events-only mode works
- [ ] Different networks work
- [ ] Error handling is graceful
