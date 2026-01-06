'use client';
import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

export default function FileUpload({
  onFile,
  accept = 'image/*',
  storeId,
  initialImage,
}: {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onFile: (_arg: string) => void;
  accept?: string;
  storeId?: string;
  initialImage?: string;
}) {
  const [preview, setPreview] = useState<string | null>(initialImage || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const fileUrl = URL.createObjectURL(file);
      const response = await fetch(fileUrl);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('images', blob, file.name);
      // Add the business name as folder parameter (directly in uploads folder)
      if (storeId) {
        formData.append('folderName', storeId.replace(/[^a-zA-Z0-9-_]/g, '_'));
      }
      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/images`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadResult = await uploadResponse.json();
      const awsImage = process.env.NEXT_PUBLIC_AWS_BUCKET_URL + uploadResult[0]?.key;
      setPreview(awsImage);
      onFile(awsImage);
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-2">
      {!preview ? (
        <label className="block border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors">
          <input type="file" accept={accept} onChange={handleFileChange} className="hidden" />
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          ) : (
            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          )}
          <p className="text-sm text-gray-600">
            {isUploading ? 'Subiendo...' : 'Haz clic para subir archivo'}
          </p>
        </label>
      ) : (
        <div className="relative inline-block">
          <Image
            src={preview}
            alt="Preview"
            width={80}
            height={80}
            className="w-20 h-20 object-cover rounded-lg"
            unoptimized
          />
          <button
            onClick={() => {
              setPreview(null);
              onFile('');
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
