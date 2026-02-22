import { useEffect, useState, useRef } from 'react';

export default function ImageSlider({ manifestPath = '/impactweekimages/manifest.json', interval = 4000 }) {
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetch(manifestPath)
      .then(res => {
        if (!res.ok) throw new Error('No manifest');
        return res.json();
      })
      .then(list => {
        if (mounted && Array.isArray(list)) setImages(list.map(i => `/impactweekimages/${i}`));
      })
      .catch(() => {
        // No manifest available — leave images empty and caller will show fallback
      });

    return () => { mounted = false; };
  }, [manifestPath]);

  useEffect(() => {
    if (!images.length) return;
    timer.current = setInterval(() => setIndex(i => (i + 1) % images.length), interval);
    return () => clearInterval(timer.current);
  }, [images, interval]);

  if (!images.length) {
    return (
      <div className="w-full h-64 sm:h-80 md:h-[420px] lg:h-[520px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
        <div className="text-center px-6">
          <p className="text-lg font-semibold">No slider images found.</p>
          <p className="text-sm text-gray-500">Place a file named <span className="font-mono">manifest.json</span> inside <span className="font-mono">public/impactweekimages</span> listing your image filenames in order.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden">
      <div className="w-full h-64 sm:h-80 md:h-[420px] lg:h-[520px] bg-gray-900/5">
        <img src={images[index]} alt={`Slide ${index + 1}`} className="w-full h-full object-cover object-center transition-opacity duration-700" />
      </div>

      {/* Dot controls: compact on mobile, larger on md+ */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-4 flex gap-2 px-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`rounded-full transition-all duration-200 ${i === index ? 'bg-white/90' : 'bg-white/40'}`}
            style={{ width: i === index ? 28 : 16, height: 6 }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
