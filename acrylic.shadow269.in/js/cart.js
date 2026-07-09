// ===== CART STATE =====
let cart = JSON.parse(localStorage.getItem('shadow269_cart') || '[]');

function saveCart() {
  localStorage.setItem('shadow269_cart', JSON.stringify(cart));
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// ===== UI UPDATES =====
function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll('#cartCount, .cart-count').forEach(el => {
    el.textContent = count;
    el.classList.toggle('visible', count > 0);
  });
}

function renderCartItems() {
  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmpty');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');
  if (!itemsEl) return;

  if (cart.length === 0) {
    if (emptyEl) emptyEl.style.display = 'flex';
    if (footerEl) footerEl.style.display = 'none';
    // Remove any item rows
    itemsEl.querySelectorAll('.cart-item-row').forEach(r => r.remove());
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (footerEl) footerEl.style.display = 'block';
  if (totalEl) totalEl.textContent = '₹' + getCartTotal().toLocaleString('en-IN');

  // Clear and re-render item rows
  itemsEl.querySelectorAll('.cart-item-row').forEach(r => r.remove());

  cart.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'cart-item-row';
    row.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" data-action="dec" data-index="${index}">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" data-action="inc" data-index="${index}">+</button>
      </div>
    `;
    itemsEl.insertBefore(row, emptyEl);
  });

  // Qty buttons
  itemsEl.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      const action = btn.dataset.action;
      if (action === 'inc') {
        cart[idx].qty++;
      } else {
        cart[idx].qty--;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
      }
      saveCart();
      updateCartBadge();
      renderCartItems();
    });
  });
}

// ===== DRAWER =====
function openCart() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  renderCartItems();
}

function closeCart() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
}

document.getElementById('cartBtn')?.addEventListener('click', openCart);
document.getElementById('cartClose')?.addEventListener('click', closeCart);
document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

// ===== ADD TO CART (global) =====
window.addToCart = function(name, price, qty = 1) {
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ name, price, qty });
  }
  saveCart();
  updateCartBadge();
  openCart();
};

// ===== INIT =====
updateCartBadge();
