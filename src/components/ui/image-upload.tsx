'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_CONFIG } from '@/config/features';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  error?: {
    message: string;
  };
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwwrtklx2';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'meat_n_beans';

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'products');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data: CloudinaryResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.secure_url;
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Check if max images would be exceeded
      if (value.length + files.length > maxImages) {
        setError(`You can only upload up to ${maxImages} images`);
        return;
      }

      setIsUploading(true);
      setError(null);

      const newUrls: string[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          // Validate file type
          const supportedFormats = APP_CONFIG.SUPPORTED_IMAGE_FORMATS as readonly string[];
          if (!supportedFormats.includes(file.type)) {
            throw new Error(`Invalid file type: ${file.type}. Supported formats: JPEG, PNG, WebP`);
          }

          // Validate file size (convert KB to bytes) - increased for Cloudinary
          const maxSizeBytes = 5 * 1024 * 1024; // 5MB for Cloudinary
          if (file.size > maxSizeBytes) {
            throw new Error(`File "${file.name}" is too large. Maximum size is 5MB`);
          }

          setUploadProgress(`Uploading ${i + 1}/${files.length}...`);

          // Upload to Cloudinary
          const imageUrl = await uploadToCloudinary(file);
          newUrls.push(imageUrl);
        }

        // Update parent with new URLs
        onChange([...value, ...newUrls]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload image');
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [value, onChange, maxImages]
  );

  const handleRemove = useCallback(
    (index: number) => {
      // Remove from the list (Cloudinary images will remain in cloud but that's fine)
      const newUrls = value.filter((_, i) => i !== index);
      onChange(newUrls);
    },
    [value, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        // Create a fake event to reuse handleFileSelect
        const fakeEvent = {
          target: { files },
        } as React.ChangeEvent<HTMLInputElement>;
        handleFileSelect(fakeEvent);
      }
    },
    [disabled, isUploading, handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          disabled || isUploading
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-orange-400 cursor-pointer',
          value.length >= maxImages && 'opacity-50'
        )}
        onClick={() => !disabled && !isUploading && value.length < maxImages && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={APP_CONFIG.SUPPORTED_IMAGE_FORMATS.join(',')}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading || value.length >= maxImages}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            <p className="text-sm text-gray-600">{uploadProgress}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {value.length >= maxImages
                  ? `Maximum ${maxImages} images reached`
                  : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WebP up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Image Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {value.map((url, index) => (
            <div
              key={url}
              className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
            >
              {url ? (
                <Image
                  src={url}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}

              {/* Remove Button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Image Number */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
