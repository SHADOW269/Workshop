import json
import mimetypes
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import scraper

ROOT = Path(__file__).parent
STATIC = ROOT / 'static'


class _Server(ThreadingHTTPServer):
    daemon_threads = True


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def setup(self):
        super().setup()
        self._sent = False

    def send_bytes(self, body, ctype, filename=None, status=200):
        if self._sent:
            return
        self._sent = True
        if isinstance(body, str):
            body = body.encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Connection', 'close')
        if filename:
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def send_json(self, data, status=200):
        self.send_bytes(json.dumps(data, indent=2, ensure_ascii=False).encode('utf-8'),
                        'application/json; charset=utf-8', status=status)

    def read_json(self):
        try:
            n = int(self.headers.get('Content-Length') or 0)
            if n:
                return json.loads(self.rfile.read(n).decode('utf-8') or '{}')
        except Exception:
            pass
        return {}

    def handle_export(self, qs):
        q = urllib.parse.parse_qs(qs)
        fmt = (q.get('format', ['json'])[0] or 'json').lower()
        slug = q.get('vendor', [None])[0]
        pid = q.get('id', [None])[0]
        if slug and pid:
            p = scraper.load_product(slug, pid)
            products = [p] if p else []
        else:
            products = scraper.load_products()
        products = [p for p in products if p]
        if fmt == 'csv':
            self.send_bytes(scraper.export_csv(products), 'text/csv; charset=utf-8',
                            'keydir-aggregator.csv')
        else:
            self.send_bytes(scraper.export_json(products), 'application/json; charset=utf-8',
                            'keydir-aggregator.json')

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        path = u.path
        try:
            if path in ('/', '/index.html'):
                self.send_bytes((STATIC / 'index.html').read_bytes(), 'text/html; charset=utf-8')
            elif path == '/api/vendors':
                self.send_json(scraper.load_vendors())
            elif path == '/api/products':
                self.send_json(scraper.load_products_light())
            elif path.startswith('/api/products/'):
                parts = path.split('/')
                p = scraper.load_product(parts[3], parts[4]) if len(parts) == 5 else None
                if p is None:
                    self.send_json({'error': 'not found'}, 404)
                else:
                    self.send_json(p)
            elif path.startswith('/api/export'):
                self.handle_export(u.query)
            else:
                fp = STATIC / path.lstrip('/')
                if fp.is_file():
                    ctype = mimetypes.guess_type(str(fp))[0] or 'application/octet-stream'
                    self.send_bytes(fp.read_bytes(), ctype)
                else:
                    self.send_json({'error': 'not found'}, 404)
        except Exception as e:
            try:
                self.send_json({'error': str(e)}, 500)
            except Exception:
                pass

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        try:
            if u.path == '/api/vendors':
                d = self.read_json()
                name = (d.get('name') or '').strip()
                url = (d.get('url') or '').strip()
                if not name or not url:
                    self.send_json({'error': 'Name and URL are required'}, 400)
                    return
                v, err = scraper.add_vendor(name, (d.get('website') or '').strip(),
                                            (d.get('category') or '').strip(), url)
                if err:
                    self.send_json({'error': err}, 400)
                else:
                    self.send_json(v)
            elif u.path.startswith('/api/scrape'):
                d = self.read_json()
                v = scraper.vendor_by_id(d.get('vendorId') or '')
                if not v:
                    self.send_json({'error': 'vendor not found'}, 404)
                    return
                try:
                    limit = int(d.get('limit') or 50)
                except (TypeError, ValueError):
                    limit = 50
                self.send_json(scraper.scrape_vendor(v, limit=limit))
            elif u.path.startswith('/api/vendors/') and u.path.endswith('/delete'):
                scraper.delete_vendor(u.path.split('/')[3])
                self.send_json({'ok': True})
            else:
                self.send_json({'error': 'not found'}, 404)
        except Exception as e:
            try:
                self.send_json({'error': str(e)}, 500)
            except Exception:
                pass


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
    print(f'keydir-aggregator running at http://localhost:{port}')
    _Server(('127.0.0.1', port), Handler).serve_forever()
