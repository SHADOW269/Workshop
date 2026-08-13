import json
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import core
import scraper
import specs
from vendors import generic

FAILED = []


def check(name, cond):
    if cond:
        print(f'  ok  {name}')
    else:
        FAILED.append(name)
        print(f'FAIL  {name}')


def test_units():
    check('parse_price INR', specs.parse_price('₹5,999') == 5999.0)
    check('parse_price dollar', specs.parse_price('$129.50') == 129.5)
    check('normalize_stock out', specs.normalize_stock('Out of stock') == 'out_of_stock')
    check('normalize_stock in', specs.normalize_stock('In Stock') == 'in_stock')
    s = specs.normalize_specs({'Layout': '60%'})
    check('normalize_specs layout', s['Layout'] == '60%')
    check('specs all fields', set(s) == set(specs.FIELDS) and len(s) == len(specs.FIELDS))
    check('specs blank by default', s['Gasket Mount'] == '' and s['Weight'] == '')
    check('normalize_specs weight', specs.normalize_specs({'Weight': '550 g'})['Weight'] == '550 g')
    check('gasket screws -> Gasket Mount', specs.normalize_specs({'Gasket Screws': '10'})['Gasket Mount'] == '10')
    check('junk value -> blank', specs.normalize_specs({'Layout': 'N/A'})['Layout'] == '')
    check('bool yes -> Yes', specs.normalize_specs({'Hot Swap': 'Yes'})['Hot Swap'] == 'Yes')
    check('unknown key dropped', specs.normalize_specs({'Flux Capacitor': '1.21GW'}) == {f: '' for f in specs.FIELDS})
    check('slugify', scraper.slugify('  Xtro  Store!! ') == 'xtro-store')
    check('product_id stable', scraper.product_id('http://x/y') == scraper.product_id('http://x/y'))


PRODUCT_HTML = '''<html><head><title>GK61 Pro</title>
<meta property="og:image" content="/img/gk61.jpg">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"GK61 Pro","sku":"GK61-BLK","brand":{"name":"Xtro"},"offers":{"price":"5999","availability":"https://schema.org/InStock"},"description":"A 60% hotswap board."}</script></head>
<body>
<header class="site-header"><a href="/collections/all">Shop All</a></header>
<main>
<h1>GK61 Pro Keyboard</h1>
<div class="price"><s>₹7,999</s> ₹5,999</div>
<div class="stock">In Stock</div>
<table><tr><td>Layout</td><td>60%</td></tr><tr><td>Mount</td><td>Tray</td></tr><tr><td>Weight</td><td>550 g</td></tr></table>
<label>Color <select name="color"><option>Black</option><option>White</option></select></label>
</main>
<footer class="site-footer"><p>Free shipping on orders over ₹500 delivered within 7 days.</p></footer>
</body></html>'''

META_HTML = '''<html><head><title>Meta Keeb</title></head><body>
<main>
<h1>Meta Keeb 75</h1>
<div class="price">₹4,999</div>
<table><tr><td>Layout</td><td>75%</td></tr></table>
<script>var meta = {"product":{"id":1,"vendor":"MetaBrand","type":"Keyboard","handle":"meta-keeb","variants":[{"id":11,"price":499900,"name":"Meta Keeb 75 - Blue","public_title":"Blue","sku":"MK-BLUE","available":true},{"id":12,"price":499900,"name":"Meta Keeb 75 - Black","public_title":"Black","sku":"MK-BLK","available":false}]}};</script>
</main>
</body></html>'''

COLLECTION_1 = '''<html><body>
<div class="product-grid">
 <div class="product-card"><a href="/products/a">GK61</a></div>
 <div class="product-card"><a href="/products/b">GK87</a></div>
</div>
<a class="next" href="/shop?page=2">Next</a>
</body></html>'''

COLLECTION_2 = '''<html><body>
<div class="product-grid">
 <div class="product-card"><a href="/products/c">GK68</a></div>
</div>
</body></html>'''

PRODUCTS = {
    '/products/a': PRODUCT_HTML,
    '/products/b': PRODUCT_HTML,
    '/products/c': PRODUCT_HTML,
    '/products/m': META_HTML,
}


class Fixture(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        body = {'/shop': COLLECTION_1, '/shop?page=2': COLLECTION_2}.get(self.path)
        if body is None:
            body = PRODUCTS.get(self.path)
        if body is None:
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body.encode())


