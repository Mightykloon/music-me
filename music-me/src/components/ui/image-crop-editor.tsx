"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  FlipHorizontal,
} from "lucide-react";

interface ImageCropEditorProps {
  imageSrc: string;
  onComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // width/height — 1 for square, 9/16 for portrait, 16/9 for landscape
  circular?: boolean;
  outputWidth?: number; // output resolution width (default 512)
}

const FILTERS = [
  { name: "None", value: "none", css: "" },
  { name: "B&W", value: "grayscale", css: "grayscale(100%)" },
  { name: "Sepia", value: "sepia", css: "sepia(80%)" },
  { name: "Warm", value: "warm", css: "sepia(30%) saturate(140%) brightness(105%)" },
  { name: "Cool", value: "cool", css: "saturate(80%) hue-rotate(15deg) brightness(105%)" },
  { name: "Vivid", value: "vivid", css: "saturate(160%) contrast(110%)" },
  { name: "Fade", value: "fade", css: "contrast(90%) brightness(110%) saturate(80%)" },
  { name: "Dramatic", value: "dramatic", css: "contrast(130%) brightness(90%) saturate(120%)" },
  { name: "Vintage", value: "vintage", css: "sepia(40%) contrast(90%) brightness(105%) saturate(70%)" },
  { name: "Noir", value: "noir", css: "grayscale(100%) contrast(130%) brightness(90%)" },
];

// Max dimensions for the crop area in the editor UI
const MAX_CROP_W = 320;
const MAX_CROP_H = 320;

export function ImageCropEditor({
  imageSrc,
  onComplete,
  onCancel,
  aspectRatio = 1,
  circular = true,
  outputWidth = 512,
}: ImageCropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [filter, setFilter] = useState("none");
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Compute crop rectangle from aspect ratio
  let cropW: number, cropH: number;
  if (aspectRatio >= 1) {
    cropW = MAX_CROP_W;
    cropH = Math.round(MAX_CROP_W / aspectRatio);
  } else {
    cropH = MAX_CROP_H;
    cropW = Math.round(MAX_CROP_H * aspectRatio);
  }

  const outputW = outputWidth;
  const outputH = Math.round(outputWidth / aspectRatio);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Calculate initial zoom to fill the crop area
      const scale = Math.max(cropW / img.naturalWidth, cropH / img.naturalHeight);
      setZoom(Math.max(scale, 1));
    };
    img.src = imageSrc;
  }, [imageSrc, cropW, cropH]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setDragging(true);
      const point = "touches" in e ? e.touches[0] : e;
      setDragStart({ x: point.clientX - offset.x, y: point.clientY - offset.y });
    },
    [offset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!dragging) return;
      e.preventDefault();
      const point = "touches" in e ? e.touches[0] : e;
      setOffset({
        x: point.clientX - dragStart.x,
        y: point.clientY - dragStart.y,
      });
    },
    [dragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom((z) => Math.max(0.1, Math.min(5, z + delta)));
    },
    []
  );

  const getFilterCss = () => FILTERS.find((f) => f.value === filter)?.css || "";

  const handleComplete = useCallback(() => {
    if (!imgRef.current) return;
    const img = imgRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = outputW / cropW;
    const scaleY = outputH / cropH;

    ctx.save();

    // Clip to circle if circular
    if (circular) {
      ctx.beginPath();
      ctx.ellipse(outputW / 2, outputH / 2, outputW / 2, outputH / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    }

    // Apply filter
    const filterCss = getFilterCss();
    if (filterCss) {
      ctx.filter = filterCss;
    }

    // Move to center of canvas
    ctx.translate(outputW / 2, outputH / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply flip
    if (flipH) ctx.scale(-1, 1);

    // Scale by zoom * outputScale
    ctx.scale(zoom * scaleX, zoom * scaleY);

    // Apply offset (convert from screen pixels to image-space)
    ctx.translate(offset.x / zoom, offset.y / zoom);

    // Draw image centered
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    ctx.restore();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onComplete(dataUrl);
  }, [zoom, offset, rotation, flipH, filter, circular, onComplete, cropW, cropH, outputW, outputH]);

  // Container height based on crop area + padding
  const editorHeight = cropH + 80;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Edit Photo</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Crop area */}
        <div
          className="relative bg-black/90 flex items-center justify-center overflow-hidden"
          style={{ height: editorHeight }}
        >
          {/* Dark overlay with cutout */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <svg width="100%" height="100%" className="absolute inset-0">
              <defs>
                <mask id="crop-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {circular ? (
                    <ellipse
                      cx="50%"
                      cy="50%"
                      rx={cropW / 2}
                      ry={cropH / 2}
                      fill="black"
                    />
                  ) : (
                    <rect
                      x="50%"
                      y="50%"
                      width={cropW}
                      height={cropH}
                      fill="black"
                      transform={`translate(${-cropW / 2}, ${-cropH / 2})`}
                    />
                  )}
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.6)"
                mask="url(#crop-mask)"
              />
              {circular ? (
                <ellipse
                  cx="50%"
                  cy="50%"
                  rx={cropW / 2}
                  ry={cropH / 2}
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              ) : (
                <rect
                  x="50%"
                  y="50%"
                  width={cropW}
                  height={cropH}
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  transform={`translate(${-cropW / 2}, ${-cropH / 2})`}
                />
              )}
            </svg>
          </div>

          {/* Image */}
          <div
            ref={containerRef}
            className="cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
            style={{ touchAction: "none" }}
          >
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Edit"
                draggable={false}
                className="pointer-events-none max-w-none"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                  filter: getFilterCss() || undefined,
                  transformOrigin: "center center",
                }}
              />
            )}
          </div>
        </div>

        {/* Zoom slider */}
        <div className="px-4 py-3 border-t border-border/50">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-primary"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>

          {/* Transform controls */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Rotate
            </button>
            <button
              onClick={() => setFlipH((f) => !f)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                flipH
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              Flip
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
                setRotation(0);
                setFlipH(false);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-auto"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">Filters</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 transition-all ${
                  filter === f.value ? "opacity-100" : "opacity-60 hover:opacity-80"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                    filter === f.value
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={imageSrc}
                    alt={f.name}
                    className="w-full h-full object-cover"
                    style={{ filter: f.css || undefined }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Check className="w-4 h-4" />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
