# Contributing to Aura

Thank you for your interest in contributing to Aura! We welcome contributions from the community.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/aura.git
   cd aura
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development

### Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Test your changes
./test-suite.sh
```

### Testing

Before submitting changes, ensure all tests pass:

```bash
# Run the test suite
./test-suite.sh

# Test specific functionality
npm run build && aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b

# Test different transaction types
aura inspect 0x40455a064096af57e8440bdcb85034bb31f512f71fa12e01b1a47d5bac46e7cd
```

## 📝 Submitting Changes

1. **Create a pull request** with a clear title and description
2. **Include tests** for new functionality
3. **Update documentation** if needed
4. **Follow the code style** (TypeScript with ESLint)

## 🎯 Areas for Contribution

- **New Networks**: Add support for more blockchains
- **Token Recognition**: Expand the known token database
- **Output Formats**: New display options or export formats
- **Performance**: Optimization and caching improvements
- **Documentation**: Examples, guides, and API docs
- **Testing**: More comprehensive test coverage

## 📋 Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Add JSDoc comments for public functions
- Use meaningful variable names
- Keep functions focused and small

## 🐛 Bug Reports

When reporting bugs, please include:

- Transaction hash that causes the issue
- Network being used
- Expected vs actual behavior
- Steps to reproduce
- Error messages (if any)

## 💡 Feature Requests

We welcome feature requests! Please:

- Check existing issues first
- Describe the use case
- Explain why it would be valuable
- Provide examples if possible

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in the README and release notes.

## 📞 Contact

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Email: [your-email@example.com]

Thank you for helping make Aura better! 🚀
