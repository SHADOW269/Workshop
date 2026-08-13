import core

from . import generic

DOMAINS = ['stackskb.com', 'stackskb.in']


def scrape(root, html, url):
    p = generic.scrape(root, html, url)
    for el in core.find_all(root):
        cls = el.attrs.get('class', '').split()
        if 'variant' in cls and 'option' in cls:
            for a in core.find_all(el, tag='a'):
                t = core.clean_text(a)
                href = a.attrs.get('href')
                if t and not any(v['name'] == t for v in p['variants']):
                    p['variants'].append({
                        'name': t, 'url': href or url, 'price': None,
                        'availability': None, 'stockStatus': None,
                        'color': None, 'switch': None, 'keycaps': None, 'sku': None,
                    })
    return p
