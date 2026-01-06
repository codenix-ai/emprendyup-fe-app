'use client';

import { useState } from 'react';
import { Plus, X, Palette } from 'lucide-react';
import { ProductColor } from '@/app/utils/types/Product';

interface ColorPickerProps {
  colors: ProductColor[];
  onChange: (colors: ProductColor[]) => void;
}

export function ColorPicker({ colors, onChange }: ColorPickerProps) {
  const [newColor, setNewColor] = useState({ name: '', hex: '#000000' });
  const [showForm, setShowForm] = useState(false);

  const addColor = () => {
    if (!newColor.name.trim()) return;

    // Prevent duplicate color names (case-insensitive)
    const exists = colors.some(
      (c) => c.name.trim().toLowerCase() === newColor.name.trim().toLowerCase()
    );
    if (exists) {
      alert('Este color ya existe.');
      return;
    }

    const color: ProductColor = {
      id: `color-${Date.now()}`,
      name: newColor.name,
      hex: newColor.hex,
    };

    onChange([...colors, color]);
    setNewColor({ name: '', hex: '#000000' });
    setShowForm(false);
  };

  const removeColor = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  const updateColor = (index: number, field: 'name' | 'hex', value: string) => {
    const updatedColors = colors.map((color, i) =>
      i === index ? { ...color, [field]: value } : color
    );
    onChange(updatedColors);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-semibold text-gray-200">Colores</h5>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center text-sm text-blue-400 hover:text-blue-300"
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar Color
        </button>
      </div>

      {/* Add Color Form */}
      {showForm && (
        <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Nombre del Color
              </label>
              <input
                type="text"
                value={newColor.name}
                onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ej: Rojo Ferrari"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={newColor.hex}
                  onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                  className="w-10 h-10 border border-gray-600 rounded cursor-pointer bg-gray-800"
                />
                <input
                  type="text"
                  value={newColor.hex}
                  onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                  className="w-20 px-2 py-2 text-xs bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={addColor}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Agregar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-500 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Colors List */}
      {colors.length > 0 && (
        <div className="space-y-2">
          {colors.map((color, index) => (
            <div
              key={color.id}
              className="flex items-center space-x-3 p-3 border border-gray-700 rounded-lg bg-gray-800"
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-500 flex-shrink-0"
                style={{ backgroundColor: color.hex }}
              />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={color.name}
                  onChange={(e) => updateColor(index, 'name', e.target.value)}
                  className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500"
                  placeholder="Nombre del color"
                />
                <input
                  type="text"
                  value={color.hex}
                  onChange={(e) => updateColor(index, 'hex', e.target.value)}
                  className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500"
                  placeholder="#000000"
                />
              </div>
              <button
                type="button"
                onClick={() => removeColor(index)}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {colors.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-400">
          <Palette className="w-8 h-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm">No hay colores configurados</p>
          <p className="text-xs">Haz clic en Agregar Color para empezar</p>
        </div>
      )}
    </div>
  );
}
