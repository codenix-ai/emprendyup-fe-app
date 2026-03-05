'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Search, Tag, Loader2, X, Plus } from 'lucide-react';
import { useQuery, gql } from '@apollo/client';
import { ProductCategory } from '../../utils/types/Product';

interface CategorySelectorProps {
  selectedCategories: ProductCategory[];
  onChange: (categories: ProductCategory[]) => void;
}

// GraphQL Query to fetch categories
const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      description
    }
  }
`;

export function CategorySelector({ selectedCategories, onChange }: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleResize = () => {
      if (isOpen) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  // Fetch categories from GraphQL
  const { data, loading, error } = useQuery(GET_CATEGORIES);

  const categories: ProductCategory[] = data?.categories || [];

  const filteredCategories = categories.filter((category: ProductCategory) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCategory = (category: ProductCategory) => {
    // Permitir selección múltiple sin duplicados
    const alreadySelected = selectedCategories.some((c) => c.id === category.id);
    if (alreadySelected) {
      onChange(selectedCategories.filter((c) => c.id !== category.id));
    } else {
      // Agregar solo si no existe (evitar duplicados)
      const newCategories = [...selectedCategories, category].filter(
        (cat, idx, arr) => arr.findIndex((c) => c.id === cat.id) === idx
      );
      onChange(newCategories);
    }

    // Close the dropdown after selection
    setIsOpen(false);

    // Clear search term for next time
    setSearchTerm('');
  };

  const removeCategory = (categoryId: string) => {
    onChange(selectedCategories.filter((c) => c.id !== categoryId));
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300">Categorías</label>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="ml-2 text-sm text-gray-400">Cargando categorías...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300">Categorías</label>
        <div className="text-red-400 text-sm p-4 bg-red-900 border border-red-800 rounded-lg">
          Error al cargar las categorías: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Categorías</label>
        <p className="text-sm text-gray-400">Selecciona una categoría para tu producto</p>
      </div>

      {/* Selected Categories - Improved Design */}
      {selectedCategories.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">
            Categorías seleccionadas ({selectedCategories.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedCategories
              .filter((cat, idx, arr) => arr.findIndex((c) => c.id === cat.id) === idx)
              .map((category, idx) => (
                <div
                  key={category.id + '-' + idx}
                  className="inline-flex items-center px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Tag className="w-3 h-3 mr-2" />
                  <span className="font-medium">{category.name}</span>
                  <button
                    type="button"
                    onClick={() => removeCategory(category.id)}
                    className="ml-2 p-0.5 rounded-full hover:bg-white/20 transition-colors"
                    title="Remover categoría"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Enhanced Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl text-left bg-gray-800 hover:bg-gray-700 hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Plus className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-300 font-medium">
                {selectedCategories.length > 0 ? 'Agregar otra categoría' : 'Seleccionar categoría'}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {isOpen && (
          <div
            className="fixed bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200"
            style={{
              zIndex: 9999,
              top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 8 : 0,
              left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().left : 0,
              width: dropdownRef.current
                ? dropdownRef.current.getBoundingClientRect().width
                : 'auto',
            }}
          >
            {/* Enhanced Search */}
            <div className="p-4 bg-gray-900 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar categorías..."
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Enhanced Categories List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredCategories.length > 0 ? (
                <div className="py-1">
                  {filteredCategories.map((category: ProductCategory, index) => {
                    const isSelected = selectedCategories.some(
                      (selected) => selected.id === category.id
                    );
                    return (
                      <div key={category.id}>
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={`w-full px-4 py-4 text-left hover:bg-blue-900 flex items-center justify-between group transition-all duration-150 ${
                            isSelected ? 'bg-blue-900 border-r-4 border-blue-500' : ''
                          } ${
                            index !== filteredCategories.length - 1
                              ? 'border-b border-gray-700'
                              : ''
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-3 h-3 rounded-full mr-3 transition-all duration-200 shadow-sm ${
                                isSelected
                                  ? 'bg-blue-500 ring-2 ring-blue-300'
                                  : 'bg-gray-600 group-hover:bg-blue-400'
                              }`}
                            />
                            <div>
                              <span
                                className={`font-medium transition-colors duration-150 ${
                                  isSelected
                                    ? 'text-blue-300'
                                    : 'text-gray-300 group-hover:text-blue-400'
                                }`}
                              >
                                {category.name}
                              </span>
                            </div>
                          </div>
                          {isSelected ? (
                            <div className="bg-blue-500 rounded-full p-1.5 shadow-sm">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-gray-600 group-hover:border-blue-500 transition-colors duration-150" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Tag className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-medium">No se encontraron categorías</p>
                  <p className="text-gray-500 text-xs mt-1">Intenta con otro término de búsqueda</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {selectedCategories.length === 0 && (
        <div className="text-center py-6 bg-gray-800 rounded-xl border-2 border-dashed border-gray-600">
          <Tag className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">
            {categories.length === 0
              ? 'No hay categorías disponibles'
              : 'Selecciona al menos una categoría'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Las categorías ayudan a los clientes a encontrar tu producto
          </p>
        </div>
      )}
    </div>
  );
}
