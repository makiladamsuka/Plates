import { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface SliderButtonProps {
  onSlideComplete: () => void;
  text?: string;
}

export function SliderButton({ onSlideComplete, text = 'Slide to approve' }: SliderButtonProps) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  const KNOB_SIZE = 48; // Size of the circular knob

  useEffect(() => {
    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      
      if (containerRef.current && knobRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const maxSlide = containerWidth - KNOB_SIZE - 8; // 4px padding on each side
        
        if (sliderPosition > maxSlide * 0.8) {
          // Snap to end and complete
          setSliderPosition(maxSlide);
          setIsCompleted(true);
          onSlideComplete();
        } else {
          // Snap back
          setSliderPosition(0);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      let clientX = 0;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const newPos = clientX - rect.left - KNOB_SIZE / 2;
      const maxSlide = rect.width - KNOB_SIZE - 8;

      if (newPos < 0) {
        setSliderPosition(0);
      } else if (newPos > maxSlide) {
        setSliderPosition(maxSlide);
      } else {
        setSliderPosition(newPos);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, sliderPosition, onSlideComplete]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '56px',
        backgroundColor: 'var(--ink-black)',
        borderRadius: '9999px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Background Text */}
      <span
        style={{
          color: 'var(--text-gray)',
          fontSize: '14px',
          fontWeight: 600,
          opacity: isCompleted ? 0 : 1,
          transition: 'opacity 0.3s',
        }}
      >
        {text}
      </span>

      {/* Draggable Knob */}
      <div
        ref={knobRef}
        onMouseDown={() => !isCompleted && setIsDragging(true)}
        onTouchStart={() => !isCompleted && setIsDragging(true)}
        style={{
          position: 'absolute',
          left: '4px',
          width: `${KNOB_SIZE}px`,
          height: `${KNOB_SIZE}px`,
          backgroundColor: 'var(--yellow)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isCompleted ? 'default' : 'grab',
          transform: `translateX(${sliderPosition}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        <ChevronRight size={24} color="var(--ink-black)" />
      </div>
    </div>
  );
}
