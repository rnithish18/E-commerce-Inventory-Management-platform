import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Camera,
  X,
  Sparkles,
  Check,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Palette,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadsApi, aiApi, AiAnalysisData } from '../../lib/api';

export interface UploadedImageItem {
  id: string;
  url: string;
  thumbUrl?: string;
  file?: File;
  previewUrl: string;
  isPrimary?: boolean;
}

interface ImageUploaderProps {
  images: UploadedImageItem[];
  onChange: (images: UploadedImageItem[]) => void;
  maxImages?: number;
  onApplySuggestions?: (suggestions: Partial<AiAnalysisData>) => void;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 5,
  onApplySuggestions,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisData | null>(null);
  const [errorChips, setErrorChips] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste listener for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData?.items) return;
      const items = Array.from(e.clipboardData.items);
      const imageFiles: File[] = [];

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        handleFilesSelected(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [images]);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`;
    }
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      return `${file.name}: File exceeds 5MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`;
    }
    return null;
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    const errors: string[] = [];
    const validFiles: File[] = [];

    const availableSlots = maxImages - images.length;
    if (availableSlots <= 0) {
      toast.error(`Maximum of ${maxImages} images allowed.`);
      return;
    }

    const filesToProcess = selectedFiles.slice(0, availableSlots);

    for (const file of filesToProcess) {
      const err = validateFile(file);
      if (err) {
        errors.push(err);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setErrorChips((prev) => [...prev, ...errors]);
    }

    if (validFiles.length === 0) return;

    // Immediately generate preview URLs for swift UI responsiveness
    const newItems: UploadedImageItem[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      url: '',
      previewUrl: URL.createObjectURL(file),
      file,
      isPrimary: images.length === 0,
    }));

    const combinedImages = [...images, ...newItems];
    onChange(combinedImages);

    // Upload files to server
    try {
      setUploadProgress(15);
      const formData = new FormData();
      if (validFiles.length === 1) {
        formData.append('image', validFiles[0]);
        setUploadProgress(45);
        const res = await uploadsApi.uploadImage(formData);
        setUploadProgress(100);

        const updated = combinedImages.map((img) =>
          img.file === validFiles[0]
            ? { ...img, url: res.data.url, thumbUrl: res.data.thumbUrl }
            : img
        );
        onChange(updated);
        toast.success('Image uploaded and optimized!');
      } else {
        validFiles.forEach((f) => formData.append('images', f));
        setUploadProgress(45);
        const res = await uploadsApi.uploadImages(formData);
        setUploadProgress(100);

        const updated = [...images];
        res.data.images.forEach((imgData, idx) => {
          updated.push({
            id: imgData.hash || Math.random().toString(36),
            url: imgData.url,
            thumbUrl: imgData.thumbUrl,
            previewUrl: imgData.url,
            isPrimary: updated.length === 0,
          });
        });
        onChange(updated);
        toast.success(`${res.data.images.length} images uploaded!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload image(s)');
    } finally {
      setTimeout(() => setUploadProgress(null), 800);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (
      (direction === 'left' && index === 0) ||
      (direction === 'right' && index === images.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    // Ensure first image retains primary status
    reordered.forEach((img, i) => {
      img.isPrimary = i === 0;
    });

    onChange(reordered);
  };

  const handleAnalyzeWithAi = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one product image to analyze.');
      return;
    }

    const primaryImage = images[0];
    try {
      setAnalyzing(true);
      setAnalysisResult(null);

      let res;
      if (primaryImage.file) {
        const formData = new FormData();
        formData.append('image', primaryImage.file);
        res = await aiApi.analyzeImage(formData);
      } else {
        res = await aiApi.analyzeImage({ imageUrl: primaryImage.url });
      }

      setAnalysisResult(res.data.data);
      toast.success('AI vision analysis complete!', { icon: '✨' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'AI analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyAll = () => {
    if (!analysisResult || !onApplySuggestions) return;
    onApplySuggestions(analysisResult);
    toast.success('All AI suggestions applied to product form!');
  };

  return (
    <div className="space-y-4">
      {/* Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-orange-500 bg-orange-500/10'
            : 'border-navy-600 hover:border-navy-500 bg-navy-800/60'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFilesSelected(Array.from(e.target.files));
            }
          }}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFilesSelected(Array.from(e.target.files));
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              Drag & drop product images, or <span className="text-orange-400 underline">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports JPEG, PNG, WebP up to 5MB • Paste from clipboard with Ctrl+V
            </p>
          </div>

          {/* Alternative upload path: Mobile Camera */}
          <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-600 text-xs font-semibold text-gray-300 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-teal-400" />
              <span>Capture Photo</span>
            </button>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploadProgress !== null && (
          <div className="absolute inset-x-4 bottom-2 h-1.5 bg-navy-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-teal-400 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Error Chips */}
      {errorChips.length > 0 && (
        <div className="space-y-1">
          {errorChips.map((chip, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                <span>{chip}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorChips((prev) => prev.filter((_, i) => i !== idx))}
                className="hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Thumbnails Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300">
              Uploaded Images ({images.length}/{maxImages})
            </span>
            <button
              type="button"
              onClick={handleAnalyzeWithAi}
              disabled={analyzing}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Vision...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                  <span>Analyze with AI</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                className="relative rounded-2xl bg-navy-800 border border-navy-700 p-2 group hover:border-navy-500 transition-all"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-navy-900 flex items-center justify-center relative">
                  <img
                    src={img.previewUrl || img.url}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {idx === 0 && (
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-orange-500 text-white font-black text-[9px] uppercase tracking-wider shadow">
                      Cover
                    </span>
                  )}
                </div>

                {/* Thumbnail Controls */}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-navy-700/60">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, 'left')}
                      className="p-1 rounded hover:bg-navy-700 text-gray-400 hover:text-white disabled:opacity-30"
                      title="Move left"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => moveImage(idx, 'right')}
                      className="p-1 rounded hover:bg-navy-700 text-gray-400 hover:text-white disabled:opacity-30"
                      title="Move right"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestion Card & Quality Gauge */}
      {analysisResult && (
        <div className="rounded-2xl bg-gradient-to-br from-navy-800 to-navy-700/80 border border-teal-500/30 p-5 space-y-4 shadow-xl animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-navy-700/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">AI Vision Analysis & Suggestions</h4>
                <p className="text-[11px] text-gray-400">
                  High-fidelity attribute extraction • {analysisResult.cached ? 'Loaded from cache' : 'Freshly analyzed'}
                </p>
              </div>
            </div>

            {onApplySuggestions && (
              <button
                type="button"
                onClick={handleApplyAll}
                className="btn-primary py-1.5 px-3.5 text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-orange-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply All Suggestions</span>
              </button>
            )}
          </div>

          {/* Quality Score & Color Swatches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Visual Quality Gauge */}
            <div className="p-3 rounded-xl bg-navy-900/80 border border-navy-700">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-400 font-semibold">Image Listing Quality:</span>
                <span
                  className={`font-black ${
                    analysisResult.imageQualityScore >= 80
                      ? 'text-emerald-400'
                      : analysisResult.imageQualityScore >= 60
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {analysisResult.imageQualityScore}/100{' '}
                  {analysisResult.imageQualityScore >= 80 ? '• Listing Ready' : '• Acceptable'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-navy-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    analysisResult.imageQualityScore >= 80
                      ? 'bg-emerald-500'
                      : analysisResult.imageQualityScore >= 60
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${analysisResult.imageQualityScore}%` }}
                />
              </div>
            </div>

            {/* Dominant Color Swatches */}
            <div className="p-3 rounded-xl bg-navy-900/80 border border-navy-700 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-teal-400" />
                <span>Dominant Colors:</span>
              </span>
              <div className="flex items-center gap-2">
                {analysisResult.dominantColors.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span
                      className="w-5 h-5 rounded-lg border border-white/20 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] font-mono text-gray-400">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggested Attributes with Cherry-Pick Apply Buttons */}
          <div className="space-y-2.5 pt-1 text-xs">
            {/* Title */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-navy-900/60 border border-navy-700/60">
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Suggested Title</span>
                <p className="text-white font-semibold mt-0.5">{analysisResult.suggestedTitle}</p>
              </div>
              {onApplySuggestions && (
                <button
                  type="button"
                  onClick={() => onApplySuggestions({ suggestedTitle: analysisResult.suggestedTitle })}
                  className="py-1 px-2.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-teal-300 font-bold text-[11px] border border-teal-500/20"
                >
                  Apply Title
                </button>
              )}
            </div>

            {/* Category */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-navy-900/60 border border-navy-700/60">
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Suggested Category</span>
                <p className="text-orange-400 font-bold mt-0.5">{analysisResult.suggestedCategory}</p>
              </div>
              {onApplySuggestions && (
                <button
                  type="button"
                  onClick={() => onApplySuggestions({ suggestedCategory: analysisResult.suggestedCategory })}
                  className="py-1 px-2.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-teal-300 font-bold text-[11px] border border-teal-500/20"
                >
                  Apply Category
                </button>
              )}
            </div>

            {/* Description */}
            <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-navy-900/60 border border-navy-700/60">
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Suggested Description</span>
                <p className="text-gray-300 text-[11px] mt-0.5 leading-relaxed">{analysisResult.suggestedDescription}</p>
              </div>
              {onApplySuggestions && (
                <button
                  type="button"
                  onClick={() => onApplySuggestions({ suggestedDescription: analysisResult.suggestedDescription })}
                  className="py-1 px-2.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-teal-300 font-bold text-[11px] border border-teal-500/20 shrink-0"
                >
                  Apply Desc
                </button>
              )}
            </div>

            {/* Detected Tags */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-navy-900/60 border border-navy-700/60">
              <div className="flex-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Detected Tags</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {analysisResult.detectedTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-navy-800 text-teal-300 border border-teal-500/20 text-[10px] font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              {onApplySuggestions && (
                <button
                  type="button"
                  onClick={() => onApplySuggestions({ detectedTags: analysisResult.detectedTags })}
                  className="py-1 px-2.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-teal-300 font-bold text-[11px] border border-teal-500/20"
                >
                  Apply Tags
                </button>
              )}
            </div>

            {/* Recommendations */}
            {analysisResult.recommendations.length > 0 && (
              <div className="p-2.5 rounded-xl bg-navy-900/40 border border-navy-700/40 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">AI Photography Tips:</span>
                <ul className="list-disc list-inside text-[11px] text-gray-300 space-y-0.5">
                  {analysisResult.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
