import importlib
import os
from urllib.parse import urlparse

from . import generic

_cached = None


def _modules():
    global _cached
    if _cached is not None:
        return _cached
    mods = [generic]
    here = os.path.dirname(__file__)
    for name in sorted(os.listdir(here)):
        if name.startswith('_') or name == 'generic.py' or not name.endswith('.py'):
            continue
        try:
            mods.append(importlib.import_module(f'vendors.{name[:-3]}'))
        except Exception as e:
            print(f'[vendors] failed to load {name}: {e}')
    _cached = mods
    return mods


def get_module(url):
    host = urlparse(url).netloc.lower().split(':')[0]
    for m in _modules():
        if m is generic:
            continue
        for d in getattr(m, 'DOMAINS', ()):
            d = d.lower()
            if host == d or host.endswith('.' + d):
                return m
    return generic
