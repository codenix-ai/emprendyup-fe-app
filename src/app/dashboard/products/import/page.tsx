'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Eye, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ImportResult {
  success: boolean;
  totalImported: number;
  totalErrors: number;
  errors?: Array<{
    row: number;
    message: string;
  }>;
  message?: string;
}

interface CSVPreview {
  headers: string[];
  rows: string[][];
}

export default function ImportProductsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userData =
    typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  // Estados
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Constantes
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const ALLOWED_TYPES = ['.csv', 'text/csv', 'application/vnd.ms-excel'];

  // Función para agregar logs
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  // Validar archivo
  const validateFile = (file: File): string | null => {
    // Validar tipo
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (fileExtension !== 'csv' && !ALLOWED_TYPES.includes(file.type)) {
      return 'El archivo debe ser formato CSV';
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Validar que no esté vacío
    if (file.size === 0) {
      return 'El archivo está vacío';
    }

    return null;
  };

  // Leer y previsualizar CSV
  const previewCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim() !== '');

      if (lines.length === 0) {
        addLog('⚠️ El archivo CSV está vacío');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const rows = lines
        .slice(1, 11) // Primeras 10 filas
        .map((line) => line.split(',').map((cell) => cell.trim()));

      setCsvPreview({ headers, rows });
      setShowPreview(true);
      addLog(
        `✅ Vista previa cargada: ${headers.length} columnas, ${lines.length - 1} filas totales`
      );
    };

    reader.onerror = () => {
      addLog('❌ Error al leer el archivo para vista previa');
      toast.error('Error al leer el archivo');
    };

    reader.readAsText(file);
  };

  // Manejar selección de archivo
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addLog(`📄 Archivo seleccionado: ${file.name}`);

    const validationError = validateFile(file);
    if (validationError) {
      addLog(`❌ ${validationError}`);
      toast.error(validationError);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    setLogs([]);
    addLog(`✅ Archivo válido: ${(file.size / 1024).toFixed(2)} KB`);

    // Generar vista previa automáticamente
    previewCSV(file);
  };

  // Importar productos
  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo CSV');
      return;
    }

    setShowConfirmDialog(false);
    setIsUploading(true);
    setUploadProgress(0);
    setImportResult(null);

    addLog('🚀 Iniciando importación de productos...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      // Backend expects storeId and filePath in the body
      const storeId = userData?.storeId || '';
      if (!storeId) {
        throw new Error('No se encontró storeId en localStorage. Por favor inicia sesión.');
      }
      formData.append('storeId', storeId);
      formData.append('filePath', selectedFile.name);

      // Simular progreso (en producción, usar XMLHttpRequest para progreso real)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/import`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
      }

      const result: ImportResult = await response.json();

      setImportResult(result);

      if (result.success) {
        addLog(`✅ Importación completada exitosamente`);
        addLog(`📦 Productos importados: ${result.totalImported}`);
        if (result.totalErrors > 0) {
          addLog(`⚠️ Errores encontrados: ${result.totalErrors}`);
        }
        toast.success(`¡${result.totalImported} productos importados exitosamente!`);
      } else {
        addLog(`❌ Error en la importación: ${result.message || 'Error desconocido'}`);
        toast.error(result.message || 'Error al importar productos');
      }

      // Mostrar errores específicos por fila
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((error) => {
          addLog(`❌ Fila ${error.row}: ${error.message}`);
        });
      }
    } catch (error) {
      console.error('Error importing products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al importar productos';
      addLog(`❌ ${errorMessage}`);
      toast.error(errorMessage);
      setImportResult({
        success: false,
        totalImported: 0,
        totalErrors: 1,
        message: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Limpiar y resetear
  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    setLogs([]);
    setCsvPreview(null);
    setShowPreview(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    addLog('🔄 Formulario reiniciado');
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/products')}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-900 dark:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a productos
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Importar Productos desde CSV
          </h1>
          <p className="text-gray-400">
            Importa productos en masa desde un archivo CSV exportado de Tienda Nube
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel principal - Uploader */}
          <div className="lg:col-span-2 space-y-6">
            {/* Zona de carga de archivo */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Seleccionar archivo CSV
              </h2>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  selectedFile
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 hover:border-blue-500 hover:bg-gray-50 dark:bg-gray-900'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                  disabled={isUploading}
                />

                {!selectedFile ? (
                  <label htmlFor="csv-upload" className="cursor-pointer block">
                    <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-900 dark:text-white font-medium mb-2">
                      Haz clic o arrastra un archivo CSV aquí
                    </p>
                    <p className="text-sm text-gray-400 mb-4">Tamaño máximo: 20MB</p>
                    <div className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Seleccionar archivo
                    </div>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <FileText className="w-16 h-16 text-green-500 mx-auto" />
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium mb-1">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-4">
                      <label
                        htmlFor="csv-upload"
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                      >
                        Cambiar archivo
                      </label>

                      <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Limpiar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botón de importación */}
            {selectedFile && !isUploading && (
              <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      ¿Listo para importar?
                    </h3>
                    <p className="text-sm text-gray-300">
                      Se procesará el archivo y se crearán los productos en tu tienda
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConfirmDialog(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:shadow-lg flex items-center font-medium"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Importar Productos
                  </button>
                </div>
              </div>
            )}

            {/* Barra de progreso */}
            {isUploading && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Importando productos...
                </h3>
                <div className="space-y-3">
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      {uploadProgress}%
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 text-center">
                    Por favor espera mientras procesamos tu archivo...
                  </p>
                </div>
              </div>
            )}

            {/* Resultado de la importación */}
            {importResult && !isUploading && (
              <div
                className={`border rounded-xl p-6 ${
                  importResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-700'
                    : 'bg-red-900/20 border-red-700'
                }`}
              >
                <div className="flex items-start">
                  {importResult.success ? (
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-semibold mb-2 ${
                        importResult.success ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {importResult.success ? '¡Importación Exitosa!' : 'Error en la Importación'}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-300">
                        <strong>Productos importados:</strong> {importResult.totalImported}
                      </p>
                      {importResult.totalErrors > 0 && (
                        <p className="text-yellow-400">
                          <strong>Errores encontrados:</strong> {importResult.totalErrors}
                        </p>
                      )}
                      {importResult.message && (
                        <p className="text-gray-300 mt-2">{importResult.message}</p>
                      )}
                    </div>

                    {/* Errores por fila */}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-4 p-3 bg-white dark:bg-gray-800/50 rounded-lg max-h-48 overflow-y-auto">
                        <p className="text-sm font-medium text-gray-300 mb-2">
                          Detalles de errores:
                        </p>
                        <ul className="space-y-1 text-xs text-gray-400">
                          {importResult.errors.map((error, idx) => (
                            <li key={idx}>
                              <strong className="text-red-400">Fila {error.row}:</strong>{' '}
                              {error.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => router.push('/dashboard/products')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Ver Productos
                      </button>
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Nueva Importación
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel lateral - Instrucciones y Logs */}
          <div className="space-y-6">
            {/* Logs */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-400" />
                Registro de Actividad
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-gray-500 italic">No hay actividad aún...</p>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, idx) => (
                      <p key={idx} className="text-gray-300">
                        {log}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-yellow-500" />
              Confirmar Importación
            </h3>
            <p className="text-gray-300 mb-6">
              ¿Estás seguro de que deseas importar los productos desde el archivo{' '}
              <strong className="text-gray-900 dark:text-white">{selectedFile?.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleImport}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sí, Importar
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
