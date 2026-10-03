"""Serve the local site with JavaScript MIME types suitable for service workers."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.js': 'application/javascript', '.json': 'application/json',
                      '.webp': 'image/webp', '.css': 'text/css'}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8878)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    def handler(*a, **kw):
        return Handler(*a, directory=str(root), **kw)
    ThreadingHTTPServer(('127.0.0.1', args.port), handler).serve_forever()
