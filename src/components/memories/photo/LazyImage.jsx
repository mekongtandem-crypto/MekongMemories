/**
 * LazyImage.jsx v2.11 - Composant image avec lazy loading
 *
 * ⚡ Optimisation performance:
 * - Intersection Observer pour charger seulement les images visibles
 * - Placeholder shimmer pendant le chargement
 * - Réduction surcharge navigateur quand tous les moments sont ouverts
 */

import React, { useState, useEffect, useRef } from 'react';

export const LazyImage = ({
  src,
  alt = '',
  className = '',
  onClick,
  onContextMenu,
  style = {}
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Intersection Observer pour détecter quand l'image entre dans le viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px', // Charger 100px avant que l'image soit visible
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={style}
    >
      {/* Placeholder shimmer pendant le chargement */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
      )}

      {/* Image chargée seulement si visible */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default LazyImage;
