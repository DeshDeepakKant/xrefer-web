#!/usr/bin/env python3
"""
XRefer HTML Visualization Demo Launcher.
This script provides an easy way to start the demo website.
"""

import os
import subprocess
import sys
from pathlib import Path

def main():
    """Run the XRefer HTML visualization demo."""
    # Get the path to the website server script
    script_dir = Path(__file__).parent.resolve()
    server_script = script_dir / "website" / "server.py"
    
    if not server_script.exists():
        print(f"Error: Server script not found at {server_script}")
        return 1
    
    # Make the server script executable if it's not already
    if not os.access(server_script, os.X_OK):
        try:
            os.chmod(server_script, 0o755)
        except Exception as e:
            print(f"Warning: Could not make server script executable: {e}")
    
    print("Starting XRefer HTML Visualization Demo...")
    
    # Pass any command-line arguments to the server script
    cmd = [sys.executable, str(server_script)] + sys.argv[1:]
    
    try:
        # Execute the server script
        process = subprocess.run(cmd)
        return process.returncode
    except KeyboardInterrupt:
        # Handle Ctrl+C gracefully
        print("\nDemo stopped.")
        return 0
    except Exception as e:
        print(f"Error starting demo: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 