#!/bin/bash
# XRefer HTML Visualization Demo Setup
# This script sets up and runs the XRefer HTML visualization demo

set -e  # Exit on error

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up XRefer HTML Visualization Demo...${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is required but not installed.${NC}"
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}Error: pip3 is required but not installed.${NC}"
    exit 1
fi

# Create a virtual environment
echo -e "${GREEN}Creating virtual environment...${NC}"
python3 -m venv xrefer_demo_venv

# Activate virtual environment
echo -e "${GREEN}Activating virtual environment...${NC}"
source xrefer_demo_venv/bin/activate

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
pip install -q selenium webdriver_manager

# Make scripts executable
echo -e "${GREEN}Making scripts executable...${NC}"
chmod +x run_demo.py website/server.py

# Print instructions
echo -e "${YELLOW}====================================${NC}"
echo -e "${YELLOW}XRefer Demo Setup Complete!${NC}"
echo -e "${YELLOW}====================================${NC}"
echo -e "${GREEN}To run the demo:${NC}"
echo -e "  ${GREEN}1. Activate the virtual environment:${NC}"
echo -e "     source xrefer_demo_venv/bin/activate"
echo -e "  ${GREEN}2. Run the demo:${NC}"
echo -e "     python run_demo.py"
echo -e ""
echo -e "${GREEN}Would you like to run the demo now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${GREEN}Starting demo...${NC}"
    python run_demo.py
else
    echo -e "${GREEN}You can run the demo later using the instructions above.${NC}"
fi 