# 🔮 Aura

**On-chain Transaction Inspector for Web3 Developers**

[![npm version](https://badge.fury.io/js/aura-cli.svg)](https://badge.fury.io/js/aura-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/darrancebeh/aura/workflows/Node.js%20CI/badge.svg)](https://github.com/darrancebeh/aura/actions)

Aura transforms blockchain transaction traces into human-readable insights. Analyze transactions across Ethereum, Polygon, and Arbitrum networks.

![Aura Demo](docs/demo.gif)

## ✨ Features

### 🔍 **Transaction Analysis**
- **Human-Readable Traces** - Convert complex transaction data into clear, understandable insights
- **Multi-Chain Support** - Ethereum, Polygon, Arbitrum with more networks planned
- **Gas Optimization** - Identify gas inefficiencies and optimization opportunities
- **Contract Interaction Analysis** - Detailed breakdown of smart contract calls and state changes

### ⚡ **Performance & Reliability**
- **Multi-Network Support** - Ethereum, Polygon, Arbitrum (more coming soon)
- **Optimized Performance** - Fast execution with intelligent caching
- **Multiple Output Formats** - Terminal-friendly or JSON for programmatic use
- **Error Handling** - Helpful guidance when things go wrong

### 🤖 **Smart Configuration System** *(Enhanced in v2.0)*
- **Network Intelligence** - Automatic RPC provider detection and testing
- **Interactive Setup** - Guided configuration process with real-time validation
- **Health Monitoring** - Continuous validation of RPC connections and configurations
- **Migration Assistant** - Seamless network switching with configuration backup

### 🏁 **Performance & Reliability**
- **Multi-Network Support** - Ethereum, Polygon, Arbitrum (more coming soon)
- **Lightning Fast** - Optimized for speed with intelligent caching
- **Multiple Output Formats** - Terminal-friendly or JSON for programmatic use
- **Graceful Error Handling** - Helpful guidance when things go wrong

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g aura-cli

# Or run directly with npx
npx aura-cli inspect <transaction-hash>
```

### First-Time Setup (Interactive)

```bash
# Run the interactive setup wizard
aura setup init

# Output:
# 🌟 Welcome to Aura! Let's set up your configuration.
# 
# 📡 Step 1/3: Choose your primary network
# 📊 Step 2/3: Configure RPC provider  
# 🧪 Step 3/3: Test configuration
# 
# 🎉 Setup complete! Aura is ready to use.
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

### Configuration Management

```bash
# List all configuration
aura config list

# Set default network
aura config set defaultNetwork polygon

# Configure RPC for a network (with automatic testing)
aura config rpc ethereum https://mainnet.gateway.tenderly.co/YOUR_KEY

# Health check your configuration
aura setup check

# Get provider recommendations
aura setup provider ethereum
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

Aura includes an enhanced configuration system with error handling, validation, and interactive setup flows.

### Configuration Features

- **Typo Detection** - Suggests corrections for mistyped configuration keys
- **Connection Testing** - Validates RPC URLs before saving them
- **Provider Intelligence** - Automatically detects capabilities (trace support, archive access)
- **Smart Recommendations** - Context-aware provider suggestions
- **Health Monitoring** - Comprehensive configuration validation

### Configuration Commands

```bash
# Interactive setup wizard
aura setup init                          # First-time guided setup
aura setup check                         # Health check your configuration
aura setup provider ethereum tenderly    # Provider setup wizard
aura setup migrate ethereum polygon      # Migrate between networks
aura setup env dev                       # Environment-specific config

# Direct configuration
aura config list                         # Show all settings
aura config get defaultNetwork           # Get specific setting
aura config set defaultNetwork polygon   # Set configuration value
aura config rpc ethereum <url>          # Configure RPC (auto-tested)
aura config reset                        # Reset to defaults
aura config path                         # Show config file location
```

### Error Handling

```bash
# Typo detection
$ aura config get defaltNetwork
❌ Configuration Error: Invalid configuration key 'defaltNetwork'
💡 Did you mean:
   defaultNetwork

# RPC validation with testing
$ aura config rpc ethereum https://bad-url.com
🧪 Testing RPC connection...
❌ Connection test failed: Invalid URL
💡 Recommendations:
   • For transaction tracing, consider using Tenderly
   • Alternative: Use Alchemy with debug API add-on
   • Configure with: aura config rpc ethereum <tenderly_url>
```

### RPC Provider Configuration

Aura automatically detects different RPC providers and their capabilities:

| Provider | Trace Support | Auto-Detection | Use Case |
|----------|---------------|----------------|----------|
| **Tenderly** | ✅ Excellent | ✅ Yes | Development & debugging |
| **Alchemy** | ⚠️ Paid tier | ✅ Yes | Production applications |
| **Infura** | ⚠️ Add-on required | ✅ Yes | Reliable infrastructure |
| **Public RPCs** | ❌ No | ✅ Yes | Testing only |

**Provider Setup:**

```bash
# Interactive provider setup
aura setup provider ethereum

# Output shows:
# 🔧 Setting up RPC provider for ethereum
# 
# Recommended providers:
# 1. Tenderly - Excellent trace support and debugging tools
# 2. Alchemy - Reliable and fast for production applications
# 3. Infura - Established and reliable infrastructure
#
# 📋 Tenderly Setup Instructions:
#    1. Sign up at https://tenderly.co
#    2. Create a new project  
#    3. Go to Settings → Gateway
#    4. Copy your Access Key
#    5. Use: aura config rpc ethereum https://mainnet.gateway.tenderly.co/YOUR_KEY
```

### Environment-Specific Configuration

```bash
# Development environment (debug enabled, Tenderly recommended)
aura setup env dev

# Production environment (optimized for reliability)
aura setup env prod

# Staging environment (production-like)
aura setup env staging
```

### Configuration Files

Aura stores configuration in `~/.aura/config.json` with automatic backups:

```json
{
  "version": "0.1.0",
  "defaultNetwork": "ethereum",
  "rpcEndpoints": {
    "ethereum": "https://mainnet.gateway.tenderly.co/YOUR_KEY",
    "polygon": "https://polygon.gateway.tenderly.co/YOUR_KEY"
  },
  "settings": {
    "outputFormat": "human",
    "colorOutput": true,
    "verboseMode": false
  }
}
```

### Supported Networks

| Network | Chain ID | Default RPC |
|---------|----------|-------------|
| Ethereum | 1 | Cloudflare |
| Polygon | 137 | Public RPC |
| Arbitrum | 42161 | Public RPC |

## 📚 Command Reference

### Transaction Inspection

#### `aura inspect <txHash>`

Inspect a transaction and display its execution trace with intelligent analysis.

**Options:**
- `-n, --network <network>` - Network to use (ethereum, polygon, arbitrum)
- `--json` - Output raw data in JSON format
- `--verbose` - Enable detailed error reporting
- `--depth <number>` - Limit call stack depth
- `--contracts-only` - Show only contract calls
- `--events-only` - Show only events

**Examples:**
```bash
# Basic inspection with auto-configuration
aura inspect 0x123...

# Network-specific analysis
aura inspect 0x123... --network polygon

# JSON output for automation
aura inspect 0x123... --json | jq '.events[]'

# Focus on contract interactions
aura inspect 0x123... --contracts-only --depth 5
```

### Configuration Management

#### `aura config <command>`

Manage Aura configuration with intelligent validation and testing.

**Subcommands:**
- `list` - Show all configuration settings
- `get <key>` - Get specific configuration value
- `set <key> <value>` - Set configuration value (with validation)
- `rpc <network> [url]` - Configure RPC endpoint (with auto-testing)
- `reset` - Reset configuration to defaults
- `path` - Show configuration file paths

**Examples:**
```bash
# View current configuration
aura config list

# Get specific setting with context
aura config get rpc.ethereum
# Output: Shows RPC URL + provider info + capabilities

# Set with smart validation
aura config set defaultNetwork polygon
aura config set settings.outputFormat json

# RPC configuration with testing
aura config rpc ethereum https://mainnet.gateway.tenderly.co/KEY
# Output: Tests connection, shows latency, detects capabilities
```

### Setup & Management

#### `aura setup <command>`

Interactive setup and configuration management with guided workflows.

**Subcommands:**
- `init` - Run first-time interactive setup wizard
- `check` - Comprehensive configuration health check
- `provider <network> [type]` - Interactive provider setup
- `migrate <from> <to>` - Migrate configuration between networks
- `env <environment>` - Setup environment-specific configuration

**Examples:**
```bash
# First-time setup (recommended for new users)
aura setup init

# Health check with detailed analysis
aura setup check
# Output:
# 🏥 Running Aura configuration health check...
# ✅ Configuration file exists
# ✅ Default network: ethereum  
# 📡 Testing 2 RPC provider(s)...
# ✅ ethereum: Connected (245ms)
#    🔍 Trace: ✅  📚 Archive: ✅  🏷️ Provider: Tenderly

# Provider setup wizard
aura setup provider ethereum tenderly
# Shows setup instructions, tests connection, saves config

# Network migration
aura setup migrate ethereum polygon
# Migrates settings, finds working providers, updates defaults

# Environment setup
aura setup env dev
# Configures debug mode, recommends Tenderly, optimizes for development
```

### Global Options

```bash
aura --version    # Show version
aura --help       # Show comprehensive help
aura <command> --help  # Command-specific help
```
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

### Architecture

Aura is built with a modular architecture:

```
src/
├── cli/           # Command-line interface
├── commands/      # Command implementations
│   ├── config.ts      # Enhanced config commands  
│   ├── config-setup.ts # Interactive setup system
│   └── inspect.ts     # Transaction inspection
├── services/      # Core business logic
│   ├── config-manager.ts   # Configuration management
│   ├── config-validator.ts # Validation & typo detection
│   ├── network-detector.ts # RPC intelligence & testing
│   └── token.ts           # Token recognition
├── providers/     # Blockchain providers
│   └── rpc.ts            # Enhanced RPC with capabilities
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

**Design Principles:**
- **User-Focused** - Every error includes helpful guidance
- **Intelligent Defaults** - Automatic detection and optimization
- **Industry Standards** - Following established CLI patterns
- **Graceful Degradation** - Continues working when advanced features fail

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
