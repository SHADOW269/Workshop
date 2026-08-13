import hashlib
import json
import re
import sys
import threading
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import core
from vendors import generic, get_module

ROOT = Path(__file__).parent
DATA = ROOT / 'data'
VENDORS_FILE = DATA / 'vendors.json'
PRODUCTS_DIR = DATA / 'products'
_lock = threading.Lock()


def now():
    return datetime.now(timezone.utc).isoformat()


def slugify(s):
    s = re.sub(r'[^a-z0-9]+', '-', s.strip().lower()).strip('-')
    return s or 'vendor'


def ensure_dirs():
    DATA.mkdir(exist_ok=True)
    PRODUCTS_DIR.mkdir(exist_ok=True)


def load_vendors():
    ensure_dirs()
    if not VENDORS_FILE.exists():
        return []
    try:
        return json.loads(VENDORS_FILE.read_text())
    except Exception:
        return []


def save_vendors(vs):
    ensure_dirs()
    with _lock:
        VENDORS_FILE.write_text(json.dumps(vs, indent=2, ensure_ascii=False))


def add_vendor(name, website, category, url):
    vs = load_vendors()
    slug = slugify(name)
    if any(v['id'] == slug for v in vs):
        return None, 'A vendor with this name already exists'
    v = {'id': slug, 'slug': slug, 'name': name, 'website': website, 'category': category, 'url': url, 'createdAt': now()}
    vs.append(v)
    save_vendors(vs)
    return v, None


def delete_vendor(vid):
    vs = load_vendors()
    save_vendors([v for v in vs if v['id'] != vid])
    d = vendor_dir(vid)
    if d.exists():
        for f in d.glob('*.json'):
            f.unlink()
        d.rmdir()


def vendor_by_id(vid):
    for v in load_vendors():
        if v['id'] == vid:
            return v
    return None


def vendor_dir(slug):
    return PRODUCTS_DIR / slug


def product_path(slug, pid):
    return vendor_dir(slug) / f'{pid}.json'


def product_id(url):
    h = hashlib.sha1(url.encode()).hexdigest()[:8]
    name = slugify(urlparse(url).path.split('/')[-1]) or 'product'
    return f'{name}-{h}'


def load_products(slug=None):
    out = []
    dirs = [vendor_dir(slug)] if slug else (sorted(PRODUCTS_DIR.iterdir()) if PRODUCTS_DIR.exists() else [])
    for d in dirs:
        if not d.is_dir():
            continue
        v = vendor_by_id(d.name)
        for f in sorted(d.glob('*.json')):
            try:
                p = json.loads(f.read_text())
            except Exception:
                continue
            p.setdefault('id', f.stem)
            p.setdefault('vendor', v['name'] if v else d.name)
            p.setdefault('vendorId', d.name)
            p.setdefault('category', v['category'] if v else '')
            out.append(p)
    return out


def load_products_light():
    out = []
    for p in load_products():
        out.append({k: v for k, v in p.items() if k not in ('rawHtml', 'rawText')})
    return out


def load_product(slug, pid):
    f = product_path(slug, pid)
    if not f.exists():
        return None
    try:
        return json.loads(f.read_text())
    except Exception:
        return None


def save_product(slug, product):
    ensure_dirs()
    d = vendor_dir(slug)
    d.mkdir(exist_ok=True)
    pid = product.get('id') or product_id(product['url'])
    product['id'] = pid
    with _lock:
        product_path(slug, pid).write_text(json.dumps(product, indent=2, ensure_ascii=False))
    return pid


def scrape_product_page(vendor, url):
    html, err = core.fetch(url)
    if html is None:
        return {'error': err}
    root = core.parse_html(html)
    module = get_module(url)
    product = module.scrape(root, html, url)
    product.update({
        'vendorId': vendor['id'],
        'vendor': vendor['name'],
        'category': vendor.get('category', ''),
        'url': url,
        'lastUpdated': now(),
        'rawHtml': html[:400000],
        'rawText': (product.get('rawText') or core.visible_text(core.first(root, tag='main') or root))[:20000],
    })
    return product


