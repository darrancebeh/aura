# Quick Test Commands

Here are some quick commands to test various functionalities:

## 1. Basic Functionality Tests

```bash
# Build and test current working transaction
npm run build && aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b

# Test JSON output
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --json | jq .

# Test verbose mode
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --verbose
```

## 2. Error Handling Tests

```bash
# Test invalid hash format
aura inspect 0xinvalid

# Test non-existent transaction
aura inspect 0x0000000000000000000000000000000000000000000000000000000000000000

# Test empty hash
aura inspect ""
```

## 3. CLI Options Tests

```bash
# Test help
aura --help
aura inspect --help

# Test version
aura --version

# Test unknown command
aura unknown-command
```

## 4. Output Format Tests

```bash
# Events only
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --events-only

# Contracts only
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --contracts-only

# Depth limiting
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --depth 1
```

## 5. Network Tests (if you have other RPC endpoints)

```bash
# Test different networks (requires different RPC endpoints)
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --network polygon
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --network arbitrum
```

## 6. Performance Tests

```bash
# Time the execution
time aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b

# Test multiple transactions quickly
for tx in 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b; do
  echo "Testing $tx..."
  aura inspect $tx --json > /dev/null && echo "✅ Success" || echo "❌ Failed"
done
```

## 7. Token Information Tests

These commands test the token recognition system:

```bash
# Should show GALA token info
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b

# Look for Transfer events with proper token amounts
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --events-only
```

## 8. Run Full Test Suite

```bash
# Execute all tests
./test-suite.sh

# Or run individual test categories
npm run build && ./test-suite.sh 2>&1 | grep "Testing:"
```

## 9. Real Transaction Examples to Try

Find recent transactions from Etherscan and test them:

1. Go to https://etherscan.io
2. Click on latest transactions
3. Copy transaction hashes
4. Test with: `aura inspect <hash>`

Look for transactions involving:
- Token transfers (ERC20)
- DEX trades (Uniswap, 1inch)
- NFT transfers (OpenSea)
- DeFi protocols (Compound, Aave)

## 10. Debug Output

```bash
# Get detailed output for debugging
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --verbose --json | jq . > debug_output.json
```
