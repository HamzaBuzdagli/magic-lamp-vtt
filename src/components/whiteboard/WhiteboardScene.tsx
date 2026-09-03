import { useTranslation } from '../../hooks/useTranslation';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Paintbrush,
  Heart,
  Eye,
  EyeOff, 
  PaintBucket,
  Eraser, 
  Square, 
  Circle, 
  Minus as LineIcon,
  MoveRight as ArrowIcon,
  Triangle as TriangleIcon,
  Star as StarIcon, 
  Type as TextIcon, 
  Undo, 
  Redo, 
  Download, 
  Upload, 
  Trash2, 
  Hand, 
  Sparkles, 
  Boxes, 
  MapPin, 
  RotateCw as SpinRight,
  RotateCcw as SpinLeft,
  Scissors,
  Copy,
  Clipboard,
  RotateCw,
  Layers,
  Plus,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Search,
  GripVertical
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { WhiteboardAsset } from '../../types/game';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', 
  '#ffffff', '#94a3b8', '#475569', '#000000',
];

type WbTool = 'brush' | 'highlighter' | 'eraser' | 'bucket' | 'line' | 'arrow' | 'rect' | 'circle' | 'triangle' | 'star' | 'text' | 'select_rect' | 'pan';

interface FloatingStamp {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  imageCanvas: HTMLCanvasElement;
}

type TransformMode = 'none' | 'move' | 'rotate' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw';

