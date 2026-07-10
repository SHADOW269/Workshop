/* Sigma Infotech — shared front-end behaviour (no backend, no storage APIs) */

let cartCount = 0;

function updateCartBadge(){
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = cartCount;
  });
}

function showToast(message){
  const toast = document.getElementById('toast');
  if(!toast) return;
  toast.querySelector('span').textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
}

function initScrollProgress(){
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  const update = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = pct + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initHeaderScrollState(){
  const header = document.querySelector('.site-header');
  if(!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initScrollReveal(){
  const selector = [
    '.section-head', '.category-card', '.product-card',
    '.promo-copy', '.promo-visual', '.value-item', '.tradein',
    '.location-info', '.location-map', '.info-card', '.contact-form',
    '.gallery-main', '.pd-brand', '.pd-title', '.pd-price-row', '.pd-desc',
    '.spec-table', '.filters'
  ].join(', ');
  const els = Array.from(document.querySelectorAll(selector));
  if(!els.length) return;

  if(!('IntersectionObserver' in window)){
    els.forEach(el => el.classList.add('reveal', 'in-view'));
    return;
  }

  els.forEach(el => {
    el.classList.add('reveal');
    const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
    const index = siblings.indexOf(el);
    el.style.transitionDelay = `${Math.max(0, Math.min(index, 5)) * 70}ms`;
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  els.forEach(el => io.observe(el));
}

function initNavToggle(){
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if(!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    const expanded = nav.classList.contains('open');
    toggle.setAttribute('aria-expanded', expanded);
  });
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });
}

function initAddToCart(){
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', () => {
      cartCount += 1;
      updateCartBadge();
      const name = btn.getAttribute('data-add-to-cart') || 'Item';
      showToast(`${name} added to cart`);
    });
  });
}

function initQtyControl(){
  const control = document.querySelector('.qty-control');
  if(!control) return;
  const span = control.querySelector('span');
  const minus = control.querySelector('[data-qty-minus]');
  const plus = control.querySelector('[data-qty-plus]');
  let qty = 1;
  minus.addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    span.textContent = qty;
  });
  plus.addEventListener('click', () => {
    qty = Math.min(9, qty + 1);
    span.textContent = qty;
  });
}

function initGalleryThumbs(){
  const thumbs = document.querySelectorAll('.gallery-thumbs [data-thumb]');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}

function initShopFilters(){
  const grid = document.querySelector('[data-product-grid]');
  if(!grid) return;
  const cards = Array.from(grid.children);
  const categoryInputs = document.querySelectorAll('[data-filter="category"]');
  const conditionInputs = document.querySelectorAll('[data-filter="condition"]');
  const priceInput = document.querySelector('[data-filter="price"]');
  const priceValueLabel = document.querySelector('[data-price-value]');
  const resultCount = document.querySelector('[data-result-count]');
  const sortSelect = document.querySelector('[data-sort]');

  function getChecked(nodeList){
    return Array.from(nodeList).filter(n => n.checked).map(n => n.value);
  }

  function applyFilters(){
    const categories = getChecked(categoryInputs);
    const conditions = getChecked(conditionInputs);
    const maxPrice = priceInput ? Number(priceInput.value) : Infinity;

    let visibleCount = 0;
    cards.forEach(card => {
      const cat = card.dataset.category;
      const cond = card.dataset.condition;
      const price = Number(card.dataset.price);

      const catMatch = categories.length === 0 || categories.includes(cat);
      const condMatch = conditions.length === 0 || conditions.includes(cond);
      const priceMatch = price <= maxPrice;

      const visible = catMatch && condMatch && priceMatch;
      card.style.display = visible ? '' : 'none';
      if(visible) visibleCount += 1;
    });

    if(resultCount) resultCount.textContent = `${visibleCount} item${visibleCount === 1 ? '' : 's'} found`;
  }

  function applySort(){
    const value = sortSelect.value;
    const sorted = cards.slice().sort((a, b) => {
      if(value === 'price-asc') return Number(a.dataset.price) - Number(b.dataset.price);
      if(value === 'price-desc') return Number(b.dataset.price) - Number(a.dataset.price);
      return 0;
    });
    sorted.forEach(card => grid.appendChild(card));
  }

  categoryInputs.forEach(el => el.addEventListener('change', applyFilters));
  conditionInputs.forEach(el => el.addEventListener('change', applyFilters));
  if(priceInput){
    priceInput.addEventListener('input', () => {
      if(priceValueLabel) priceValueLabel.textContent = `Up to ₹${Number(priceInput.value).toLocaleString('en-IN')}`;
      applyFilters();
    });
  }
  if(sortSelect) sortSelect.addEventListener('change', applySort);

  applyFilters();
}

