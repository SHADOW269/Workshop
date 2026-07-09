// ===== IMAGE GALLERY =====
const thumbs = document.querySelectorAll('.thumb-wrap');
const mainImg = document.getElementById('mainImg');
const isRealImage = mainImg && mainImg.tagName === 'IMG';

thumbs.forEach(thumb => {
  thumb.addEventListener('click', () => {
    thumbs.forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
    // Only swap src if mainImg is an actual <img> (i.e. real product photos have been added)
    if (isRealImage && thumb.dataset.src) {
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = thumb.dataset.src;
        mainImg.style.opacity = '1';
      }, 200);
    }
  });
});

// ===== QUANTITY SELECTOR =====
let qty = 1;
const qtyDisplay = document.getElementById('qtyDisplay');

document.getElementById('qtyDec')?.addEventListener('click', () => {
  if (qty > 1) { qty--; if (qtyDisplay) qtyDisplay.textContent = qty; }
});

document.getElementById('qtyInc')?.addEventListener('click', () => {
  qty++;
  if (qtyDisplay) qtyDisplay.textContent = qty;
});

// ===== ADD TO CART =====
document.getElementById('addToCartBtn')?.addEventListener('click', () => {
  window.addToCart?.('Acrylic 3-in-1 Keyboard Armrest Cover', 1499, qty);
});

document.getElementById('buyNowBtn')?.addEventListener('click', () => {
  window.addToCart?.('Acrylic 3-in-1 Keyboard Armrest Cover', 1499, qty);
  setTimeout(() => { window.location.href = '/checkout/cart.html'; }, 400);
});

// ===== TAB PANELS =====
document.querySelectorAll('.ptab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.tab;
    document.querySelectorAll('.ptab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.ptab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.querySelector(`.ptab-panel[data-panel="${key}"]`)?.classList.add('active');
  });
});

// ===== IMAGE ZOOM =====
if (mainImg) {
  mainImg.addEventListener('mousemove', (e) => {
    const rect = mainImg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    mainImg.style.transformOrigin = `${x}% ${y}%`;
    mainImg.style.transform = 'scale(1.12)';
  });
  mainImg.addEventListener('mouseleave', () => {
    mainImg.style.transform = 'scale(1)';
    mainImg.style.transformOrigin = 'center center';
  });
}
