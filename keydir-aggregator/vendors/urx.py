import re

import core
import specs

from . import generic

DOMAINS = ['urx.tech', 'urx.in']


def scrape(root, html, url):
    p = generic.scrape(root, html, url)
    txt = core.visible_text(root)
    m = re.search(r'\b(?:use|enter)\s+code\s+([A-Z0-9-]{4,14})\b', txt, re.I)
    if m and m.group(1) not in p['coupons']:
        p['coupons'].append(m.group(1).upper())
    return p
