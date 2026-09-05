import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Artwork } from '../types';
import { api } from '../api/client';

interface Props {
  label: string;
  type: 'poster' | 'banner' | 'thumbnail';
  dimensions: string;
  aspect: string;
  maxKb?: number;
  currentArtwork?: Artwork;
  showId?: string;
  episodeId?: string;
  onUploaded: (artwork: Artwork) => void;
}

export const ArtworkUploadSlot: React.FC<Props> = ({
  label,
  type,
  dimensions,
  aspect,
  maxKb = 200,
  currentArtwork,
  showId,
  episodeId,
  onUploaded
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentArtwork?.url || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploading(true);

    try {
      const artwork = await api.uploadArtwork({
        file,
        artwork_type: type,
        show_id: showId,
        episode_id: episodeId
      });

      setPreviewUrl(artwork.url);
      setSuccessMessage(`Uploaded! (${artwork.width}x${artwork.height}px, ${Math.round(artwork.size_bytes / 1024)}KB)`);
      onUploaded(artwork);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload artwork');
    } finally {
      setIsUploading(false);
    }
  };

  const getAspectClass = () => {
    if (type === 'poster') return 'aspect-[2/3] max-w-[150px]';
    if (type === 'banner') return 'aspect-[16/9] max-w-[240px]';
    return 'aspect-[16/9] max-w-[160px]';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-200 text-sm">{label}</h4>
          <p className="text-xs text-slate-400">
            Aspect <span className="text-amber-400 font-mono">{aspect}</span> • Target <span className="text-slate-300 font-mono">{dimensions}</span> • Max <span className="text-slate-300 font-mono">{maxKb}KB</span>
          </p>
        </div>
        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {type}
        </span>
      </div>

      {/* Image Preview / Slot */}
      <div className={`relative border-2 border-dashed rounded-lg overflow-hidden flex items-center justify-center bg-slate-950/60 ${getAspectClass()} ${errorMessage ? 'border-red-500/60' : 'border-slate-700 hover:border-indigo-500'} transition-all`}>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-full object-cover"
            onError={() => setPreviewUrl(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-3 text-center text-slate-500">
            <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
            <span className="text-[11px]">No image</span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-indigo-400">
            <Loader2 className="w-6 h-6 animate-spin mb-1" />
            <span className="text-[11px] font-medium">Validating...</span>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors">
        <Upload className="w-3.5 h-3.5" />
        <span>{previewUrl ? 'Replace Image' : 'Upload Image'}</span>
        <input
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
          disabled={isUploading}
          onChange={handleFileChange}
        />
      </label>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-start gap-2 text-xs text-red-300 bg-red-950/50 border border-red-900/60 p-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-900/50 p-2 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};
