# XRefer HTML Visualization Demo

This is a demo of the XRefer HTML Visualization component, which allows analysts to explore binary analysis results outside of IDA Pro.

## Running the Demo

There are two ways to run the demo:

### 1. Using the Launcher Script

```bash
# Basic usage - opens browser automatically
python run_demo.py

# Specify a different port
python run_demo.py --port 8080

# Don't open browser automatically
python run_demo.py --no-browser
```

### 2. Running the Server Directly

```bash
cd website
python server.py

# Or with options
python server.py --port 8080 --no-browser
```

## Exploring the Visualization

Once the server is running, you can use the following features:

1. **View Clusters**: The main view shows a graph of clusters representing different functional areas of the binary.
2. **Navigate**: Click on clusters to see their details in the right sidebar.
3. **Expand/Collapse**: Double-click on clusters to expand and show their internal functions.
4. **Search**: Use the search box to find specific functions, strings, or other artifacts.
5. **Filter**: Apply filters to focus on specific artifact types (APIs, strings, etc.).
6. **Zoom/Pan**: Use the controls or mouse to navigate the graph.

## Sample Data

The demo uses sample data representing a ransomware binary. This showcases how XRefer's cluster analysis can break down complex malware into understandable functional components.

## Integration with XRefer

In a real deployment, this HTML visualization would be exported by the XRefer IDA Pro plugin using the `Edit -> XRefer -> Export -> Export to HTML` menu option. The exported visualization contains all the cluster information and binary artifacts from your actual analysis. 