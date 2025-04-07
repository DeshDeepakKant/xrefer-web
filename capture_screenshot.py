#!/usr/bin/env python3
"""
Screenshot capture utility for the XRefer HTML visualization demo.
This script uses selenium to take a screenshot of the running demo.
"""

import os
import time
import argparse
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def capture_screenshot(url="http://localhost:8888", output_path="screenshot.png", wait_time=5):
    """
    Capture a screenshot of the XRefer visualization.
    
    Args:
        url: URL of the running demo
        output_path: Where to save the screenshot
        wait_time: How long to wait for the page to load
    """
    print(f"Capturing screenshot of {url}")
    
    # Configure Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in headless mode
    chrome_options.add_argument("--window-size=1920,1080")  # Set window size
    
    try:
        # Initialize the driver
        driver = webdriver.Chrome(options=chrome_options)
        
        # Load the page
        driver.get(url)
        print("Waiting for page to load...")
        time.sleep(wait_time)  # Wait for the graph to render
        
        # Take screenshot
        driver.save_screenshot(output_path)
        print(f"Screenshot saved to {output_path}")
        
        # Close the browser
        driver.quit()
        
        return True
    except Exception as e:
        print(f"Error capturing screenshot: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Capture screenshot of XRefer visualization")
    parser.add_argument("--url", default="http://localhost:8888",
                        help="URL of the running demo (default: http://localhost:8888)")
    parser.add_argument("--output", default="xrefer_demo_screenshot.png",
                        help="Path to save the screenshot (default: xrefer_demo_screenshot.png)")
    parser.add_argument("--wait", type=int, default=5,
                        help="Seconds to wait for page load (default: 5)")
    
    args = parser.parse_args()
    capture_screenshot(args.url, args.output, args.wait) 