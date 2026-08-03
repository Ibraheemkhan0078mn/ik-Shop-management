import { useState } from "react";
import { X } from "lucide-react";

export default function BigViewImage({ src, alt = "", className = "", onLoad, onError }) {
  const [isBigViewOpen, setIsBigViewOpen] = useState(false);

  const handleClick = () => {
    if (src) {
      setIsBigViewOpen(true);
    }
  };

  const BigViewModal = () => {
    if (!isBigViewOpen) return null;

    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={() => setIsBigViewOpen(false)}
      >
        <div className="relative max-w-4xl max-h-[90vh]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsBigViewOpen(false);
            }}
            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
          >
            <X size={32} />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`${className} cursor-pointer hover:opacity-90 transition-opacity`}
        onClick={handleClick}
        onLoad={onLoad}
        onError={onError}
      />
      <BigViewModal />
    </>
  );
}
