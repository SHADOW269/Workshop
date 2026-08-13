from html.parser import HTMLParser
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
import json, re, time

UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'

VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}


class Node:
    __slots__ = ('tag', 'attrs', 'children', 'parent', 'data')

    def __init__(self, tag, attrs):
        self.tag = tag
        self.attrs = {k.lower(): (v or '') for k, v in attrs}
        self.children = []
        self.parent = None
        self.data = ''

    def __repr__(self):
        return f'<{self.tag} {self.attrs}>'


class _Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('#root', {})
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        node.parent = self.stack[-1]
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        node = Node(tag, attrs)
        node.parent = self.stack[-1]
        self.stack[-1].children.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if data:
            node = Node('#text', ())
            node.data = data
            node.parent = self.stack[-1]
            self.stack[-1].children.append(node)


def parse_html(html):
    b = _Builder()
    try:
        b.feed(html or '')
    except Exception:
        pass
    return b.root


def walk(node):
    for c in node.children:
        yield c
        yield from walk(c)


def find_all(node, tag=None, class_=None, attrs=None):
    out = []
    for n in walk(node):
        if tag and n.tag != tag:
            continue
        if class_:
            if class_ not in n.attrs.get('class', '').split():
                continue
        if attrs:
            if not all(n.attrs.get(k) == v for k, v in attrs.items()):
                continue
        out.append(n)
    return out


def first(node, tag=None, class_=None, attrs=None):
    for n in walk(node):
        if tag and n.tag != tag:
            continue
        if class_:
            if class_ not in n.attrs.get('class', '').split():
                continue
        if attrs:
            if not all(n.attrs.get(k) == v for k, v in attrs.items()):
                continue
        return n
    return None


def text(node):
    parts = []
    stack = [node]
    while stack:
        n = stack.pop()
        if n.data:
            parts.append(n.data)
        if n.children:
            stack.extend(reversed(n.children))
    return ' '.join(''.join(parts).split())


def clean_text(s):
    if isinstance(s, Node):
        s = text(s)
    return ' '.join(str(s).split())


SKIP_TAGS = {'script', 'style', 'noscript', 'svg', 'head', 'template'}


def visible_text(node):
    parts = []
    stack = [(node, False)]
    while stack:
        n, in_skip = stack.pop()
        if n.tag in SKIP_TAGS:
            continue
        if n.data:
            if not in_skip:
                parts.append(n.data)
        if n.children:
            stack.extend((c, in_skip or c.tag in SKIP_TAGS) for c in reversed(n.children))
    return ' '.join(''.join(parts).split())


def is_ancestor(node, target):
    n = target.parent
    while n:
        if n is node:
            return True
        n = n.parent
    return False


def meta_content(root, key):
    for m in find_all(root, tag='meta'):
        if m.attrs.get('property') == key or m.attrs.get('name') == key or m.attrs.get('itemprop') == key:
            v = m.attrs.get('content')
            if v:
                return v
    return None


def og_meta(root, key):
    return meta_content(root, key)


def json_ld(root):
    out = []
    for s in find_all(root, tag='script'):
        if s.attrs.get('type') == 'application/ld+json':
            raw = text(s).strip()
            if not raw:
                continue
            try:
                out.append(json.loads(raw))
            except Exception:
                pass
    return out


def _balanced_js(s, start):
    """Parse the JSON object starting at s[start] ('{'), honoring string escapes."""
    depth = 0
    in_str = esc = False
    for i in range(start, len(s)):
        c = s[i]
        if in_str:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == '"':
                in_str = False
        elif c == '"':
            in_str = True
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(s[start:i + 1])
                except Exception:
                    return None
    return None


EMBEDDED_MARKERS = (
    ('meta', r'var meta\s*=\s*'),
    ('__NEXT_DATA__', r'__NEXT_DATA__\s*=\s*'),
    ('__INITIAL_STATE__', r'window\.__INITIAL_STATE__\s*=\s*'),
)


def embedded_json(root):
    """Yield (source, dict) for product JSON embedded in page scripts."""
    for s in find_all(root, tag='script'):
        if s.attrs.get('type') == 'application/ld+json':
            continue
        js = text(s)
        if not js:
            continue
        for src, marker in EMBEDDED_MARKERS:
            m = re.search(marker, js)
            if m:
                brace = js.find('{', m.end())
                if brace >= 0:
                    d = _balanced_js(js, brace)
                    if isinstance(d, dict):
                        yield src, d


def walk_dicts(v):
    if isinstance(v, dict):
        yield v
        for x in v.values():
            yield from walk_dicts(x)
    elif isinstance(v, list):
        for x in v:
            yield from walk_dicts(x)


def find_product_dict(data):
    """Deepest dict that looks like a product (title/variants/tags/vendor...)."""
    best, best_score = None, 0
    for d in walk_dicts(data):
        score = sum(1 for k in ('title', 'handle', 'variants', 'tags', 'vendor', 'description', 'sku')
                    if k in d and isinstance(d[k], (str, int, list)))
        if score > best_score:
            best, best_score = d, score
    return best if best_score >= 2 else None


def fetch(url, timeout=25, sleep=0.4):
    req = Request(url, headers={
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
    })
    try:
        with urlopen(req, timeout=timeout) as r:
            data = r.read()
    except (HTTPError, URLError) as e:
        return None, f'{getattr(e, "code", "")} {type(e).__name__}'.strip()
    if sleep:
        time.sleep(sleep)
    for enc in ('utf-8', 'latin-1'):
        try:
            return data.decode(enc), None
        except Exception:
            continue
    return data.decode('utf-8', 'ignore'), None
