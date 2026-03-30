'use client';

// ─── EditorCanvas ──────────────────────────────────────────────────────────────
// Área de trabajo central del editor.
// Usa <Frame> de Craft.js para el canvas drag & drop.
//
// Cuando `initialJSON` es undefined (página nueva), Frame renderiza sus hijos
// como estado inicial.
// Cuando `initialJSON` tiene datos, Frame los deserializa y los muestra.
//
// `onStateChange` se llama (debounced) después de cualquier mutación del canvas:
// drag & drop, edición de propiedades, undo/redo, etc.
//
// ⚠️  La suscripción a `nodes` vive en <CanvasChangeWatcher> (fuera de <Frame>)
//     para que los re-renders de seguimiento nunca afecten al árbol de Frame.

import { useEffect, useRef } from 'react';
import { Frame, Element, useEditor } from '@craftjs/core';

const AUTOSAVE_DEBOUNCE_MS = 600;

// ─── CanvasChangeWatcher ───────────────────────────────────────────────────────
// Componente headless (return null) que suscribe a `nodes` de Craft.js.
// Al vivir FUERA de <Frame>, sus re-renders no provocan que Frame
// reinicialice ni descarte bloques recién añadidos por drag & drop.

interface CanvasChangeWatcherProps {
  onStateChange: (serialized: string) => void;
}

function CanvasChangeWatcher({ onStateChange }: CanvasChangeWatcherProps) {
  const { query, nodes } = useEditor((state) => ({ nodes: state.nodes }));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSerializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const serialized = query.serialize();
      if (serialized !== prevSerializedRef.current) {
        prevSerializedRef.current = serialized;
        onStateChange(serialized);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nodes, query, onStateChange]);

  return null;
}

// ─── EditorCanvas ─────────────────────────────────────────────────────────────

interface EditorCanvasProps {
  initialJSON?: string;
  isMobile?: boolean;
  /** Called with the serialized Craft.js JSON after every canvas change. */
  onStateChange?: (serialized: string) => void;
}

export function EditorCanvas({ initialJSON, isMobile = false, onStateChange }: EditorCanvasProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 flex justify-center py-8 px-4">
      <div
        className="bg-white shadow-2xl transition-all duration-300 rounded-sm overflow-y-auto"
        style={{
          width: isMobile ? '375px' : '100%',
          minHeight: '600px',
          maxHeight: 'calc(100vh - 112px)',
        }}
      >
        {isMobile && (
          <div className="bg-gray-800 text-gray-400 text-[10px] text-center py-1 tracking-widest">
            MÓVIL — 375px
          </div>
        )}
        {/*
          Watcher is a sibling of Frame — subscribes to node changes without
          causing Frame to re-render or re-initialize.
        */}
        {onStateChange && <CanvasChangeWatcher onStateChange={onStateChange} />}
        {/*
          Frame children are the initial canvas state ONLY when `data` is undefined
          (new page). When `data` is provided Craft.js deserializes it and ignores children.
        */}
        <Frame data={initialJSON}>
          <Element canvas is="div" id="ROOT" className="w-full min-h-[600px]" />
        </Frame>
      </div>
    </div>
  );
}
