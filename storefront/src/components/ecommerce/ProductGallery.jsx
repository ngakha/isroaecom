import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { clsx } from 'clsx';

export default function ProductGallery({ images = [], activeImageIndex }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeImageIndex != null && activeImageIndex >= 0 && activeImageIndex < images.length) {
      setActiveIndex(activeImageIndex);
    }
  }, [activeImageIndex, images.length]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images.length) {
    return (
      <div className="aspect-square bg-surface rounded-lg flex items-center justify-center text-muted">
        No images
      </div>
    );
  }

  const activeImage = images[activeIndex];

  const prev = () => setActiveIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setActiveIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square bg-surface rounded-lg overflow-hidden group cursor-zoom-in"
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={activeImage.url}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
          <span className="bg-white/90 p-2 rounded-full shadow-sm">
            <ZoomIn size={20} />
          </span>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={clsx(
                'flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors',
                i === activeIndex ? 'border-primary-900' : 'border-transparent hover:border-primary-300'
              )}
            >
              <img
                src={img.thumbnail_url || img.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setLightboxOpen(false)}
          >
            <X size={24} />
          </button>
          <img
            src={activeImage.url}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