def test_parse_html():
    root = core.parse_html(PRODUCT_HTML)
    h1 = core.first(root, tag='h1')
    check('h1 extracted', core.clean_text(h1) == 'GK61 Pro Keyboard')
    check('price parse', specs.parse_price(core.clean_text(core.first(root, class_='price'))) == 7999.0)
    check('json-ld found', core.json_ld(root) != [])
    check('visible text has specs', 'Tray' in core.visible_text(root))


def test_generic_product():
    root = core.parse_html(PRODUCT_HTML)
    p = generic.scrape(root, PRODUCT_HTML, 'http://fixture/products/a')
    check('generic name', p['name'] == 'GK61 Pro')
    check('generic brand', p['brand'] == 'Xtro')
    check('generic sku', p['sku'] == 'GK61-BLK')
    check('generic price', p['price'] == 5999.0)
    check('generic compare', p['comparePrice'] == 7999.0)
    check('generic stock', p['stockStatus'] == 'in_stock')
    check('generic specs layout', p['specs']['Layout'] == '60%')
    check('generic specs mount', p['specs']['Mounting Style'] == 'Tray')
    check('generic specs weight', p['specs']['Weight'] == '550 g')
    check('generic rawSpecs kept', p['rawSpecs'] == {'Layout': '60%', 'Mount': 'Tray', 'Weight': '550 g'})
    check('generic specs all keys', set(p['specs']) == set(specs.FIELDS))
    check('generic image', p['images'] and p['images'][0].endswith('/img/gk61.jpg'))
    check('variant color', any(v['color'] == 'Black' for v in p['variants']))
    check('variant count', len(p['variants']) >= 2)
    check('rawText product-only', 'Mount: Tray' in p['rawText'] and 'Shop All' not in p['rawText'])
    check('shipping not from footer', p['shipping'] is None)
    check('tags not from nav', p['tags'] == [])


def test_embedded_json():
    root = core.parse_html(META_HTML)
    p = generic.scrape(root, META_HTML, 'http://fixture/products/m')
    check('emb name', p['name'] == 'Meta Keeb 75')
    check('emb brand', p['brand'] == 'MetaBrand')
    check('emb sku', p['sku'] == 'MK-BLUE')
    check('emb price paise/100', p['price'] == 4999.0)
    check('emb stock', p['stockStatus'] == 'in_stock')
    check('emb variant color', any(v['color'] == 'Blue' and v['price'] == 4999.0 for v in p['variants']))
    check('emb variant out of stock', any(v['color'] == 'Black' and v['stockStatus'] == 'out_of_stock' for v in p['variants']))
    check('emb specs from table', p['specs']['Layout'] == '75%')


def test_collection():
    root = core.parse_html(COLLECTION_1)
    links = generic.product_links(root, 'http://fixture/shop')
    check('product_links count', len(links) == 2)
    check('next_page', generic.next_page(root, 'http://fixture/shop') == 'http://fixture/shop?page=2')
    root2 = core.parse_html(COLLECTION_2)
    check('page_links from page1', len(generic.page_links(root, 'http://fixture/shop')) >= 1)


def test_end_to_end():
    srv = ThreadingHTTPServer(('127.0.0.1', 0), Fixture)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    vendor = {'id': 'fixture', 'name': 'Fixture', 'website': 'fixture.test', 'category': 'keebs',
              'url': f'http://127.0.0.1:{port}/shop'}
    r = scraper.scrape_vendor(vendor, limit=10)
    check('e2e saved 3', r['saved'] == 3)
    p = scraper.load_product('fixture', scraper.product_id(f'http://127.0.0.1:{port}/products/a'))
    check('e2e product stored', p is not None and p['price'] == 5999.0 and p['vendor'] == 'Fixture')
    check('e2e raw html kept', p['rawHtml'].startswith('<html>'))
    check('e2e export json', b'GK61 Pro Keyboard' in scraper.export_json([p]))
    csv_bytes = scraper.export_csv([p])
    check('e2e export csv spec col', b'spec.Layout' in csv_bytes)
    srv.shutdown()
    scraper.delete_vendor('fixture')


if __name__ == '__main__':
    test_units()
    test_parse_html()
    test_generic_product()
    test_embedded_json()
    test_collection()
    test_end_to_end()
    if FAILED:
        print(f'\n{len(FAILED)} FAILED: {FAILED}')
        sys.exit(1)
    print('\nall checks passed')
