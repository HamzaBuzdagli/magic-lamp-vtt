import { useTranslation } from '../../hooks/useTranslation';
import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Eraser, 
  Trash2, 
  Sparkles, 
  Sword, 
  ShieldAlert, 
  Package, 
  Check, 
  PaintBucket, 
  Paintbrush, 
  Square, 
  Circle, 
  Minus as LineIcon, 
  MoveRight as ArrowIcon,
  Triangle as TriangleIcon,
  Star as StarIcon,
  Undo, 
  Redo, 
  Upload, 
  Download, 
  Boxes,
  MapPin,
  RotateCw as SpinRight,
  RotateCcw as SpinLeft,
  Scissors,
  Copy,
  Clipboard,
  RotateCw
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { TokenType } from '../../types/game';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', 
  '#ffffff', '#94a3b8', '#475569', '#000000',
];

type PaintTool = 'brush' | 'eraser' | 'bucket' | 'line' | 'arrow' | 'rect' | 'circle' | 'triangle' | 'star' | 'select_rect';

interface FloatingStamp {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  imageCanvas: HTMLCanvasElement;
}

type TransformMode = 'none' | 'move' | 'rotate' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw';

export const DoodleToAssetModal: React.FC = () => {
  const { isPaintModalOpen, setPaintModalOpen, addToken, isStreamerMode, preloadedDoodleImage, setPreloadedDoodleImage } = useGameStore();
  const { t } = useTranslation();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load preloaded image from Whiteboard or token export
  useEffect(() => {
    if (isPaintModalOpen && preloadedDoodleImage) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = preloadedDoodleImage;
      setPreloadedDoodleImage(null);
    }
  }, [isPaintModalOpen, preloadedDoodleImage, setPreloadedDoodleImage]);

  // Paint Tools & States
  const [activeTool, setActiveTool] = useState<PaintTool>('brush');
  const [brushColor, setBrushColor] = useState('#ef4444');
  const [brushSize, setBrushSize] = useState(6);
  const [isShapeFilled, setIsShapeFilled] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  // Floating Draggable Stamp & Transform
  const [floatingStamp, setFloatingStamp] = useState<FloatingStamp | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>('none');
  const [startTransformPos, setStartTransformPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [startStampState, setStartStampState] = useState<{ x: number; y: number; w: number; h: number; rotation: number } | null>(null);
  const [copiedCanvasData, setCopiedCanvasData] = useState<HTMLCanvasElement | null>(null);

  // Undo / Redo History
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Asset creation form state
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<TokenType>('monster');
  const [assetSize, setAssetSize] = useState<number>(1);
  const [assetSizeY, setAssetSizeY] = useState<number>(1);
  const [isCustomSize, setIsCustomSize] = useState<boolean>(false);
  const [hasHp] = useState(true);
  const [assetHp, setAssetHp] = useState<number>(20);
  const [assetInitiative, setAssetInitiative] = useState<number>(5);
  const [assetNotes, setAssetNotes] = useState('');
  const [sendTo, setSendTo] = useState<'map' | 'backstage'>('backstage');
  const [isTemplate, setIsTemplate] = useState<boolean>(false);
  const [hideInFog, setHideInFog] = useState<boolean>(true);

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentImg);
    if (newHistory.length > 25) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  useEffect(() => {
    if (isPaintModalOpen) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.fillStyle = '#090a0f';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
          setHistory([initial]);
          setHistoryIndex(0);
        }
      }
      setFloatingStamp(null);
      setAssetName('');
      setAssetNotes('');
    }
  }, [isPaintModalOpen]);

  // Draw Triangle Helper
  const drawTriangle = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    filled: boolean
  ) => {
    const topX = (startX + endX) / 2;
    const topY = startY;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(endX, endY);
    ctx.lineTo(startX, endY);
    ctx.closePath();
    if (filled) ctx.fill();
    ctx.stroke();
  };

  // Draw Star Helper
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
    filled: boolean
  ) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();

    if (filled) ctx.fill();
    ctx.stroke();
  };

  // Draw Arrow Helper
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    filled: boolean
  ) => {
    const headlen = Math.max(14, ctx.lineWidth * 3);
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();

    if (filled) ctx.fill();
    ctx.stroke();
  };

  // Delete / Clear selected area
  const handleDeleteSelection = () => {
    if (floatingStamp) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.clearRect(floatingStamp.x, floatingStamp.y, floatingStamp.w, floatingStamp.h);
        pushHistory();
      }
      setFloatingStamp(null);
      setTransformMode('none');
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.putImageData(history[newIdx], 0, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.putImageData(history[newIdx], 0, 0);
    }
  };

  // Stamp Commit / Cancel
  const commitStamp = () => {
    if (!floatingStamp) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    ctx.translate(floatingStamp.x + floatingStamp.w / 2, floatingStamp.y + floatingStamp.h / 2);
    ctx.rotate((floatingStamp.rotation * Math.PI) / 180);
    ctx.drawImage(floatingStamp.imageCanvas, -floatingStamp.w / 2, -floatingStamp.h / 2, floatingStamp.w, floatingStamp.h);
    ctx.restore();

    pushHistory();
    setFloatingStamp(null);
    setTransformMode('none');
  };

  const cancelStamp = () => {
    setFloatingStamp(null);
    setTransformMode('none');
  };

  const createStampFromRegion = (x: number, y: number, w: number, h: number, cutOut: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas || w <= 0 || h <= 0) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const stampCanvas = document.createElement('canvas');
    stampCanvas.width = w;
    stampCanvas.height = h;
    const stampCtx = stampCanvas.getContext('2d');
    if (!stampCtx) return;

    stampCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    setCopiedCanvasData(stampCanvas);

    if (cutOut) {
      ctx.clearRect(x, y, w, h);
      pushHistory();
    }

    setFloatingStamp({
      x,
      y,
      w,
      h,
      rotation: 0,
      imageCanvas: stampCanvas,
    });
  };

  const handleCut = () => {
    if (floatingStamp) {
      setCopiedCanvasData(floatingStamp.imageCanvas);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.clearRect(floatingStamp.x, floatingStamp.y, floatingStamp.w, floatingStamp.h);
        pushHistory();
      }
    }
  };

  const handleCopy = () => {
    if (floatingStamp) {
      setCopiedCanvasData(floatingStamp.imageCanvas);
    }
  };

  const handlePaste = () => {
    if (!copiedCanvasData) return;
    setFloatingStamp({
      x: 30,
      y: 30,
      w: copiedCanvasData.width,
      h: copiedCanvasData.height,
      rotation: 0,
      imageCanvas: copiedCanvasData,
    });
  };

  // Keyboard Shortcuts (Ctrl+X, Ctrl+C, Ctrl+V, Enter, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPaintModalOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        handleCut();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        handlePaste();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && floatingStamp) {
        handleDeleteSelection();
      } else if (e.key === 'Enter' && floatingStamp) {
        commitStamp();
      } else if (e.key === 'Escape' && floatingStamp) {
        cancelStamp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaintModalOpen, floatingStamp, copiedCanvasData]);

  // OS Clipboard Paste listener
  useEffect(() => {
    const handleOsPaste = (e: ClipboardEvent) => {
      if (!isPaintModalOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                const stampCanvas = document.createElement('canvas');
                stampCanvas.width = img.width;
                stampCanvas.height = img.height;
                const stampCtx = stampCanvas.getContext('2d');
                if (stampCtx) {
                  stampCtx.drawImage(img, 0, 0);
                  setCopiedCanvasData(stampCanvas);
                  setFloatingStamp({
                    x: 20,
                    y: 20,
                    w: Math.min(300, img.width),
                    h: Math.min(300, img.height),
                    rotation: 0,
                    imageCanvas: stampCanvas,
                  });
                }
              };
              img.src = event.target?.result as string;
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handleOsPaste);
    return () => window.removeEventListener('paste', handleOsPaste);
  }, [isPaintModalOpen]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#090a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushHistory();
    setFloatingStamp(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const stampCanvas = document.createElement('canvas');
        stampCanvas.width = img.width;
        stampCanvas.height = img.height;
        const stampCtx = stampCanvas.getContext('2d');
        if (stampCtx) {
          stampCtx.drawImage(img, 0, 0);
          setCopiedCanvasData(stampCanvas);
          setFloatingStamp({
            x: 20,
            y: 20,
            w: Math.min(320, img.width),
            h: Math.min(320, img.height),
            rotation: 0,
            imageCanvas: stampCanvas,
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `cizim-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const floodFill = (startX: number, startY: number, fillColorHex: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCtx.fillStyle = fillColorHex;
    tempCtx.fillRect(0, 0, 1, 1);
    const fillPixel = tempCtx.getImageData(0, 0, 1, 1).data;
    const fillR = fillPixel[0], fillG = fillPixel[1], fillB = fillPixel[2], fillA = fillPixel[3];

    const startIndex = (startY * width + startX) * 4;
    const startR = data[startIndex];
    const startG = data[startIndex + 1];
    const startB = data[startIndex + 2];
    const startA = data[startIndex + 3];

    if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) return;

    const colorMatch = (idx: number) => {
      const dr = Math.abs(data[idx] - startR);
      const dg = Math.abs(data[idx + 1] - startG);
      const db = Math.abs(data[idx + 2] - startB);
      const da = Math.abs(data[idx + 3] - startA);
      return dr < 30 && dg < 30 && db < 30 && da < 30;
    };

    const pixelStack: [number, number][] = [[startX, startY]];
    const seen = new Uint8Array(width * height);

    while (pixelStack.length > 0) {
      const [curX, curY] = pixelStack.pop()!;
      let y1 = curY;
      while (y1 >= 0 && colorMatch((y1 * width + curX) * 4)) y1--;
      y1++;

      let spanLeft = false;
      let spanRight = false;

      while (y1 < height && colorMatch((y1 * width + curX) * 4)) {
        const idx = (y1 * width + curX) * 4;
        data[idx] = fillR;
        data[idx + 1] = fillG;
        data[idx + 2] = fillB;
        data[idx + 3] = fillA;
        seen[y1 * width + curX] = 1;

        if (curX > 0) {
          if (colorMatch((y1 * width + (curX - 1)) * 4) && !seen[y1 * width + (curX - 1)]) {
            if (!spanLeft) {
              pixelStack.push([curX - 1, y1]);
              spanLeft = true;
            }
          } else if (spanLeft) {
            spanLeft = false;
          }
        }

        if (curX < width - 1) {
          if (colorMatch((y1 * width + (curX + 1)) * 4) && !seen[y1 * width + (curX + 1)]) {
            if (!spanRight) {
              pixelStack.push([curX + 1, y1]);
              spanRight = true;
            }
          } else if (spanRight) {
            spanRight = false;
          }
        }
        y1++;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    pushHistory();
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };
  };

  // Start Transform on handle or body (Drag-and-Hold)
  const startTransform = (e: React.MouseEvent, mode: TransformMode) => {
    e.stopPropagation();
    e.preventDefault();
    if (!floatingStamp) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setTransformMode(mode);
    setStartTransformPos({ x, y });
    setStartStampState({ ...floatingStamp });
  };

  // Global window listener: Drag-and-Hold for resize, move, and rotate
  useEffect(() => {
    if (transformMode === 'none') return;

    const handleGlobalMove = (e: MouseEvent | PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !startStampState) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);

      const dx = x - startTransformPos.x;
      const dy = y - startTransformPos.y;

      if (transformMode === 'move') {
        setFloatingStamp(prev => prev ? ({
          ...prev,
          x: Math.round(startStampState.x + dx),
          y: Math.round(startStampState.y + dy),
        }) : null);
      } else if (transformMode === 'resize-se') {
        setFloatingStamp(prev => prev ? ({
          ...prev,
          w: Math.max(20, Math.round(startStampState.w + dx)),
          h: Math.max(20, Math.round(startStampState.h + dy)),
        }) : null);
      } else if (transformMode === 'resize-sw') {
        const newW = Math.max(20, Math.round(startStampState.w - dx));
        setFloatingStamp(prev => prev ? ({
          ...prev,
          x: Math.round(startStampState.x + (startStampState.w - newW)),
          w: newW,
          h: Math.max(20, Math.round(startStampState.h + dy)),
        }) : null);
      } else if (transformMode === 'resize-ne') {
        const newH = Math.max(20, Math.round(startStampState.h - dy));
        setFloatingStamp(prev => prev ? ({
          ...prev,
          y: Math.round(startStampState.y + (startStampState.h - newH)),
          w: Math.max(20, Math.round(startStampState.w + dx)),
          h: newH,
        }) : null);
      } else if (transformMode === 'resize-nw') {
        const newW = Math.max(20, Math.round(startStampState.w - dx));
        const newH = Math.max(20, Math.round(startStampState.h - dy));
        setFloatingStamp(prev => prev ? ({
          ...prev,
          x: Math.round(startStampState.x + (startStampState.w - newW)),
          y: Math.round(startStampState.y + (startStampState.h - newH)),
          w: newW,
          h: newH,
        }) : null);
      } else if (transformMode === 'rotate') {
        const cx = startStampState.x + startStampState.w / 2;
        const cy = startStampState.y + startStampState.h / 2;
        const rad = Math.atan2(y - cy, x - cx);
        let deg = Math.round((rad * 180) / Math.PI + 90);
        deg = (deg + 360) % 360;
        setFloatingStamp(prev => prev ? ({
          ...prev,
          rotation: deg,
        }) : null);
      }
    };

    const handleGlobalUp = () => {
      setTransformMode('none');
    };

    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [transformMode, startTransformPos, startStampState]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (activeTool === 'bucket') {
      floodFill(x, y, brushColor);
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));

    if (activeTool === 'brush' || activeTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = activeTool === 'eraser' ? '#090a0f' : brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (activeTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    // Handle Transform (Move / Resize / Rotate)
    if (transformMode !== 'none' && floatingStamp && startStampState) {
      const dx = x - startTransformPos.x;
      const dy = y - startTransformPos.y;

      if (transformMode === 'move') {
        setFloatingStamp({
          ...floatingStamp,
          x: Math.round(startStampState.x + dx),
          y: Math.round(startStampState.y + dy),
        });
        return;
      }

      if (transformMode === 'resize-se') {
        setFloatingStamp({
          ...floatingStamp,
          w: Math.max(20, Math.round(startStampState.w + dx)),
          h: Math.max(20, Math.round(startStampState.h + dy)),
        });
        return;
      }

      if (transformMode === 'resize-sw') {
        const newW = Math.max(20, Math.round(startStampState.w - dx));
        setFloatingStamp({
          ...floatingStamp,
          x: Math.round(startStampState.x + (startStampState.w - newW)),
          w: newW,
          h: Math.max(20, Math.round(startStampState.h + dy)),
        });
        return;
      }

      if (transformMode === 'resize-ne') {
        const newH = Math.max(20, Math.round(startStampState.h - dy));
        setFloatingStamp({
          ...floatingStamp,
          y: Math.round(startStampState.y + (startStampState.h - newH)),
          w: Math.max(20, Math.round(startStampState.w + dx)),
          h: newH,
        });
        return;
      }

      if (transformMode === 'resize-nw') {
        const newW = Math.max(20, Math.round(startStampState.w - dx));
        const newH = Math.max(20, Math.round(startStampState.h - dy));
        setFloatingStamp({
          ...floatingStamp,
          x: Math.round(startStampState.x + (startStampState.w - newW)),
          y: Math.round(startStampState.y + (startStampState.h - newH)),
          w: newW,
          h: newH,
        });
        return;
      }

      if (transformMode === 'rotate') {
        const cx = startStampState.x + startStampState.w / 2;
        const cy = startStampState.y + startStampState.h / 2;
        const rad = Math.atan2(y - cy, x - cx);
        let deg = Math.round((rad * 180) / Math.PI + 90);
        deg = (deg + 360) % 360;
        setFloatingStamp({
          ...floatingStamp,
          rotation: deg,
        });
        return;
      }
    }

    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (activeTool === 'brush' || activeTool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (snapshot) {
      ctx.putImageData(snapshot, 0, 0);

      ctx.strokeStyle = brushColor;
      ctx.fillStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.globalCompositeOperation = 'source-over';

      if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (activeTool === 'arrow') {
        drawArrow(ctx, startPos.x, startPos.y, x, y, isShapeFilled);
      } else if (activeTool === 'rect') {
        const rx = Math.min(startPos.x, x);
        const ry = Math.min(startPos.y, y);
        const rw = Math.abs(x - startPos.x);
        const rh = Math.abs(y - startPos.y);
        if (isShapeFilled) {
          ctx.fillRect(rx, ry, rw, rh);
        }
        ctx.strokeRect(rx, ry, rw, rh);
      } else if (activeTool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        if (isShapeFilled) {
          ctx.fill();
        }
        ctx.stroke();
      } else if (activeTool === 'triangle') {
        drawTriangle(ctx, startPos.x, startPos.y, x, y, isShapeFilled);
      } else if (activeTool === 'star') {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
        drawStar(ctx, startPos.x, startPos.y, 5, radius, radius / 2.2, isShapeFilled);
      } else if (activeTool === 'select_rect') {
        const rx = Math.min(startPos.x, x);
        const ry = Math.min(startPos.y, y);
        const rw = Math.abs(x - startPos.x);
        const rh = Math.abs(y - startPos.y);

        ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.setLineDash([]);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (transformMode !== 'none') {
      setTransformMode('none');
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (activeTool === 'select_rect') {
      const { x, y } = getCanvasCoords(e);
      const rx = Math.min(startPos.x, x);
      const ry = Math.min(startPos.y, y);
      const rw = Math.abs(x - startPos.x);
      const rh = Math.abs(y - startPos.y);

      if (snapshot) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) ctx.putImageData(snapshot, 0, 0);
      }

      if (rw > 6 && rh > 6) {
        createStampFromRegion(rx, ry, rw, rh, false);
      }
      return;
    }

    pushHistory();
  };

  const handleCreateAsset = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const finalName = assetName.trim() || (assetType === 'monster' ? 'Gölge Yaratık' : assetType === 'hero' ? 'Yeni Kahraman' : 'Büyülü Eşya');

    addToken({
      name: finalName,
      type: assetType,
      size: assetSize,
      sizeY: isCustomSize ? assetSizeY : assetSize,
      x: 5,
      y: 5,
      image: dataUrl,
      color: brushColor,
      hp: hasHp ? { current: assetHp, max: assetHp } : undefined,
      initiativeBonus: assetInitiative,
      notes: assetNotes.trim() || undefined,
      statuses: [],
      statusEffects: [],
      isTemplate: sendTo === 'backstage' ? isTemplate : false,
      hideInFog,
      customAttributes: [
        { id: `attr-${Date.now()}`, name: 'Para / Altın', type: 'number', value: 0, isPublic: true }
      ]
    }, sendTo === 'backstage');

    setPaintModalOpen(false);
  };

  if (!isPaintModalOpen || isStreamerMode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5 text-amber-400 font-black text-base">
            <Sparkles className="w-5 h-5" />
            <span>Sihirli Varlık Stüdyosu (Çiz / Yükle & Oluştur)</span>
          </div>
          <button
            onClick={() => setPaintModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 flex flex-col md:flex-row gap-5 overflow-y-auto">
          
          {/* Left Canvas Panel */}
          <div className="flex flex-col items-center flex-1">
            
            {/* Top Tools Toolbar */}
            <div className="w-full flex items-center justify-between gap-1 mb-3 bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setActiveTool('brush')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${activeTool === 'brush' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  title="Fırça"
                >
                  <Paintbrush className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool('eraser')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${activeTool === 'eraser' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  title="Silgi"
                >
                  <Eraser className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool('bucket')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${activeTool === 'bucket' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  title="Boya Kovası"
                >
                  <PaintBucket className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool('line')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${activeTool === 'line' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  title="Düz Çizgi"
                >
                  <LineIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool('rect')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${activeTool === 'rect' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  title="Dikdörtgen"
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool('circle')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${activeTool === 'circle' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  title="Daire"
                >
                  <Circle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool('arrow')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${activeTool === 'arrow' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  title="Yön Oku (➔)"
                >
                  <ArrowIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool('triangle')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${activeTool === 'triangle' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  title="Üçgen (🔺)"
                >
                  <TriangleIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool('star')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${activeTool === 'star' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  title="Yıldız (⭐)"
                >
                  <StarIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsShapeFilled(!isShapeFilled)}
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    isShapeFilled
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isShapeFilled ? "Şekil Modu: İçi Dolu (Tıkla -> Çerçeve Yap)" : "Şekil Modu: İçi Boş Çerçeve (Tıkla -> Dolu Yap)"}
                >
                  {isShapeFilled ? '⬛ Dolu' : '🔲 Boş'}
                </button>

                <div className="w-px h-5 bg-slate-800 mx-0.5" />

                {/* Marquee Box Select Tool */}
                <button
                  onClick={() => setActiveTool('select_rect')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${activeTool === 'select_rect' ? 'bg-amber-500 text-slate-950 font-bold ring-2 ring-amber-300' : 'text-amber-400 hover:bg-slate-800'}`}
                  title="🔲 Kare Seçim (Seç, Kes, Kopyala & Yapıştır)"
                >
                  <Boxes className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-slate-800 mx-0.5" />

                {/* Cut, Copy, Paste Toolbar Group */}
                <button
                  onClick={handleCut}
                  disabled={!floatingStamp}
                  className="p-1.5 px-2 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-30 flex items-center gap-1 font-bold text-xs cursor-pointer transition-colors"
                  title="Seçimi Kes (Ctrl + X)"
                >
                  <Scissors className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Kes</span>
                </button>

                <button
                  onClick={handleCopy}
                  disabled={!floatingStamp}
                  className="p-1.5 px-2 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-30 flex items-center gap-1 font-bold text-xs cursor-pointer transition-colors"
                  title="Seçimi Kopyala (Ctrl + C)"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Kopyala</span>
                </button>

                <button
                  onClick={handlePaste}
                  disabled={!copiedCanvasData}
                  className="p-1.5 px-2 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-30 flex items-center gap-1 font-bold text-xs cursor-pointer transition-colors"
                  title="Panodakini Yapıştır (Ctrl + V)"
                >
                  <Clipboard className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Yapıştır</span>
                </button>

                {floatingStamp && (
                  <button
                    onClick={handleDeleteSelection}
                    className="p-1.5 px-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 flex items-center gap-1 font-bold text-xs cursor-pointer transition-colors animate-in fade-in"
                    title="Seçili Alanı Sil (Delete / Backspace)"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Alanı Sil</span>
                  </button>
                )}
              </div>

              {/* Undo / Redo & File Import / Export */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg cursor-pointer"
                  title="Geri Al (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg cursor-pointer"
                  title="İleri Al (Ctrl+Y)"
                >
                  <Redo className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-slate-800 mx-0.5" />

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-amber-400 rounded-lg cursor-pointer"
                  title="Resim Yükle"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  onClick={handleExportPNG}
                  className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg cursor-pointer"
                  title="PNG İndir"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClear}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer"
                  title="Tuvali Temizle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Canvas Area with Interactive Bounding Box */}
            <div className="relative border-2 border-slate-700/80 rounded-2xl overflow-hidden shadow-inner bg-slate-950 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={380}
                height={380}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="block cursor-crosshair"
                style={{
                  backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              {/* Render Interactive Floating Stamp Overlay & Handles */}
              {floatingStamp && (
                <div
                  style={{
                    left: `${floatingStamp.x}px`,
                    top: `${floatingStamp.y}px`,
                    width: `${floatingStamp.w}px`,
                    height: `${floatingStamp.h}px`,
                    transform: `rotate(${floatingStamp.rotation}deg)`,
                    transformOrigin: 'center center',
                  }}
                  className="absolute z-30 border-2 border-amber-400 border-dashed rounded bg-amber-500/10 shadow-2xl flex items-center justify-center pointer-events-auto"
                >
                  {/* Image Preview */}
                  <img
                    src={floatingStamp.imageCanvas.toDataURL()}
                    alt="stamp"
                    className="w-full h-full object-contain filter drop-shadow-md pointer-events-none select-none"
                  />

                  {/* Body Move Area */}
                  <div
                    onMouseDown={(e) => startTransform(e, 'move')}
                    className="absolute inset-0 cursor-move"
                    title="Sürükleyip Taşı"
                  />

                  {/* 4 Corner Resize Handles (Daireler) */}
                  <div
                    onMouseDown={(e) => startTransform(e, 'resize-nw')}
                    className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-950 shadow-md cursor-nwse-resize hover:scale-125 transition-transform z-40"
                    title="Sol Üstten Boyutlandır (Basılı Tutup Sürükleyin)"
                  />
                  <div
                    onMouseDown={(e) => startTransform(e, 'resize-ne')}
                    className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-950 shadow-md cursor-nesw-resize hover:scale-125 transition-transform z-40"
                    title="Sağ Üstten Boyutlandır (Basılı Tutup Sürükleyin)"
                  />
                  <div
                    onMouseDown={(e) => startTransform(e, 'resize-sw')}
                    className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-950 shadow-md cursor-nesw-resize hover:scale-125 transition-transform z-40"
                    title="Sol Alttan Boyutlandır (Basılı Tutup Sürükleyin)"
                  />
                  <div
                    onMouseDown={(e) => startTransform(e, 'resize-se')}
                    className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-950 shadow-md cursor-nwse-resize hover:scale-125 transition-transform z-40"
                    title="Sağ Alttan Boyutlandır (Basılı Tutup Sürükleyin)"
                  />

                  {/* Top/Bottom Rotation Handle & Attached Action Bar */}
                  <div className={`absolute ${floatingStamp.y < 80 ? '-bottom-10' : '-top-9'} left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-40`}>
                    {floatingStamp.y >= 80 && <div className="w-0.5 h-3 bg-amber-400" />}
                    <div
                      onMouseDown={(e) => startTransform(e, 'rotate')}
                      className="w-6 h-6 rounded-full bg-amber-400 border-2 border-slate-950 text-slate-950 flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                      title="Döndürmek için tut ve çevir"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </div>
                    {floatingStamp.y < 80 && <div className="w-0.5 h-3 bg-amber-400" />}
                  </div>

                  {/* Attached Floating Action Bar */}
                  <div 
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`absolute ${floatingStamp.y < 80 ? 'top-full mt-4' : '-top-14'} left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/95 border border-amber-500/80 px-2.5 py-1 rounded-xl shadow-2xl backdrop-blur-md whitespace-nowrap z-50 text-xs`}
                  >
                    <button
                      onClick={() => setFloatingStamp({ ...floatingStamp, rotation: (floatingStamp.rotation - 90 + 360) % 360 })}
                      className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded cursor-pointer"
                      title="90° Sola Döndür"
                    >
                      <SpinLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-amber-400 font-mono text-[10px] font-bold">{floatingStamp.rotation}°</span>
                    <button
                      onClick={() => setFloatingStamp({ ...floatingStamp, rotation: (floatingStamp.rotation + 90) % 360 })}
                      className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded cursor-pointer"
                      title="90° Sağa Döndür"
                    >
                      <SpinRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-slate-800 mx-0.5" />

                    <button
                      onClick={handleCut}
                      className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                      title="Kes (Ctrl+X)"
                    >
                      <Scissors className="w-3 h-3 text-amber-400" />
                      <span>Kes</span>
                    </button>

                    <button
                      onClick={handleCopy}
                      className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                      title="Kopyala (Ctrl+C)"
                    >
                      <Copy className="w-3 h-3 text-amber-400" />
                      <span>Kopyala</span>
                    </button>

                    <div className="w-px h-4 bg-slate-800 mx-0.5" />

                    <button
                      onClick={commitStamp}
                      className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-lg flex items-center gap-1 cursor-pointer shadow text-[11px]"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Yapıştır</span>
                    </button>

                    <button
                      onClick={cancelStamp}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer text-[11px]"
                    >
                      İptal
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Bottom Palette & Brush Size */}
            <div className="w-full flex items-center justify-between gap-3 mt-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBrushColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      brushColor === c ? 'scale-125 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Brush Size Slider */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-mono">{brushSize}px</span>
                <input
                  type="range"
                  min="2"
                  max="40"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

          </div>

          {/* Right Asset Profile & Stats Config */}
          <div className="w-full md:w-80 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 text-xs">
            
            <div>
              <h3 className="text-amber-400 font-bold mb-3 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Varlık Kartını Oluştur</span>
              </h3>

              {/* Asset Name */}
              <div className="mb-3">
                <label className="block text-slate-400 font-bold mb-1">{t('doodle.tokenName')}</label>
                <input
                  type="text"
                  placeholder="Örn: Zehirli Mağara Örümceği, Ateş Büyücüsü..."
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 font-semibold text-xs"
                />
              </div>

              {/* Token Type */}
              <div className="mb-3">
                <label className="block text-slate-400 font-bold mb-1">Varlık Türü</label>
                <div className="grid grid-cols-3 gap-1.5 text-center font-bold">
                  {[
                    { id: 'monster', label: 'Canavar', icon: ShieldAlert, color: 'text-rose-400 border-rose-500/50 bg-rose-950/30' },
                    { id: 'hero', label: 'Kahraman', icon: Sword, color: 'text-blue-400 border-blue-500/50 bg-blue-950/30' },
                    { id: 'item', label: 'Eşya / Sandık', icon: Package, color: 'text-amber-400 border-amber-500/50 bg-amber-950/30' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setAssetType(t.id as TokenType)}
                      className={`py-1.5 px-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        assetType === t.id ? `${t.color} ring-1 ring-amber-400 shadow-md font-black` : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <t.icon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Size & HP */}
              <div className="space-y-2 mb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Grid Boyutu</label>
                    <select
                      value={isCustomSize ? 'custom' : assetSize}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomSize(true);
                        } else {
                          setIsCustomSize(false);
                          setAssetSize(Number(e.target.value));
                          setAssetSizeY(Number(e.target.value));
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 cursor-pointer"
                    >
                      <option value={1}>1x1 (Normal)</option>
                      <option value={2}>2x2 (Büyük)</option>
                      <option value={3}>3x3 (Dev)</option>
                      <option value={4}>4x4 (Gargantuan)</option>
                      <option value="custom">⚙️ Özel Boyut (GxY)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Maks Can (HP)</label>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={assetHp}
                      onChange={(e) => setAssetHp(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-center font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">⚔️ İnisiyatif (DEX)</label>
                    <input
                      type="number"
                      value={assetInitiative}
                      onChange={(e) => setAssetInitiative(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-bold text-center font-mono"
                    />
                  </div>
                </div>

                {/* Custom Dimensions Inputs (When Özel Boyut is selected) */}
                {isCustomSize && (
                  <div className="p-2 bg-slate-900 rounded-xl border border-amber-500/50 flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex-1">
                      <label className="block text-[10px] text-amber-400 font-bold mb-0.5">Genişlik (Kare)</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={assetSize}
                        onChange={(e) => setAssetSize(Math.max(1, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-center font-mono font-bold"
                      />
                    </div>
                    <span className="text-slate-500 font-bold pt-3">x</span>
                    <div className="flex-1">
                      <label className="block text-[10px] text-amber-400 font-bold mb-0.5">Yükseklik (Kare)</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={assetSizeY}
                        onChange={(e) => setAssetSizeY(Math.max(1, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-center font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description Notes */}
              <div className="mb-3">
                <label className="block text-slate-400 font-bold mb-1">DM Notu / Hikaye</label>
                <textarea
                  placeholder="Özellikler, saldırı bonusları veya tuzak mekaniği..."
                  value={assetNotes}
                  onChange={(e) => setAssetNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 resize-none text-xs"
                />
              </div>

              {/* Target Destination: Direct to Map or Backstage */}
              <div className="space-y-2 mb-3">
                <label className="block text-slate-400 font-bold mb-1">Nereye Eklensin?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSendTo('backstage')}
                    className={`py-2 px-2 rounded-xl border text-center font-bold cursor-pointer ${
                      sendTo === 'backstage'
                        ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    🎭 Gizli Kasaya
                  </button>
                  <button
                    onClick={() => setSendTo('map')}
                    className={`py-2 px-2 rounded-xl border text-center font-bold cursor-pointer ${
                      sendTo === 'map'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    🗺️ Doğrudan Haritaya
                  </button>
                </div>

                {/* Template Toggle (Only when sending to Backstage) */}
                {sendTo === 'backstage' && (
                  <label className="flex items-center gap-2 p-2 bg-purple-950/40 border border-purple-800/60 rounded-xl cursor-pointer hover:bg-purple-900/40 transition-colors animate-in fade-in">
                    <input
                      type="checkbox"
                      checked={isTemplate}
                      onChange={(e) => setIsTemplate(e.target.checked)}
                      className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
                    />
                    <div className="text-[11px] leading-tight">
                      <span className="text-purple-300 font-bold block">
                        {isTemplate ? '📦 Şablon Varlık (Sonsuz Çağrılır)' : '🎯 Tek Seferlik Varlık (Varsayılan)'}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {isTemplate 
                          ? 'Haritaya atılsa bile kasada kalır, sınırsız kopyalanır.' 
                          : 'Sahneye çağrıldığında kasadan haritaya taşınır.'}
                      </span>
                    </div>
                  </label>
                )}

                {/* Hide in Fog Toggle */}
                <label className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={hideInFog}
                    onChange={(e) => setHideInFog(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                  <div className="text-[11px] leading-tight">
                    <span className="text-amber-300 font-bold block">🌫️ Sis İçinde Gizle</span>
                    <span className="text-slate-400 text-[10px]">Sisli odalarda oyuncu ekranında görünmez.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Create Asset Button */}
            <button
              onClick={handleCreateAsset}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Varlığı Kaydet & Kullan</span>
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};
