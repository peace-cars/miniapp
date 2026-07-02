import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProgressiveImage } from './ProgressiveImage';
import type { Vehicle } from '../../shared/types';
import { useTranslation } from 'react-i18next';

interface VehicleGalleryProps {
  car: Vehicle;
  images: string[];
}

export const VehicleGallery: React.FC<VehicleGalleryProps> = ({ car, images }) => {
  const { t } = useTranslation();
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const galleryRef = useRef<HTMLDivElement>(null);

  const nextImage = () => {
    setZoomScale(1);
    setActiveImage((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = () => {
    setZoomScale(1);
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  };

  React.useEffect(() => {
    if (isLightboxOpen) {
      // Push a fake state so the mobile hardware back button can be intercepted
      window.history.pushState({ lightbox: true }, '');
      const handlePopState = () => {
        setIsLightboxOpen(false);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        // If the component unmounts while lightbox is open, we need to clean up
        if (window.history.state?.lightbox) {
          window.history.back();
        }
      };
    }
  }, [isLightboxOpen]);

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    if (window.history.state?.lightbox) {
      window.history.back();
    }
  };

  return (
    <>
      <section className="max-w-[1400px] mx-auto px-6 pb-12 md:pb-24">
        {/* Mobile Swipe Snapping Gallery */}
        <div className="md:hidden relative w-full overflow-hidden">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar w-full pb-4 px-1">
            {images.map((img: string, i: number) => (
              <div 
                key={i} 
                onClick={() => {
                  setActiveImage(i);
                  setIsLightboxOpen(true);
                }}
                className="shrink-0 w-[88%] snap-center aspect-[16/10] rounded-xl overflow-hidden border border-border bg-bg-secondary cursor-zoom-in"
              >
                <ProgressiveImage src={img} alt={t('details.gallery.slide', 'Slide {{current}}', { current: i + 1 })} className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {images.map((_: any, i: number) => (
              <button 
                key={i} 
                onClick={() => setActiveImage(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === activeImage ? 'bg-accent w-4' : 'bg-border'}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Gallery */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="hidden md:block relative"
        >
          {/* Main Image */}
          <div className="relative rounded-xl overflow-hidden bg-bg-secondary aspect-[16/9] md:aspect-[21/9] group cursor-zoom-in" onClick={() => setIsLightboxOpen(true)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full absolute inset-0"
              >
                <ProgressiveImage
                  src={images[activeImage]}
                  alt={t('details.gallery.main_image', '{{model}} - Image {{current}}', { model: car.model, current: activeImage + 1 })}
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </AnimatePresence>
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-bg/90 backdrop-blur-sm rounded-full flex items-center justify-center text-text-primary opacity-0 group-hover:opacity-100 transition-all hover:bg-bg shadow-lg active:scale-90"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-bg/90 backdrop-blur-sm rounded-full flex items-center justify-center text-text-primary opacity-0 group-hover:opacity-100 transition-all hover:bg-bg shadow-lg active:scale-90"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-bg/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold text-text-secondary shadow-sm">
                {activeImage + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div ref={galleryRef} className="flex gap-3 mt-4 overflow-x-auto no-scrollbar px-1 py-1">
              {images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 w-20 h-14 md:w-28 md:h-20 rounded-xl overflow-hidden transition-all ${
                    i === activeImage 
                      ? 'ring-2 ring-text-primary ring-offset-2 opacity-100' 
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt={t('details.gallery.thumb', 'Thumb {{current}}', { current: i + 1 })} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            {/* Top Toolbar */}
            <div className="flex justify-between items-center px-4 md:px-6 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] text-white border-b border-white/10 shrink-0">
              <span className="font-medium tracking-wide">
                {t('details.gallery.counter', '{{current}} of {{total}}', { current: activeImage + 1, total: images.length })}
              </span>
              <button 
                onClick={handleCloseLightbox}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all active:scale-90"
              >
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            {/* Pinch Zoom / Gestured Content Frame */}
            <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden select-none">
              
              {/* Zoom Indicator and Scale controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-2.5 rounded-full z-20 text-white border border-white/10">
                <button 
                  onClick={() => setZoomScale(prev => Math.max(1, prev - 0.5))} 
                  className="text-lg font-bold w-6 h-6 flex items-center justify-center"
                >
                  -
                </button>
                <span className="text-xs font-semibold tracking-widest">{zoomScale.toFixed(1)}x</span>
                <button 
                  onClick={() => setZoomScale(prev => Math.min(3, prev + 0.5))} 
                  className="text-lg font-bold w-6 h-6 flex items-center justify-center"
                >
                  +
                </button>
              </div>

              {/* Pan-draggable motion container */}
              <motion.div
                drag={zoomScale > 1}
                dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
                dragElastic={0.15}
                animate={{ scale: zoomScale }}
                style={{ originX: 0.5, originY: 0.5 }}
                className="w-full max-h-[75vh] flex items-center justify-center px-4 cursor-grab active:cursor-grabbing"
              >
                <ProgressiveImage 
                  src={images[activeImage]} 
                  alt="" 
                  className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-2xl" 
                />
              </motion.div>

              {/* Navigation swipe buttons inside Lightroom */}
              {images.length > 1 && zoomScale === 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all border border-white/10"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all border border-white/10"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Overlay Strip */}
            <div className="shrink-0 bg-black/60 backdrop-blur-sm pt-4 pb-2 overflow-x-auto no-scrollbar flex justify-center gap-3 border-t border-white/5">
              {images.map((img: string, i: number) => (
                <button 
                  key={i} 
                  onClick={() => { setActiveImage(i); setZoomScale(1); }}
                  style={{ padding: i === activeImage ? '2px' : '0' }}
                  className={`shrink-0 w-16 h-10 rounded-lg overflow-hidden border transition-all ${
                    i === activeImage 
                      ? 'border-white opacity-100 scale-105 shadow-lg' 
                      : 'border-transparent opacity-40 hover:opacity-75'
                  }`}
                >
                  <ProgressiveImage src={img} alt="" className="w-full h-full rounded-lg" />
                </button>
              ))}
            </div>

            {/* Large finger-accessible close button — bottom center, above safe area */}
            <button
              onClick={handleCloseLightbox}
              className="shrink-0 flex items-center justify-center gap-2 mx-auto mb-[calc(env(safe-area-inset-bottom)+12px)] mt-2 px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white text-sm font-semibold border border-white/20 backdrop-blur-sm w-fit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              {t('details.gallery.close', 'Close Gallery')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
