import core

from . import generic

DOMAINS = ['ryugear.in', 'ryugear.com']


def scrape(root, html, url):
    p = generic.scrape(root, html, url)
    el = core.first(root, class_='gallery')
    if el:
        imgs = []
        for img in core.find_all(el, tag='img'):
            src = img.attrs.get('src') or img.attrs.get('data-src')
            if src and not src.startswith('data:'):
                imgs.append(src)
        if imgs:
            p['images'] = imgs[:10]
    return p
