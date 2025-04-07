# XRefer HTML Visualizer

A sophisticated web-based visualization interface for XRefer binary analysis data, offering interactive exploration of malware structures, execution paths, and artifacts.

## Features

- **Interactive Graph Visualization**: Explore complex binary relationships with an interactive graph interface
- **Cluster Analysis View**: Examine function clusters and their relationships
- **Path Graph Analysis**: Visualize code execution paths with both full and simplified views
- **Function Artifact Display**: Inspect APIs, strings, and other artifacts associated with binary functions
- **Advanced Malware Demo**: Includes advanced visualization of a sophisticated ransomware sample

## Quick Start

```bash
# Clone the repository
git clone https://github.com/DeshDeepakKant/xrefer-web.git
cd xrefer-web

# Set up demo environment (creates venv and installs dependencies)
./demo_setup.sh

# Run the demo server
python3 run_demo.py --port 8889
```

Visit `http://localhost:8889` in your browser to explore the visualization.

## Visualization Pages

- **Main Demo**: http://localhost:8889/ - Overview of basic functionality
- **Direct Demo**: http://localhost:8889/direct-demo.html - Focused cluster visualization
- **Complex Malware Analysis**: http://localhost:8889/complex-malware-demo.html - Advanced malware visualization
- **Extreme Visualization**: http://localhost:8889/extreme-malware-visualization.html - Detailed XRefer-style interface
- **Path Graph**: http://localhost:8889/pathgraph-view.html - Execution path visualization
- **Malware Functions**: http://localhost:8889/malware-functions.html - Function artifact analysis

## Repository Structure

```
.
├── website/              # Web visualization interface
│   ├── css/              # CSS stylesheets
│   ├── js/               # JavaScript functionality
│   │   ├── data.js       # Data processing utilities
│   │   ├── graph.js      # Graph visualization
│   │   ├── ui.js         # User interface components
│   │   └── main.js       # Application initialization
│   ├── data/             # Sample data for visualization
│   └── server.py         # Local development server
├── run_demo.py           # Demo launcher script
├── demo_setup.sh         # Environment setup script
├── capture_screenshot.py # Utility for capturing screenshots
├── DEMO_OVERVIEW.md      # Demo architecture overview
└── DEMO_INSTRUCTIONS.md  # Detailed usage instructions
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
