"""
SpendWise Local Server
Run:   python server.py
Open:  http://localhost:8000
"""

import json
import os
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'transactions.json')
RECURRING_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'recurring.json')


def read_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def write_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def read_recurring():
    if not os.path.exists(RECURRING_FILE):
        return []
    with open(RECURRING_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def write_recurring(data):
    with open(RECURRING_FILE, 'w') as f:
        json.dump(data, f, indent=2)


class Handler(SimpleHTTPRequestHandler):

    def do_GET(self):
        if self.path == '/api/transactions':
            data = read_data()
            self._json_response(200, data)
        elif self.path == '/api/recurring':
            data = read_recurring()
            self._json_response(200, data)
        elif self.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/transactions':
            body = self._read_body()
            if body is None:
                return
            data = read_data()
            data.insert(0, body)
            write_data(data)
            self._json_response(201, body)

        elif self.path == '/api/transactions/delete':
            body = self._read_body()
            if body is None:
                return
            tid = body.get('id')
            if not tid:
                self._json_response(400, {'error': 'Missing id'})
                return
            data = read_data()
            data = [t for t in data if t.get('id') != tid]
            write_data(data)
            self._json_response(200, {'deleted': tid})

        elif self.path == '/api/transactions/bulk':
            body = self._read_body()
            if body is None:
                return
            items = body if isinstance(body, list) else body.get('transactions', [])
            data = read_data()
            existing_ids = {t.get('id') for t in data}
            added = [t for t in items if t.get('id') not in existing_ids]
            data = added + data
            write_data(data)
            self._json_response(201, {'added': len(added), 'skipped': len(items) - len(added)})

        elif self.path == '/api/transactions/update':
            body = self._read_body()
            if body is None:
                return
            tid = body.get('id')
            if not tid:
                self._json_response(400, {'error': 'Missing id'})
                return
            data = read_data()
            updated = False
            for i, t in enumerate(data):
                if t.get('id') == tid:
                    data[i] = body
                    updated = True
                    break
            if not updated:
                self._json_response(404, {'error': 'Not found'})
                return
            write_data(data)
            self._json_response(200, body)

        elif self.path == '/api/recurring':
            body = self._read_body()
            if body is None:
                return
            data = read_recurring()
            data.append(body)
            write_recurring(data)
            self._json_response(201, body)

        elif self.path == '/api/recurring/update':
            body = self._read_body()
            if body is None:
                return
            rid = body.get('id')
            if not rid:
                self._json_response(400, {'error': 'Missing id'})
                return
            data = read_recurring()
            updated = False
            for i, r in enumerate(data):
                if r.get('id') == rid:
                    data[i] = body
                    updated = True
                    break
            if not updated:
                self._json_response(404, {'error': 'Not found'})
                return
            write_recurring(data)
            self._json_response(200, body)

        elif self.path == '/api/recurring/delete':
            body = self._read_body()
            if body is None:
                return
            rid = body.get('id')
            if not rid:
                self._json_response(400, {'error': 'Missing id'})
                return
            data = read_recurring()
            data = [r for r in data if r.get('id') != rid]
            write_recurring(data)
            self._json_response(200, {'deleted': rid})

        else:
            self._json_response(404, {'error': 'Not found'})

    # ---- helpers ----

    def _read_body(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length)
            return json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            self._json_response(400, {'error': 'Invalid JSON'})
            return None

    def _json_response(self, status, data):
        payload = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, fmt, *args):
        # cleaner console output — only show API calls
        msg = str(args[0]) if args else ''
        if '/api/' in msg:
            print(f'  API  {msg}')


if __name__ == '__main__':
    port = 8000
    server = HTTPServer(('localhost', port), Handler)
    print(f'\n  SpendWise running at http://localhost:{port}\n')
    webbrowser.open(f'http://localhost:{port}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  Server stopped.')
        server.server_close()
