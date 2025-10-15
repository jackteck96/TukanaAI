import React, { useRef } from 'react';

interface SignaturePlacementProps {
  onChange?: (pos: { x: number; y: number } | null) => void;
}

// Simple clickable area to capture relative position (percentages)
const SignaturePlacement: React.FC<SignaturePlacementProps> = ({ onChange }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onChange?.({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="relative h-64 w-full rounded-md border border-border bg-muted/30 overflow-hidden cursor-crosshair"
    >
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm select-none">
        Clique no local desejado para posicionar a assinatura
      </div>
    </div>
  );
};

export default SignaturePlacement;
