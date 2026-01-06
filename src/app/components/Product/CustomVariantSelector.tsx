'use client';

import { useState } from 'react';
import { Plus, X, Settings, Palette, Ruler } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { SizeSelector } from './SizeSelector';
import { ProductColor, ProductSize } from '@/app/utils/types/Product';

interface CustomVariant {
  id: string;
  type: string;
  name: string;
  value: string;
}

interface CustomVariantSelectorProps {
  variants: CustomVariant[];
  onChange: (variants: CustomVariant[]) => void;
  colors?: ProductColor[];
  onChangeColors?: (colors: ProductColor[]) => void;
  sizes?: ProductSize[];
  onChangeSizes?: (sizes: ProductSize[]) => void;
}

export function CustomVariantSelector({
  variants,
  onChange,
  colors = [],
  onChangeColors,
  sizes = [],
  onChangeSizes,
}: CustomVariantSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newVariant, setNewVariant] = useState({
    type: '',
    name: '',
    value: '',
  });

  const handleAddVariant = () => {
    if (!newVariant.type.trim() || !newVariant.name.trim()) return;

    // Prevent duplicate custom variants by type+name (case-insensitive)
    const isDuplicate = variants.some(
      (v) =>
        v.type.trim().toLowerCase() === newVariant.type.trim().toLowerCase() &&
        v.name.trim().toLowerCase() === newVariant.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      alert('Esta variante personalizada ya existe.');
      return;
    }

    const variant: CustomVariant = {
      id: `custom-${Date.now()}-${Math.random()}`,
      type: newVariant.type.trim(),
      name: newVariant.name.trim(),
      value: newVariant.value.trim() || newVariant.name.trim(),
    };

    onChange([...variants, variant]);
    setNewVariant({ type: '', name: '', value: '' });
    setIsAdding(false);
  };

  const handleRemoveVariant = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
  };

  const handleUpdateVariant = (
    id: string,
    field: keyof Omit<CustomVariant, 'id'>,
    value: string
  ) => {
    onChange(variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-md font-medium text-gray-300 mb-4 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Variantes Personalizadas
        </h5>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center text-sm text-blue-400 hover:text-blue-300"
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar Variante
        </button>
      </div>

      {/* Existing variants grouped by type */}
      <div className="space-y-3">
        {(() => {
          if (!variants || variants.length === 0) return null;
          const groups: Record<string, { typeLabel: string; items: CustomVariant[] }> = {};
          variants.forEach((v) => {
            const key = (v.type || 'Otros').trim().toLowerCase() || 'otros';
            if (!groups[key]) groups[key] = { typeLabel: v.type || key, items: [] };
            groups[key].items.push(v);
          });

          return Object.keys(groups).map((k) => {
            const group = groups[k];
            const title =
              group.typeLabel && group.typeLabel.trim()
                ? group.typeLabel.charAt(0).toUpperCase() + group.typeLabel.slice(1)
                : k.charAt(0).toUpperCase() + k.slice(1);

            return (
              <div key={k} className="space-y-2">
                <h6 className="text-sm font-semibold text-gray-200">{title}</h6>
                <div className="space-y-2">
                  {group.items.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center space-x-3 p-3 border border-gray-700 rounded-lg bg-gray-800"
                    >
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={variant.type}
                          onChange={(e) => handleUpdateVariant(variant.id, 'type', e.target.value)}
                          placeholder="Tipo (ej: Material)"
                          className="px-2 py-1 border border-gray-600 bg-gray-800 text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                        />
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => handleUpdateVariant(variant.id, 'name', e.target.value)}
                          placeholder="Nombre (ej: Algodón)"
                          className="px-2 py-1 border border-gray-600 bg-gray-800 text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                        />
                        <input
                          type="text"
                          value={variant.value}
                          onChange={(e) => handleUpdateVariant(variant.id, 'value', e.target.value)}
                          placeholder="Valor (opcional)"
                          className="px-2 py-1 border border-gray-600 bg-gray-800 text-white rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(variant.id)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          });
        })()}
        {onChangeColors && colors && colors.length > 0 && (
          <div>
            <ColorPicker colors={colors} onChange={onChangeColors} />
          </div>
        )}
        {onChangeSizes && sizes && sizes.length > 0 && (
          <div>
            <SizeSelector sizes={sizes} onChange={onChangeSizes} />
          </div>
        )}
      </div>

      {/* Add new variant form */}
      {isAdding && (
        <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tipo de Variante *
                </label>
                <input
                  type="text"
                  value={newVariant.type}
                  onChange={(e) => setNewVariant((prev) => ({ ...prev, type: e.target.value }))}
                  placeholder="ej: Material, Acabado, Estilo"
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newVariant.name}
                  onChange={(e) => setNewVariant((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="ej: Algodón, Mate, Clásico"
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Valor (opcional)
              </label>
              <input
                type="text"
                value={newVariant.value}
                onChange={(e) => setNewVariant((prev) => ({ ...prev, value: e.target.value }))}
                placeholder="Valor adicional o descripción"
                className="w-full px-3 py-2 border border-gray-600 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewVariant({ type: '', name: '', value: '' });
                }}
                className="px-3 py-2 border border-gray-600 rounded-md text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddVariant}
                disabled={!newVariant.type.trim() || !newVariant.name.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {variants.length === 0 && !isAdding && (
        <div className="text-center py-8 text-gray-400">
          <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay variantes personalizadas</p>
          <p className="text-xs text-gray-500 mt-1">
            Agrega variantes como material, acabado, estilo, etc.
          </p>
        </div>
      )}

      {variants.length > 0 && (
        <div className="mt-4 p-3 bg-blue-900 border border-blue-800 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 <strong>Tip:</strong> Las variantes personalizadas te permiten añadir características
            únicas de tu producto como material, acabado, estilo, marca, etc.
          </p>
        </div>
      )}
    </div>
  );
}
