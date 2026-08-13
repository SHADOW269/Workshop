import core
import specs

from . import generic

DOMAINS = ['xtro.store', 'xtro.in']


def scrape(root, html, url):
    p = generic.scrape(root, html, url)
    el = core.first(root, class_='wr-price') or core.first(root, class_='price')
    if el:
        pr = specs.parse_price(core.clean_text(el))
        if pr is not None:
            p['price'] = pr
    return p
