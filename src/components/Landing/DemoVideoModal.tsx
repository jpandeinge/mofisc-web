import { useEffect, useRef } from 'react';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoVideoModal = ({ isOpen, onClose }: DemoVideoModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      videoRef.current?.play().catch(() => undefined);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f1720]/80 p-4" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex justify-between text-white">
          <p className="text-sm font-medium">Mofisc demo</p>
          <button type="button" onClick={onClose} className="bg-transparent text-sm text-white hover:bg-transparent">Close</button>
        </div>
        <video ref={videoRef} src="/videos/landing-demo.mp4" className="w-full bg-black" controls playsInline />
      </div>
    </div>
  );
};

export default DemoVideoModal;
