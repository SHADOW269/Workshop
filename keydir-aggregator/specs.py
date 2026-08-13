import re

GROUPS = [
    ('General', ['Brand', 'Product Name', 'SKU', 'Description']),
    ('Keyboard', ['Layout', 'Form Factor', 'Style', 'Case Material', 'Surface Finish',
                  'Dimensions', 'Weight', 'Typing Angle', 'Color']),
    ('Mounting', ['Mounting Style', 'Plate Material', 'PCB']),
    ('Connectivity', ['Wired', 'Bluetooth', '2.4GHz', 'USB Interface', 'Battery Capacity',
                      'Battery Life', 'Polling Rate', 'NKRO', 'RGB']),
    ('Switches', ['Switch Brand', 'Switch Name', 'Switch Type', 'Hot Swap', 'Stabilizers', 'Foam']),
    ('Keycaps', ['Material', 'Profile', 'Legend Type', 'Legend Placement']),
    ('Features', ['VIA/QMK', 'Mac Support', 'Windows Support', 'South Facing LEDs',
                  'Gasket Mount', 'Display', 'Knob', 'Other Features']),
]

FIELDS = [f for _, fs in GROUPS for f in fs]

ALIASES = {
    'Brand': ['brand', 'brand name', 'manufacturer', 'make'],
    'Product Name': ['product name', 'name', 'model name', 'model'],
    'SKU': ['sku', 'sku id', 'part number', 'model number', 'item code'],
    'Description': ['description', 'about', 'overview', 'product description'],
    'Layout': ['layout', 'layout type', 'keyboard layout'],
    'Form Factor': ['form factor', 'form-factor', 'size', 'keyboard size'],
    'Style': ['style', 'design', 'aesthetic', 'keyboard style'],
    'Case Material': ['case material', 'case', 'material', 'materials', 'frame material', 'frame',
                      'body', 'body material', 'housing', 'shell', 'chassis', 'construction', 'casing'],
    'Surface Finish': ['surface finish', 'finish', 'surface', 'coating', 'anodization', 'anodizing', 'texture'],
    'Dimensions': ['dimensions', 'dimension', 'measurements', 'measurement', 'size (w x d x h)',
                   'product dimensions', 'physical dimensions', 'w x d x h'],
    'Weight': ['weight', 'net weight', 'product weight'],
    'Typing Angle': ['typing angle', 'angle', 'tilt', 'tilt angle', 'typing angle (degrees)'],
    'Color': ['color', 'colour', 'case color', 'case colour', 'color option'],
    'Mounting Style': ['mount', 'mounting', 'mounting style', 'mount style', 'mounting system',
                       'mount type', 'mounting type', 'structure', 'leaf spring', 'leaf spring mount',
                       'gasket structure', 'tray mount'],
    'Plate Material': ['plate', 'plate material', 'plate type', 'material plate', 'plate options',
                       'mounting plate', 'mounting-plate', 'positioning plate', 'plate frame'],
    'PCB': ['pcb', 'pcb type', 'pcb material', 'pcb mount', 'pcb thickness', 'hotswap pcb'],
    'Wired': ['wired', 'wired mode', 'wired connection', 'wired/wireless', 'cable connection',
              'connection', 'connectivity', 'connection mode'],
    'Bluetooth': ['bluetooth', 'bt', 'bluetooth version', 'bt version'],
    '2.4GHz': ['2.4ghz', '2.4 g', '2.4g', '2.4 ghz', 'wireless', 'wireless mode',
               'wireless connection', 'dongle'],
    'USB Interface': ['usb', 'usb interface', 'usb type', 'usb-c', 'usb-c port', 'usb connector',
                      'interface', 'port'],
    'Battery Capacity': ['battery', 'battery capacity', 'battery size', 'battery type', 'mah', 'capacity'],
    'Battery Life': ['battery life', 'battery duration', 'battery endurance', 'battery hours', 'battery runtime'],
    'Polling Rate': ['polling rate', 'polling', 'report rate', 'response rate'],
    'NKRO': ['nkro', 'n-key rollover', 'n key rollover', 'key rollover', 'rollover', 'anti-ghosting', 'ghosting'],
    'RGB': ['rgb', 'rgb lighting', 'backlight', 'backlighting', 'led', 'led lighting',
            'lighting', 'light', 'rgb modes', 'per-key rgb'],
    'Switch Brand': ['switch brand', 'switches brand', 'switch manufacturer'],
    'Switch Name': ['switch name', 'switch', 'switches', 'switch model', 'switch option'],
    'Switch Type': ['switch type', 'type of switch', 'switch style', 'switch feel'],
    'Hot Swap': ['hot swap', 'hotswap', 'hot-swap', 'hot swappable', 'hot-swappable',
                 'hotswap sockets', 'switch sockets', 'hot-swap sockets', 'swappable switches'],
    'Stabilizers': ['stabilizers', 'stabilisers', 'stabilizer', 'stabiliser', 'stabs', 'stab',
                    'stabilizer type', 'stabilizers type', 'screw-in stabilizers'],
    'Foam': ['foam', 'sound dampening', 'dampening', 'poron', 'sound', 'foam type',
             'sound insulation', 'acoustic foam'],
    'Material': ['keycap material', 'keycaps material', 'keycaps', 'keycap', 'keycap type', 'pbt', 'abs'],
    'Profile': ['keycap profile', 'keycaps profile', 'profile', 'caps profile', 'keycap profile type',
                'oem', 'cherry', 'sa', 'dsa', 'xda', 'asa'],
    'Legend Type': ['legend type', 'legend', 'legend printing', 'print method', 'dye-sub', 'dye sub',
                    'doubleshot', 'double-shot', 'laser etched', 'printing'],
    'Legend Placement': ['legend placement', 'legend position', 'top legend', 'front legend',
                         'side legend', 'south-facing legend'],
    'VIA/QMK': ['via/qmk', 'via', 'qmk', 'via support', 'qmk support', 'programmable software',
                'keyboard software', 'remappable', 'webdriver', 'driver software', 'software',
                'vial', 'keyboard driver'],
    'Mac Support': ['mac support', 'macos', 'mac os', 'mac compatibility', 'mac'],
    'Windows Support': ['windows support', 'windows compatibility', 'windows'],
    'South Facing LEDs': ['south facing', 'south-facing', 'south facing leds', 'south-facing leds',
                          'led orientation', 'north facing', 'led direction'],
    'Gasket Mount': ['gasket', 'gasket mount', 'gasket mounting'],
    'Display': ['display', 'screen', 'led display', 'oled', 'mini display', 'lcd'],
    'Knob': ['knob', 'rotary knob', 'volume knob', 'rotary encoder', 'encoder'],
    'Other Features': ['features', 'other features', 'special features', 'additional features', 'extras'],
}

