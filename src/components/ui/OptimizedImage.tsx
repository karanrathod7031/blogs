import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  onLoaded?: () => void;
}

export default function OptimizedImage({ 
  src, 
  alt, 
  className = "", 
  aspectRatio = "aspect-video",
  onLoaded 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${aspectRatio} ${className} bg-slate-900`}>
      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center z-10"
          >
            <div className="w-10 h-10 border-4 border-slate-700 border-t-accent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500 p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-2">
             <span className="text-xl font-bold">!</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Image Unavailable</p>
        </div>
      ) : (
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => {
            setIsLoaded(true);
            onLoaded?.();
          }}
          onError={() => {
            setError(true);
          }}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0,
            scale: isLoaded ? 1 : 1.05
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
