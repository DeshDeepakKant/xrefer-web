# XRefer HTML Visualization Demo Instructions

This repository contains a demo of the XRefer HTML Visualization component. This is a GSoC 2025 project that adds web-based visualization capabilities to the XRefer binary analysis tool.

## Quick Start

```bash
# Run the setup script to prepare the environment
./demo_setup.sh

# OR run the demo directly
python run_demo.py
```

## Repository Contents

- `website/`: The HTML visualization component 
  - `index.html`: Main HTML page
  - `css/`: Stylesheets
  - `js/`: JavaScript files
  - `data/`: Sample data
  - `server.py`: Development server

- `run_demo.py`: Launcher script for the demo
- `demo_setup.sh`: Environment setup script
- `capture_screenshot.py`: Utility to capture screenshots of the demo
- `DEMO_README.md`: Basic usage instructions
- `DEMO_OVERVIEW.md`: Technical documentation

## Requirements

- Python 3.6 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Optional: Chrome WebDriver (for screenshot capture)

## Key Features

1. **Interactive Cluster Graph**: Visualize relationships between function clusters
2. **Semantic Descriptions**: View natural language explanations of cluster purposes
3. **Artifact Analysis**: Explore strings, APIs, libraries, and other binary artifacts
4. **Rich Navigation**: Zoom, pan, filter, and search to explore the binary
5. **Responsive Design**: Works on desktop and mobile devices

## Development

To modify the visualization:

1. Edit files in the `website/` directory
2. Run the server (`python website/server.py`)
3. Refresh the browser to see changes

## Integration with XRefer

In a real deployment, this HTML visualization is exported by the XRefer IDA Pro plugin. The integration is handled by the `html_exporter.py` module which:

1. Extracts analysis data from XRefer
2. Packages it with the web application files
3. Creates a self-contained, shareable HTML visualization

## License

This project is released under the Apache License 2.0, matching the license of the main XRefer project. 