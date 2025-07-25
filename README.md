# 🔮 Aura

**Debug Any Blockchain Transaction in Seconds**

[![npm version](https://badge.fury.io/js/aura-cli.svg)](https://badge.fury.io/js/aura-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/darrancebeh/aura/workflows/Node.js%20CI/badge.svg)](https://github.com/darrancebeh/aura/actions)

Stop digging through block explorers. Aura instantly shows you **exactly what happened** in any transaction with clear, developer-friendly output. Perfect for debugging failed transactions, analyzing gas usage, and understanding complex DeFi interactions.

![Aura Demo](docs/demo.gif)

## 🆚 Why Aura Over Block Explorers?

While Etherscan and Polygonscan are great for basic transaction info, Aura gives you **developer superpowers**:

| Block Explorers | 🔮 Aura |
|-----------------|---------|
| ❌ Raw transaction data | ✅ **Human-readable call traces** |
| ❌ Cryptic function signatures | ✅ **Decoded function names & parameters** |
| ❌ Scattered event logs | ✅ **Organized, indented call stack** |
| ❌ Manual network switching | ✅ **Multi-chain support in one tool** |
| ❌ Web interface only | ✅ **Terminal & JSON output for automation** |
| ❌ No gas analysis | ✅ **Built-in gas optimization insights** |

**Perfect for:**
- 🐛 **Debugging failed transactions** - See exactly where and why it reverted
- ⛽ **Gas optimization** - Identify expensive operations
- 🔄 **DeFi analysis** - Understand complex swaps and interactions
- 🤖 **Automation** - JSON output for scripts and monitoring

## ✨ What You Get

### 🔍 **Crystal Clear Transaction Breakdowns**
- See exactly which functions were called and in what order
- Understand token flows and balance changes instantly
- Spot expensive operations draining your gas

### ⚡ **Developer-First Experience**
- Works across Ethereum, Polygon, and Arbitrum out of the box
- Clean terminal output or JSON for automation
- One command to analyze any transaction

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

### First-Time Setup (Optional)

```bash
# Run the interactive setup wizard for custom RPC providers
aura setup init
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

Aura works out of the box with public RPCs, but you can configure custom providers for better performance:

```bash
# Interactive setup wizard
aura setup init

# Configure RPC for better trace support
aura config rpc ethereum https://mainnet.gateway.tenderly.co/YOUR_KEY

# Check your configuration
aura setup check
```

### Supported Networks

| Network | Chain ID | Default RPC |
|---------|----------|-------------|
| Ethereum | 1 | Cloudflare |
| Polygon | 137 | Public RPC |
| Arbitrum | 42161 | Public RPC |

### Advanced Configuration

For detailed configuration options, custom RPC providers, and troubleshooting, see our [Configuration Guide](docs/configuration.md).

## 📚 Command Reference

### Basic Commands

```bash
# Inspect any transaction
aura inspect <txHash> [--network polygon] [--json]

# Configuration
aura config list                    # Show all settings
aura config rpc <network> <url>     # Set RPC endpoint
aura setup init                     # Interactive setup

# Help
aura --help                         # Show all commands
aura inspect --help                 # Command-specific help
```

### Command Options

**Transaction Inspection:**
- `--network <network>` - Specify network (ethereum, polygon, arbitrum)
- `--json` - JSON output for automation
- `--depth <number>` - Limit call stack depth
- `--contracts-only` - Show only contract calls
- `--events-only` - Show only events

For complete command documentation, see our [CLI Reference](docs/cli-reference.md).

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

# Run locally with your configuration
npm start inspect 0x123...
```

### Development Scripts

```bash
npm run dev        # Development mode with auto-reload
npm run build      # Build TypeScript to JavaScript  
npm run type-check # Check TypeScript types
npm run clean      # Clean build artifacts
npm test           # Run test suite
npm run test:watch # Test in watch mode
npm run test:coverage # Coverage report
```

### Testing Your Changes

```bash
# Build and test basic functionality
npm run build && npm start setup check

# Test transaction inspection
npm start inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b

# Test configuration system
npm start config list
npm start setup init
```

For detailed development information, see our [Contributing Guide](CONTRIBUTING.md).

## 🤝 Contributing

We welcome contributions! Aura is designed to be developer-friendly and easy to extend.

### Quick Contribution Guide

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- **Write tests** for new functionality
- **Follow TypeScript** strict typing
- **Add helpful error messages** with actionable suggestions
- **Test with multiple networks** (Ethereum, Polygon, Arbitrum)
- **Update documentation** for new features

### Areas for Contribution

- 🌐 **New Network Support** - Add more blockchain networks
- 🔍 **Enhanced Parsing** - Improve transaction analysis capabilities
- 🎨 **UI/UX Improvements** - Better terminal output and user experience
- 🧪 **Testing** - Expand test coverage and edge case handling
- 📚 **Documentation** - Improve guides and examples

Please see our [Contributing Guide](CONTRIBUTING.md) for detailed information.

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
