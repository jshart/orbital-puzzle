"""
Orbital Puzzle - Local Development Server
Run this script to launch the local web server and open the prototype in your default browser.
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

if __name__ == '__main__':
    print(f"Starting Orbital Puzzle Prototype server on http://localhost:{PORT}")
    # Open browser automatically
    webbrowser.open(f"http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
