'use client';
import { useNode } from '@craftjs/core';
import type { GallerySectionProps, GalleryVariant } from './GallerySection.props';

const VARIANTS: Array<{ value: GalleryVariant; label: string }> = [
  { value: 'grid', label: 'Grilla uniforme' },
  { value: 'masonry', label: 'Masonry' },
  { value: 'slider', label: 'Slider' },
];

export function GallerySectionSettings() {
  const {
    props,
    actions: { setProp },
  } = useNode<{ props: GallerySectionProps }>((node) => ({
    props: node.data.props as GallerySectionProps,
  }));
  return (
    <div className="flex flex-col gap-4 p-3 text-sm text-white">
      <h3 className="font-semibold text-xs uppercase tracking-widest text-gray-400">Galería</h3>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Variante</span>
        <select
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.variant}
          onChange={(e) =>
            setProp((p: GallerySectionProps) => {
              p.variant = e.target.value as GalleryVariant;
            })
          }
        >
          {VARIANTS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Título</span>
        <input
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.title}
          onChange={(e) =>
            setProp((p: GallerySectionProps) => {
              p.title = e.target.value;
            })
          }
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-gray-300">Columnas</span>
        <select
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
          value={props.columns}
          onChange={(e) =>
            setProp((p: GallerySectionProps) => {
              p.columns = parseInt(e.target.value) as 2 | 3 | 4;
            })
          }
        >
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </label>
      <div className="flex flex-col gap-2">
        <span className="text-gray-400 text-xs">Imágenes</span>
        {props.images.map((img, i) => (
          <input
            key={i}
            placeholder={`URL imagen ${i + 1}`}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
            value={img.url}
            onChange={(e) =>
              setProp((p: GallerySectionProps) => {
                p.images[i].url = e.target.value;
              })
            }
          />
        ))}
        <button
          className="text-xs text-indigo-400 hover:text-indigo-300 text-left"
          onClick={() =>
            setProp((p: GallerySectionProps) => {
              p.images.push({ url: '', alt: `Imagen ${p.images.length + 1}` });
            })
          }
        >
          + Agregar imagen
        </button>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={props.visible}
          onChange={(e) =>
            setProp((p: GallerySectionProps) => {
              p.visible = e.target.checked;
            })
          }
        />
        <span className="text-gray-300">Visible</span>
      </label>
    </div>
  );
}