JUNK = {'na', 'n/a', 'none', 'nil', 'null', '-', '--', 'not provided', 'not specified',
        'not mentioned', 'not listed', 'unknown', 'nill', 'n.p.', 'n/p', 'n/a.', '-'}

GENERIC_KEYS = {'support', 'supports', 'mode', 'modes', 'type', 'types', 'option', 'options',
                'info', 'information', 'details', 'misc', 'miscellaneous'}

BOOL_FIELDS = {'Wired', 'Bluetooth', '2.4GHz', 'NKRO', 'RGB', 'Hot Swap', 'VIA/QMK',
               'Mac Support', 'Windows Support', 'South Facing LEDs', 'Gasket Mount',
               'Display', 'Knob'}

YES_RE = re.compile(r'^(yes|y|supported|support|available|has|true|compatible|works|supports)$', re.I)
NO_RE = re.compile(r'^(no|n|not supported|does not support|unsupported|false|doesnt|doesn.t)$', re.I)


def clean(v):
    if v is None:
        return ''
    return ' '.join(str(v).split())


def normalize_stock(s):
    if not s:
        return None
    t = _compact(str(s))
    if any(w in t for w in ('outofstock', 'soldout', 'unavailable', 'discontinued', 'backorder')):
        return 'out_of_stock'
    if any(w in t for w in ('instock', 'available', 'readytoship', 'preorder', 'pre-order')):
        return 'in_stock'
    return None


def parse_price(s):
    if s is None:
        return None
    m = re.search(r'(?:₹|Rs\.?|INR|\$|USD|£|€|EUR)\s?([\d,]+(?:\.\d+)?)', str(s), re.I)
    if m:
        try:
            return float(m.group(1).replace(',', ''))
        except ValueError:
            return None
    m = re.search(r'[\d,]+(?:\.\d+)?', str(s))
    if m:
        try:
            return float(m.group(0).replace(',', ''))
        except ValueError:
            return None
    return None


def parse_weight(s):
    m = re.search(r'([\d.]+)\s*(kg|g|lbs|lb|oz)\b', str(s), re.I)
    if m:
        return f'{m.group(1)} {m.group(2).lower()}'
    return None


def parse_dimensions(s):
    m = re.search(r'([\d.]+)\s*[x×*]\s*([\d.]+)\s*[x×*]\s*([\d.]+)\s*(mm|cm|in)?', str(s), re.I)
    if m:
        return f'{m.group(1)} x {m.group(2)} x {m.group(3)}' + (f' {m.group(4)}' if m.group(4) else '')
    return None


def _compact(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())


def _match(words, compact):
    best = 0
    best_field = None
    for field in FIELDS:
        score = 0
        for a in ALIASES[field]:
            if words == a.split():
                score = 100
                break
            ac = _compact(a)
            if ac == compact:
                score = 100
                break
            if len(ac) >= 3 and ac in compact:
                score = max(score, 60 + min(10, len(ac)))
            if len(compact) >= 3 and compact in ac:
                score = max(score, 40 + min(10, len(compact)))
        if score > best:
            best = score
            best_field = field
        if best == 100:
            break
    return best_field


def _normalize_value(field, value):
    v = clean(value)
    if not v:
        return ''
    low = v.lower().strip(' .:')
    if field in BOOL_FIELDS:
        if YES_RE.fullmatch(low):
            return 'Yes'
        if NO_RE.fullmatch(low):
            return 'No'
    if low in JUNK:
        return ''
    return v


def normalize_specs(raw):
    out = {f: '' for f in FIELDS}
    for k, v in raw.items():
        words = re.sub(r'[^a-z0-9 ]', ' ', str(k).lower()).split()
        if not words:
            continue
        if len(words) == 1 and words[0] in GENERIC_KEYS:
            continue
        field = _match(words, ''.join(words))
        if field is None:
            continue
        value = _normalize_value(field, v)
        if not value:
            continue
        if field == 'Weight':
            parsed = parse_weight(value)
            if parsed:
                value = parsed
        elif field == 'Dimensions':
            parsed = parse_dimensions(value)
            if parsed:
                value = parsed
        if not out[field]:
            out[field] = value
    return out
