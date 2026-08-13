import re
from urllib.parse import urljoin, urlparse

import core
import specs

SKIP_PATH = re.compile(r'/(cart|checkout|account|login|register|search|contact|about|pages?|blogs?|collections?|tags?|policies?|admin|wishlist|404|sitemap|feed|cdn)($|/)', re.I)
SKIP_EXT = ('.css', '.js', '.json', '.xml', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.pdf', '.zip', '.mp4', '.woff', '.woff2')
BADGE_WORDS = {'badge', 'ribbon', 'sale', 'new', 'hot', 'bestseller', 'popular', 'limited', 'discount'}
SHIP_WORDS = {'shipping', 'delivery', 'fulfillment', 'deliver'}
COUPON_WORDS = {'coupon', 'coupons', 'promo', 'promocode', 'promo-code', 'discount-code', 'discountcode', 'voucher'}
SKIP_PRICE = ('compare', 'was', 'old', 'msrp', 'slash', 'strike', 'crossed', 'regular', 'currency')
IMG_CLASS = ('product', 'gallery', 'thumb', 'main', 'hero', 'feature')
PAGE_RE = re.compile(r'(?:(?:[?&]page=)|/page/)(\d+)')

CHROME = {'header', 'nav', 'navbar', 'footer', 'aside', 'search', 'cart', 'menu', 'breadcrumb',
          'announcement', 'recommend', 'related', 'featured', 'upsell', 'recently', 'collection',
          'blog', 'login', 'account', 'sidebar', 'drawer', 'modal', 'quickadd', 'quick-view', 'quickview'}


def _zone(root):
    main = core.first(root, tag='main')
    return main if main else root


def _words(el):
    return re.split(r'[^a-z0-9]+', (el.attrs.get('id', '') + ' ' + el.attrs.get('class', '')).lower())


def _skip_chrome(el):
    n = el
    while n:
        if n.tag in ('header', 'nav', 'footer', 'aside'):
            return True
        if any(w in CHROME for w in _words(n)):
            return True
        n = n.parent
    return False


def _clean_els(root, **kw):
    return [el for el in core.find_all(root, **kw) if not _skip_chrome(el)]


def _first(*vals):
    for v in vals:
        if isinstance(v, str):
            v = v.strip()
        elif v is not None:
            v = core.clean_text(v)
        if v:
            return v
    return None


def _ld_variants(ldp):
    if not ldp:
        return []
    vs = ldp.get('hasVariant')
    if isinstance(vs, list) and vs:
        return [v for v in vs if isinstance(v, dict)]
    return [ldp]


def _shopify(emb):
    if not isinstance(emb, dict):
        return False
    return any(isinstance(v, dict) and 'public_title' in v for v in emb.get('variants') or [])


def _embedded_product(root):
    for src, data in core.embedded_json(root):
        if src == 'meta':
            prod = data.get('product')
            if isinstance(prod, dict) and ('variants' in prod or 'handle' in prod):
                return prod
    for src, data in core.embedded_json(root):
        if src != 'meta':
            p = core.find_product_dict(data)
            if p:
                return p
    return None


def _emb_specs(emb):
    if not isinstance(emb, dict):
        return {}
    out = {}
    for node in core.walk_dicts(emb):
        for key in ('additionalProperty', 'specifications', 'specs'):
            v = node.get(key)
            if isinstance(v, list):
                for x in v:
                    if isinstance(x, dict) and x.get('name') and 'value' in x:
                        out.setdefault(core.clean_text(x['name']), core.clean_text(x.get('value')))
            elif isinstance(v, dict):
                for k, val in v.items():
                    if isinstance(val, str) and not k.startswith('@'):
                        out.setdefault(core.clean_text(k), val)
    return out


def _from_name(name):
    if not name:
        return None
    parts = str(name).rsplit(' - ', 1)
    if len(parts) == 2 and len(parts[1]) < 30:
        return core.clean_text(parts[1])
    return None


def _raw_text(desc, raw, zone):
    parts = []
    if desc:
        parts.append(desc)
    for k, v in raw.items():
        parts.append(f'{k}: {v}')
    for el in _clean_els(zone):
        if 'aplus-row__body' in el.attrs.get('class', '').split():
            t = core.clean_text(el)
            if t and t not in parts:
                parts.append(t)
    return '\n'.join(parts)[:20000]


def _ld_find(ld, type_name):
    def walk(v):
        if isinstance(v, dict):
            t = v.get('@type')
            ts = t if isinstance(t, list) else [t]
            if any(str(x) == type_name for x in ts):
                return v
            for val in v.values():
                r = walk(val)
                if r:
                    return r
        elif isinstance(v, list):
            for x in v:
                r = walk(x)
                if r:
                    return r
        return None
    for v in ld:
        r = walk(v)
        if r:
            return r
    return None


def _name(zone, root, ldp, emb):
    if ldp:
        n = ldp.get('name')
        if n:
            return core.clean_text(n)
    if emb and emb.get('title'):
        return core.clean_text(emb['title'])
    for el in _clean_els(zone, tag='h1'):
        t = core.clean_text(el)
        if t:
            return t
    return core.og_meta(root, 'og:title') or core.meta_content(root, 'title')


def _brand(zone, ldp, emb):
    if ldp:
        b = ldp.get('brand')
        if isinstance(b, dict):
            b = b.get('name')
        if b:
            return core.clean_text(b)
    if emb and emb.get('vendor'):
        return core.clean_text(emb['vendor'])
    v = core.meta_content(zone, 'brand')
    if v:
        return v
    for el in core.find_all(zone, attrs={'itemprop': 'brand'}):
        t = core.clean_text(el)
        if t:
            return t
    for el in _clean_els(zone, class_='brand'):
        t = core.clean_text(el)
        if t and len(t) < 40:
            return t
    return None


def _sku(zone, ldp, emb):
    for v in _ld_variants(ldp):
        s = v.get('sku')
        if s:
            return core.clean_text(s)
    if emb:
        vs = emb.get('variants') or []
        if vs and isinstance(vs[0], dict) and vs[0].get('sku'):
            return core.clean_text(vs[0]['sku'])
    for el in core.find_all(zone, attrs={'itemprop': 'sku'}):
        t = core.clean_text(el)
        if t:
            return t
    for el in _clean_els(zone):
        if 'sku' in el.attrs.get('class', '').split():
            t = core.clean_text(el)
            if t and len(t) < 60:
                return t
    return None


def _description(root, zone, ldp, emb, name):
    best = ''
    for el in _clean_els(zone):
        if not any(('aplus' in w or 'descrip' in w or w in ('details', 'summary', 'overview', 'about'))
                   for w in _words(el)):
            continue
        t = core.clean_text(el)
        if len(t) > 20 and len(t) > len(best):
            best = t
    if best:
        return best[:2000]
    d = core.clean_text(ldp.get('description')) if ldp else ''
    if len(d) > 20 and d != name:
        return d[:2000]
    d = core.og_meta(root, 'description') or core.meta_content(root, 'description')
    d = core.clean_text(d)
    if len(d) > 20 and d != name:
        return d[:2000]
    return None


def _images(root, zone, url, ldp):
    out = []

    def add(u):
        if not u:
            return
        u = urljoin(url, u)
        if u.startswith(('http://', 'https://')) and u not in out:
            out.append(u)

    add(core.og_meta(root, 'og:image'))
    add(core.og_meta(root, 'og:image:secure_url'))
    if ldp:
        img = ldp.get('image')
        if isinstance(img, str):
            add(img)
        elif isinstance(img, list):
            for i in img:
                if isinstance(i, str):
                    add(i)
                elif isinstance(i, dict):
                    add(i.get('url'))
        for v in _ld_variants(ldp):
            vi = v.get('image')
            if isinstance(vi, str):
                add(vi)
    for img in core.find_all(zone, tag='img'):
        src = img.attrs.get('src') or img.attrs.get('data-src') or img.attrs.get('data-lazy-src')
        if not src or src.startswith('data:'):
            continue
        cls = img.attrs.get('class', '').lower()
        if any(w in cls.split() for w in IMG_CLASS):
            add(src)
    if not out:
        for img in core.find_all(zone, tag='img'):
            src = img.attrs.get('src') or img.attrs.get('data-src')
            if src and not src.startswith('data:'):
                add(src)
            if len(out) >= 5:
                break
    return out[:10]


def _price_el(el):
    cls = el.attrs.get('class', '').lower()
    if any(w in cls for w in SKIP_PRICE):
        return False
    t = core.clean_text(el)
    if not t or len(t) > 40:
        return False
    return bool(re.search(r'[₹$€£]|\d', t))


def _price(zone, ldp, emb):
    for v in _ld_variants(ldp):
        o = v.get('offers')
        if isinstance(o, dict):
            pr = o.get('price') or o.get('lowPrice')
            if pr is not None:
                p = specs.parse_price(pr)
                if p is not None:
                    return p
    if emb:
        for v in emb.get('variants') or []:
            if isinstance(v, dict) and v.get('price') is not None:
                p = specs.parse_price(str(v['price']))
                if p is not None:
                    return p / 100 if _shopify(emb) else p
    for el in core.find_all(zone, attrs={'itemprop': 'price'}):
        p = specs.parse_price(el.attrs.get('content') or core.clean_text(el))
        if p is not None:
            return p
    for el in _clean_els(zone, class_='price'):
        if _price_el(el):
            p = specs.parse_price(core.clean_text(el))
            if p is not None:
                return p
    t = core.visible_text(zone)
    m = re.search(r'(?:₹|Rs\.?|INR|\$)\s?[\d,]+(?:\.\d+)?', t)
    if m:
        p = specs.parse_price(m.group(0))
        if p is not None:
            return p
    return None


def _compare_price(zone, ldp, emb):
    for v in _ld_variants(ldp):
        o = v.get('offers')
        if isinstance(o, dict):
            hi = o.get('highPrice')
            if hi is not None:
                p = specs.parse_price(hi)
                if p is not None:
                    return p
    if emb:
        for v in emb.get('variants') or []:
            if isinstance(v, dict) and v.get('compare_at_price') is not None:
                p = specs.parse_price(str(v['compare_at_price']))
                if p is not None:
                    return p / 100 if _shopify(emb) else p
    for tag in ('del', 'strike', 's'):
        for el in core.find_all(zone, tag=tag):
            p = specs.parse_price(core.clean_text(el))
            if p is not None and p > 0:
                return p
    for el in core.find_all(zone):
        cls = el.attrs.get('class', '').lower()
        if any(w in cls.split() for w in ('compare-price', 'was-price', 'compare_at', 'old-price', 'strikethrough', 'msrp')):
            p = specs.parse_price(core.clean_text(el))
            if p is not None:
                return p
    return None


def _availability(zone, ldp, emb):
    for v in _ld_variants(ldp):
        o = v.get('offers')
        if isinstance(o, dict):
            a = o.get('availability')
            if a:
                return a, specs.normalize_stock(a)
    if emb:
        states = [v.get('available') for v in emb.get('variants') or [] if isinstance(v, dict) and v.get('available') is not None]
        if states:
            ok = any(states)
            return ('In stock' if ok else 'Out of stock'), ('in_stock' if ok else 'out_of_stock')
    for el in core.find_all(zone, attrs={'itemprop': 'availability'}):
        a = el.attrs.get('content') or core.clean_text(el)
        if a:
            return a, specs.normalize_stock(a)
    for el in _clean_els(zone, class_='availability') or _clean_els(zone, class_='stock'):
        t = core.clean_text(el)
        if t and len(t) < 60:
            return t, specs.normalize_stock(t)
    return None, None


def _label_for(el):
    parent = el.parent
    for _ in range(4):
        if not parent:
            break
        for label in core.find_all(parent, tag='label'):
            t = core.clean_text(label)
            if t and len(t) < 40 and not core.is_ancestor(label, el):
                return t
        if parent.tag in ('fieldset', 'form'):
            break
        parent = parent.parent
    return ''


def _option_groups(root, url):
    groups = []
    for sel in core.find_all(root, tag='select'):
        nm = sel.attrs.get('name') or ''
        if 'qty' in nm.lower() or 'quantity' in nm.lower():
            continue
        label = _label_for(sel) or nm
        opts = []
        for o in core.find_all(sel, tag='option'):
            name = core.clean_text(o) or o.attrs.get('value')
            if name in ('', 'Select', 'Select Option', 'Choose an option', 'Please select', 'Default Title'):
                continue
            opts.append({'name': name, 'url': url})
        if opts:
            groups.append({'label': label, 'options': opts})
    for fieldset in core.find_all(root, tag='fieldset'):
        legend = core.first(fieldset, tag='legend')
        label = core.clean_text(legend) if legend else _label_for(fieldset)
        opts = []
        for lab in core.find_all(fieldset, tag='label'):
            inp = core.first(lab, tag='input')
            if inp and inp.attrs.get('type') in ('radio', 'checkbox'):
                name = core.clean_text(lab)
                if name:
                    opts.append({'name': name, 'url': url})
        if opts:
            groups.append({'label': label, 'options': opts})
    for el in core.find_all(root, tag='button'):
        cls = set(el.attrs.get('class', '').split())
        if cls & {'variant', 'option', 'swatch', 'pill'}:
            name = core.clean_text(el)
            if name and len(name) < 60:
                groups.append({
                    'label': _label_for(el) or 'option',
                    'options': [{'name': name, 'url': url, 'sku': el.attrs.get('data-sku') or el.attrs.get('data-variant-id')}],
                })
    return groups


def _variant_from_option(g, opt):
    kl = g['label'].lower()
    color = switch = keycaps = None
    if any(w in kl for w in ('color', 'colour', 'swatch')):
        color = opt['name']
    elif 'switch' in kl:
        switch = opt['name']
    elif any(w in kl for w in ('keycap', 'key-cap', 'caps')):
        keycaps = opt['name']
    return {
        'name': opt['name'], 'url': opt.get('url'), 'price': None,
        'availability': None, 'stockStatus': None,
        'color': color, 'switch': switch, 'keycaps': keycaps, 'sku': opt.get('sku'),
    }


def _variants(zone, url, ldp, emb):
    variants = []
    for v in _ld_variants(ldp):
        name = core.clean_text(v.get('name'))
        o = v.get('offers')
        avail = o.get('availability') if isinstance(o, dict) else None
        price = specs.parse_price(o.get('price')) if isinstance(o, dict) else None
        variants.append({
            'name': name or 'Variant',
            'url': v.get('url') or url,
            'price': price,
            'availability': avail,
            'stockStatus': specs.normalize_stock(avail),
            'color': _from_name(name),
            'switch': None, 'keycaps': None,
            'sku': v.get('sku'),
        })
    if emb:
        for v in emb.get('variants') or []:
            if not isinstance(v, dict):
                continue
            name = v.get('name') or v.get('public_title')
            avail = v.get('available')
            price = specs.parse_price(str(v.get('price') or ''))
            if price and _shopify(emb):
                price /= 100
            variants.append({
                'name': core.clean_text(name or 'Variant'),
                'url': url,
                'price': price,
                'availability': avail,
                'stockStatus': 'in_stock' if avail is True else ('out_of_stock' if avail is False else None),
                'color': core.clean_text(v.get('public_title')) or _from_name(v.get('name')),
                'switch': None, 'keycaps': None,
                'sku': v.get('sku'),
            })
    for g in _option_groups(zone, url):
        for opt in g['options']:
            variants.append(_variant_from_option(g, opt))
    seen = set()
    out = []
    for v in variants:
        key = (v['name'], v['sku'], v['color'], v['switch'])
        if key in seen:
            continue
        seen.add(key)
        out.append(v)
    return out


def _specs(zone, ldp, emb):
    raw = {}

    def add(k, v):
        k, v = core.clean_text(k), core.clean_text(v)
        if k and not raw.get(k):
            raw[k] = v

    for node in ([ldp] + list(_ld_variants(ldp)) if ldp else []):
        ap = node.get('additionalProperty') or []
        if isinstance(ap, dict):
            ap = [ap]
        for p in ap:
            if isinstance(p, dict) and p.get('name'):
                add(p['name'], p.get('value'))
    for k, v in _emb_specs(emb).items():
        add(k, v)
    for table in _clean_els(zone, tag='table'):
        for tr in core.find_all(table, tag='tr'):
            cells = core.find_all(tr, tag='td') or core.find_all(tr, tag='th')
            if len(cells) == 2:
                add(cells[0], core.clean_text(cells[1]))
    for dl in _clean_els(zone, tag='dl'):
        dts = core.find_all(dl, tag='dt')
        dds = core.find_all(dl, tag='dd')
        for dt, dd in zip(dts, dds):
            add(core.clean_text(dt), core.clean_text(dd))
    for lab in _clean_els(zone, class_='highlight-label'):
        val_el = core.first(lab.parent, class_='highlight-value')
        if val_el:
            add(core.clean_text(lab), core.clean_text(val_el))
    for el in _clean_els(zone):
        cls = el.attrs.get('class', '').split()
        if {'spec', 'specs', 'specification', 'specifications', 'attribute', 'attributes',
            'tab', 'tab-pane', 'accordion-item'} & set(cls):
            t = core.clean_text(el)
            m = re.match(r'^(.{2,30}?)\s*[:：]\s*(.{1,200})$', t)
            if m:
                add(m.group(1), m.group(2))
    return raw


def _coupons(zone):
    out = []
    for el in _clean_els(zone):
        if set(el.attrs.get('class', '').split()) & COUPON_WORDS:
            t = core.clean_text(el)
            if t and len(t) < 120 and t not in out:
                out.append(t)
    txt = core.visible_text(zone)
    for m in set(re.findall(r'\b(?:code|coupon|promo)\s*[:=]?\s*([A-Z0-9][A-Z0-9-]{3,14})\b', txt)):
        if len(m) >= 5 and (re.search(r'\d', m) or '-' in m) and m not in out:
            out.append(m)
    return out[:20]


def _shipping(zone):
    for el in _clean_els(zone):
        if set(_words(el)) & SHIP_WORDS:
            t = core.clean_text(el)
            if t and 5 < len(t) < 300:
                return t
    for d in _clean_els(zone, tag='details'):
        summ = core.first(d, tag='summary')
        if summ and re.search(r'shipping|delivery|fulfillment|dispatch', core.clean_text(summ), re.I):
            t = core.clean_text(d)
            if t:
                return t[:300]
    return None


def _badges(zone):
    out = []
    for el in _clean_els(zone):
        if set(el.attrs.get('class', '').split()) & BADGE_WORDS:
            t = core.clean_text(el)
            if t and 1 < len(t) < 40 and t not in out:
                out.append(t)
    txt = core.visible_text(zone)
    for m in set(re.findall(r'(\d{1,3}\s?%\s?(?:off|discount))', txt, re.I)):
        if m not in out:
            out.append(m)
    return out[:15]


def _breadcrumbs(zone, ld):
    for v in ld:
        b = _ld_find([v], 'BreadcrumbList')
        if b:
            items = [e.get('name') for e in (b.get('itemListElement') or []) if isinstance(e, dict) and e.get('name')]
            if items:
                return items
    for el in _clean_els(zone):
        if 'breadcrumb' in el.attrs.get('class', '').lower():
            items = [core.clean_text(a) for a in core.find_all(el, tag='a') if core.clean_text(a)]
            if items:
                return items
    nav = core.first(zone, tag='nav', attrs={'aria-label': 'breadcrumb'})
    if nav:
        items = [core.clean_text(a) for a in core.find_all(nav, tag='a')]
        if items:
            return items
    return []


def _tags(root, zone, ldp, emb):
    out = []
    kw = core.meta_content(root, 'keywords')
    if kw:
        out += [core.clean_text(x) for x in kw.split(',') if core.clean_text(x)]
    if emb:
        for t in emb.get('tags') or []:
            if isinstance(t, str) and t not in out:
                out.append(t)
        if emb.get('type'):
            out.append(core.clean_text(emb['type']))
    if ldp:
        kw = ldp.get('keywords')
        if isinstance(kw, str):
            kw = kw.split(',')
        if isinstance(kw, list):
            for x in kw:
                if isinstance(x, str) and x not in out:
                    out.append(core.clean_text(x))
        if ldp.get('category'):
            out.append(core.clean_text(ldp['category']))
    for el in _clean_els(zone):
        if 'tag' in el.attrs.get('class', '').split() or 'product-tag' in el.attrs.get('class', '').split():
            t = core.clean_text(el)
            if t and len(t) < 30 and t not in out:
                out.append(t)
    return out[:20]


def scrape(root, html, url):
    ld = core.json_ld(root)
    ldp = _ld_find(ld, 'ProductGroup') or _ld_find(ld, 'Product')
    emb = _embedded_product(root)
    zone = _zone(root)
    availability, stock = _availability(zone, ldp, emb)
    raw_specs = _specs(zone, ldp, emb)
    name = _name(zone, root, ldp, emb)
    desc = _description(root, zone, ldp, emb, name)
    return {
        'name': name,
        'brand': _brand(zone, ldp, emb),
        'sku': _sku(zone, ldp, emb),
        'description': desc,
        'images': _images(root, zone, url, ldp),
        'price': _price(zone, ldp, emb),
        'comparePrice': _compare_price(zone, ldp, emb),
        'availability': availability,
        'stockStatus': stock,
        'variants': _variants(zone, url, ldp, emb),
        'rawSpecs': raw_specs,
        'specs': specs.normalize_specs(raw_specs),
        'coupons': _coupons(zone),
        'shipping': _shipping(zone),
        'badges': _badges(zone),
        'breadcrumbs': _breadcrumbs(zone, ld),
        'tags': _tags(root, zone, ldp, emb),
        'rawText': _raw_text(desc, raw_specs, zone),
    }


def _in_chrome(el):
    n = el.parent
    while n:
        if n.tag in ('nav', 'header', 'footer'):
            return True
        if n.tag == 'ul' and set(n.attrs.get('class', '').split()) & {'menu', 'nav', 'nav-menu'}:
            return True
        n = n.parent
    return False


def product_links(root, url):
    base = urlparse(url)
    cands = []
    seen = set()

    def consider(u, score):
        up = urlparse(u)
        if up.scheme not in ('http', 'https'):
            return
        if up.netloc and up.netloc != base.netloc:
            return
        path = up.path or ''
        if path in ('/', ''):
            return
        if path.endswith(SKIP_EXT) or SKIP_PATH.search(path):
            return
        key = path + ('?' + up.query if up.query else '')
        if key in seen:
            return
        seen.add(key)
        cands.append((score, u))

    for el in core.find_all(root):
        if _in_chrome(el):
            continue
        words = set(el.attrs.get('class', '').split())
        if words & {'product', 'product-card', 'product-item', 'product-grid', 'tile', 'card', 'grid', 'item'}:
            for a in core.find_all(el, tag='a'):
                href = a.attrs.get('href')
                if href:
                    consider(urljoin(url, href), 2)
    for a in core.find_all(root, tag='a'):
        href = a.attrs.get('href') or ''
        if not href or 'javascript' in href:
            continue
        u = urljoin(url, href)
        path = urlparse(u).path
        if re.search(r'/(product|products|item|p)/', path, re.I) or path.endswith('.html'):
            consider(u, 1)
    cands.sort(key=lambda x: -x[0])
    out = []
    for _, u in cands:
        if u not in out:
            out.append(u)
    return out


def next_page(root, url):
    for link in core.find_all(root, tag='link'):
        if 'next' in (link.attrs.get('rel') or ''):
            href = link.attrs.get('href')
            if href:
                return urljoin(url, href)
    for a in core.find_all(root, tag='a'):
        cls = a.attrs.get('class', '').split()
        aria = (a.attrs.get('aria-label') or '').lower()
        t = core.clean_text(a).lower()
        if 'next' in aria or 'next' in cls or t in ('next', 'next page', 'next ›', '›'):
            href = a.attrs.get('href')
            if href and 'javascript' not in href:
                return urljoin(url, href)
    return None


def page_links(root, url):
    base = urlparse(url)
    pages = {}
    for a in core.find_all(root, tag='a'):
        href = a.attrs.get('href', '')
        u = urljoin(url, href)
        up = urlparse(u)
        if up.netloc and up.netloc != base.netloc:
            continue
        m = PAGE_RE.search(u)
        if m:
            pages[int(m.group(1))] = u
    return [pages[n] for n in sorted(pages)]
