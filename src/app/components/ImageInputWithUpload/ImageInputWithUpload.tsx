'use client';

import { useRef, type ChangeEvent } from 'react';
import { Upload, Link as LinkIcon, Loader2 } from 'lucide-react';

interface ImageInputWithUploadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  progress?: number;
  placeholder?: string;
  accept?: string;
  hint?: string;
}

export function ImageInputWithUpload({
  label,
  value,
  onChange,
  onUpload,
  uploading,
  progress = 0,
  placeholder = 'https://example.com/image.jpg o ID de S3',
  accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif',
  hint,
}: ImageInputWithUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
    }
    // Reset input para permitir seleccionar el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2 w-full">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="flex gap-2 w-full">
        {/* Input de URL/ID */}
        <div className="flex-1 min-w-0 relative">
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={uploading}
          />
          <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Botón de Upload - Responsive */}
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading}
          className="shrink-0 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
          title="Subir imagen desde tu computadora"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs sm:text-sm">{progress}%</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Subir</span>
            </>
          )}
        </button>

        {/* Input de archivo oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Barra de progreso */}
      {uploading && progress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Preview de la imagen actual */}
      {/* {value && !uploading && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span className="truncate max-w-xs">
            {value.startsWith("http") ? "URL Externa" : `S3: ${value}`}
          </span>
        </div>
      )} */}

      {/* Hint de tamaño sugerido */}
      {hint && <p className="text-xs text-gray-400 mt-1">Tamaño sugerido: {hint}</p>}
    </div>
  );
}