def scrape_vendor(vendor, limit=50):
    queue = [vendor['url']]
    seen_pages = set()
    urls = []
    seen_urls = set()
    saved = scanned = errors = 0
    while queue and len(seen_pages) < 30 and saved < limit:
        page_url = queue.pop(0)
        if page_url in seen_pages:
            continue
        seen_pages.add(page_url)
        html, err = core.fetch(page_url)
        if html is None:
            continue
        root = core.parse_html(html)
        for u in generic.product_links(root, page_url):
            if u not in seen_urls:
                seen_urls.add(u)
                urls.append(u)
        np_ = generic.next_page(root, page_url)
        if np_ and np_ not in seen_pages and np_ not in queue:
            queue.append(np_)
        for pu in generic.page_links(root, page_url):
            if pu not in seen_pages and pu not in queue:
                queue.append(pu)
        while urls and saved < limit:
            u = urls.pop(0)
            if u in seen_pages:
                continue
            seen_pages.add(u)
            scanned += 1
            print(f'  [{saved + 1}] {u}')
            p = scrape_product_page(vendor, u)
            if 'error' in p:
                errors += 1
                continue
            save_product(vendor['id'], p)
            saved += 1
    return {'ok': True, 'vendor': vendor['name'], 'url': vendor['url'], 'saved': saved, 'scanned': scanned, 'errors': errors}


def flatten_products(products):
    spec_keys = sorted({k for p in products for k in (p.get('specs') or {})})
    base = ['id', 'name', 'brand', 'sku', 'price', 'comparePrice', 'availability',
            'stockStatus', 'category', 'vendor', 'url', 'lastUpdated', 'description',
            'shipping', 'badges', 'coupons', 'tags', 'breadcrumbs', 'images']
    headers = base + [f'spec.{k}' for k in spec_keys] + [
        'variant.name', 'variant.url', 'variant.price', 'variant.availability',
        'variant.stockStatus', 'variant.color', 'variant.switch', 'variant.keycaps', 'variant.sku']
    rows = []
    for p in products:
        variants = p.get('variants') or [{}]
        for v in variants:
            row = {}
            for h in base:
                val = p.get(h)
                if isinstance(val, (list, dict)):
                    val = json.dumps(val, ensure_ascii=False)
                row[h] = '' if val is None else str(val)
            for k in spec_keys:
                row[f'spec.{k}'] = (p.get('specs') or {}).get(k, '')
            for field, col in [('name', 'variant.name'), ('url', 'variant.url'), ('price', 'variant.price'),
                               ('availability', 'variant.availability'), ('stockStatus', 'variant.stockStatus'),
                               ('color', 'variant.color'), ('switch', 'variant.switch'),
                               ('keycaps', 'variant.keycaps'), ('sku', 'variant.sku')]:
                val = v.get(field)
                row[col] = '' if val is None else str(val)
            rows.append(row)
    return headers, rows


def export_json(products):
    return json.dumps(products, indent=2, ensure_ascii=False).encode('utf-8')


def export_csv(products):
    import csv
    import io
    headers, rows = flatten_products(products)
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=headers, extrasaction='ignore')
    w.writeheader()
    w.writerows(rows)
    return buf.getvalue().encode('utf-8')


if __name__ == '__main__':
    args = sys.argv[1:]
    cmd = args[0] if args else ''
    if cmd == 'scrape' and len(args) >= 2:
        url = args[1]
        limit = 50
        if '--limit' in args:
            limit = int(args[args.index('--limit') + 1])
        v = next((x for x in load_vendors() if x['url'] == url), None)
        if not v:
            v = {'id': slugify(urlparse(url).netloc), 'name': urlparse(url).netloc, 'url': url,
                 'website': '', 'category': ''}
        print(scrape_vendor(v, limit=limit))
    elif cmd == 'probe' and len(args) >= 2:
        html, err = core.fetch(args[1])
        if html is None:
            print('fetch error:', err)
        else:
            root = core.parse_html(html)
            print('products:')
            for u in generic.product_links(root, args[1]):
                print(' ', u)
            print('next page:', generic.next_page(root, args[1]))
            print('page links:', generic.page_links(root, args[1]))
    elif not args:
        for v in load_vendors():
            print(scrape_vendor(v))
    else:
        print('usage: python3 scraper.py scrape <url> [--limit N] | probe <url> | python3 server.py')
