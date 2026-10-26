import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Image as ImageIcon, 
  Edit, 
  Trash2, 
  Upload, 
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import api, { AiAnalysisData } from '../../lib/api';
import { formatPaise } from '../../lib/utils';
import { FullPageSpinner } from '../../components/ui/Spinner';
import { ImageUploader, UploadedImageItem } from '../../components/ImageUploader/ImageUploader';
import toast from 'react-hot-toast';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  price_paise: number;
  mrp_paise: number;
  badge: string | null;
  average_rating: number | null;
  is_active: boolean;
  category_name: string;
  total_stock: number;
  image_url: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function AdminProducts() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Product Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const [mrpRupees, setMrpRupees] = useState('');
  const [badge, setBadge] = useState<string>('');
  const [stockQty, setStockQty] = useState('25');
  const [reorderThreshold, setReorderThreshold] = useState('5');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleApplySuggestions = (suggestions: Partial<AiAnalysisData>) => {
    if (suggestions.suggestedTitle) setName(suggestions.suggestedTitle);
    if (suggestions.suggestedDescription) setDescription(suggestions.suggestedDescription);
    if (suggestions.suggestedCategory) {
      const matched = categories.find(
        (c) =>
          c.name.toLowerCase().includes(suggestions.suggestedCategory!.toLowerCase()) ||
          suggestions.suggestedCategory!.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matched) setCategoryId(matched.id);
    }
    if (suggestions.estimatedPriceRange) {
      setPriceRupees((suggestions.estimatedPriceRange.minPaise / 100).toFixed(2));
      setMrpRupees((suggestions.estimatedPriceRange.maxPaise / 100).toFixed(2));
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/products');
      setProducts(res.data.products);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories);
      if (res.data.categories.length > 0) {
        setCategoryId(res.data.categories[0].id);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are permitted');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size cannot exceed 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingImage(true);
      const res = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedImageUrl(res.data.url);
      toast.success('Image uploaded to private uploads folder');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || !priceRupees || !mrpRupees) {
      toast.error('Please fill in all mandatory product fields');
      return;
    }

    const price_paise = Math.round(parseFloat(priceRupees) * 100);
    const mrp_paise = Math.round(parseFloat(mrpRupees) * 100);

    if (price_paise > mrp_paise) {
      toast.error('Selling price cannot exceed MRP');
      return;
    }

    try {
      setSubmitting(true);
      const finalImageUrl = uploadedImages[0]?.url || uploadedImageUrl || undefined;
      const allImageUrls = uploadedImages.map((img) => img.url).filter(Boolean);

      await api.post('/admin/products', {
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        brand: brand.trim() || undefined,
        price_paise,
        mrp_paise,
        badge: badge || undefined,
        is_active: true,
        stock_qty: parseInt(stockQty, 10) || 0,
        reorder_threshold: parseInt(reorderThreshold, 10) || 5,
        image_url: finalImageUrl,
        images: allImageUrls.length > 0 ? allImageUrls : undefined,
      });

      toast.success(`Product "${name}" created with inventory movement!`);
      setShowModal(false);
      setName('');
      setBrand('');
      setDescription('');
      setPriceRupees('');
      setMrpRupees('');
      setUploadedImageUrl(null);
      setUploadedImages([]);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, prodName: string) => {
    if (!confirm(`Are you sure you want to deactivate "${prodName}"?`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success(`Product "${prodName}" deactivated`);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to deactivate product');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
    p.category_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-orange-500" />
            <span>Product Catalog Management</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Create products, upload controlled images, manage pricing in paise, and configure stock
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search */}
      <div className="card p-4 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, brand, or category..."
            className="input-field pl-9 py-2 text-xs w-full"
          />
        </div>
        <span className="text-xs text-gray-400 font-mono">
          Showing {filteredProducts.length} of {products.length} products
        </span>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <FullPageSpinner />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs">
            No products found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-navy-900/80 text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-navy-700">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price / MRP</th>
                  <th className="py-3 px-4 text-center">Badge</th>
                  <th className="py-3 px-4 text-center">Total Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-navy-700/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-navy-900 border border-navy-700 overflow-hidden flex items-center justify-center shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white truncate max-w-xs">{p.name}</div>
                          {p.brand && <div className="text-[11px] text-gray-400">{p.brand}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">
                      {p.category_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-white">{formatPaise(p.price_paise)}</span>
                      <span className="text-[11px] text-gray-500 line-through ml-1.5">{formatPaise(p.mrp_paise)}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.badge ? (
                        <span className="text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                          {p.badge}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                      {p.total_stock}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.is_active ? (
                        <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2.5 py-0.5 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.is_active && (
                        <button
                          onClick={() => handleDeactivate(p.id, p.name)}
                          className="btn-secondary py-1 px-2.5 text-[11px] text-red-400 hover:text-red-300"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-xl p-6 border-navy-600 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              Add New Product to Storefront
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              All prices are stored in paise and stock movements are audited upon creation
            </p>

            <form onSubmit={handleCreateProduct} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sony WH-1000XM5 Headphones"
                    className="input-field text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Sony"
                    className="input-field text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="input-field text-xs w-full"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Product Badge
                  </label>
                  <select
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="input-field text-xs w-full"
                  >
                    <option value="">None</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="Hot">Hot</option>
                    <option value="Trending">Trending</option>
                    <option value="Sale">Sale</option>
                    <option value="New">New</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    placeholder="e.g. 24999.00"
                    className="input-field text-xs w-full font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    MRP / List Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={mrpRupees}
                    onChange={(e) => setMrpRupees(e.target.value)}
                    placeholder="e.g. 29999.00"
                    className="input-field text-xs w-full font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    className="input-field text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Reorder Threshold Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reorderThreshold}
                    onChange={(e) => setReorderThreshold(e.target.value)}
                    className="input-field text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive description of specifications, materials, and warranty..."
                  className="input-field text-xs w-full resize-none"
                />
              </div>

              {/* AI-Powered Image Uploader */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Product Images & AI Vision Analysis</span>
                  <span className="text-[10px] text-teal-400 font-bold">✨ AI Suggestion Ready</span>
                </label>
                <ImageUploader
                  images={uploadedImages}
                  onChange={(imgs) => {
                    setUploadedImages(imgs);
                    if (imgs.length > 0 && imgs[0].url) {
                      setUploadedImageUrl(imgs[0].url);
                    }
                  }}
                  onApplySuggestions={handleApplySuggestions}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs"
                >
                  {submitting ? 'Creating Product...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
