"""Local development web server for the Fractured teaser. No packages required."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import webbrowser

os.chdir(Path(__file__).resolve().parent)
HOST = '127.0.0.1'
for port in (3000, 3001, 3002):
    try:
        server = ThreadingHTTPServer((HOST, port), SimpleHTTPRequestHandler)
        break
    except OSError:
        continue
else:
    raise SystemExit('Ports 3000–3002 are occupied. Close another server and try again.')
url = f'http://localhost:{port}'
print(f'\n Fractured teaser running at {url}')
print(' Press Ctrl+C to stop the server.\n')
webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    print('\nServer stopped.')
finally:
    server.server_close()
