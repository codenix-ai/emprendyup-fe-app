'use client';

import { useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export default function AdressAutocomplete({
  onPlaceSelected,
  value,
}: {
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
  value?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está configurada');
      return;
    }

    let isMounted = true;
    let autocomplete: google.maps.places.Autocomplete | null = null;

    (async () => {
      try {
        // import the places library (ensure loader config)
        setOptions({ key: apiKey });
        const places = await importLibrary('places');

        if (!isMounted || !inputRef.current) return;

        if (!places || typeof (places as any).Autocomplete !== 'function') {
          console.error('Google Maps Places library no está disponible');
          return;
        }

        autocomplete = new (places as any).Autocomplete(inputRef.current, {
          fields: ['place_id', 'formatted_address', 'geometry', 'address_components'],
          componentRestrictions: { country: 'co' },
          types: ['address'],
        });

        const listener = autocomplete?.addListener('place_changed', () => {
          const place = autocomplete!.getPlace();
          onPlaceSelected?.(place);
        });

        // store listener removal in cleanup via closure
        (inputRef.current as any).__gm_listener = listener;
      } catch (err) {
        console.error('Google Maps load error:', err);
      }
    })();

    return () => {
      isMounted = false;
      try {
        if (inputRef.current && (inputRef.current as any).__gm_listener) {
          const l = (inputRef.current as any).__gm_listener;
          if (l && typeof l.remove === 'function') l.remove();
        }
        if (autocomplete) {
          if (window.google && window.google.maps && window.google.maps.event) {
            window.google.maps.event.clearInstanceListeners(autocomplete);
          }
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, [onPlaceSelected]);

  useEffect(() => {
    if (inputRef.current && typeof value === 'string') {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value}
      placeholder="Escribe tu dirección"
      className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );
}
