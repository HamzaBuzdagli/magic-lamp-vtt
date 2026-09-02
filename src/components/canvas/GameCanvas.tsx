import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  FolderOpen,
  Minus, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  X, 
  Edit3,
  Link,
  Unlink,
  Copy,
  Clipboard,
  Shield,
  Coins,
  Heart,
  Upload,
  Palette
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { Token, DrawPoint, DungeonRoom } from '../../types/game';

const COMMON_STATUS_EFFECTS = [
  '🤢 Zehirlendi',
  '⚡ Hızlandı',
  '🛡️ Kalkanlı',
  '🔥 Yanıyor',
  '💤 Uyuyor',
  '🩸 Kanamalı',
  '💫 Sersemledi',
  '👁️ Görünmez',
  '❄️ Dondu'
];

export const GameCanvas: React.FC = () => {
  const {
    isStreamerMode,
    layers,
    activeLayerId,
    activeTool,
    gridSize,
    showGrid,
    zoom,
    panOffset,
    setZoom,
    setPanOffset,
    tokens,
    rooms,
    connections,
    drawings,
    addDrawingPath,
    brushColor,
    brushWidth,
    addToken,
    moveToken,
    updateToken,
    deleteToken,
    sendToBackstage,
    selectedTokenId,
    selectToken,
    addTokenAttribute,
    updateTokenAttribute,
    deleteTokenAttribute,
    toggleTokenStatusEffect,
    selectedRoomIds,
    setSelectedRoomIds,
    toggleSelectRoom,
    moveRoomsDelta,
    updateRoom,
    deleteRooms,
    toggleRoomReveal,
    setSpawnPoint,
    connectRooms,
    disconnectRooms,
    copyRooms,
    pasteRooms,
    copiedRooms,
    undoMap,
    redoMap,
    pushMapHistory,
  } = useGameStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction State
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDrawingLive, setIsDrawingLive] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawPoint[]>([]);

  // Room Dragging State
  const [isDraggingRooms, setIsDraggingRooms] = useState(false);
  const [lastDragGridPos, setLastDragGridPos] = useState<{ gx: number; gy: number }>({ gx: 0, gy: 0 });

  // Marquee Box Selection State
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [marqueeCurrent, setMarqueeCurrent] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Popups / Modals
  const [activeTokenInspectorId, setActiveTokenInspectorId] = useState<string | null>(null);
  const [rulerStart, setRulerStart] = useState<{ x: number; y: number } | null>(null);
  const [rulerCurrent, setRulerCurrent] = useState<{ x: number; y: number } | null>(null);
  const [playerViewTokenId, setPlayerViewTokenId] = useState<string | null>(null);
  const [roomContextMenu, setRoomContextMenu] = useState<{ x: number; y: number; clickedRoomId?: string } | null>(null);
  const [tokenContextMenu, setTokenContextMenu] = useState<{ x: number; y: number; token: Token } | null>(null);
  const [activeRoomInspectorId, setActiveRoomInspectorId] = useState<string | null>(null);
  const [, setRenderTrigger] = useState(0);
  const roomImageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const roomFileInputRef = useRef<HTMLInputElement | null>(null);

  const getRoomImage = (src: string) => {
    if (!src) return null;
    if (!roomImageCache.current.has(src)) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setRenderTrigger((r) => r + 1);
      };
      roomImageCache.current.set(src, img);
      return img;
    }
    return roomImageCache.current.get(src) || null;
  };

  // New Attribute Form
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrType, setNewAttrType] = useState<'number' | 'text'>('number');
  const [newAttrValue, setNewAttrValue] = useState<string | number>(100);

    // Active Layer Filtering for Multi-Floor system
  const defaultLayerId = layers[0]?.id || 'layer-1';
  const activeRooms = rooms.filter((r) => (r.layerId || defaultLayerId) === activeLayerId);
  const activeConnections = connections.filter((c) => (c.layerId || defaultLayerId) === activeLayerId);
  const activeDrawings = drawings.filter((d) => (d.layerId || defaultLayerId) === activeLayerId);
  const activeTokens = tokens.filter((t) => (t.layerId || defaultLayerId) === activeLayerId);

  // Resize canvas to container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+C, Ctrl+V, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isStreamerMode) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Undo / Redo (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redoMap();
        } else {
          undoMap();
        }
        return;
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoMap();
        return;
      }

      if (activeTool === 'room_edit') {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
          if (selectedRoomIds.length > 0) {
            copyRooms();
          }
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
          if (copiedRooms.length > 0) {
            pushMapHistory();
            pasteRooms(5, 5);
          }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedRoomIds.length > 0) {
            pushMapHistory();
            deleteRooms(selectedRoomIds);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, isStreamerMode, selectedRoomIds, copiedRooms, undoMap, redoMap, copyRooms, pasteRooms, deleteRooms, pushMapHistory]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    const cell = gridSize;

    // 1. Render Grid
    if (showGrid) {
      const startX = Math.floor(-panOffset.x / zoom / cell) * cell - cell * 2;
      const endX = startX + (canvas.width / zoom) + cell * 4;
      const startY = Math.floor(-panOffset.y / zoom / cell) * cell - cell * 2;
      const endY = startY + (canvas.height / zoom) + cell * 4;

      ctx.beginPath();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1 / zoom;

      for (let x = startX; x <= endX; x += cell) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += cell) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    }

    // 2. Render Dungeon Room Connections (Corridors)
    activeConnections.forEach((conn) => {
      const roomA = rooms.find((r) => r.id === conn.fromRoomId);
      const roomB = rooms.find((r) => r.id === conn.toRoomId);
      if (!roomA || !roomB) return;

      const ax = (roomA.x + roomA.width / 2) * cell;
      const ay = (roomA.y + roomA.height / 2) * cell;
      const bx = (roomB.x + roomB.width / 2) * cell;
      const by = (roomB.y + roomB.height / 2) * cell;

      // Outer stone wall of corridor
      ctx.beginPath();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 22 / zoom;
      ctx.lineCap = 'round';
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // Inner corridor floor path
      ctx.beginPath();
      ctx.strokeStyle = '#161b26';
      ctx.lineWidth = 16 / zoom;
      ctx.lineCap = 'round';
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // Dashed stone tiles in the middle
      ctx.beginPath();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([6 / zoom, 6 / zoom]);
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 3. Render Dungeon Rooms
    activeRooms.forEach((room) => {
      const rx = room.x * cell;
      const ry = room.y * cell;
      const rw = room.width * cell;
      const rh = room.height * cell;
      const isSelected = selectedRoomIds.includes(room.id) || activeRoomInspectorId === room.id;

      // Theme background
      if (room.theme === 'crypt') ctx.fillStyle = '#18181f';
      else if (room.theme === 'magma') ctx.fillStyle = '#260f12';
      else if (room.theme === 'nature') ctx.fillStyle = '#0f1f14';
      else if (room.theme === 'gold') ctx.fillStyle = '#231b0c';
      else ctx.fillStyle = '#161b26'; // stone

      ctx.fillRect(rx, ry, rw, rh);

      // Render custom room image if uploaded
      if (room.image) {
        const roomImg = getRoomImage(room.image);
        if (roomImg && roomImg.complete && roomImg.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(rx, ry, rw, rh);
          ctx.clip();
          ctx.drawImage(roomImg, rx, ry, rw, rh);
          ctx.restore();
        }
      }

      // Floor grid tiles inside room
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      for (let x = rx; x <= rx + rw; x += cell) {
        ctx.moveTo(x, ry);
        ctx.lineTo(x, ry + rh);
      }
      for (let y = ry; y <= ry + rh; y += cell) {
        ctx.moveTo(rx, y);
        ctx.lineTo(rx + rw, y);
      }
      ctx.stroke();

      // Room Title Header Bar
      ctx.fillStyle = isSelected ? 'rgba(234, 179, 8, 0.35)' : room.isSpawnPoint ? 'rgba(239, 68, 68, 0.35)' : 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(rx, ry, rw, 22 / zoom);

      ctx.fillStyle = isSelected ? '#fde047' : room.isSpawnPoint ? '#fca5a5' : 'rgba(255,255,255,0.7)';
      ctx.font = `bold ${11 / zoom}px system-ui`;
      ctx.fillText(`🏰 ${room.name} (${room.width}x${room.height})`, rx + 6 / zoom, ry + 15 / zoom);

      if (room.isSpawnPoint && !isStreamerMode) {
        ctx.fillStyle = '#ef4444';
        ctx.font = `bold ${10 / zoom}px system-ui`;
        ctx.fillText(`🎯 [OLUŞUM NOKTASI]`, rx + rw - (130 / zoom), ry + 15 / zoom);
      }

      // Stone Wall Border
      ctx.strokeStyle = isSelected ? '#f59e0b' : room.theme === 'magma' ? '#dc2626' : room.theme === 'gold' ? '#eab308' : '#475569';
      ctx.lineWidth = isSelected ? 4 / zoom : 2.5 / zoom;
      ctx.strokeRect(rx, ry, rw, rh);

      // Floor Label / Text written in room
      const canShowLabel = room.label && (!isStreamerMode || room.isNotePublic || room.isRevealed);
      if (canShowLabel && room.label) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = `bold ${13 / zoom}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(room.label, rx + rw / 2, ry + rh / 2);

        if (room.notes && !isStreamerMode) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = `italic ${10 / zoom}px system-ui`;
          ctx.fillText(room.notes.length > 35 ? room.notes.substring(0, 32) + '...' : room.notes, rx + rw / 2, ry + rh / 2 + 16 / zoom);
        }
        ctx.restore();
      }

      // Fog of War Overlay
      if (!room.isRevealed) {
        if (isStreamerMode) {
          ctx.fillStyle = '#090a0f';
          ctx.fillRect(rx, ry, rw, rh);
          ctx.fillStyle = '#334155';
          ctx.font = `italic ${13 / zoom}px system-ui`;
          ctx.textAlign = 'center';
          ctx.fillText('🌫️ Keşfedilmemiş Alan', rx + rw / 2, ry + rh / 2);
          ctx.textAlign = 'left';
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.fillRect(rx, ry, rw, rh);
          ctx.fillStyle = '#94a3b8';
          ctx.font = `bold ${11 / zoom}px system-ui`;
          ctx.fillText('🌫️ [SİSLİ - DM]', rx + 8, ry + rh - 8);
        }
      }
    });

    // 4. Render Permanent Drawing Paths
    activeDrawings.forEach((d) => {
      if (d.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = d.color;
      ctx.lineWidth = d.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(d.points[0].x, d.points[0].y);
      for (let i = 1; i < d.points.length; i++) {
        ctx.lineTo(d.points[i].x, d.points[i].y);
      }
      ctx.stroke();
    });

    // 5. Render Live In-Progress Drawing
    if (isDrawingLive && currentStroke.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = activeTool === 'laser' ? '#f43f5e' : brushColor;
      ctx.lineWidth = activeTool === 'laser' ? 6 : brushWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (activeTool === 'laser') {
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
      }
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 6. Render Marquee Box Selection Overlay
    if (isMarqueeActive) {
      const bx = Math.min(marqueeStart.x, marqueeCurrent.x);
      const by = Math.min(marqueeStart.y, marqueeCurrent.y);
      const bw = Math.abs(marqueeCurrent.x - marqueeStart.x);
      const bh = Math.abs(marqueeCurrent.y - marqueeStart.y);

      ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
      ctx.fillRect(bx, by, bw, bh);

      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);
    }

    // 7. Render Ruler Measurement
    if (rulerStart && rulerCurrent) {
      const startX = rulerStart.x * cell;
      const startY = rulerStart.y * cell;
      const endX = rulerCurrent.x * cell;
      const endY = rulerCurrent.y * cell;

      const dx = rulerCurrent.x - rulerStart.x;
      const dy = rulerCurrent.y - rulerStart.y;
      const gridDist = Math.hypot(dx, dy);
      const feetDist = Math.round(gridDist * 5);
      const cellsCount = gridDist.toFixed(1);

      ctx.beginPath();
      ctx.setLineDash([8 / zoom, 6 / zoom]);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3 / zoom;
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.fillStyle = '#f59e0b';
      ctx.arc(startX, startY, 5 / zoom, 0, Math.PI * 2);
      ctx.arc(endX, endY, 5 / zoom, 0, Math.PI * 2);
      ctx.fill();

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2 - (15 / zoom);

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5 / zoom;
      const text = `📏 ${feetDist} ft (${cellsCount} Kare)`;
      ctx.font = `bold ${Math.max(12, 14 / zoom)}px monospace`;
      const textWidth = ctx.measureText(text).width;
      const padding = 6 / zoom;
      
      ctx.beginPath();
      ctx.roundRect(midX - textWidth / 2 - padding, midY - (14 / zoom), textWidth + padding * 2, 20 / zoom, 6 / zoom);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, midX, midY - (4 / zoom));
      ctx.restore();
    }

    ctx.restore();
  }, [rooms, connections, drawings, activeRooms, activeConnections, activeDrawings, activeLayerId, isDrawingLive, currentStroke, zoom, panOffset, showGrid, gridSize, isStreamerMode, activeTool, brushColor, brushWidth, selectedRoomIds, activeRoomInspectorId, isMarqueeActive, marqueeStart, marqueeCurrent, rulerStart, rulerCurrent]);

  // Coordinate Helpers
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - panOffset.x) / zoom,
      y: (screenY - panOffset.y) / zoom,
    };
  }, [panOffset, zoom]);

  const worldToGrid = useCallback((worldX: number, worldY: number) => {
    return {
      gx: Math.floor(worldX / gridSize),
      gy: Math.floor(worldY / gridSize),
    };
  }, [gridSize]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);
    const { gx, gy } = worldToGrid(world.x, world.y);

    // Ruler Tool
    if (activeTool === 'ruler') {
      setRulerStart({ x: gx, y: gy });
      setRulerCurrent({ x: gx, y: gy });
      return;
    }

    // Pan
    if (e.button === 1 || activeTool === 'pan') {
      setIsPanning(true);
      setStartPanPos({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // Live Drawing or Laser
    if (activeTool === 'draw' || activeTool === 'laser') {
      setIsDrawingLive(true);
      setCurrentStroke([{ x: world.x, y: world.y }]);
      return;
    }

    // Fog Reveal / Hide Click on Room
    if (activeTool === 'fog_reveal' || activeTool === 'fog_hide') {
      const clickedRoom = activeRooms.find(
        (r) => gx >= r.x && gx < r.x + r.width && gy >= r.y && gy < r.y + r.height
      );
      if (clickedRoom) {
        if (activeTool === 'fog_reveal') {
          updateRoom(clickedRoom.id, { isRevealed: true });
        } else {
          updateRoom(clickedRoom.id, { isRevealed: false });
        }
      }
      return;
    }

    // Player Mode: Left-click does NOT toggle fog (requires right-click)

    // ROOM EDIT MODE
    if (activeTool === 'room_edit') {
      const clickedRoom = activeRooms.slice().reverse().find(
        (r) => gx >= r.x && gx < r.x + r.width && gy >= r.y && gy < r.y + r.height
      );

      if (e.button === 0) {
        if (clickedRoom) {
          if (e.shiftKey) {
            toggleSelectRoom(clickedRoom.id, true);
          } else {
            if (!selectedRoomIds.includes(clickedRoom.id)) {
              setSelectedRoomIds([clickedRoom.id]);
            }
          }
          setIsDraggingRooms(true);
          setLastDragGridPos({ gx, gy });
        } else {
          setIsMarqueeActive(true);
          setMarqueeStart({ x: world.x, y: world.y });
          setMarqueeCurrent({ x: world.x, y: world.y });
          if (!e.shiftKey) {
            setSelectedRoomIds([]);
          }
          setRoomContextMenu(null);
    setTokenContextMenu(null);
        }
      }
      return;
    }

    // Normal Select Mode
    setRoomContextMenu(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
        if (activeTool === 'ruler' && rulerStart) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const gx = Math.round((e.clientX - rect.left - panOffset.x) / zoom / gridSize);
        const gy = Math.round((e.clientY - rect.top - panOffset.y) / zoom / gridSize);
        setRulerCurrent({ x: gx, y: gy });
      }
      return;
    }
    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPanPos.x,
        y: e.clientY - startPanPos.y,
      });
      return;
    }

    if (isMarqueeActive) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      setMarqueeCurrent({ x: world.x, y: world.y });
      return;
    }

    if (isDraggingRooms && selectedRoomIds.length > 0) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const { gx, gy } = worldToGrid(world.x, world.y);
      const dx = gx - lastDragGridPos.gx;
      const dy = gy - lastDragGridPos.gy;
      if (dx !== 0 || dy !== 0) {
        moveRoomsDelta(selectedRoomIds, dx, dy);
        setLastDragGridPos({ gx, gy });
      }
      return;
    }

    if (isDrawingLive) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      setCurrentStroke((prev) => [...prev, { x: world.x, y: world.y }]);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (activeTool === 'ruler') {
      // Keep ruler visible or reset on next click
    }
    if (isDraggingRooms) setIsDraggingRooms(false);

    if (isMarqueeActive) {
      const x1 = Math.min(marqueeStart.x, marqueeCurrent.x);
      const x2 = Math.max(marqueeStart.x, marqueeCurrent.x);
      const y1 = Math.min(marqueeStart.y, marqueeCurrent.y);
      const y2 = Math.max(marqueeStart.y, marqueeCurrent.y);
      const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

      if (dist > 15) {
        const cell = gridSize;
        const matched = activeRooms.filter((r) => {
          const rx1 = r.x * cell;
          const rx2 = (r.x + r.width) * cell;
          const ry1 = r.y * cell;
          const ry2 = (r.y + r.height) * cell;
          return !(rx2 < x1 || rx1 > x2 || ry2 < y1 || ry1 > y2);
        });

        setSelectedRoomIds(matched.map((r) => r.id));
      }

      setIsMarqueeActive(false);
    }

    if (isDrawingLive) {
      if (currentStroke.length > 1) {
        addDrawingPath({
          id: `path-${Date.now()}`,
          points: currentStroke,
          color: activeTool === 'laser' ? '#f43f5e' : brushColor,
          width: activeTool === 'laser' ? 5 : brushWidth,
          isLaser: activeTool === 'laser',
        });
      }
      setIsDrawingLive(false);
      setCurrentStroke([]);
    }
  };

  // Right Click Context Menu (Order-Independent)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const { gx, gy } = worldToGrid(world.x, world.y);

    const clickedRoom = activeRooms.slice().reverse().find(
      (r) => gx >= r.x && gx < r.x + r.width && gy >= r.y && gy < r.y + r.height
    );

    let nextSelected = [...selectedRoomIds];

    if (clickedRoom) {
      if (selectedRoomIds.length === 1 && !selectedRoomIds.includes(clickedRoom.id)) {
        // If 1 room is already selected and user right-clicks another room -> select BOTH!
        nextSelected = [selectedRoomIds[0], clickedRoom.id];
        setSelectedRoomIds(nextSelected);
      } else if (!selectedRoomIds.includes(clickedRoom.id)) {
        nextSelected = [clickedRoom.id];
        setSelectedRoomIds(nextSelected);
      }
    }

    if (clickedRoom || nextSelected.length > 0) {
      setRoomContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        clickedRoomId: clickedRoom?.id,
      });
    }
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prevZoom) => Math.min(Math.max(prevZoom * zoomFactor, 0.3), 2.5));
  };

  // Token Dragging Handlers
  const handleTokenDragStart = (e: React.DragEvent, tokenId: string) => {
    e.dataTransfer.setData('text/plain', tokenId);
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tokenId = e.dataTransfer.getData('text/plain');
    if (!tokenId) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const world = screenToWorld(screenX, screenY);
    const { gx, gy } = worldToGrid(world.x, world.y);

    moveToken(tokenId, Math.max(0, gx), Math.max(0, gy));
  };

  const handleTokenRightClick = (e: React.MouseEvent, token: Token) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isStreamerMode) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      selectToken(token.id);
      setRoomContextMenu(null);
      setTokenContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        token,
      });
    }
  };

  const activeInspectorToken = tokens.find((t) => t.id === activeTokenInspectorId);
  const activePlayerToken = tokens.find((t) => t.id === playerViewTokenId);
  const activeInspectorRoom = rooms.find((r) => r.id === activeRoomInspectorId);

  // Check if selected rooms have connection
  const areSelectedRoomsConnected = selectedRoomIds.length === 2 && connections.some(
    (c) => (c.fromRoomId === selectedRoomIds[0] && c.toRoomId === selectedRoomIds[1]) ||
           (c.fromRoomId === selectedRoomIds[1] && c.toRoomId === selectedRoomIds[0])
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-slate-950 ${
        activeTool === 'pan' || isPanning ? 'cursor-grab active:cursor-grabbing' :
        activeTool === 'room_edit' || activeTool === 'fog_reveal' || activeTool === 'fog_hide' ? 'cursor-pointer' :
        activeTool === 'draw' || activeTool === 'laser' ? 'cursor-crosshair' : 'cursor-default'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleContainerDrop}
      onDoubleClick={(e) => {
        if (activeTool === 'room_edit' && !isStreamerMode) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
          const { gx, gy } = worldToGrid(world.x, world.y);
          const room = activeRooms.slice().reverse().find(
            (r) => gx >= r.x && gx < r.x + r.width && gy >= r.y && gy < r.y + r.height
          );
          if (room) {
            setActiveRoomInspectorId(room.id);
          }
        }
      }}
    >
      {/* HTML5 Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      {/* HTML Token & Avatar Layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {activeTokens.map((token) => {
          if (isStreamerMode) {
            if (token.hiddenFromPlayers) return null;
            // Check if token is inside an undiscovered/fogged room
            const tokenRoom = rooms.find(
              (r) => token.x >= r.x && token.x < r.x + (r.width || 1) && token.y >= r.y && token.y < r.y + (r.height || 1)
            );
            const isInFog = tokenRoom && !tokenRoom.isRevealed;
            if (isInFog && (token.hideInFog || (token.hideInFog === undefined && token.type !== 'hero'))) {
              return null;
            }
          }
          const isSelected = selectedTokenId === token.id;
          const tokenW = (token.size || 1) * gridSize;
          const tokenH = (token.sizeY || token.size || 1) * gridSize;

          // Main numeric attributes for badge preview
          const goldAttr = token.customAttributes?.find((a) => a.name.toLowerCase().includes('para') || a.name.toLowerCase().includes('altın'));
          const acAttr = token.customAttributes?.find((a) => a.name.toLowerCase().includes('ac') || a.name.toLowerCase().includes('zırh'));

          return (
            <div
              key={token.id}
              draggable={activeTool === 'select'}
              onDragStart={(e) => handleTokenDragStart(e, token.id)}
              onClick={(e) => { 
                if (activeTool === 'fog_reveal' || activeTool === 'fog_hide') return;
                e.stopPropagation(); 
                selectToken(token.id);
              }}
              onDoubleClick={(e) => {
                if (activeTool === 'fog_reveal' || activeTool === 'fog_hide') return;
                e.stopPropagation();
                if (isStreamerMode) {
                  setPlayerViewTokenId(token.id);
                } else {
                  setActiveTokenInspectorId(token.id);
                }
              }}
              onContextMenu={(e) => handleTokenRightClick(e, token)}
              style={{
                left: `${token.x * gridSize}px`,
                top: `${token.y * gridSize}px`,
                width: `${tokenW}px`,
                height: `${tokenH}px`,
              }}
              className={`absolute transition-transform flex items-center justify-center select-none group ${
                activeTool === 'fog_reveal' || activeTool === 'fog_hide' ? 'pointer-events-none' : 'pointer-events-auto cursor-grab active:cursor-grabbing'
              } ${
                isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 scale-105 z-30' : 'z-20 hover:scale-105'
              }`}
            >
              {/* Token Graphic Body */}
              <div 
                className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-2 flex items-center justify-center p-1 backdrop-blur-sm"
                style={{
                  backgroundColor: token.image ? 'rgba(15, 23, 42, 0.85)' : (token.color || '#3b82f6'),
                  borderColor: token.type === 'monster' ? '#ef4444' : token.type === 'hero' ? '#3b82f6' : '#eab308'
                }}
              >
                {token.image ? (
                  <img src={token.image} alt={token.name} className="w-full h-full object-contain filter drop-shadow" />
                ) : (
                  <span className="text-white font-black text-lg drop-shadow">
                    {token.name.charAt(0)}
                  </span>
                )}

                {/* HP Mini Counter Bar */}
                {token.hp && (
                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 px-1 py-0.5 flex flex-col items-center">
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-0.5">
                      <div 
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, (token.hp.current / token.hp.max) * 100))}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-rose-300 leading-none">
                      {token.hp.current}/{token.hp.max}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Effect Badges (Floating on top right) */}
              {token.statusEffects && token.statusEffects.length > 0 && (
                <div className="absolute -top-3 -right-2 flex gap-0.5 z-40">
                  {token.statusEffects.slice(0, 3).map((eff, i) => (
                    <span key={i} className="text-xs filter drop-shadow scale-110" title={eff}>
                      {eff.split(' ')[0]}
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Stat Pill (e.g. Gold / AC on corners) */}
              {goldAttr && (
                <div className="absolute -bottom-2 -left-2 bg-amber-950/90 border border-amber-500/80 rounded-full px-1.5 py-0.2 text-[9px] font-bold text-amber-300 flex items-center gap-0.5 shadow-md">
                  <Coins className="w-2.5 h-2.5 text-amber-400" />
                  <span>{goldAttr.value}</span>
                </div>
              )}

              {acAttr && (
                <div className="absolute -bottom-2 -right-2 bg-blue-950/90 border border-blue-500/80 rounded-full px-1.5 py-0.2 text-[9px] font-bold text-blue-300 flex items-center gap-0.5 shadow-md">
                  <Shield className="w-2.5 h-2.5 text-blue-400" />
                  <span>{acAttr.value}</span>
                </div>
              )}

              {/* Name Tag Badge on Top */}
              <div className="absolute -top-5 inset-x-0 flex justify-center pointer-events-none">
                <span className="px-1.5 py-0.2 rounded bg-slate-950/90 border border-slate-800 text-[10px] font-bold text-slate-200 shadow truncate max-w-full">
                  {token.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Player View Token Read-Only Stats Inspector Modal (when player double-clicks on token) */}
      {playerViewTokenId && activePlayerToken && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in select-none"
          onClick={() => setPlayerViewTokenId(null)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border-2 border-amber-500/70 rounded-3xl shadow-2xl p-6 space-y-5 text-xs max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                <div 
                  className="w-14 h-14 rounded-2xl border-2 border-amber-400 overflow-hidden flex items-center justify-center bg-slate-950 shadow-md shrink-0"
                  style={{ backgroundColor: activePlayerToken.color || '#3b82f6' }}
                >
                  {activePlayerToken.image ? (
                    <img src={activePlayerToken.image} alt={activePlayerToken.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-white font-black text-2xl">{activePlayerToken.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-100">{activePlayerToken.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 text-[10px] font-bold uppercase border border-slate-700">
                      {activePlayerToken.type === 'hero' ? '🛡️ Kahraman' : activePlayerToken.type === 'monster' ? '⚔️ Canavar' : '📦 Eşya / Obje'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                      Salt Okunur
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setPlayerViewTokenId(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-Only HP Bar */}
            {activePlayerToken.hp && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span className="font-black">Can Puanı (HP)</span>
                  </span>
                  <div className="flex items-center gap-1 font-mono font-black text-sm text-rose-300">
                    <span>{activePlayerToken.hp.current}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-400">{activePlayerToken.hp.max}</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(0, (activePlayerToken.hp.current / activePlayerToken.hp.max) * 100))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Active Status Effects (Read-Only Badges) */}
            {activePlayerToken.statusEffects && activePlayerToken.statusEffects.length > 0 && (
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Aktif Durumlar & Efektler
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activePlayerToken.statusEffects.map((eff, i) => (
                    <span 
                      key={i}
                      className="px-2.5 py-1 rounded-xl bg-purple-950/80 border border-purple-700/80 text-purple-200 font-bold text-xs shadow-sm flex items-center gap-1"
                    >
                      <span>{eff}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Attributes (Read-Only Grid) */}
            {activePlayerToken.customAttributes && activePlayerToken.customAttributes.length > 0 && (
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Nitelikler & Statlar</span>
                  <span className="text-[9px] font-mono text-slate-500">DM Kontrollü</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {activePlayerToken.customAttributes.map((attr) => (
                    <div 
                      key={attr.id}
                      className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <span className="font-bold text-slate-300 truncate mr-2">{attr.name}</span>
                      <span className="px-2 py-0.5 bg-slate-950 text-amber-300 font-mono font-black rounded-lg border border-slate-800">
                        {attr.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Public Notes (Read-Only) */}
            {activePlayerToken.notes && (
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Açıklama & Notlar</div>
                <p className="text-slate-300 italic leading-relaxed text-xs">
                  "{activePlayerToken.notes}"
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 text-center">
              <button
                onClick={() => setPlayerViewTokenId(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DM Full Token Inspector & Custom Attributes Sheet */}
      {activeInspectorToken && !isStreamerMode && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setActiveTokenInspectorId(null)}
        >
          <div 
            className="w-full max-w-lg bg-slate-900 border border-amber-500/60 rounded-3xl shadow-2xl p-6 space-y-4 text-xs animate-in fade-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl border-2 border-amber-400 overflow-hidden flex items-center justify-center bg-slate-950 shadow-md"
                  style={{ backgroundColor: activeInspectorToken.color || '#3b82f6' }}
                >
                  {activeInspectorToken.image ? (
                    <img src={activeInspectorToken.image} alt={activeInspectorToken.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-white font-black text-xl">{activeInspectorToken.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={activeInspectorToken.name}
                    onChange={(e) => updateToken(activeInspectorToken.id, { name: e.target.value })}
                    className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-bold text-sm focus:outline-none focus:border-amber-500 w-full"
                    placeholder="Varlık İsmi..."
                  />
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-slate-400 font-mono">Tür:</span>
                    {(['hero', 'monster', 'npc', 'item'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => updateToken(activeInspectorToken.id, { type: t })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                          activeInspectorToken.type === t
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {t === 'hero' ? 'Kahraman' : t === 'monster' ? 'Canavar' : t === 'npc' ? 'NPC' : 'Eşya'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setActiveTokenInspectorId(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visual & Appearance Customization Panel */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5 text-xs">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Görsel & Boyut Ayarları</span>
                </span>
                {activeInspectorToken.image && (
                  <button
                    onClick={() => updateToken(activeInspectorToken.id, { image: undefined })}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Resmi Kaldır (Harfe Dön)
                  </button>
                )}
              </div>

              {/* Image Upload & URL Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Resim Dosyası Yükle</label>
                  <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-dashed border-amber-500/50 rounded-xl cursor-pointer text-xs font-bold transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Dosya Seç / Yükle</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            updateToken(activeInspectorToken.id, { image: ev.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Veya Resim Linki / URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={activeInspectorToken.image || ''}
                    onChange={(e) => updateToken(activeInspectorToken.id, { image: e.target.value || undefined })}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Color Palette & Token Grid Dimensions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-900">
                {/* Color Palette */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Tema Rengi</label>
                  <div className="flex items-center gap-1.5">
                    {['#3b82f6', '#ef4444', '#eab308', '#22c55e', '#a855f7', '#ec4899', '#94a3b8', '#000000'].map((c) => (
                      <button
                        key={c}
                        onClick={() => updateToken(activeInspectorToken.id, { color: c })}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer border border-white/20 ${
                          activeInspectorToken.color === c ? 'scale-125 ring-2 ring-amber-400' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Grid Size Steppers (Width x Height) */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Grid Boyutu (GxY)</label>
                  <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">G:</span>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={activeInspectorToken.size || 1}
                      onChange={(e) => updateToken(activeInspectorToken.id, { size: Math.max(1, Number(e.target.value)) })}
                      className="w-8 bg-transparent text-amber-400 font-bold text-center text-xs focus:outline-none"
                    />
                    <span className="text-slate-600 font-bold">x</span>
                    <span className="text-[10px] text-slate-500 font-mono">Y:</span>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={activeInspectorToken.sizeY || activeInspectorToken.size || 1}
                      onChange={(e) => updateToken(activeInspectorToken.id, { sizeY: Math.max(1, Number(e.target.value)) })}
                      className="w-8 bg-transparent text-amber-400 font-bold text-center text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* HP Stepper */}
            {activeInspectorToken.hp && (
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>Can (HP)</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateToken(activeInspectorToken.id, {
                      hp: { ...activeInspectorToken.hp!, current: Math.max(0, activeInspectorToken.hp!.current - 1) }
                    })}
                    className="w-8 h-8 rounded-xl bg-rose-950 text-rose-400 hover:bg-rose-900 border border-rose-800 flex items-center justify-center font-bold cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-rose-300 text-sm w-16 text-center">
                    {activeInspectorToken.hp.current}/{activeInspectorToken.hp.max}
                  </span>
                  <button
                    onClick={() => updateToken(activeInspectorToken.id, {
                      hp: { ...activeInspectorToken.hp!, current: Math.min(activeInspectorToken.hp!.max, activeInspectorToken.hp!.current + 1) }
                    })}
                    className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800 flex items-center justify-center font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Status Effects Toggles */}
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">Durum Efektleri (Tıkla & Aç/Kapat)</label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_STATUS_EFFECTS.map((eff) => {
                  const isActive = activeInspectorToken.statusEffects?.includes(eff);
                  return (
                    <button
                      key={eff}
                      onClick={() => toggleTokenStatusEffect(activeInspectorToken.id, eff)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-md scale-105'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {eff}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Attributes List (Para, Mana, AC vb.) */}
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">Özel Nitelikler & Değerler (Para, Mana, AC vb.)</label>
              <div className="space-y-2">
                {(activeInspectorToken.customAttributes || []).map((attr) => (
                  <div key={attr.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-slate-300">{attr.name}</span>
                    <div className="flex items-center gap-2">
                      {attr.type === 'number' ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateTokenAttribute(activeInspectorToken.id, attr.id, {
                              value: Number(attr.value) - 1
                            })}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-14 text-center font-mono font-bold text-amber-400">{attr.value}</span>
                          <button
                            onClick={() => updateTokenAttribute(activeInspectorToken.id, attr.id, {
                              value: Number(attr.value) + 1
                            })}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={String(attr.value)}
                          onChange={(e) => updateTokenAttribute(activeInspectorToken.id, attr.id, { value: e.target.value })}
                          className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs w-32 focus:outline-none focus:border-amber-500"
                        />
                      )}

                      <button
                        onClick={() => deleteTokenAttribute(activeInspectorToken.id, attr.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Niteliği Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Attribute Inputs */}
              <div className="mt-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nitelik Adı (Örn: Para, Mana, AC)..."
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />

                <select
                  value={newAttrType}
                  onChange={(e) => setNewAttrType(e.target.value as any)}
                  className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-xs cursor-pointer"
                >
                  <option value="number">Sayı (Integer)</option>
                  <option value="text">Yazı (String)</option>
                </select>

                <input
                  type={newAttrType === 'number' ? 'number' : 'text'}
                  placeholder="Değer..."
                  value={newAttrValue}
                  onChange={(e) => setNewAttrValue(newAttrType === 'number' ? Number(e.target.value) : e.target.value)}
                  className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs text-center focus:outline-none focus:border-amber-500"
                />

                <button
                  onClick={() => {
                    if (!newAttrName.trim()) return;
                    addTokenAttribute(activeInspectorToken.id, {
                      name: newAttrName.trim(),
                      type: newAttrType,
                      value: newAttrValue,
                      isPublic: true,
                    });
                    setNewAttrName('');
                    setNewAttrValue(100);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>

            {/* Bottom Actions: Sahne Arkası & Sil */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  sendToBackstage(activeInspectorToken.id);
                  setActiveTokenInspectorId(null);
                }}
                className="px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
                title="Token'ı haritadan gizler ve alttaki gizli DM kasasına taşır."
              >
                <EyeOff className="w-4 h-4" />
                <span>🎭 Sahne Arkasına At (Gizle)</span>
              </button>

              <button
                onClick={() => {
                  deleteToken(activeInspectorToken.id);
                  setActiveTokenInspectorId(null);
                }}
                className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Haritadan Sil</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Token Right Click Context Menu */}
      {tokenContextMenu && !isStreamerMode && (
        <div
          style={{ left: `${tokenContextMenu.x}px`, top: `${tokenContextMenu.y}px` }}
          className="absolute z-50 w-60 bg-slate-900/95 border border-purple-500/60 rounded-xl shadow-2xl p-1.5 backdrop-blur-md text-xs space-y-1 animate-in fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              {tokenContextMenu.token.image ? (
                <img src={tokenContextMenu.token.image} alt="tok" className="w-3.5 h-3.5 rounded-full object-cover" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full bg-purple-500 text-white text-[8px] flex items-center justify-center font-bold">
                  {tokenContextMenu.token.name.charAt(0)}
                </span>
              )}
              <span className="truncate text-slate-200">{tokenContextMenu.token.name}</span>
            </div>
            <button onClick={() => setTokenContextMenu(null)} className="text-slate-500 hover:text-white cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Send to Backstage Vault */}
          <button
            onClick={() => {
              sendToBackstage(tokenContextMenu.token.id);
              setTokenContextMenu(null);
            }}
            className="w-full px-2 py-1.5 text-left text-purple-300 hover:bg-purple-950/80 hover:text-white rounded-lg flex items-center gap-2 transition-colors font-bold cursor-pointer"
            title="Token'ı tüm statları, canı ve zırhıyla beraber gizli kasaya kaldırır (Tek seferlik olarak saklanır)."
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>🧰 Gizli Kasaya Al (Statlarıyla)</span>
          </button>

          {/* Open Inspector */}
          <button
            onClick={() => {
              setActiveTokenInspectorId(tokenContextMenu.token.id);
              setTokenContextMenu(null);
            }}
            className="w-full px-2 py-1.5 text-left text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors font-medium cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Tokenı İncele & Düzenle</span>
          </button>

          {/* Duplicate Token */}
          <button
            onClick={() => {
              const src = tokenContextMenu.token;
              addToken({
                ...src,
                x: src.x + 1,
                y: src.y + 1,
                name: `${src.name} (Kopya)`,
              });
              setTokenContextMenu(null);
            }}
            className="w-full px-2 py-1.5 text-left text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors font-medium cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Klonla / Çoğalt</span>
          </button>

          {/* Toggle Hidden from Players */}
          <button
            onClick={() => {
              updateToken(tokenContextMenu.token.id, {
                hiddenFromPlayers: !tokenContextMenu.token.hiddenFromPlayers
              });
              setTokenContextMenu(null);
            }}
            className="w-full px-2 py-1.5 text-left text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2 transition-colors font-medium cursor-pointer"
          >
            {tokenContextMenu.token.hiddenFromPlayers ? (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Oyunculara Göster</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Oyuncudan Gizle</span>
              </>
            )}
          </button>

          {/* Delete */}
          <div className="pt-1 border-t border-slate-800">
            <button
              onClick={() => {
                deleteToken(tokenContextMenu.token.id);
                setTokenContextMenu(null);
              }}
              className="w-full px-2 py-1.5 text-left text-rose-400 hover:bg-rose-950/60 rounded-lg flex items-center gap-2 transition-colors font-medium cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Haritadan Sil</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating 2-Room Quick Connection Bar (Zero Friction & Order-Independent) */}
      {selectedRoomIds.length === 2 && (() => {
        const r1 = rooms.find((r) => r.id === selectedRoomIds[0]);
        const r2 = rooms.find((r) => r.id === selectedRoomIds[1]);
        if (!r1 || !r2) return null;

        const centerWorldX = ((r1.x + r1.width / 2) + (r2.x + r2.width / 2)) / 2 * gridSize;
        const centerWorldY = ((r1.y + r1.height / 2) + (r2.y + r2.height / 2)) / 2 * gridSize;
        const screenX = centerWorldX * zoom + panOffset.x;
        const screenY = centerWorldY * zoom + panOffset.y;

        return (
          <div
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-40 bg-slate-900/95 border border-amber-500/80 p-1.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-1.5 animate-in zoom-in-95 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1 px-1 text-[11px] font-bold text-slate-300">
              <span className="text-amber-400 font-bold truncate max-w-[85px]">{r1.name}</span>
              <span className="text-slate-500">⇄</span>
              <span className="text-amber-400 font-bold truncate max-w-[85px]">{r2.name}</span>
            </div>

            <div className="w-px h-4 bg-slate-800" />

            {!areSelectedRoomsConnected ? (
              <button
                onClick={() => connectRooms(r1.id, r2.id)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl flex items-center gap-1 text-xs cursor-pointer shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
                title="İki oda arasına koridor çek"
              >
                <Link className="w-3.5 h-3.5" />
                <span>Odaları Bağla</span>
              </button>
            ) : (
              <button
                onClick={() => disconnectRooms(r1.id, r2.id)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-1 text-xs cursor-pointer shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
                title="İki oda arasındaki koridoru kes"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Bağlantıyı Kes</span>
              </button>
            )}
          </div>
        );
      })()}

      {/* Room Right Click Context Menu */}
      {roomContextMenu && (
        <div
          style={{ left: `${roomContextMenu.x}px`, top: `${roomContextMenu.y}px` }}
          className="absolute z-50 w-56 bg-slate-900/95 border border-amber-500/50 rounded-xl shadow-2xl p-1.5 backdrop-blur-md text-xs space-y-1 animate-in fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
            <span>Oda İşlemleri ({selectedRoomIds.length} Seçili)</span>
            <button onClick={() => setRoomContextMenu(null)} className="text-slate-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Connect / Disconnect 2 rooms */}
          {selectedRoomIds.length === 2 && (
            <>
              {!areSelectedRoomsConnected ? (
                <button
                  onClick={() => {
                    connectRooms(selectedRoomIds[0], selectedRoomIds[1]);
                    setRoomContextMenu(null);
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-amber-500/20 text-amber-300 font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Odaları Bağla (Koridor Çek)</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    disconnectRooms(selectedRoomIds[0], selectedRoomIds[1]);
                    setRoomContextMenu(null);
                  }}
                  className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-rose-500/20 text-rose-300 font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Bağlantıyı Ayır / Kes</span>
                </button>
              )}
            </>
          )}

          {/* Connect / Disconnect 3+ rooms */}
          {selectedRoomIds.length > 2 && (
            <>
              <button
                onClick={() => {
                  for (let i = 0; i < selectedRoomIds.length - 1; i++) {
                    connectRooms(selectedRoomIds[i], selectedRoomIds[i + 1]);
                  }
                  setRoomContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-amber-500/20 text-amber-300 font-bold flex items-center gap-2 cursor-pointer"
              >
                <Link className="w-3.5 h-3.5" />
                <span>Seçili Odaları Sırayla Bağla</span>
              </button>

              <button
                onClick={() => {
                  for (let i = 0; i < selectedRoomIds.length; i++) {
                    for (let j = i + 1; j < selectedRoomIds.length; j++) {
                      disconnectRooms(selectedRoomIds[i], selectedRoomIds[j]);
                    }
                  }
                  setRoomContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-rose-500/20 text-rose-300 font-bold flex items-center gap-2 cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Tüm Bağlantıları Kes</span>
              </button>
            </>
          )}

          {/* Copy Rooms */}
          {selectedRoomIds.length > 0 && (
            <button
              onClick={() => {
                copyRooms();
                setRoomContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-slate-800 text-slate-200 font-medium flex items-center gap-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span>Oda(ları) Kopyala (Ctrl+C)</span>
            </button>
          )}

          {/* Paste Rooms */}
          {copiedRooms.length > 0 && (
            <button
              onClick={() => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                  const world = screenToWorld(roomContextMenu.x, roomContextMenu.y);
                  const { gx, gy } = worldToGrid(world.x, world.y);
                  pasteRooms(gx, gy);
                } else {
                  pasteRooms(5, 5);
                }
                setRoomContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-slate-800 text-slate-200 font-medium flex items-center gap-2 cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Odaları Yapıştır (Ctrl+V)</span>
            </button>
          )}

          {/* Edit single room */}
          {selectedRoomIds.length === 1 && (
            <button
              onClick={() => {
                setActiveRoomInspectorId(selectedRoomIds[0]);
                setRoomContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-slate-800 text-slate-200 font-medium flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Odayı Düzenle & Yazı Yaz</span>
            </button>
          )}

          {/* Delete selected rooms */}
          {selectedRoomIds.length > 0 && (
            <button
              onClick={() => {
                deleteRooms(selectedRoomIds);
                setRoomContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-rose-950/60 text-rose-300 font-medium flex items-center gap-2 cursor-pointer border-t border-slate-800 pt-1.5 mt-1"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Seçili Oda(ları) Sil</span>
            </button>
          )}
        </div>
      )}

      {/* Room Quick Inspector / Edit Modal */}
      {activeInspectorRoom && !isStreamerMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={() => setActiveRoomInspectorId(null)}>
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl p-5 space-y-4 text-xs animate-in fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Edit3 className="w-4 h-4" />
                <span>Oda Düzenle & Yazı Yaz</span>
              </div>
              <button onClick={() => setActiveRoomInspectorId(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Room Name */}
            <div>
              <label className="block text-slate-400 mb-1">Oda Başlığı</label>
              <input
                type="text"
                value={activeInspectorRoom.name}
                onChange={(e) => updateRoom(activeInspectorRoom.id, { name: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Floor Visual Label */}
            <div>
              <label className="block text-slate-400 mb-1">Zeminde Gözükecek Yazı (Floor Label)</label>
              <input
                type="text"
                placeholder="Örn: ⚠️ Tuzaklı Zemin / Kadim Kütüphane / Boss Alanı"
                value={activeInspectorRoom.label || ''}
                onChange={(e) => updateRoom(activeInspectorRoom.id, { label: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-bold focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="checkbox"
                  id="notePublic"
                  checked={activeInspectorRoom.isNotePublic ?? true}
                  onChange={(e) => updateRoom(activeInspectorRoom.id, { isNotePublic: e.target.checked })}
                  className="accent-amber-500 rounded cursor-pointer"
                />
                <label htmlFor="notePublic" className="text-[11px] text-slate-400 cursor-pointer">
                  Bu zemin yazısını oyuncular da görsün
                </label>
              </div>
            </div>

                        {/* Room Layer / Floor Selector */}
            <div>
              <label className="block text-slate-400 mb-1 font-bold">🏢 Bulunduğu Kat / Katman</label>
              <select
                value={activeInspectorRoom.layerId || defaultLayerId}
                onChange={(e) => updateRoom(activeInspectorRoom.id, { layerId: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-bold cursor-pointer focus:outline-none focus:border-amber-500"
              >
                {layers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Room Story Notes */}
            <div>
              <label className="block text-slate-400 mb-1">DM Hikaye Açıklaması / Gizli Notlar</label>
              <textarea
                placeholder="Odaya girildiğinde yapılacak betimleme veya tuzak notları..."
                value={activeInspectorRoom.notes || ''}
                onChange={(e) => updateRoom(activeInspectorRoom.id, { notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Trap & Loot Info if populated */}
            {(activeInspectorRoom.trapDetails || activeInspectorRoom.lootDetails) && (
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                {activeInspectorRoom.trapDetails && (
                  <div className="text-amber-400 font-medium">
                    ⚠️ <span className="font-bold">Tuzak:</span> {activeInspectorRoom.trapDetails}
                  </div>
                )}
                {activeInspectorRoom.lootDetails && (
                  <div className="text-emerald-400 font-medium">
                    🎁 <span className="font-bold">Ganimet:</span> {activeInspectorRoom.lootDetails}
                  </div>
                )}
              </div>
            )}

            {/* Room Background Image */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-slate-400 font-bold">🖼️ Oda Zemin Görseli / Harita Resmi</label>
              
              {activeInspectorRoom.image && (
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 mb-2 flex items-center justify-center">
                  <img src={activeInspectorRoom.image} alt="Room floor" className="w-full h-full object-cover" />
                  <button
                    onClick={() => updateRoom(activeInspectorRoom.id, { image: undefined })}
                    className="absolute top-1 right-1 p-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-md border border-rose-800 cursor-pointer text-[10px]"
                    title="Görseli Kaldır"
                  >
                    Görseli Sil
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={roomFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      updateRoom(activeInspectorRoom.id, { image: event.target?.result as string });
                    };
                    reader.readAsDataURL(file);
                  }}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => roomFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Resim Yükle</span>
                </button>
                
                <input
                  type="text"
                  placeholder="Veya Resim URL'si yapıştır..."
                  value={activeInspectorRoom.image || ''}
                  onChange={(e) => updateRoom(activeInspectorRoom.id, { image: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Spawn Point Toggle */}
            <label className="flex items-center gap-2 p-2.5 bg-rose-950/30 border border-rose-800/60 rounded-xl cursor-pointer hover:bg-rose-900/30 transition-colors">
              <input
                type="checkbox"
                checked={activeInspectorRoom.isSpawnPoint ?? false}
                onChange={() => setSpawnPoint(activeInspectorRoom.id)}
                className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
              />
              <div>
                <span className="text-rose-300 font-bold block">🎯 Doğuş / Oluşum Noktası</span>
                <span className="text-slate-400 text-[10px]">Gizli kasadan çağrılan varlıklar bu odanın merkezine doğar.</span>
              </div>
            </label>

            {/* Theme & Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Genişlik x Yükseklik</label>
                <div className="flex items-center gap-2 font-mono">
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={activeInspectorRoom.width}
                    onChange={(e) => updateRoom(activeInspectorRoom.id, { width: Math.max(2, Number(e.target.value)) })}
                    className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center"
                  />
                  <span className="text-slate-500">x</span>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={activeInspectorRoom.height}
                    onChange={(e) => updateRoom(activeInspectorRoom.id, { height: Math.max(2, Number(e.target.value)) })}
                    className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Zemin Teması</label>
                <select
                  value={activeInspectorRoom.theme}
                  onChange={(e) => updateRoom(activeInspectorRoom.id, { theme: e.target.value as DungeonRoom['theme'] })}
                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 cursor-pointer"
                >
                  <option value="stone">Taş Zemin</option>
                  <option value="crypt">Mahzen (Crypt)</option>
                  <option value="magma">Lav Akıntısı</option>
                  <option value="nature">Sarmaşık / Doğa</option>
                  <option value="gold">Altın / Mermer</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => toggleRoomReveal(activeInspectorRoom.id)}
                className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 cursor-pointer ${
                  activeInspectorRoom.isRevealed
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                }`}
              >
                {activeInspectorRoom.isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{activeInspectorRoom.isRevealed ? 'Sisi Kapat' : 'Sisi Aç (Görünür Yap)'}</span>
              </button>

              <button
                onClick={() => { deleteRooms([activeInspectorRoom.id]); setActiveRoomInspectorId(null); }}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Odayı Sil</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Zoom & Canvas Controls */}
      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-xl shadow-xl backdrop-blur-md">
        <button
          onClick={() => setZoom((z) => z * 0.85)}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold transition-colors cursor-pointer"
          title="Uzaklaş"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="px-2 text-xs font-mono font-bold text-amber-400">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => z * 1.15)}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold transition-colors cursor-pointer"
          title="Yakınlaş"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