const PRODUCTS = {
  'dell-latitude-7490': {
    brand: 'Dell · Latitude Series',
    title: 'Dell Latitude 7490 — 14" Business Laptop',
    grade: 'Excellent', gradeClass: '',
    price: '₹19,999', priceOld: '₹22,999',
    desc: 'Lightweight business laptop, fully cleaned, tested and re-certified by our technicians. Battery, keyboard and display checked for full working condition before listing.',
    icon: 'laptop',
    specs: [
      ['Processor', 'Intel Core i5-8350U (8th Gen)'], ['RAM', '8GB DDR4'], ['Storage', '256GB SSD'],
      ['Display', '14" FHD (1920×1080)'], ['Graphics', 'Intel UHD 620 (Integrated)'],
      ['Battery Health', 'Tested — holds charge normally'], ['Condition Grade', 'Excellent — minimal cosmetic wear'],
      ['Included', 'Original charger, cleaned chassis']
    ]
  },
  'hp-elitebook-840-g5': {
    brand: 'HP · EliteBook Series',
    title: 'HP EliteBook 840 G5 — 14" Business Laptop',
    grade: 'Good', gradeClass: 'grade-good',
    price: '₹21,499', priceOld: '₹24,499',
    desc: 'Reliable business laptop, fully cleaned, tested and re-certified by our technicians. Battery, keyboard and display checked for full working condition before listing.',
    icon: 'laptop',
    specs: [
      ['Processor', 'Intel Core i5-8250U (8th Gen)'], ['RAM', '8GB DDR4'], ['Storage', '512GB SSD'],
      ['Display', '14" FHD (1920×1080)'], ['Graphics', 'Intel UHD 620 (Integrated)'],
      ['Battery Health', 'Tested — good capacity'], ['Condition Grade', 'Good — light cosmetic wear'],
      ['Included', 'Original charger']
    ]
  },
  'lenovo-thinkpad-t480': {
    brand: 'Lenovo · ThinkPad Series',
    title: 'Lenovo ThinkPad T480 — 14" Business Laptop',
    grade: 'Excellent', gradeClass: '',
    price: '₹26,999', priceOld: '₹30,999',
    desc: 'High-spec business laptop, fully cleaned, tested and re-certified by our technicians. Battery, keyboard and display checked for full working condition before listing.',
    icon: 'laptop',
    specs: [
      ['Processor', 'Intel Core i7-8550U (8th Gen)'], ['RAM', '16GB DDR4'], ['Storage', '512GB SSD'],
      ['Display', '14" FHD (1920×1080)'], ['Graphics', 'Intel UHD 620 (Integrated)'],
      ['Battery Health', 'Tested — holds charge normally'], ['Condition Grade', 'Excellent — minimal cosmetic wear'],
      ['Included', 'Original charger, cleaned chassis']
    ]
  },
  'acer-aspire-5': {
    brand: 'Acer · Aspire Series',
    title: 'Acer Aspire 5 — 15.6" Everyday Laptop',
    grade: 'Fair', gradeClass: 'grade-fair',
    price: '₹12,999', priceOld: '₹15,499',
    desc: 'Budget-friendly everyday laptop, fully cleaned and tested by our technicians. Ideal for browsing, office work and study use.',
    icon: 'laptop',
    specs: [
      ['Processor', 'Intel Core i3-7100U (7th Gen)'], ['RAM', '4GB DDR4'], ['Storage', '500GB HDD'],
      ['Display', '15.6" HD (1366×768)'], ['Graphics', 'Intel HD 620 (Integrated)'],
      ['Battery Health', 'Tested — reduced capacity'], ['Condition Grade', 'Fair — visible cosmetic wear'],
      ['Included', 'Charger']
    ]
  },
  'dell-optiplex-7050-sff': {
    brand: 'Dell · OptiPlex Series',
    title: 'Dell OptiPlex 7050 SFF — Desktop Tower',
    grade: 'Good', gradeClass: 'grade-good',
    price: '₹17,999', priceOld: '₹20,999',
    desc: 'Compact small-form-factor desktop, fully cleaned, tested and re-certified by our technicians. Great for home or office use.',
    icon: 'desktop',
    specs: [
      ['Processor', 'Intel Core i5-6500'], ['RAM', '8GB DDR4'], ['Storage', '256GB SSD'],
      ['Form Factor', 'Small Form Factor (SFF)'], ['Graphics', 'Intel HD 530 (Integrated)'],
      ['Condition Grade', 'Good — light cosmetic wear'], ['Included', 'Power cable (monitor/keyboard/mouse sold separately)']
    ]
  },
  'hp-prodesk-600-g4': {
    brand: 'HP · ProDesk Series',
    title: 'HP ProDesk 600 G4 — Desktop Tower',
    grade: 'Excellent', gradeClass: '',
    price: '₹24,999', priceOld: '₹28,999',
    desc: 'High-performance small-form-factor desktop, fully cleaned, tested and re-certified by our technicians.',
    icon: 'desktop',
    specs: [
      ['Processor', 'Intel Core i7-8700'], ['RAM', '16GB DDR4'], ['Storage', '512GB SSD'],
      ['Form Factor', 'Small Form Factor (SFF)'], ['Graphics', 'Intel UHD 630 (Integrated)'],
      ['Condition Grade', 'Excellent — minimal cosmetic wear'], ['Included', 'Power cable (monitor/keyboard/mouse sold separately)']
    ]
  },
  'canon-pixma-g2010': {
    brand: 'Canon · PIXMA Series',
    title: 'Canon PIXMA G2010 — Ink Tank Printer',
    grade: 'Good', gradeClass: 'grade-good',
    price: '₹4,499', priceOld: '₹5,999',
    desc: 'Ink tank printer with print and scan, tested by our technicians for smooth ink flow and clean output.',
    icon: 'printer',
    specs: [
      ['Type', 'Ink tank (print & scan)'], ['Connectivity', 'USB'], ['Print Speed', 'Up to 8.8 ipm (mono)'],
      ['Condition Grade', 'Good — tested ink system'], ['Included', 'Power cable, USB cable']
    ]
  },
  'hp-laserjet-p1102': {
    brand: 'HP · LaserJet Series',
    title: 'HP LaserJet P1102 — Mono Laser Printer',
    grade: 'Fair', gradeClass: 'grade-fair',
    price: '₹3,199', priceOld: '₹4,299',
    desc: 'Compact mono laser printer, tested for print quality and reliability by our technicians.',
    icon: 'printer',
    specs: [
      ['Type', 'Mono laser (print only)'], ['Connectivity', 'USB'], ['Print Speed', 'Up to 18 ppm'],
      ['Condition Grade', 'Fair — visible cosmetic wear'], ['Included', 'Power cable, USB cable']
    ]
  }
};

