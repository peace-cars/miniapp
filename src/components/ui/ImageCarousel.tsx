import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProgressiveImage } from './ProgressiveImage';

interface ImageCarouselProps {
  images: string[];
}

/* ── Full-screen lightbox ─────────────────────────────────────────── */
function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => Math.min(images.length - 1, i + 1)); };

  return (
    <div
      className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        onClick={onClose}
      >
        <X size={20} />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm font-bold px-3 py-1 rounded-full z-10">
          {idx + 1} / {images.length}
        </div>
      )}

      {/* Image */}
      <div className="relative w-full h-full flex items-center justify-center px-16" onClick={e => e.stopPropagation()}>
        <div style={{ maxHeight: 'calc(100vh - 80px)', maxWidth: '100%' }}>
          <ProgressiveImage
            src={images[idx]}
            alt=""
            className="rounded-lg object-contain"
          />
        </div>
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors ${idx === 0 ? 'opacity-30 pointer-events-none' : ''}`}
            onClick={prev}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors ${idx === images.length - 1 ? 'opacity-30 pointer-events-none' : ''}`}
            onClick={next}
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </div>
  );
}

/* ── Facebook-style compact image grid ───────────────────────────── */
export function ImageCarousel({ images }: ImageCarouselProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const open = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setLightboxIndex(idx);
  };

  const cellClass = 'overflow-hidden cursor-pointer bg-black';
  const imgClass = 'w-full h-full object-cover hover:opacity-90 transition-opacity duration-150';

  let grid: React.ReactNode;

  if (images.length === 1) {
    /* Single image — 4:3 landscape, compact */
    grid = (
      <div
        className={`${cellClass} aspect-[4/3] w-full rounded-xl`}
        onClick={e => open(e, 0)}
      >
        <ProgressiveImage src={images[0]} alt="" className={imgClass} />
      </div>
    );
  } else if (images.length === 2) {
    /* Two images — side-by-side squares */
    grid = (
      <div className="grid grid-cols-2 gap-[2px] rounded-xl overflow-hidden" style={{ aspectRatio: '2/1' }}>
        {images.map((img, i) => (
          <div key={i} className={cellClass} onClick={e => open(e, i)}>
            <ProgressiveImage src={img} alt="" className={imgClass} />
          </div>
        ))}
      </div>
    );
  } else if (images.length === 3) {
    /* Three images — 1 big left, 2 stacked right */
    grid = (
      <div className="grid grid-cols-2 gap-[2px] rounded-xl overflow-hidden" style={{ height: '260px' }}>
        <div className={`${cellClass} row-span-2`} onClick={e => open(e, 0)}>
          <ProgressiveImage src={images[0]} alt="" className={imgClass} />
        </div>
        {images.slice(1, 3).map((img, i) => (
          <div key={i} className={cellClass} onClick={e => open(e, i + 1)}>
            <ProgressiveImage src={img} alt="" className={imgClass} />
          </div>
        ))}
      </div>
    );
  } else {
    /* 4+ images — 2×2 grid with "+N more" overlay on last cell */
    const remaining = images.length - 4;
    grid = (
      <div className="grid grid-cols-2 gap-[2px] rounded-xl overflow-hidden" style={{ height: '260px' }}>
        {images.slice(0, 4).map((img, i) => (
          <div
            key={i}
            className={`${cellClass} relative`}
            onClick={e => open(e, i)}
          >
            <ProgressiveImage src={img} alt="" className={imgClass} />
            {i === 3 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center pointer-events-none">
                <span className="text-white text-2xl font-black">+{remaining + 1}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="px-4 pb-3 mt-1">
        {grid}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
