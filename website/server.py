#!/usr/bin/env python3
"""
Simple HTTP server for the XRefer HTML Visualization demo.
This server allows you to run the XRefer visualization locally.
"""

import http.server
import socketserver
import os
import webbrowser
import argparse
from pathlib import Path

def serve_website(port=8000, open_browser=True):
    """
    Start an HTTP server to serve the XRefer visualization website.
    
    Args:
        port: Port number to serve on (default: 8000)
        open_browser: Whether to automatically open a browser window
    """
    # Change to the website directory
    website_path = Path(__file__).parent.resolve()
    os.chdir(website_path)
    
    handler = http.server.SimpleHTTPRequestHandler
    
    # Create the server
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"\n🚀 XRefer visualization server running at http://localhost:{port}")
        print(f"📂 Serving files from: {website_path}")
        print("🔍 Press Ctrl+C to stop the server\n")
        
        # Open a browser window if requested
        if open_browser:
            webbrowser.open(f"http://localhost:{port}")
        
        # Serve until process is killed
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n⏹️  Server stopped.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="XRefer HTML Visualization Server")
    parser.add_argument("-p", "--port", type=int, default=8000,
                        help="Port to serve on (default: 8000)")
    parser.add_argument("--no-browser", action="store_true",
                        help="Don't automatically open a browser window")
    
    args = parser.parse_args()
    serve_website(port=args.port, open_browser=not args.no_browser) 