const PRODUCT_ICONS = {
  laptop: '<rect x="6" y="6" width="78" height="46" rx="2"/><path d="M2 58h86l-6 8H8Z"/>',
  desktop: '<rect x="10" y="4" width="34" height="62" rx="2"/><circle cx="27" cy="14" r="2"/><rect x="50" y="30" width="34" height="24" rx="1"/><path d="M58 62h20"/>',
  printer: '<path d="M20 24V6h50v18"/><rect x="8" y="24" width="74" height="28" rx="2"/><rect x="22" y="52" width="46" height="12"/>'
};

function initProductPage(){
  const titleEl = document.querySelector('[data-pd-title]');
  if(!titleEl) return; // not the product page

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'dell-latitude-7490';
  const product = PRODUCTS[id] || PRODUCTS['dell-latitude-7490'];

  document.querySelectorAll('[data-pd-brand]').forEach(el => el.textContent = product.brand);
  titleEl.textContent = product.title;
  document.querySelectorAll('[data-pd-price]').forEach(el => el.textContent = product.price);
  document.querySelectorAll('[data-pd-price-old]').forEach(el => el.textContent = product.priceOld);
  document.querySelectorAll('[data-pd-desc]').forEach(el => el.textContent = product.desc);
  document.querySelectorAll('[data-pd-breadcrumb]').forEach(el => el.textContent = product.title.split(' — ')[0]);
  document.querySelectorAll('[data-pd-h1]').forEach(el => el.textContent = product.title.split(' — ')[0]);
  document.title = `${product.title.split(' — ')[0]} — Sigma Infotech`;

  document.querySelectorAll('[data-pd-grade]').forEach(el => {
    el.textContent = product.grade;
    el.classList.remove('grade-good', 'grade-fair');
    if(product.gradeClass) el.classList.add(product.gradeClass);
  });

  const iconEl = document.querySelector('[data-pd-icon]');
  if(iconEl && PRODUCT_ICONS[product.icon]) iconEl.innerHTML = PRODUCT_ICONS[product.icon];

  const specsTable = document.querySelector('[data-pd-specs]');
  if(specsTable){
    specsTable.innerHTML = product.specs.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join('');
  }

  const cartBtn = document.querySelector('[data-pd-cart-btn]');
  if(cartBtn) cartBtn.setAttribute('data-add-to-cart', product.title.split(' — ')[0]);
}

function initContactForm(){
  const form = document.querySelector('[data-contact-form]');
  if(!form) return;
  const status = document.querySelector('[data-form-status]');
  form.addEventListener('submit', e => {
    e.preventDefault();
    if(status){
      status.textContent = 'Thanks — your message has been noted. We\u2019ll get back to you shortly.';
      status.classList.add('show');
    }
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initAddToCart();
  initQtyControl();
  initGalleryThumbs();
  initShopFilters();
  initContactForm();
  updateCartBadge();
});