import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/* ─────────────────────────────────────────────────────────────
   HELPER: format UGX
   ───────────────────────────────────────────────────────────── */
const fmtPrice = (v) => {
  const n = Number(v);
  if (isNaN(n)) return 'USh 0';
  return 'USh ' + n.toLocaleString('en-UG', { maximumFractionDigits: 0 });
};

/* star rating helper */
const Stars = ({ rating = 0, size = 'text-sm' }) => (
  <span className={`inline-flex gap-0.5 ${size}`}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        className={`material-symbols-outlined ${s <= Math.round(rating) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
        style={{ fontSize: 'inherit' }}
      >
        star
      </span>
    ))}
  </span>
);

/* ─────────────────────────────────────────────────────────────
   MAIN SHOP COMPONENT
   ───────────────────────────────────────────────────────────── */
export default function Shop({ user }) {
  // top-level view: 'browse' | 'product' | 'cart' | 'checkout' | 'orders' | 'order-detail'
  const [view, setView] = useState('browse');

  // data
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState({ items: [], total: '0', item_count: 0 });
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');

  // ui state
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null); // product id
  const [toast, setToast] = useState(null);

  // checkout form
  const [checkoutForm, setCheckoutForm] = useState({
    shipping_address: '',
    phone: user?.phone_number || '',
    payment_method: 'MOBILE_MONEY',
    notes: '',
  });

  /* ── Toast helper ─────────────────────────────────────────── */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Fetch products + categories on mount / filter change ── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          api.shop.getCategories(),
          api.shop.getProducts({ category: selectedCategory, search: searchQuery, sort: sortBy }),
        ]);
        if (!cancelled) {
          setCategories(cats);
          setProducts(prods);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [selectedCategory, searchQuery, sortBy]);

  /* ── Load cart ──────────────────────────────────────────── */
  const loadCart = useCallback(async () => {
    try {
      const data = await api.shop.getCart();
      setCart(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadCart(); }, [loadCart]);

  /* ── Add to cart ────────────────────────────────────────── */
  const handleAddToCart = async (productId) => {
    setAddingToCart(productId);
    try {
      const data = await api.shop.addToCart(productId, 1);
      setCart(data);
      showToast('Added to cart');
    } catch (e) {
      showToast(e.message || 'Failed to add', 'error');
    }
    setAddingToCart(null);
  };

  /* ── Update quantity ────────────────────────────────────── */
  const handleUpdateQty = async (itemId, qty) => {
    setCartLoading(true);
    try {
      const data = await api.shop.updateCartItem(itemId, qty);
      setCart(data);
    } catch (e) {
      showToast(e.message || 'Failed to update', 'error');
    }
    setCartLoading(false);
  };

  /* ── Remove from cart ───────────────────────────────────── */
  const handleRemoveItem = async (itemId) => {
    setCartLoading(true);
    try {
      const data = await api.shop.removeCartItem(itemId);
      setCart(data);
      showToast('Item removed');
    } catch (e) {
      showToast(e.message || 'Failed to remove', 'error');
    }
    setCartLoading(false);
  };

  /* ── Checkout ───────────────────────────────────────────── */
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutForm.shipping_address || !checkoutForm.phone) {
      showToast('Please fill in delivery address and phone', 'error');
      return;
    }
    setCheckoutLoading(true);
    try {
      await api.shop.checkout(checkoutForm);
      showToast('Order placed successfully!');
      setCart({ items: [], total: '0', item_count: 0 });
      // load orders then go to orders view
      const ords = await api.shop.getOrders();
      setOrders(ords);
      setView('orders');
    } catch (e) {
      showToast(e.message || 'Checkout failed', 'error');
    }
    setCheckoutLoading(false);
  };

  /* ── Load orders ────────────────────────────────────────── */
  const loadOrders = async () => {
    setLoading(true);
    try {
      const ords = await api.shop.getOrders();
      setOrders(ords);
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Open product detail ────────────────────────────────── */
  const openProduct = async (slug) => {
    setLoading(true);
    try {
      const p = await api.shop.getProduct(slug);
      setSelectedProduct(p);
      setView('product');
    } catch { showToast('Failed to load product', 'error'); }
    setLoading(false);
  };

  /* ── Navigate helpers ───────────────────────────────────── */
  const goToBrowse = () => { setView('browse'); setSelectedProduct(null); };
  const goToCart = () => setView('cart');
  const goToCheckout = () => { setCheckoutForm(f => ({ ...f, phone: user?.phone_number || f.phone })); setView('checkout'); };
  const goToOrders = () => { loadOrders(); setView('orders'); };
  const openOrder = (order) => { setSelectedOrder(order); setView('order-detail'); };

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="relative min-h-[60vh]">
      {/* ── Toast ──────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-semibold text-sm animate-fadeInUp ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {view !== 'browse' && (
            <button
              onClick={() => {
                if (view === 'product') goToBrowse();
                else if (view === 'checkout') goToCart();
                else if (view === 'order-detail') goToOrders();
                else goToBrowse();
              }}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-xl sm:text-2xl">arrow_back</span>
            </button>
          )}
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
            {view === 'browse' && 'Shop'}
            {view === 'product' && (selectedProduct?.name || 'Product')}
            {view === 'cart' && 'Your Cart'}
            {view === 'checkout' && 'Checkout'}
            {view === 'orders' && 'My Orders'}
            {view === 'order-detail' && `Order ${selectedOrder?.order_number || ''}`}
          </h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={goToOrders}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            title="My Orders"
          >
            <span className="material-symbols-outlined text-gray-700 dark:text-gray-300">receipt_long</span>
          </button>
          <button
            onClick={goToCart}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            title="Cart"
          >
            <span className="material-symbols-outlined text-gray-700 dark:text-gray-300">shopping_cart</span>
            {cart.item_count > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cart.item_count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
         BROWSE VIEW
         ══════════════════════════════════════════════════════ */}
      {view === 'browse' && (
        <>
          {/* Filters bar */}
          <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6">
            {/* Search */}
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
            {/* Category + Sort row */}
            <div className="flex gap-2 sm:gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Sort by</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="newest">Newest</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-3 mb-3 sm:mb-4 no-scrollbar -mx-1 px-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  !selectedCategory
                    ? 'bg-primary text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 sm:gap-1.5 ${
                    selectedCategory === c.slug
                      ? 'bg-primary text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{c.icon || 'category'}</span>
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Products grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3">storefront</span>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 overflow-hidden hover-lift transition-all group"
                >
                  {/* Image */}
                  <div
                    className="relative aspect-[4/5] sm:aspect-square bg-gray-100 dark:bg-gray-800 cursor-pointer overflow-hidden"
                    onClick={() => openProduct(p.slug)}
                  >
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl sm:text-5xl text-gray-300 dark:text-gray-600">image</span>
                      </div>
                    )}
                    {p.discount_percent > 0 && (
                      <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg">
                        -{p.discount_percent}%
                      </span>
                    )}
                    {p.is_featured && (
                      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-primary text-gray-900 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg">
                        Featured
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-2.5 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-primary font-semibold mb-0.5 sm:mb-1">{p.category_name}</p>
                    <h3
                      className="font-bold text-gray-900 dark:text-white text-xs sm:text-base leading-tight truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => openProduct(p.slug)}
                    >
                      {p.name}
                    </h3>
                    {/* Rating */}
                    <div className="flex items-center gap-0.5 sm:gap-1 my-0.5 sm:my-1">
                      <Stars rating={p.avg_rating} size="text-[10px] sm:text-sm" />
                      <span className="text-[10px] sm:text-xs text-gray-400">({p.review_count})</span>
                    </div>
                    {/* Price */}
                    <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <span className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">{fmtPrice(p.price)}</span>
                      {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                        <span className="text-[10px] sm:text-xs text-gray-400 line-through">{fmtPrice(p.compare_at_price)}</span>
                      )}
                    </div>
                    {/* Add to cart */}
                    <button
                      disabled={!p.in_stock || addingToCart === p.id}
                      onClick={() => handleAddToCart(p.id)}
                      className={`w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                        p.in_stock
                          ? 'bg-primary text-gray-900 hover:opacity-90 active:scale-95'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {addingToCart === p.id ? (
                        <span className="material-symbols-outlined animate-spin text-sm sm:text-base">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-sm sm:text-base">add_shopping_cart</span>
                      )}
                      {p.in_stock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════
         PRODUCT DETAIL VIEW
         ══════════════════════════════════════════════════════ */}
      {view === 'product' && selectedProduct && (
        <div className="animate-fadeInUp">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Image */}
            <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[4/3] sm:aspect-square">
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl sm:text-7xl text-gray-300 dark:text-gray-600">image</span>
                </div>
              )}
            </div>
            {/* Details */}
            <div>
              <p className="text-xs sm:text-sm text-primary font-semibold mb-1 sm:mb-2">{selectedProduct.category_name}</p>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">{selectedProduct.name}</h2>
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Stars rating={selectedProduct.avg_rating} size="text-base sm:text-lg" />
                <span className="text-xs sm:text-sm text-gray-500">({selectedProduct.review_count} reviews)</span>
              </div>
              <div className="flex items-baseline flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{fmtPrice(selectedProduct.price)}</span>
                {selectedProduct.compare_at_price && Number(selectedProduct.compare_at_price) > Number(selectedProduct.price) && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{fmtPrice(selectedProduct.compare_at_price)}</span>
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-lg">-{selectedProduct.discount_percent}%</span>
                  </>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 leading-relaxed">{selectedProduct.description}</p>
              <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 text-xs sm:text-sm">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold ${
                  selectedProduct.in_stock ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  <span className="material-symbols-outlined text-sm">{selectedProduct.in_stock ? 'check_circle' : 'cancel'}</span>
                  {selectedProduct.in_stock ? `${selectedProduct.stock} in stock` : 'Out of stock'}
                </span>
                {selectedProduct.is_digital && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold">
                    <span className="material-symbols-outlined text-sm">download</span>Digital
                  </span>
                )}
              </div>
              <button
                disabled={!selectedProduct.in_stock || addingToCart === selectedProduct.id}
                onClick={() => handleAddToCart(selectedProduct.id)}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                  selectedProduct.in_stock
                    ? 'bg-primary text-gray-900 hover:opacity-90 active:scale-95'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {addingToCart === selectedProduct.id ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined">add_shopping_cart</span>
                )}
                {selectedProduct.in_stock ? 'Add to Cart' : 'Out of Stock'}
              </button>

              {/* Tags */}
              {selectedProduct.tags && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {selectedProduct.tags.split(',').filter(Boolean).map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          {selectedProduct.reviews && selectedProduct.reviews.length > 0 && (
            <div className="mt-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Reviews</h3>
              <div className="space-y-4">
                {selectedProduct.reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{r.user_name}</span>
                      <Stars rating={r.rating} />
                    </div>
                    {r.comment && <p className="text-gray-600 dark:text-gray-400 text-sm">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         CART VIEW
         ══════════════════════════════════════════════════════ */}
      {view === 'cart' && (
        <div className="animate-fadeInUp">
          {cart.items.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-gray-600 mb-4">shopping_cart</span>
              <p className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">Your cart is empty</p>
              <p className="text-gray-400 dark:text-gray-500 mb-6">Browse the shop and add items</p>
              <button
                onClick={goToBrowse}
                className="px-6 py-3 rounded-xl bg-primary text-gray-900 font-bold hover:opacity-90 transition-all"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Items list */}
              <div className="lg:col-span-2 space-y-2 sm:space-y-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                      {item.product?.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl sm:text-2xl text-gray-300">image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{item.product?.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{fmtPrice(item.product?.price)} each</p>
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base flex-shrink-0">{fmtPrice(item.subtotal)}</p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-2">
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                          disabled={cartLoading}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="font-bold text-gray-900 dark:text-white w-5 sm:w-6 text-center text-sm sm:text-base">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          disabled={cartLoading}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={cartLoading}
                          className="ml-auto p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg sm:text-xl">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order summary */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 h-fit sticky top-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal ({cart.item_count} items)</span>
                    <span>{fmtPrice(cart.total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span className="text-green-600 font-semibold">Free</span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>{fmtPrice(cart.total)}</span>
                  </div>
                </div>
                <button
                  onClick={goToCheckout}
                  className="w-full mt-6 py-3 rounded-xl bg-primary text-gray-900 font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">shopping_cart_checkout</span>
                  Proceed to Checkout
                </button>
                <button
                  onClick={goToBrowse}
                  className="w-full mt-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         CHECKOUT VIEW
         ══════════════════════════════════════════════════════ */}
      {view === 'checkout' && (
        <div className="animate-fadeInUp max-w-2xl mx-auto">
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Delivery Details</h2>
            <form onSubmit={handleCheckout} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Delivery Address *</label>
                <textarea
                  value={checkoutForm.shipping_address}
                  onChange={(e) => setCheckoutForm(f => ({ ...f, shipping_address: e.target.value }))}
                  required
                  rows={3}
                  placeholder="Enter your delivery address..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number *</label>
                <input
                  type="tel"
                  value={checkoutForm.phone}
                  onChange={(e) => setCheckoutForm(f => ({ ...f, phone: e.target.value }))}
                  required
                  placeholder="+256..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: 'phone_android' },
                    { value: 'WALLET', label: 'Savings Wallet', icon: 'account_balance_wallet' },
                  ].map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setCheckoutForm(f => ({ ...f, payment_method: pm.value }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-semibold ${
                        checkoutForm.payment_method === pm.value
                          ? 'border-primary bg-primary/10 text-gray-900 dark:text-white'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{pm.icon}</span>
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Order Notes (optional)</label>
                <input
                  type="text"
                  value={checkoutForm.notes}
                  onChange={(e) => setCheckoutForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Special instructions..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{cart.item_count} item(s)</span>
                  <span>{fmtPrice(cart.total)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold">Free</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>{fmtPrice(cart.total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full py-3.5 rounded-xl bg-primary text-gray-900 font-bold text-base hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {checkoutLoading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined">lock</span>
                )}
                {checkoutLoading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         ORDERS VIEW
         ══════════════════════════════════════════════════════ */}
      {view === 'orders' && (
        <div className="animate-fadeInUp">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-gray-600 mb-4">receipt_long</span>
              <p className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No orders yet</p>
              <button onClick={goToBrowse} className="px-6 py-3 rounded-xl bg-primary text-gray-900 font-bold hover:opacity-90 transition-all mt-4">
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => openOrder(order)}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 lg:p-5 cursor-pointer hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">{order.order_number}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-UG', { dateStyle: 'medium' })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      {
                        PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                        CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                        PROCESSING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                        SHIPPED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
                        DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                        CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      }[order.status] || 'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status_display}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{order.items.length} item(s)</span>
                    <span className="font-bold text-gray-900 dark:text-white">{fmtPrice(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         ORDER DETAIL VIEW
         ══════════════════════════════════════════════════════ */}
      {view === 'order-detail' && selectedOrder && (
        <div className="animate-fadeInUp space-y-6 max-w-3xl mx-auto">
          {/* Status badge */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedOrder.order_number}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Placed {new Date(selectedOrder.created_at).toLocaleDateString('en-UG', { dateStyle: 'long' })}
                </p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                {
                  PENDING: 'bg-yellow-100 text-yellow-700',
                  CONFIRMED: 'bg-blue-100 text-blue-700',
                  PROCESSING: 'bg-purple-100 text-purple-700',
                  SHIPPED: 'bg-indigo-100 text-indigo-700',
                  DELIVERED: 'bg-green-100 text-green-700',
                  CANCELLED: 'bg-red-100 text-red-700',
                }[selectedOrder.status] || 'bg-gray-100 text-gray-700'
              }`}>
                {selectedOrder.status_display}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Payment</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.payment_display}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Phone</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.phone || '—'}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-gray-500 dark:text-gray-400">Address</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.shipping_address || '—'}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Items</h3>
            <div className="space-y-3">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-lg text-gray-300">image</span></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{fmtPrice(item.price)} × {item.quantity}</p>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white">{fmtPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal</span><span>{fmtPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Shipping</span><span>{fmtPrice(selectedOrder.shipping_fee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2">
                <span>Total</span><span>{fmtPrice(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
