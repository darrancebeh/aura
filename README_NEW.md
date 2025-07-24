# 🔮 Aura

**On-chain Transaction Inspector for Web3 Developers**

[![npm version](https://badge.fury.io/js/aura-cli.svg)](https://badge.fury.io/js/aura-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/darrancebeh/aura/workflows/Node.js%20CI/badge.svg)](https://github.com/darrancebeh/aura/actions)

Aura transforms cryptic blockchain transaction traces into human-readable, actionable insights. Get instant clarity on what happened in any transaction across Ethereum, Polygon, and Arbitrum.

![Aura Demo](docs/demo.gif)

## ✨ Features

- 🔍 **Instant Transaction Analysis** - Decode any transaction hash into human-readable format
- 💰 **Smart Token Recognition** - Automatically identifies tokens and formats amounts (GALA, USDT, WETH, etc.)
- 📊 **Multiple Output Formats** - Terminal-friendly or JSON for programmatic use
- 🌐 **Multi-Network Support** - Ethereum, Polygon, Arbitrum (more coming soon)
- 🚀 **Lightning Fast** - Optimized for speed with intelligent caching
- 🎨 **Beautiful Output** - Color-coded, well-formatted terminal display
- 🔗 **Call Trace Analysis** - See exactly how contracts interact with each other
- 📝 **Event Decoding** - Automatically decode Transfer, Approval, and other events
- ♾️ **Unlimited Approval Detection** - Clearly highlights unlimited token approvals

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g aura-cli

# Or run directly with npx
npx aura-cli inspect <transaction-hash>
```

### Basic Usage

```bash
# Inspect any transaction
aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b

# Specify network
aura inspect 0x123... --network polygon

# Get JSON output
aura inspect 0x123... --json
```

## 📖 Examples

### Token Transfer Analysis

```bash
$ aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b
```

**Output:**
```
🔍 Inspecting transaction: 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b
Network: ethereum

📋 Transaction Summary:
────────────────────────────────────────────────────────────
Status: ✅ Success
Gas Used: 37,976
Gas Price: 11.789405161 gwei
Transaction Fee: 0.000447714 ETH
────────────────────────────────────────────────────────────

🌳 Call Trace:
📞 0x15d4...03da (GALA).gasprice_bit_ether(param0: 753606082381758668835418713929.78847408 GALA)
│  📝 Transfer(from: 0xa00f...46B0, to: 0xf16E...9B91, value: 1856.8077 GALA)
│  📝 Approval(owner: 0xa00f...46B0, spender: 0xa152...f94E, value: ∞ (unlimited))
│  ⚡ Gas: 37,976
```

### DEX Trade Analysis

Perfect for understanding complex DeFi transactions:

```bash
$ aura inspect 0x7b5d3f1e9c7a5b3d1f9e7c5a3b1d9f7e5c3a1b9d7f5e3c1a9b7d5f3e1c9a7b5d
```

Shows token swaps, liquidity changes, and fee distributions in an easy-to-read format.

### Failed Transaction Debugging

```bash
$ aura inspect 0xfail1111111111111111111111111111111111111111111111111111111111111
```

Clearly shows revert reasons and where transactions failed in the call stack.

## 🔧 Configuration

### RPC Providers

Aura works with any Ethereum-compatible RPC provider. Configure via environment variables:

```bash
# Create .env file
cp .env.example .env

# Edit with your RPC URLs
ETHEREUM_RPC_URL=https://mainnet.gateway.tenderly.co/YOUR_KEY
POLYGON_RPC_URL=https://polygon.gateway.tenderly.co/YOUR_KEY
ARBITRUM_RPC_URL=https://arbitrum.gateway.tenderly.co/YOUR_KEY
```

**Recommended Providers:**
- **Tenderly** - Excellent trace support, recommended for best experience
- **Alchemy** - Good performance (paid tier required for traces)
- **Infura** - Reliable (add-ons required for trace support)

### Supported Networks

| Network | Chain ID | Default RPC |
|---------|----------|-------------|
| Ethereum | 1 | Cloudflare |
| Polygon | 137 | Public RPC |
| Arbitrum | 42161 | Public RPC |

## 📚 Command Reference

### `aura inspect`

Inspect a transaction and display its execution trace.

**Usage:**
```bash
aura inspect <txHash> [options]
```

**Options:**
- `-n, --network <network>` - Network to use (ethereum, polygon, arbitrum)
- `--json` - Output raw data in JSON format
- `--verbose` - Enable detailed error reporting
- `--depth <number>` - Limit call stack depth
- `--contracts-only` - Show only contract calls
- `--events-only` - Show only events
- `-h, --help` - Display help

**Examples:**
```bash
# Basic inspection
aura inspect 0x123...

# Polygon network
aura inspect 0x123... --network polygon

# JSON output for scripting
aura inspect 0x123... --json | jq '.events[0]'

# Limit complexity for large transactions
aura inspect 0x123... --depth 3

# Focus on events only
aura inspect 0x123... --events-only
```

### Global Options

```bash
aura --version    # Show version
aura --help      # Show help
```

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone repository
git clone https://github.com/darrancebeh/aura.git
cd aura

# Install dependencies
npm install

# Build project
npm run build

# Run locally
npm start inspect 0x123...
```

### Testing

```bash
# Run test suite
npm test

# Test specific functionality
./test-suite.sh

# Manual testing
npm run build && aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Scripts

```bash
npm run dev        # Development mode with auto-reload
npm run build      # Build TypeScript to JavaScript
npm run type-check # Check TypeScript types
npm run clean      # Clean build artifacts
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [GitHub Repository](https://github.com/darrancebeh/aura)
- [npm Package](https://www.npmjs.com/package/aura-cli)
- [Documentation](https://github.com/darrancebeh/aura/wiki)
- [Issue Tracker](https://github.com/darrancebeh/aura/issues)

## 🙏 Acknowledgments

- Built with [ethers.js](https://ethers.org/) for blockchain interaction
- [Commander.js](https://github.com/tj/commander.js/) for CLI framework
- [Chalk](https://github.com/chalk/chalk) for beautiful terminal output

---

**Made with ❤️ by the Web3 developer community**

*Aura helps you see through the complexity of blockchain transactions*
