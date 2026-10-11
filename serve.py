"""
Orbital Puzzle - Local Development Server
Run this script to launch the local web server and open the prototype in your default browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else ""
    url = f"http://localhost:{PORT}/{target}"
    print(f"Starting Orbital Puzzle Prototype server on {url}")
    # Open browser automatically
    webbrowser.open(url)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
