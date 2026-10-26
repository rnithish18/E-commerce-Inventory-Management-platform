import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  UploadCloud,
  X,
  Sparkles,
  ArrowRight,
  Loader2,
  Tag,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { aiApi } from '../../lib/api';
import { formatPaise } from '../../lib/utils';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VisualSearchModal({ isOpen, onClose }: VisualSearchModalProps) {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [queryAnalysis, setQueryAnalysis] = useState<{
    category: string;
    tags: string[];
    title: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size cannot exceed 5MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setResults(null);
    setQueryAnalysis(null);

    // Automatically trigger visual search
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', file);
      const res = await aiApi.imageSearch(formData);
      setResults(res.data.results || []);
      setQueryAnalysis(res.data.queryAnalysis || null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Visual search failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults(null);
    setQueryAnalysis(null);
  };

  const handleProductClick = (slug: string) => {
    onClose();
    navigate(`/product/${slug}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fadeIn">
      <div className="card w-full max-w-2xl bg-navy-800/95 border-navy-600 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-navy-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Search by Image</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                  AI Vision Powered
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                Upload or capture an image to find visually similar products across the catalog
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-navy-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Upload Area when no image selected */}
          {!previewUrl && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-navy-600 hover:border-navy-500 bg-navy-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Drop a photo here, or <span className="text-orange-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPEG, PNG, or WebP up to 5MB
                  </p>
                </div>

                <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-600 text-xs font-semibold text-gray-200"
                  >
                    <Camera className="w-3.5 h-3.5 text-teal-400" />
                    <span>Take Photo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Query Image & Status */}
          {previewUrl && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-900/80 border border-navy-700">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-navy-800 border border-navy-600 overflow-hidden shrink-0">
                  <img src={previewUrl} alt="Query" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white line-clamp-1">
                    {selectedFile?.name || 'Captured Image'}
                  </p>
                  {queryAnalysis && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-orange-400 font-semibold">
                        {queryAnalysis.category}
                      </span>
                      <span className="text-gray-500 text-[10px]">•</span>
                      <span className="text-[10px] text-gray-400 truncate max-w-xs">
                        {queryAnalysis.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={resetSearch}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Change Photo
              </button>
            </div>
          )}

          {/* Loading Shimmer State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
              <div className="text-center">
                <p className="text-xs font-bold text-white">Analyzing Visual Features...</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Detecting object category, colors, and ranking catalog matches
                </p>
              </div>
            </div>
          )}

          {/* Visual Search Results */}
          {!loading && results !== null && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">
                  Matching Products ({results.length})
                </span>
              </div>

              {results.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p>No products closely matching this visual signature were found.</p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Try uploading an image with a clearer view or plain background.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.slug)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-navy-900/60 hover:bg-navy-700/60 border border-navy-700/80 hover:border-orange-500/40 transition-all cursor-pointer group"
                    >
                      <div className="w-16 h-16 rounded-lg bg-navy-800 border border-navy-700 overflow-hidden flex items-center justify-center shrink-0">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase truncate">
                            {product.category_name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                            {product.matchScore}% match
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-orange-400 transition-colors mt-0.5">
                          {product.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-bold text-white">
                            {formatPaise(product.price_paise)}
                          </span>
                          <span className="text-[10px] text-orange-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            View <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
