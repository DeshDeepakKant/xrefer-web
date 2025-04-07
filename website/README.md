# XRefer HTML Visualizer

A web-based visualization tool for XRefer's cluster analysis data. This interactive HTML exporter allows analysts to explore binary analysis results in a user-friendly interface.

## Features

- **Interactive Cluster Graph**: Visualize relationships between function clusters with an intuitive graph interface.
- **Semantic Descriptions**: View natural language explanations for clusters and their contained functions.
- **Artifact Analysis**: Explore strings, API calls, libraries, and CAPA matches associated with each cluster.
- **Rich Navigation**: Zoom, pan, filter, and search to quickly locate areas of interest.
- **Responsive Design**: Works on desktop and mobile devices with adaptive layout.
- **Dark/Light Themes**: Choose your preferred visual theme for comfortable analysis.

## Usage

1. Open `index.html` in a modern web browser.
2. Navigate the cluster graph by:
   - Clicking nodes to see detailed information
   - Double-clicking clusters to expand/collapse them
   - Using the zoom controls to adjust your view
   - Searching for specific functions or artifacts
   - Filtering the display by artifact type or cluster category

## Data Format

The visualization expects JSON data in the format specified in `data/sample_cluster_data.json`. This format includes:

- **Metadata**: Information about the analyzed binary
- **Clusters**: Groups of related functions with their relationships
- **Nodes**: Individual functions within clusters
- **Artifacts**: Strings, APIs, libraries, and other extracted information

## Development

### Project Structure

```
website/
├── css/
│   └── styles.css          # Styling for the visualization
├── data/
│   └── sample_cluster_data.json  # Example data format
├── js/
│   ├── data.js             # Data loading and processing
│   ├── graph.js            # Visualization rendering with Cytoscape
│   ├── main.js             # Application initialization
│   └── ui.js               # User interface interactions
└── index.html              # Main HTML page
```

### Technologies Used

- **Cytoscape.js**: Graph visualization library
- **Bootstrap**: Responsive UI components
- **Font Awesome**: Icons for the interface

## Integration with XRefer

This HTML exporter is designed to be integrated with the XRefer IDA Pro plugin. The Python exporter module in XRefer will generate the JSON data consumed by this visualization.

## License

This project is released under the Apache License 2.0, matching the license of the main XRefer project. 