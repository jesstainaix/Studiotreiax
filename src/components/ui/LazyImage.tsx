import React, { useState, useEffect } from 'react';
import useLazyLoading from '@/hooks/useLazyLoading';
import { cn } from '@/lib/utils';
import { cacheUtils } from '@/utils/assetCache';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  placeholder,
  priority = false,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const [cachedSrc, setCachedSrc] = useState<string | undefined>(undefined);
  
  const { isVisible, elementRef } = useLazyLoading({
    threshold: 0.1,
    rootMargin: '50px'
  });

  useEffect(() => {
    if ((isVisible || priority) && src && !cachedSrc) {
      // Try to get cached version first
      cacheUtils.getCachedAsset(src, 'image')
        .then(cachedUrl => {
          setCachedSrc(cachedUrl);
          setImageSrc(cachedUrl);
        })
        .catch(() => {
          // Fallback to original src if cache fails
          setImageSrc(src);
        });
    }
  }, [isVisible, priority, src, cachedSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    // Try fallback to original src if cached version fails
    if (cachedSrc && cachedSrc !== src) {
      setImageSrc(src);
      setCachedSrc(undefined);
    } else {
      onError?.();
    }
  };

  return (
    <div ref={elementRef} className={cn('relative overflow-hidden', className)}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt="" className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="text-gray-400 text-sm">Carregando...</div>
          )}
        </div>
      )}

      {/* Main Image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          {...props}
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm">Erro ao carregar</div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {imageSrc && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;