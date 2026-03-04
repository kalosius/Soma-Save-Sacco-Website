import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/* ─── Format UGX ─────────────────────────────────────────── */
const fmtPrice = (v) => {
  const n = Number(v);
  if (isNaN(n)) return 'USh 0';
  return 'USh ' + n.toLocaleString('en-UG', { maximumFractionDigits: 0 });
};

/* ═══════════════════════════════════════════════════════════
   VENDOR DASHBOARD
   ═══════════════════════════════════════════════════════════ */
export default function VendorDashboard({ user }) {
  // Internal navigation
  const [view, setView] = useState('dashboard');
  // 'dashboard' | 'products' | 'add-product' | 'edit-product' | 'orders' | 'order-detail'

  // Data
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editProduct, setEditProduct] = useState(null);

  // UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Product form
  const emptyForm = {
    name: '', description: '', price: '', compare_at_price: '',
    stock: '', category: '', image: '', is_active: true, is_digital: false, tags: '',
  };
  const [form, setForm] = useState(emptyForm);

  /* ── Toast ──────────────────────────────────────────────── */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── Load vendor dashboard stats ────────────────────────── */
  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.vendor.getDashboard();
      setStats(data);
    } catch { /* ignore */ }
  }, []);

  /* ── Load vendor products ───────────────────────────────── */
  const loadProducts = useCallback(async () => {
    try {
      const data = await api.vendor.getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  /* ── Load vendor orders ─────────────────────────────────── */
  const loadOrders = useCallback(async () => {
    try {
      const data = await api.vendor.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  /* ── Load categories ────────────────────────────────────── */
  const loadCategories = useCallback(async () => {
    try {
      const data = await api.shop.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  /* ── Initial load ───────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([loadDashboard(), loadProducts(), loadOrders(), loadCategories()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadDashboard, loadProducts, loadOrders, loadCategories]);

  /* ── Product form handlers ──────────────────────────────── */
  const openAddProduct = () => {
    setForm(emptyForm);
    setEditProduct(null);
    setView('add-product');
  };

  const openEditProduct = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      compare_at_price: product.compare_at_price || '',
      stock: product.stock ?? '',
      category: product.category || '',
      image: product.image || '',
      is_active: product.is_active ?? true,
      is_digital: product.is_digital ?? false,
      tags: product.tags || '',
    });
    setView('edit-product');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      showToast('Name, price, and category are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        stock: parseInt(form.stock) || 0,
        category: parseInt(form.category),
      };

      if (editProduct) {
        await api.vendor.updateProduct({ ...payload, id: editProduct.id });
        showToast('Product updated!');
      } else {
        await api.vendor.createProduct(payload);
        showToast('Product created!');
      }
      await loadProducts();
      await loadDashboard();
      setView('products');
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
    }
    setSaving(false);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Deactivate this product? It will be hidden from the shop.')) return;
    try {
      await api.vendor.deleteProduct(id);
      showToast('Product deactivated');
      await loadProducts();
      await loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  /* ── Order actions ──────────────────────────────────────── */
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const updated = await api.vendor.updateOrderStatus(orderId, newStatus);
      showToast(`Order marked as ${newStatus.toLowerCase()}`);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      if (selectedOrder?.id === updated.id) setSelectedOrder(updated);
    } catch (err) {
      showToast(err.message || 'Failed to update', 'error');
    }
  };

  /* ── Vendor internal nav items ──────────────────────────── */
  const vendorNav = [
    { id: 'dashboard', label: 'Overview', icon: 'dashboard' },
    { id: 'products', label: 'Products', icon: 'inventory_2' },
    { id: 'orders', label: 'Orders', icon: 'local_shipping' },
  ];

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-semibold text-sm animate-fadeInUp ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* ── Vendor Header ─────────────────────────────────── */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">store</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Vendor Dashboard</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage your products & orders</p>
            </div>
          </div>
          {(view === 'products' || view === 'dashboard') && (
            <button
              onClick={openAddProduct}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-primary text-gray-900 font-bold text-sm hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span className="hidden sm:inline">Add Product</span>
            </button>
          )}
          {(view === 'add-product' || view === 'edit-product' || view === 'order-detail') && (
            <button
              onClick={() => setView(view === 'order-detail' ? 'orders' : 'products')}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back
            </button>
          )}
        </div>

        {/* Vendor Sub-Navigation */}
        {!['add-product', 'edit-product', 'order-detail'].includes(view) && (
          <div className="flex gap-1 mt-4 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/60">
            {vendorNav.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  view === item.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
         DASHBOARD VIEW
         ══════════════════════════════════════════════════════ */}
      {view === 'dashboard' && stats && (
        <div className="space-y-4 sm:space-y-6 animate-fadeInUp">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Total Products', value: stats.total_products, icon: 'inventory_2', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
              { label: 'Active', value: stats.active_products, icon: 'check_circle', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
              { label: 'Total Orders', value: stats.total_orders, icon: 'shopping_bag', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
              { label: 'Revenue', value: fmtPrice(stats.total_revenue), icon: 'payments', color: 'text-primary', bg: 'bg-primary/10' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-lg ${stat.color}`}>{stat.icon}</span>
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Extra stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending_orders}</p>
              <p className="text-xs text-gray-500 mt-1">Pending Orders</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.out_of_stock}</p>
              <p className="text-xs text-gray-500 mt-1">Out of Stock</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_sold}</p>
              <p className="text-xs text-gray-500 mt-1">Units Sold</p>
            </div>
          </div>

          {/* Recent orders preview */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Orders</h3>
              <button onClick={() => setView('orders')} className="text-xs font-semibold text-primary flex items-center gap-1">
                View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => { setSelectedOrder(order); setView('order-detail'); }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.order_number}</p>
                      <p className="text-xs text-gray-500">{order.customer_name} · {new Date(order.created_at).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        { PENDING: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-blue-100 text-blue-700', PROCESSING: 'bg-purple-100 text-purple-700', SHIPPED: 'bg-indigo-100 text-indigo-700', DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' }[order.status] || 'bg-gray-100 text-gray-700'
                      }`}>{order.status_display}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{fmtPrice(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={openAddProduct}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm">Add Product</span>
            </button>
            <button
              onClick={() => setView('products')}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all"
            >
              <span className="material-symbols-outlined text-primary text-xl">inventory_2</span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm">View Products</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         PRODUCTS VIEW
         ══════════════════════════════════════════════════════ */}
      {view === 'products' && (
        <div className="animate-fadeInUp">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-gray-600 mb-4">inventory_2</span>
              <p className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No products yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Start by adding your first product</p>
              <button
                onClick={openAddProduct}
                className="px-6 py-3 rounded-xl bg-primary text-gray-900 font-bold hover:opacity-90 transition-all"
              >
                Add First Product
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3 sm:p-4"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl text-gray-300">image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{product.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{product.category_name}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className={`inline-block w-2 h-2 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="text-[10px] text-gray-500">{product.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-base font-bold text-gray-900 dark:text-white">{fmtPrice(product.price)}</span>
                        {product.compare_at_price && (
                          <span className="text-xs text-gray-400 line-through">{fmtPrice(product.compare_at_price)}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">inventory</span>
                          {product.stock} in stock
                        </span>
                        {product.is_digital && (
                          <span className="flex items-center gap-1 text-blue-500">
                            <span className="material-symbols-outlined text-sm">cloud_download</span>
                            Digital
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => openEditProduct(product)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         ADD / EDIT PRODUCT VIEW
         ══════════════════════════════════════════════════════ */}
      {(view === 'add-product' || view === 'edit-product') && (
        <div className="animate-fadeInUp max-w-2xl mx-auto">
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. SomaSave Branded T-Shirt"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe your product..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                />
              </div>

              {/* Price Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Price (UGX) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                    required
                    min="0"
                    step="100"
                    placeholder="25000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Compare Price</label>
                  <input
                    type="number"
                    value={form.compare_at_price}
                    onChange={(e) => setForm(f => ({ ...f, compare_at_price: e.target.value }))}
                    min="0"
                    step="100"
                    placeholder="30000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Stock Quantity</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))}
                  min="0"
                  placeholder="50"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Image URL</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
                {form.image && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="fashion, sale, new-arrival"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
                <p className="text-[10px] text-gray-400 mt-1">Comma-separated tags</p>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_digital}
                    onChange={(e) => setForm(f => ({ ...f, is_digital: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Digital Product</span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-primary text-gray-900 font-bold text-base hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined">{editProduct ? 'save' : 'add_circle'}</span>
                )}
                {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
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
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-gray-600 mb-4">local_shipping</span>
              <p className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No orders yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Orders for your products will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => { setSelectedOrder(order); setView('order-detail'); }}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 cursor-pointer hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{order.order_number}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{order.customer_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      { PENDING: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-blue-100 text-blue-700', PROCESSING: 'bg-purple-100 text-purple-700', SHIPPED: 'bg-indigo-100 text-indigo-700', DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' }[order.status] || 'bg-gray-100 text-gray-700'
                    }`}>{order.status_display}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{order.items?.length || 0} item(s) · {new Date(order.created_at).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
        <div className="animate-fadeInUp space-y-4 max-w-3xl mx-auto">
          {/* Order Info */}
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedOrder.order_number}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(selectedOrder.created_at).toLocaleDateString('en-UG', { dateStyle: 'long' })}
                </p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                { PENDING: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-blue-100 text-blue-700', PROCESSING: 'bg-purple-100 text-purple-700', SHIPPED: 'bg-indigo-100 text-indigo-700', DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' }[selectedOrder.status] || 'bg-gray-100 text-gray-700'
              }`}>{selectedOrder.status_display}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Payment</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.payment_display}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.phone || '—'}</p>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <p className="text-gray-500">Delivery Address</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.shipping_address || '—'}</p>
              </div>
              {selectedOrder.notes && (
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-gray-500">Notes</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 sm:p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Items</h3>
            <div className="space-y-3">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-sm text-gray-300">image</span></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{fmtPrice(item.price)} × {item.quantity}</p>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{fmtPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <hr className="my-4 border-gray-200 dark:border-gray-700" />
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
              <span>Total</span>
              <span>{fmtPrice(selectedOrder.total)}</span>
            </div>
          </div>

          {/* Order Actions */}
          {!['DELIVERED', 'CANCELLED'].includes(selectedOrder.status) && (
            <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status !== 'PROCESSING' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PROCESSING')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-semibold text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">settings</span>
                    Mark Processing
                  </button>
                )}
                {selectedOrder.status !== 'SHIPPED' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'SHIPPED')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">local_shipping</span>
                    Mark Shipped
                  </button>
                )}
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'DELIVERED')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Mark Delivered
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
