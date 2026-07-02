import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface ImageUploadProps {
  bucket: string;
  folder?: string;
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  label?: string;
}

export default function ImageUpload({ 
  bucket, 
  folder = 'uploads', 
  onUploadComplete, 
  maxFiles = 5 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  
const compressImage = (file: File, maxWidth = 1280): Promise<File> => {
  return new Promise<File>((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        resolve(file);
        return;
      }
      const img = new Image();
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = maxWidth / img.width;
        let width = img.width;
        let height = img.height;
        if (scaleSize < 1) {
          width = maxWidth;
          height = img.height * scaleSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' }));
            } else {
              resolve(file);
            }
          }, 'image/webp', 0.85);
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (previews.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    setUploading(true);
    setError(null);
    const uploadedUrls: string[] = [];

    for (let file of files) {
      file = await compressImage(file);
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject('Failed to read file');
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;

        const res = await apiClient.post<{url: string}>('/upload/base64', {
          file: base64,
          bucket,
          folder,
        });

        if (res?.url) {
          uploadedUrls.push(res.url);
          setPreviews(prev => [...prev, res.url]);
        }
      } catch (err: any) {
        console.error('Upload error:', err);
        setError(`Upload failed: ${err.message}`);
      }
    }

    onUploadComplete(uploadedUrls);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = async (url: string) => {
    // Note: To fully remove from storage, we'd need to extract the path from the URL
    // For now, we just remove it from the local state/UI
    setPreviews(prev => prev.filter(p => p !== url));
    onUploadComplete(previews.filter(p => p !== url));
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold animate-in slide-in-from-top-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {previews.map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/5 group shadow-xl">
            <img src={url} alt="Preview" className="w-full h-full object-cover" />
            <button 
              onClick={() => removeImage(url)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        {previews.length < maxFiles && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-purple-500/30 transition-all flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
          >
            {uploading ? (
              <Loader2 size={32} className="text-purple-500 animate-spin" />
            ) : (
              <>
                <div className="bg-purple-500/10 p-3 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Add Photo</span>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              multiple 
              accept="image/*" 
              className="hidden" 
            />
          </button>
        )}
      </div>

      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] text-center">
        {previews.length} / {maxFiles} Files Uploaded
      </p>
    </div>
  );
}