export const WhiteboardScene: React.FC = () => {
  const { t } = useTranslation();
  const handleExportToToken = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setPreloadedDoodleImage(dataUrl);
    setPaintModalOpen(true);
  };

  const { 
    connectedPlayers,
    localPlayerName,
    whiteboardDataUrl,
    setWhiteboardDataUrl, 
    whiteboardPages,
    activeWhiteboardPageId,
    setActiveWhiteboardPageId,
    addWhiteboardPage,
    updateWhiteboardPage,
    deleteWhiteboardPage,
    resetActiveWhiteboardPage,
    whiteboardAssets,
    addWhiteboardAsset,
    deleteWhiteboardAsset,
    whiteboardHealthBars,
    addWhiteboardHealthBar,
    updateWhiteboardHealthBar,
    deleteWhiteboardHealthBar,
    isStreamerMode,
    setPaintModalOpen,
    setPreloadedDoodleImage
  } = useGameStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const assetVaultFileInputRef = useRef<HTMLInputElement | null>(null);

  // Tools & Settings
  const [activeTool, setActiveTool] = useState<WbTool>('brush');
  const myPlayer = (connectedPlayers || []).find((p) => p.name === localPlayerName || p.id === localPlayerName);
  const canDraw = !isStreamerMode || (myPlayer && myPlayer.canDrawWhiteboard);
  const [color, setColor] = useState('#eab308');
  const [lineWidth, setLineWidth] = useState(4);
  const [theme, setTheme] = useState<'dark' | 'grid' | 'parchment'>('dark');
  const [isShapeFilled, setIsShapeFilled] = useState<boolean>(false);
  const [isShapesMenuOpen, setIsShapesMenuOpen] = useState<boolean>(false);
  const [draggingBarId, setDraggingBarId] = useState<string | null>(null);
  const [dragBarOffset, setDragBarOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Draggable Whiteboard Layer Panel State
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [layerPanelPos, setLayerPanelPos] = useState<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 320) : 800,
    y: 70
  });
  const [isDraggingLayerPanel, setIsDraggingLayerPanel] = useState(false);
  const [dragLayerStart, setDragLayerStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isAddingPage, setIsAddingPage] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editPageName, setEditPageName] = useState('');

  // Asset Vault Drawer State
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [searchVault, setSearchVault] = useState('');
  const [selectedVaultCategory, setSelectedVaultCategory] = useState<string>('all');
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('Referanslar');
  const [newAssetUrl, setNewAssetUrl] = useState('');

  // Zoom & Pan
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  // Floating Stamp
  const [floatingStamp, setFloatingStamp] = useState<FloatingStamp | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>('none');
  const [startTransformPos, setStartTransformPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [startStampState, setStartStampState] = useState<{ x: number; y: number; w: number; h: number; rotation: number } | null>(null);
  const [copiedCanvasData, setCopiedCanvasData] = useState<HTMLCanvasElement | null>(null);

  // History Stack
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const currentPage = (whiteboardPages || []).find((p) => p.id === activeWhiteboardPageId) || whiteboardPages?.[0];

  // Sync to store & cross-tab
  const syncStore = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    setWhiteboardDataUrl(url);
  }, [setWhiteboardDataUrl]);

  // Push history and sync
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
    syncStore();
  };

  // LIVE CROSS-TAB SYNCHRONIZATION: Load incoming whiteboard data from store (e.g. DM tab -> Player tab)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetUrl = currentPage?.dataUrl || (activeWhiteboardPageId === (whiteboardPages?.[0]?.id || 'wb-page-1') ? whiteboardDataUrl : null);

    if (targetUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        if (history.length === 0) {
          const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
          setHistory([initial]);
          setHistoryIndex(0);
        }
      };
      img.src = targetUrl;
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initial]);
      setHistoryIndex(0);
    }
  }, [currentPage?.dataUrl, whiteboardDataUrl, activeWhiteboardPageId]);

  // Resize canvas to full container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const currentW = canvas.width;
      const currentH = canvas.height;
      const targetW = container.clientWidth;
      const targetH = container.clientHeight;

      if (currentW !== targetW || currentH !== targetH) {
        const ctx = canvas.getContext('2d');
        let prevImg: ImageData | null = null;
        if (currentW > 0 && currentH > 0 && ctx) {
          prevImg = ctx.getImageData(0, 0, currentW, currentH);
        }

        canvas.width = targetW;
        canvas.height = targetH;

        if (prevImg && ctx) {
          ctx.putImageData(prevImg, 0, 0);
        } else if (currentPage?.dataUrl && ctx) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = currentPage.dataUrl;
        } else if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
          setHistory([initial]);
          setHistoryIndex(0);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPage?.dataUrl]);

  // Global mouse handlers for draggable layer panel and health bars
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingLayerPanel) {
        setLayerPanelPos({
          x: Math.max(10, Math.min(window.innerWidth - 80, e.clientX - dragLayerStart.x)),
          y: Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragLayerStart.y)),
        });
      }
      if (draggingBarId) {
        updateWhiteboardHealthBar(draggingBarId, {
          x: Math.max(10, Math.min(window.innerWidth - 100, e.clientX - dragBarOffset.x)),
          y: Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragBarOffset.y)),
        });
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingLayerPanel) {
        setIsDraggingLayerPanel(false);
      }
      if (draggingBarId) {
        setDraggingBarId(null);
      }
    };

    if (isDraggingLayerPanel || draggingBarId) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingLayerPanel, dragLayerStart, draggingBarId, dragBarOffset, updateWhiteboardHealthBar]);

  // Flood Fill Algorithm (Paint Bucket)
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

    const startXInt = Math.floor(startX);
    const startYInt = Math.floor(startY);
    if (startXInt < 0 || startXInt >= width || startYInt < 0 || startYInt >= height) return;

    const startIndex = (startYInt * width + startXInt) * 4;
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
      return dr < 32 && dg < 32 && db < 32 && da < 32;
    };

    const pixelStack: [number, number][] = [[startXInt, startYInt]];
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
    syncStore();
  };

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
        syncStore();
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
      syncStore();
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
      syncStore();
    }
  };

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

  const createStampFromRegion = (x: number, y: number, w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas || w <= 0 || h <= 0) return;

    const stampCanvas = document.createElement('canvas');
    stampCanvas.width = w;
    stampCanvas.height = h;
    const stampCtx = stampCanvas.getContext('2d');
    if (!stampCtx) return;

    stampCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    setCopiedCanvasData(stampCanvas);

    setFloatingStamp({
      x,
      y,
      w,
      h,
      rotation: 0,
      imageCanvas: stampCanvas,
    });
  };

  const spawnImageAsStamp = (imageUrl: string, dropX = 100, dropY = 100) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const stampCanvas = document.createElement('canvas');
      stampCanvas.width = img.naturalWidth || img.width;
      stampCanvas.height = img.naturalHeight || img.height;
      const stampCtx = stampCanvas.getContext('2d');
      if (stampCtx) {
        stampCtx.drawImage(img, 0, 0);
        const maxDisplayW = Math.min(480, img.width || 400);
        const maxDisplayH = Math.min(480, ((img.height || 400) / (img.width || 400)) * maxDisplayW);

        setCopiedCanvasData(stampCanvas);
        setFloatingStamp({
          x: dropX,
          y: dropY,
          w: maxDisplayW,
          h: maxDisplayH,
          rotation: 0,
          imageCanvas: stampCanvas,
        });
      }
    };
    img.src = imageUrl;
  };

  const handleCut = () => {
    if (floatingStamp) {
      setCopiedCanvasData(floatingStamp.imageCanvas);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.clearRect(floatingStamp.x, floatingStamp.y, floatingStamp.w, floatingStamp.h);
        pushHistory();
        syncStore();
      }
    }
  };

  const handleCopy = () => {
    if (floatingStamp) {
      setCopiedCanvasData(floatingStamp.imageCanvas);
    }
  };

  const handleSaveSelectionToAssets = () => {
    if (!floatingStamp) return;
    const dataUrl = floatingStamp.imageCanvas.toDataURL('image/png');
    const defaultName = `Çizim ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    const assetName = window.prompt('Referans Kasası için Görsel Adı:', defaultName);
    if (assetName) {
      addWhiteboardAsset({
        name: assetName,
        image: dataUrl,
        category: 'Çizimler',
      });
      setIsVaultOpen(true);
    }
  };

  const handlePasteData = () => {
    if (!copiedCanvasData) return;
    setFloatingStamp({
      x: 80,
      y: 80,
      w: copiedCanvasData.width,
      h: copiedCanvasData.height,
      rotation: 0,
      imageCanvas: copiedCanvasData,
    });
  };

  // Keyboard Shortcuts (Ctrl+X, Ctrl+C, Ctrl+V, Enter, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        handleCut();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && floatingStamp) {
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && copiedCanvasData) {
        handlePasteData();
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
  }, [floatingStamp, copiedCanvasData]);

  // Paste image directly on whiteboard (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                spawnImageAsStamp(event.target.result as string, 80, 80);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Start Transform on handle or body (Drag-and-Hold)
  const startTransform = (e: React.MouseEvent, mode: TransformMode) => {
    e.stopPropagation();
    e.preventDefault();
    if (!floatingStamp) return;
    const { x, y } = getCanvasCoords(e);
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
          w: Math.max(24, Math.round(startStampState.w + dx)),
          h: Math.max(24, Math.round(startStampState.h + dy)),
        }) : null);
      } else if (transformMode === 'resize-sw') {
        const newW = Math.max(24, Math.round(startStampState.w - dx));
        setFloatingStamp(prev => prev ? ({
          ...prev,
          x: Math.round(startStampState.x + (startStampState.w - newW)),
          w: newW,
          h: Math.max(24, Math.round(startStampState.h + dy)),
        }) : null);
      } else if (transformMode === 'resize-ne') {
        const newH = Math.max(24, Math.round(startStampState.h - dy));
        setFloatingStamp(prev => prev ? ({
          ...prev,
          y: Math.round(startStampState.y + (startStampState.h - newH)),
          w: Math.max(24, Math.round(startStampState.w + dx)),
          h: newH,
        }) : null);
      } else if (transformMode === 'resize-nw') {
        const newW = Math.max(24, Math.round(startStampState.w - dx));
        const newH = Math.max(24, Math.round(startStampState.h - dy));
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    if (!canDraw && activeTool !== 'pan') return;
    const { x, y } = getCanvasCoords(e);

    if (e.button === 1 || activeTool === 'pan') {
      setIsPanning(true);
      setStartPanPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // PAINT BUCKET FLOOD FILL TOOL
    if (activeTool === 'bucket') {
      floodFill(x, y, color);
      return;
    }

    // HIGH CONTRAST TEXT TOOL
    if (activeTool === 'text') {
      const text = window.prompt('Tuvale yazılacak metni girin:');
      if (text && text.trim()) {
        const fontSize = lineWidth * 3 + 16;
        ctx.save();
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(text, x, y);

        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.restore();

        pushHistory();
      }
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));

    if (activeTool === 'brush' || activeTool === 'highlighter' || activeTool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = activeTool === 'eraser' ? '#090a0f' : color;
      ctx.lineWidth = activeTool === 'highlighter' ? lineWidth * 3 : lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (activeTool === 'highlighter') {
        ctx.globalAlpha = 0.45;
        ctx.globalCompositeOperation = 'source-over';
      } else if (activeTool === 'eraser') {
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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
          w: Math.max(24, Math.round(startStampState.w + dx)),
          h: Math.max(24, Math.round(startStampState.h + dy)),
        });
        return;
      }

      if (transformMode === 'resize-sw') {
        const newW = Math.max(24, Math.round(startStampState.w - dx));
        setFloatingStamp({
          ...floatingStamp,
          x: Math.round(startStampState.x + (startStampState.w - newW)),
          w: newW,
          h: Math.max(24, Math.round(startStampState.h + dy)),
        });
        return;
      }

      if (transformMode === 'resize-ne') {
        const newH = Math.max(24, Math.round(startStampState.h - dy));
        setFloatingStamp({
          ...floatingStamp,
          y: Math.round(startStampState.y + (startStampState.h - newH)),
          w: Math.max(24, Math.round(startStampState.w + dx)),
          h: newH,
        });
        return;
      }

      if (transformMode === 'resize-nw') {
        const newW = Math.max(24, Math.round(startStampState.w - dx));
        const newH = Math.max(24, Math.round(startStampState.h - dy));
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

    if (isPanning) {
      setPan({
        x: e.clientX - startPanPos.x,
        y: e.clientY - startPanPos.y,
      });
      return;
    }

    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (activeTool === 'brush' || activeTool === 'highlighter' || activeTool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (snapshot) {
      ctx.putImageData(snapshot, 0, 0);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 1.0;
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

  const handleMouseUp = (e: React.MouseEvent) => {
    if (transformMode !== 'none') {
      setTransformMode('none');
      return;
    }

    if (isPanning) {
      setIsPanning(false);
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

      if (rw > 8 && rh > 8) {
        createStampFromRegion(rx, ry, rw, rh);
      }
      return;
    }

    pushHistory();
  };

  const handleResetPage = () => {
    if (window.confirm(`"${currentPage?.name || 'Mevcut'}" sayfasını tamamen sıfırlamak istediğinize emin misiniz? (Tüm çizimler temizlenir)`)) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initial]);
      setHistoryIndex(0);
      setFloatingStamp(null);
      resetActiveWhiteboardPage();
    }
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `cizim-${currentPage?.name || 'tahta'}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        spawnImageAsStamp(event.target.result as string, 60, 60);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop asset or external image onto canvas
  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    const dropX = rect ? e.clientX - rect.left - 100 : 80;
    const dropY = rect ? e.clientY - rect.top - 100 : 80;

    const rawAsset = e.dataTransfer.getData('whiteboard-asset');
    if (rawAsset) {
      try {
        const asset: WhiteboardAsset = JSON.parse(rawAsset);
        spawnImageAsStamp(asset.image, Math.max(20, dropX), Math.max(20, dropY));
        return;
      } catch (err) {
        console.error('Error parsing dropped asset', err);
      }
    }

    // External image file drop
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            spawnImageAsStamp(ev.target.result as string, Math.max(20, dropX), Math.max(20, dropY));
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddPageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPageName.trim()) {
      addWhiteboardPage(newPageName.trim());
      setNewPageName('');
      setIsAddingPage(false);
    }
  };

  const handleSavePageEdit = (id: string) => {
    if (editPageName.trim()) {
      updateWhiteboardPage(id, editPageName.trim());
    }
    setEditingPageId(null);
  };

  // Asset Vault Management
  const handleSaveNewAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetUrl.trim()) return;

    addWhiteboardAsset({
      name: newAssetName.trim() || 'Yeni Referans Görseli',
      category: newAssetCategory.trim() || 'Referanslar',
      image: newAssetUrl.trim(),
    });

    setNewAssetName('');
    setNewAssetUrl('');
    setIsAddingAsset(false);
  };

  const categories = Array.from(
    new Set((whiteboardAssets || []).map((a) => a.category || 'Referanslar'))
  );

  const filteredAssets = (whiteboardAssets || []).filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchVault.toLowerCase()) || 
                          (a.category || '').toLowerCase().includes(searchVault.toLowerCase());
    const matchesCategory = selectedVaultCategory === 'all' || (a.category || 'Referanslar') === selectedVaultCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div 
      ref={containerRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDropOnCanvas}
      className={`relative w-full h-full overflow-hidden select-none ${
        theme === 'grid' 
          ? 'bg-slate-950' 
          : theme === 'parchment'
          ? 'bg-[#1c1813]'
          : 'bg-[#090a0f]'
      }`}
      style={{
        backgroundImage: theme === 'grid' 
          ? 'radial-gradient(#1e293b 1.5px, transparent 1.5px)' 
          : undefined,
        backgroundSize: '24px 24px'
      }}
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 block cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* Interactive Floating Bounding Box & Transformation Handles */}
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
          {/* Main Content Preview Image */}
          <img
            src={floatingStamp.imageCanvas.toDataURL()}
            alt="stamp"
            className="w-full h-full object-contain filter drop-shadow-md pointer-events-none select-none"
          />

          {/* Draggable Body Move Area */}
          <div
            onMouseDown={(e) => startTransform(e, 'move')}
            className="absolute inset-0 cursor-move"
            title="Sürükleyip Taşı"
          />

          {/* 4 Corner Resize Handles */}
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

          {/* Adaptive Rotation Handle & Attached Action Bar (Below if near top) */}
          {(() => {
            const isNearTop = floatingStamp.y < 85;
            return (
              <>
                {/* Top/Bottom Rotation Handle */}
                <div className={`absolute ${isNearTop ? '-bottom-10' : '-top-9'} left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-40`}>
                  {!isNearTop && <div className="w-0.5 h-3 bg-amber-400" />}
                  <div
                    onMouseDown={(e) => startTransform(e, 'rotate')}
                    className="w-6 h-6 rounded-full bg-amber-400 border-2 border-slate-950 text-slate-950 flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                    title="Döndürmek için tut ve çevir"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </div>
                  {isNearTop && <div className="w-0.5 h-3 bg-amber-400" />}
                </div>

                {/* Attached Floating Action Bar (Placed BELOW if selection is near top of screen) */}
                <div 
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`absolute ${isNearTop ? 'top-full mt-4' : '-top-14'} left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900/95 border border-amber-500/80 px-2.5 py-1 rounded-xl shadow-2xl backdrop-blur-md whitespace-nowrap z-50 text-xs`}
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

                  <button
                    onClick={handleSaveSelectionToAssets}
                    className="p-1 px-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 rounded cursor-pointer flex items-center gap-1 font-bold text-[11px] transition-colors"
                    title="Seçili Alanı Referans Görsel Kasasına Kaydet"
                  >
                    <ImageIcon className="w-3 h-3 text-amber-400" />
                    <span>Referanslara Ekle</span>
                  </button>

                  <button
                    onClick={handleDeleteSelection}
                    className="p-1 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 rounded cursor-pointer flex items-center gap-1 font-bold text-[11px]"
                    title="Seçili Alanı Sil (Delete / Backspace)"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Alanı Sil</span>
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
              </>
            );
          })()}

        </div>
      )}

      {/* Floating Main Whiteboard Toolbar on Top Left (Responsive & Compact) */}
      {!isStreamerMode && (
        <div 
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 left-3 z-30 max-w-[calc(100vw-24px)] flex flex-wrap items-center gap-1.5 bg-slate-900/95 border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs"
        >
          {/* Main Drawing Tools Group */}
          <div className="flex items-center gap-0.5 bg-slate-950/70 p-0.5 rounded-xl border border-slate-800/80">
            <button
              onClick={() => { setActiveTool('brush'); setIsShapesMenuOpen(false); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'brush' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title={t('wb.brush')}
            >
              <Paintbrush className="w-4 h-4" />
            </button>

            <button
              onClick={() => { setActiveTool('highlighter'); setIsShapesMenuOpen(false); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'highlighter' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Vurgulayıcı / Fosforlu Kalem"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              onClick={() => { setActiveTool('eraser'); setIsShapesMenuOpen(false); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'eraser' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title={t('wb.eraser')}
            >
              <Eraser className="w-4 h-4" />
            </button>

            <button
              onClick={() => { setActiveTool('bucket'); setIsShapesMenuOpen(false); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'bucket' ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="🪣 Boya Kovası (Alanı Renge Doldur / Flood Fill)"
            >
              <PaintBucket className="w-4 h-4" />
            </button>
          </div>

          {/* Compact Shapes Selector Popover Group */}
          <div className="relative">
            <button
              onClick={() => setIsShapesMenuOpen(!isShapesMenuOpen)}
              className={`px-2 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                ['line', 'arrow', 'rect', 'circle', 'triangle', 'star'].includes(activeTool)
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Temel Şekiller Menüsü"
            >
              {activeTool === 'line' && <LineIcon className="w-3.5 h-3.5" />}
              {activeTool === 'arrow' && <ArrowIcon className="w-3.5 h-3.5" />}
              {activeTool === 'rect' && <Square className="w-3.5 h-3.5" />}
              {activeTool === 'circle' && <Circle className="w-3.5 h-3.5" />}
              {activeTool === 'triangle' && <TriangleIcon className="w-3.5 h-3.5" />}
              {activeTool === 'star' && <StarIcon className="w-3.5 h-3.5" />}
              {!['line', 'arrow', 'rect', 'circle', 'triangle', 'star'].includes(activeTool) && <Square className="w-3.5 h-3.5" />}
              <span className="text-[11px] hidden sm:inline">Şekil</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Shapes Popover Menu */}
            {isShapesMenuOpen && (
              <div 
                className="absolute top-full mt-1.5 left-0 z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 w-48 space-y-1.5 animate-in fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Temel Şekiller</div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => { setActiveTool('line'); setIsShapesMenuOpen(false); }}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer ${activeTool === 'line' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 hover:bg-slate-800 text-slate-300'}`}
                    title="Düz Çizgi"
                  >
                    <LineIcon className="w-4 h-4" />
                    <span className="text-[9px]">Çizgi</span>
                  </button>
                  <button
                    onClick={() => { setActiveTool('arrow'); setIsShapesMenuOpen(false); }}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer ${activeTool === 'arrow' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 hover:bg-slate-800 text-slate-300'}`}
                    title="Yön Oku"
                  >
                    <ArrowIcon className="w-4 h-4" />
                    <span className="text-[9px]">Ok</span>
                  </button>
                  <button
                    onClick={() => { setActiveTool('rect'); setIsShapesMenuOpen(false); }}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer ${activeTool === 'rect' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 hover:bg-slate-800 text-slate-300'}`}
                    title="Kare / Dikdörtgen"
                  >
                    <Square className="w-4 h-4" />
                    <span className="text-[9px]">Kare</span>
                  </button>
                  <button
                    onClick={() => { setActiveTool('circle'); setIsShapesMenuOpen(false); }}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer ${activeTool === 'circle' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 hover:bg-slate-800 text-slate-300'}`}
                    title="Daire / Çember"
                  >
                    <Circle className="w-4 h-4" />
                    <span className="text-[9px]">Daire</span>
                  </button>
                  <button
                    onClick={() => { setActiveTool('triangle'); setIsShapesMenuOpen(false); }}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer ${activeTool === 'triangle' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 hover:bg-slate-800 text-slate-300'}`}
                    title="Üçgen"
                  >
                    <TriangleIcon className="w-4 h-4" />
                    <span className="text-[9px]">Üçgen</span>
                  </button>
                  <button
                    onClick={() => { setActiveTool('star'); setIsShapesMenuOpen(false); }}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer ${activeTool === 'star' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 hover:bg-slate-800 text-slate-300'}`}
                    title="Yıldız"
                  >
                    <StarIcon className="w-4 h-4" />
                    <span className="text-[9px]">Yıldız</span>
                  </button>
                </div>

                {/* Fill Toggle Inside Dropdown */}
                <button
                  onClick={() => setIsShapeFilled(!isShapeFilled)}
                  className={`w-full py-1.5 px-2 rounded-xl text-center text-[11px] font-bold border transition-colors cursor-pointer ${
                    isShapeFilled
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isShapeFilled ? '⬛ İçi Dolu Şekiller' : '🔲 İçi Boş Çerçeve'}
                </button>
              </div>
            )}
          </div>

          {/* Text, Marquee Select & Pan */}
          <div className="flex items-center gap-0.5 bg-slate-950/70 p-0.5 rounded-xl border border-slate-800/80">
            <button
              onClick={() => { setActiveTool('text'); setIsShapesMenuOpen(false); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'text' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title={t('wb.textTool')}
            >
              <TextIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => { setActiveTool('select_rect'); setIsShapesMenuOpen(false); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'select_rect' ? 'bg-amber-500 text-slate-950 font-bold ring-2 ring-amber-300' : 'text-amber-400 hover:bg-slate-800'
              }`}
              title="🔲 Kare Seçim (Seç, Kes, Kopyala & Yapıştır)"
            >
              <Boxes className="w-4 h-4" />
            </button>

            <button
              onClick={() => { setActiveTool('pan'); setIsShapesMenuOpen(false); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTool === 'pan' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Kaydır (Pan)"
            >
              <Hand className="w-4 h-4" />
            </button>
          </div>

          {/* Selection Actions (Only when selection or clipboard exists) */}
          {(floatingStamp || copiedCanvasData) && (
            <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-xl border border-amber-500/50 animate-in fade-in">
              {floatingStamp && (
                <>
                  <button
                    onClick={handleCut}
                    className="p-1 px-1.5 rounded text-slate-300 hover:text-amber-400 hover:bg-slate-800 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                    title="Kes (Ctrl+X)"
                  >
                    <Scissors className="w-3 h-3 text-amber-400" />
                    <span>Kes</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-1 px-1.5 rounded text-slate-300 hover:text-amber-400 hover:bg-slate-800 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                    title="Kopyala (Ctrl+C)"
                  >
                    <Copy className="w-3 h-3 text-amber-400" />
                    <span>Kopya</span>
                  </button>
                  <button
                    onClick={handleSaveSelectionToAssets}
                    className="p-1 px-1.5 rounded text-amber-300 hover:text-amber-200 hover:bg-amber-950/60 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                    title="Seçili Alanı Referans Görsel Kasasına Kaydet"
                  >
                    <ImageIcon className="w-3 h-3 text-amber-400" />
                    <span>Kasaya Ekle</span>
                  </button>
                  <button
                    onClick={handleDeleteSelection}
                    className="p-1 px-1.5 rounded text-rose-400 hover:bg-rose-950/80 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                    title="Seçili Alanı Sil (Delete / Backspace)"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Sil</span>
                  </button>
                </>
              )}
              {copiedCanvasData && (
                <button
                  onClick={handlePasteData}
                  className="p-1 px-1.5 rounded text-slate-300 hover:text-amber-400 hover:bg-slate-800 flex items-center gap-1 font-bold text-[11px] cursor-pointer"
                  title="Yapıştır (Ctrl+V)"
                >
                  <Clipboard className="w-3 h-3 text-amber-400" />
                  <span>Yapıştır</span>
                </button>
              )}
            </div>
          )}

          {/* Interactive Health Bar Add Button */}
          <button
            onClick={() => {
              addWhiteboardHealthBar({
                name: 'Yeni Can Barı / Hedef',
                currentHp: 100,
                maxHp: 100,
                x: 120 + Math.floor(Math.random() * 80),
                y: 120 + Math.floor(Math.random() * 80),
                color: '#ef4444',
                isPublic: true,
                pageId: activeWhiteboardPageId,
              });
            }}
            className="p-1.5 px-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 hover:border-rose-600 rounded-xl text-rose-300 font-bold text-xs flex items-center gap-1 shadow-lg shadow-rose-950/40 cursor-pointer transition-all"
            title="Tuvale İnteraktif Can Barı Ekle"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span className="hidden md:inline">Can Barı</span>
          </button>

          <div className="w-px h-5 bg-slate-800 hidden sm:block" />

          {/* Compact 2-Row Color Palette */}
          <div className="grid grid-cols-6 gap-1 px-0.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                  color === c ? 'scale-125 ring-2 ring-amber-400' : 'hover:scale-110 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-px h-5 bg-slate-800 hidden sm:block" />

          {/* Stroke Width Slider */}
          <div className="flex items-center gap-1 bg-slate-950/70 px-1.5 py-1 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono w-5 text-center">{lineWidth}p</span>
            <input
              type="range"
              min="1"
              max="24"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-12 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Theme Selector */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            className="px-1.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-[11px] cursor-pointer focus:outline-none focus:border-amber-500"
          >
            <option value="dark">🌑 Koyu</option>
            <option value="grid">📐 Izgara</option>
            <option value="parchment">📜 Parşömen</option>
          </select>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 bg-slate-950/70 p-0.5 rounded-xl border border-slate-800/80">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Geri Al (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 cursor-pointer"
              title="İleri Al (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Vault & Layer Panels Toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsVaultOpen(!isVaultOpen)}
              className={`p-1.5 px-2 rounded-xl border flex items-center gap-1 font-bold text-xs cursor-pointer transition-all ${
                isVaultOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-amber-400'
              }`}
              title="Referans Görsel Kasası"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Kasa</span>
            </button>

            <button
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              className={`p-1.5 px-2 rounded-xl border flex items-center gap-1 font-bold text-xs cursor-pointer transition-all ${
                isLayerMenuOpen
                  ? 'bg-purple-600 text-white border-purple-400 shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-purple-400'
              }`}
              title="Tahta Sayfaları / Katmanları"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Sayfalar</span>
            </button>
          </div>

          {/* Export PNG & Clear */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-950 cursor-pointer transition-colors"
              title={t('wb.uploadImage')}
            >
              <Upload className="w-3.5 h-3.5" />
            </button>

            {!isStreamerMode && (
              <button
                onClick={handleExportToToken}
                className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1 shrink-0"
                title="Çizim tahtasındaki resmi alıp yeni bir Token / Varlık oluşturun"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('wb.toToken')}</span>
              </button>
            )}

            <button
              onClick={handleExportPNG}
              className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-950 cursor-pointer transition-colors"
              title={t('wb.exportPng')}
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetPage}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-950 cursor-pointer transition-colors"
              title={t('wb.clear')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* FREELY DRAGGABLE WHITEBOARD LAYER / PAGE SWITCHER PANEL */}
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          left: `${layerPanelPos.x}px`,
          top: `${layerPanelPos.y}px`,
        }}
        className="absolute z-40 select-none flex flex-col items-end"
      >
        {/* Draggable Header Badge / Trigger Button */}
        <div className="flex items-center bg-slate-900/95 border border-amber-500/60 hover:border-amber-400 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Drag Handle */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingLayerPanel(true);
              setDragLayerStart({
                x: e.clientX - layerPanelPos.x,
                y: e.clientY - layerPanelPos.y,
              });
            }}
            className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 cursor-grab active:cursor-grabbing transition-colors"
            title="Katman Menüsünü Ekranda İstediğin Yere Sürükle"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="flex items-center gap-2 pr-3.5 py-2 text-xs font-bold text-slate-100 transition-all cursor-pointer group"
          >
            <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[9px] text-amber-400/80 uppercase font-black tracking-wider leading-none">
                Tahta Katmanı
              </span>
              <span className="text-xs text-white font-black truncate max-w-[120px]">
                {currentPage?.name || 'Tahta 1'}
              </span>
            </div>

            <div className="text-slate-400 group-hover:text-amber-400 ml-1 transition-colors">
              {isLayerMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
        </div>

        {/* Expanded Draggable Manager Panel */}
        {isLayerMenuOpen && (
          <div 
            className="mt-2 w-72 bg-slate-900/95 border border-amber-500/50 rounded-2xl shadow-2xl p-2.5 backdrop-blur-md text-xs space-y-2 z-50 animate-in fade-in"
          >
            <div className="flex items-center justify-between px-1.5 py-1 border-b border-slate-800 text-[11px] font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Çizim Tahtası Sayfaları</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">({whiteboardPages.length} Sayfa)</span>
            </div>

            {/* List of Whiteboard Pages */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {whiteboardPages.map((page) => {
                const isActive = page.id === activeWhiteboardPageId;
                const isEditing = editingPageId === page.id;

                return (
                  <div
                    key={page.id}
                    onClick={() => {
                      if (!isEditing) {
                        syncStore();
                        setActiveWhiteboardPageId(page.id);
                      }
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1 mr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editPageName}
                          onChange={(e) => setEditPageName(e.target.value)}
                          autoFocus
                          className="w-full px-2 py-0.5 bg-slate-900 border border-amber-500 rounded text-xs text-white focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSavePageEdit(page.id);
                            if (e.key === 'Escape') setEditingPageId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSavePageEdit(page.id)}
                          className="p-1 text-emerald-400 hover:bg-slate-800 rounded cursor-pointer"
                          title="Kaydet"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingPageId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-800 rounded cursor-pointer"
                          title="İptal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col truncate pr-2">
                          <span className="truncate">{page.name}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {page.dataUrl ? '🎨 Çizim Var' : '📄 Boş Sayfa'}
                          </span>
                        </div>

                        {/* Edit & Delete Buttons */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingPageId(page.id);
                              setEditPageName(page.name);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 cursor-pointer"
                            title="İsmi Düzenle"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          {whiteboardPages.length > 1 && (
                            <button
                              onClick={() => {
                                if (window.confirm(`"${page.name}" sayfasını silmek istediğinize emin misiniz?`)) {
                                  deleteWhiteboardPage(page.id);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer"
                              title="Sayfayı Sil"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add New Whiteboard Page */}
            <div className="pt-1 border-t border-slate-800">
              {isAddingPage ? (
                <form onSubmit={handleAddPageSubmit} className="space-y-1.5 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="Örn: Şehir Haritası, Savaş Planı, Notlar..."
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    autoFocus
                    className="w-full px-2.5 py-1 bg-slate-950 border border-amber-500/70 rounded-lg text-slate-100 text-xs focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer text-[11px]"
                    >
                      Sayfa Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingPage(false)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer text-[11px]"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setIsAddingPage(true);
                    setNewPageName(`Tahta ${whiteboardPages.length + 1}`);
                  }}
                  className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-amber-400 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Yeni Tahta Sayfası / Katman Ekle</span>
                </button>
              )}
            </div>

          </div>
        )}
      </div>

      {/* BOTTOM REFERENCE & ASSET VAULT DRAWER (Gizli Kasa Mantığı) */}
      {!isStreamerMode && (
        <div 
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none"
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsVaultOpen(!isVaultOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/95 hover:bg-slate-850 border border-amber-500/60 hover:border-amber-400 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold text-slate-100 transition-all cursor-pointer group"
          >
            <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ImageIcon className="w-3.5 h-3.5" />
            </div>

            <span>🖼️ Referans & Görsel Kasası</span>
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full font-mono text-[10px]">
              {(whiteboardAssets || []).length}
            </span>

            <div className="text-slate-400 group-hover:text-amber-400 transition-colors">
              {isVaultOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </button>

          {/* Drawer Content */}
          {isVaultOpen && (
            <div className="mb-2 w-[92vw] max-w-3xl bg-slate-900/95 border border-amber-500/50 rounded-2xl shadow-2xl p-3 backdrop-blur-md text-xs space-y-2.5 animate-in slide-in-from-bottom-3 duration-200">
              
              {/* Header with Search & Filter & Add Button */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Görsel veya kategori ara..."
                    value={searchVault}
                    onChange={(e) => setSearchVault(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto max-w-[320px] py-0.5">
                  <button
                    onClick={() => setSelectedVaultCategory('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      selectedVaultCategory === 'all'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tümü
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedVaultCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap ${
                        selectedVaultCategory === cat
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Add New Asset Button */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={assetVaultFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          addWhiteboardAsset({
                            name: file.name.replace(/\.[^/.]+$/, ''),
                            category: selectedVaultCategory === 'all' ? 'Referanslar' : selectedVaultCategory,
                            image: ev.target.result as string,
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => assetVaultFileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold rounded-lg flex items-center gap-1 cursor-pointer text-[11px]"
                    title="Dosya Yükle"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Dosya Yükle</span>
                  </button>

                  <button
                    onClick={() => setIsAddingAsset(!isAddingAsset)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>URL ile Ekle</span>
                  </button>
                </div>

              </div>

              {/* Add by URL Form */}
              {isAddingAsset && (
                <form onSubmit={handleSaveNewAsset} className="p-2.5 bg-slate-950 rounded-xl border border-amber-500/50 space-y-2 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Görsel Başlığı..."
                      value={newAssetName}
                      onChange={(e) => setNewAssetName(e.target.value)}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      placeholder="Kategori (Örn: Haritalar, Bosslar...)"
                      value={newAssetCategory}
                      onChange={(e) => setNewAssetCategory(e.target.value)}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      placeholder="Görsel URL'si yapıştırın..."
                      value={newAssetUrl}
                      onChange={(e) => setNewAssetUrl(e.target.value)}
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer text-xs"
                    >
                      Kasaya Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingAsset(false)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer text-xs"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              )}

              {/* Grid of Reference Assets (Draggable) */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {filteredAssets.length === 0 ? (
                  <div className="col-span-full text-center py-6 text-slate-500">
                    Henüz bu kategoride referans görseli yok. Yukarıdan ekleyebilirsin!
                  </div>
                ) : (
                  filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('whiteboard-asset', JSON.stringify(asset));
                      }}
                      onClick={() => spawnImageAsStamp(asset.image, 120, 120)}
                      className="group relative bg-slate-950 border border-slate-800 hover:border-amber-500/70 rounded-xl p-1.5 flex flex-col items-center text-center cursor-grab active:cursor-grabbing hover:scale-105 transition-all shadow-md"
                      title="Tuvale sürükle veya tıkla"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-900 mb-1 flex items-center justify-center">
                        <img 
                          src={asset.image} 
                          alt={asset.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                        />
                      </div>

                      {/* Title & Badge */}
                      <span className="text-[11px] font-bold text-slate-200 truncate w-full">
                        {asset.name}
                      </span>
                      <span className="text-[9px] text-amber-400/70 font-semibold truncate w-full">
                        {asset.category || 'Referans'}
                      </span>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`"${asset.name}" görselini kasadan silmek istediğinize emin misiniz?`)) {
                            deleteWhiteboardAsset(asset.id);
                          }
                        }}
                        className="absolute top-1 right-1 p-1 bg-slate-950/90 text-slate-400 hover:text-rose-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                        title="Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="text-[10px] text-slate-500 text-center">
                💡 İpucu: Görselleri doğrudan çizim tahtasına sürükleyip bırakabilir veya üzerine tıklayarak tuvale ekleyebilirsin.
              </div>

            </div>
          )}
        </div>
      )}

      {/* Interactive Whiteboard Health Bars Layer */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {(whiteboardHealthBars || [])
          .filter((bar) => (!bar.pageId || bar.pageId === activeWhiteboardPageId))
          .map((bar) => {
            if (isStreamerMode && bar.isPublic === false) return null;

            const pct = Math.min(100, Math.max(0, Math.round((bar.currentHp / (bar.maxHp || 1)) * 100)));
            const isLowHp = pct > 0 && pct <= 25;
            const isDead = bar.currentHp <= 0;
            const barThemeColor = bar.color || '#ef4444';

            return (
              <div
                key={bar.id}
                style={{
                  left: `${bar.x}px`,
                  top: `${bar.y}px`,
                  width: `${bar.width || 280}px`,
                }}
                className={`absolute pointer-events-auto bg-slate-950/95 border rounded-2xl shadow-2xl backdrop-blur-md p-3 select-none transition-all ${
                  isLowHp ? 'border-rose-500 shadow-rose-500/20 animate-pulse' : 'border-slate-800 hover:border-slate-700'
                }`}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Header: Grip, Title & Actions */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {!isStreamerMode && (
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDraggingBarId(bar.id);
                          setDragBarOffset({ x: e.clientX - bar.x, y: e.clientY - bar.y });
                        }}
                        className="cursor-move text-slate-500 hover:text-amber-400 p-0.5"
                        title="Can Barını Sürükle"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}

                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: barThemeColor }} />

                    {!isStreamerMode ? (
                      <input
                        type="text"
                        value={bar.name}
                        onChange={(e) => updateWhiteboardHealthBar(bar.id, { name: e.target.value })}
                        className="flex-1 px-1.5 py-0.5 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-amber-500 text-slate-100 text-xs font-black focus:outline-none truncate"
                        placeholder="Can Barı Adı..."
                      />
                    ) : (
                      <span className="font-black text-xs text-slate-100 truncate">{bar.name}</span>
                    )}
                  </div>

                  {/* DM Controls */}
                  {!isStreamerMode && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Color preset cycle */}
                      <button
                        onClick={() => {
                          const colors = ['#ef4444', '#22c55e', '#a855f7', '#3b82f6', '#eab308'];
                          const currentIdx = colors.indexOf(bar.color || '#ef4444');
                          const nextColor = colors[(currentIdx + 1) % colors.length];
                          updateWhiteboardHealthBar(bar.id, { color: nextColor });
                        }}
                        className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:scale-125 transition-transform cursor-pointer"
                        style={{ backgroundColor: barThemeColor }}
                        title="Renk Değiştir"
                      />

                      {/* Visibility toggle */}
                      <button
                        onClick={() => updateWhiteboardHealthBar(bar.id, { isPublic: bar.isPublic === false ? true : false })}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer ${
                          bar.isPublic === false ? 'text-slate-600' : 'text-emerald-400'
                        }`}
                        title={bar.isPublic === false ? "Oyuncudan Gizli (Tıkla -> Göster)" : "Oyunculara Açık (Tıkla -> Gizle)"}
                      >
                        {bar.isPublic === false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteWhiteboardHealthBar(bar.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Can Barını Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Animated Health Progress Bar */}
                <div className="relative w-full h-5 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 mb-2">
                  <div
                    className="h-full transition-all duration-300 rounded-lg"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barThemeColor,
                      backgroundImage: 'linear-gradient(rgba(255,255,255,0.15), transparent)'
                    }}
                  />
                  
                  {/* Status Overlay Text */}
                  <div className="absolute inset-0 flex items-center justify-between px-2.5 text-[11px] font-black tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    <span className="flex items-center gap-1 font-mono">
                      <Heart className="w-3 h-3 fill-current" />
                      {bar.currentHp} / {bar.maxHp} HP
                    </span>
                    <span className="font-mono">
                      {isDead ? '💀 YENİLDİ' : `%${pct}`}
                    </span>
                  </div>
                </div>

                {/* DM Quick Adjust Steppers */}
                {!isStreamerMode && (
                  <div className="flex items-center justify-between gap-1 text-xs pt-1 border-t border-slate-900">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => updateWhiteboardHealthBar(bar.id, { currentHp: Math.max(0, bar.currentHp - 10) })}
                        className="px-1.5 py-0.5 bg-slate-900 hover:bg-rose-950/80 text-rose-400 font-mono font-bold rounded text-[10px] border border-slate-800 cursor-pointer"
                        title="10 Hasar"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => updateWhiteboardHealthBar(bar.id, { currentHp: Math.max(0, bar.currentHp - 5) })}
                        className="px-1.5 py-0.5 bg-slate-900 hover:bg-rose-950/80 text-rose-400 font-mono font-bold rounded text-[10px] border border-slate-800 cursor-pointer"
                        title="5 Hasar"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => updateWhiteboardHealthBar(bar.id, { currentHp: Math.max(0, bar.currentHp - 1) })}
                        className="px-1.5 py-0.5 bg-slate-900 hover:bg-rose-950/80 text-rose-400 font-mono font-bold rounded text-[10px] border border-slate-800 cursor-pointer"
                        title="1 Hasar"
                      >
                        -1
                      </button>
                    </div>

                    {/* Numeric Direct Edit */}
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <input
                        type="number"
                        min="0"
                        max={bar.maxHp}
                        value={bar.currentHp}
                        onChange={(e) => updateWhiteboardHealthBar(bar.id, { currentHp: Number(e.target.value) })}
                        className="w-10 px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-center text-rose-300 font-bold focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-slate-600">/</span>
                      <input
                        type="number"
                        min="1"
                        value={bar.maxHp}
                        onChange={(e) => updateWhiteboardHealthBar(bar.id, { maxHp: Number(e.target.value) })}
                        className="w-10 px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-center text-slate-400 font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => updateWhiteboardHealthBar(bar.id, { currentHp: Math.min(bar.maxHp, bar.currentHp + 1) })}
                        className="px-1.5 py-0.5 bg-slate-900 hover:bg-emerald-950/80 text-emerald-400 font-mono font-bold rounded text-[10px] border border-slate-800 cursor-pointer"
                        title="1 İyileşme"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => updateWhiteboardHealthBar(bar.id, { currentHp: Math.min(bar.maxHp, bar.currentHp + 5) })}
                        className="px-1.5 py-0.5 bg-slate-900 hover:bg-emerald-950/80 text-emerald-400 font-mono font-bold rounded text-[10px] border border-slate-800 cursor-pointer"
                        title="5 İyileşme"
                      >
                        +5
                      </button>
                      <button
                        onClick={() => updateWhiteboardHealthBar(bar.id, { currentHp: Math.min(bar.maxHp, bar.currentHp + 10) })}
                        className="px-1.5 py-0.5 bg-slate-900 hover:bg-emerald-950/80 text-emerald-400 font-mono font-bold rounded text-[10px] border border-slate-800 cursor-pointer"
                        title="10 İyileşme"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
    </div>
  );
};
