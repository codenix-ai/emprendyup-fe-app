'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Move, Image as ImageIcon, Eye, ZoomIn, Grid, List } from 'lucide-react';
import Image from 'next/image';
import { ProductImage } from '../../utils/types/Product';

interface ImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onChange, maxImages = 10 }: ImageUploaderProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<ProductImage | null>(null);
  const [hoveredImage, setHoveredImage] = useState<ProductImage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const inputId = useState(() => `file-input-${Math.random().toString(36).slice(2)}`)[0];

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (images.length + files.length > maxImages) {
        alert(`Máximo ${maxImages} imágenes permitidas`);
        return;
      }

      setIsUploading(true);
      const newImages: ProductImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        // Create a temporary URL for preview
        const url = URL.createObjectURL(file);
        newImages.push({
          id: `temp-${Date.now()}-${i}`,
          url,
          alt: file.name,
          order: images.length + newImages.length,
        });
      }

      onChange([...images, ...newImages]);
      setIsUploading(false);
    },
    [images, onChange, maxImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFileUpload(e.target.files);
      }
    },
    [handleFileUpload]
  );

  const removeImage = useCallback(
    (index: number) => {
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages.map((img, i) => ({ ...img, order: i })));
    },
    [images, onChange]
  );

  const moveImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newImages = [...images];
      const [movedItem] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedItem);
      onChange(newImages.map((img, i) => ({ ...img, order: i })));
    },
    [images, onChange]
  );

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveImage(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-600 bg-gray-800 rounded-lg p-6 text-center hover:border-fourth-500 hover:bg-gray-700 transition-colors"
      >
        <input
          type="file"
          multiple={maxImages > 1}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id={inputId}
          disabled={isUploading || images.length >= maxImages}
        />

        <label htmlFor={inputId} className="cursor-pointer flex flex-col items-center space-y-2">
          {isUploading ? (
            <div className="w-8 h-8 border-2 border-fourth-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-gray-400" />
          )}
          <div>
            <p className="text-sm font-medium text-white">
              {isUploading ? 'Subiendo...' : 'Arrastra imágenes aquí o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, GIF hasta 10MB. Máximo {maxImages} imágenes.
            </p>
          </div>
        </label>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-300">
              {images.length} imagen{images.length !== 1 ? 'es' : ''} subida
              {images.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-fourth-base text-black'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
                }`}
                title="Vista de cuadrícula"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-fourth-base text-black'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
                }`}
                title="Vista de lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Main Image */}
                  <div
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="relative aspect-square bg-gray-700 rounded-lg overflow-hidden cursor-move mb-3"
                  >
                    <Image
                      src={
                        image.url.startsWith('blob:')
                          ? image.url
                          : `https://emprendyup-images.s3.us-east-1.amazonaws.com/${image.url}`
                      }
                      alt={image.alt || `Producto imagen ${index + 1}`}
                      fill
                      className="object-cover"
                    />

                    {/* Order indicator */}
                    <div className="absolute top-2 left-2 bg-fourth-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-white truncate">
                      {image.alt || `Imagen ${index + 1}`}
                    </p>
                    <p className="text-xs text-gray-400">Posición: {index + 1}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between space-x-2">
                    <button
                      onClick={() => setPreviewImage(image)}
                      className="flex-1 px-3 py-2 bg-fourth-base text-white text-xs rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                      title="Vista previa completa"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </button>
                    <button
                      onClick={() => removeImage(index)}
                      className="px-3 py-2 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                      title="Eliminar imagen"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div
                      className="px-3 py-2 bg-gray-600 text-white text-xs rounded-md cursor-move flex items-center justify-center"
                      title="Arrastrar para reordenar"
                    >
                      <Move className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center space-x-4 p-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors cursor-move"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={
                        image.url.startsWith('blob:')
                          ? image.url
                          : `https://emprendyup-images.s3.us-east-1.amazonaws.com/${image.url}`
                      }
                      alt={image.alt || `Producto imagen ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {image.alt || `Imagen ${index + 1}`}
                    </p>
                    <p className="text-xs text-gray-400">Posición: {index + 1}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewImage(image)}
                      className="p-2 text-black hover:bg-fourth-base rounded-lg transition-colors"
                      title="Vista previa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeImage(index)}
                      className="p-2 text-red-400 hover:bg-red-900 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="p-2 text-gray-400" title="Arrastrar para reordenar">
                      <Move className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Vista Previa de Imagen</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 bg-gray-800">
              <div className="relative max-w-3xl max-h-96 mx-auto">
                <Image
                  src={
                    previewImage.url.startsWith('blob:')
                      ? previewImage.url
                      : `https://emprendyup-images.s3.us-east-1.amazonaws.com/${previewImage.url}`
                  }
                  alt={previewImage.alt || 'Preview'}
                  width={800}
                  height={600}
                  className="object-contain w-full h-full rounded-lg"
                />
              </div>

              {/* Image Info */}
              <div className="mt-4 text-center text-sm text-gray-400">
                <p className="font-medium text-white">
                  {previewImage.alt ||
                    `Imagen ${images.findIndex((img) => img.id === previewImage.id) + 1}`}
                </p>
                <p>Orden: {previewImage.order + 1}</p>
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    const currentIndex = images.findIndex((img) => img.id === previewImage.id);
                    if (currentIndex > 0) {
                      const prevImage = images[currentIndex - 1];
                      setPreviewImage(prevImage);
                    }
                  }}
                  disabled={images.findIndex((img) => img.id === previewImage.id) === 0}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => {
                    const currentIndex = images.findIndex((img) => img.id === previewImage.id);
                    removeImage(currentIndex);
                    setPreviewImage(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => {
                    const currentIndex = images.findIndex((img) => img.id === previewImage.id);
                    if (currentIndex < images.length - 1) {
                      const nextImage = images[currentIndex + 1];
                      setPreviewImage(nextImage);
                    }
                  }}
                  disabled={
                    images.findIndex((img) => img.id === previewImage.id) === images.length - 1
                  }
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
