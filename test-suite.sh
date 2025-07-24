#!/bin/bash

# Aura CLI Test Suite
# Tests various transaction types and CLI options

echo "🧪 Aura CLI Test Suite"
echo "======================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_exit_code="${3:-0}"
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    echo "Command: $command"
    echo ""
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if eval "$command" > /dev/null 2>&1; then
        if [ $? -eq $expected_exit_code ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}❌ FAIL (unexpected exit code)${NC}"
        fi
    else
        if [ $expected_exit_code -ne 0 ]; then
            echo -e "${GREEN}✅ PASS (expected failure)${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}❌ FAIL${NC}"
        fi
    fi
    echo ""
}

# Build the project first
echo "📦 Building project..."
npm run build
echo ""

# Test 1: Known working transaction (GALA)
run_test "GALA Token Transaction" \
    "aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b"

# Test 2: JSON output
run_test "JSON Output Format" \
    "aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --json"

# Test 3: Depth limiting
run_test "Depth Limiting" \
    "aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --depth 2"

# Test 4: Events only
run_test "Events Only Mode" \
    "aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --events-only"

# Test 5: Contracts only
run_test "Contracts Only Mode" \
    "aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --contracts-only"

# Test 6: Invalid transaction hash (should fail)
run_test "Invalid Transaction Hash" \
    "aura inspect 0xinvalid" 1

# Test 7: Non-existent transaction (should fail)
run_test "Non-existent Transaction" \
    "aura inspect 0x1111111111111111111111111111111111111111111111111111111111111111" 1

# Test 8: Help command
run_test "Help Command" \
    "aura --help"

# Test 9: Version command
run_test "Version Command" \
    "aura --version"

# Test 10: Verbose mode
run_test "Verbose Mode" \
    "aura inspect 0xa4b1f606b66105fa45cb5db23d2f6597075701e7f0e2367f4e6a39d17a8cf98b --verbose"

echo "📊 Test Results"
echo "==============="
echo -e "Tests run: $TESTS_RUN"
echo -e "${GREEN}Tests passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests failed: $((TESTS_RUN - TESTS_PASSED))${NC}"

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed${NC}"
    exit 1
fi
