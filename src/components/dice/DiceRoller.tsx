import React, { useState, useEffect } from 'react';
import { 
  Dices, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  ShieldAlert,
  Award,
  RotateCw,
  GripHorizontal
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameStore } from '../../hooks/useGameStore';
import type { DiceRoll } from '../../types/game';

const DICE_TYPES: { type: DiceRoll['diceType']; max: number; label: string; color: string }[] = [
  { type: 'd4', max: 4, label: 'D4', color: 'from-amber-600 to-amber-800' },
  { type: 'd6', max: 6, label: 'D6', color: 'from-emerald-600 to-emerald-800' },
  { type: 'd8', max: 8, label: 'D8', color: 'from-cyan-600 to-cyan-800' },
  { type: 'd10', max: 10, label: 'D10', color: 'from-blue-600 to-blue-800' },
  { type: 'd12', max: 12, label: 'D12', color: 'from-indigo-600 to-indigo-800' },
  { type: 'd20', max: 20, label: 'D20', color: 'from-purple-600 to-purple-800' },
  { type: 'd100', max: 100, label: 'D100', color: 'from-rose-600 to-rose-800' },
];

export const DiceRoller: React.FC = () => {
  const { 
    isDicePanelOpen, 
    setDicePanelOpen, 
    diceHistory, 
    addDiceRoll, 
    clearDiceHistory,
    setWheelModalOpen
  } = useGameStore();

  const [modifier, setModifier] = useState<number>(0);
  const [rollerName, setRollerName] = useState<string>('Yayıncı / DM');
  const [rollingDice, setRollingDice] = useState<string | null>(null);
  const [lastAnimatedResult, setLastAnimatedResult] = useState<{ result: number; total: number; isCrit?: boolean; isFumble?: boolean } | null>(null);

  // Draggable Window Position State
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: typeof window !== 'undefined' ? window.innerWidth - 340 : 20, y: 70 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Only drag if left click
    if (e.button !== 0) return;
    setIsDraggingPanel(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingPanel) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 340, e.clientX - dragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDraggingPanel) setIsDraggingPanel(false);
    };

    if (isDraggingPanel) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPanel, dragOffset]);

  const rollDice = (type: DiceRoll['diceType'], max: number) => {
    setRollingDice(type);

    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        const finalResult = Math.floor(Math.random() * max) + 1;
        const total = finalResult + modifier;
        const isCrit = type === 'd20' && finalResult === 20;
        const isFumble = type === 'd20' && finalResult === 1;

        if (isCrit) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.7 }
          });
        }

        addDiceRoll({
          diceType: type,
          result: finalResult,
          modifier,
          rollerName: rollerName || 'Oyuncu',
          isCrit,
          isFumble,
        });

        setLastAnimatedResult({
          result: finalResult,
          total,
          isCrit,
          isFumble
        });

        setRollingDice(null);
      }
    }, 45);
  };

  return (
    <div 
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className={`fixed z-40 w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md transition-shadow select-none ${
        isDraggingPanel ? 'shadow-amber-500/20 ring-2 ring-amber-400 cursor-grabbing' : 'shadow-2xl'
      }`}
    >
      {/* Header & Drag Handle */}
      <div 
        onMouseDown={handleHeaderMouseDown}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 rounded-t-2xl cursor-grab active:cursor-grabbing hover:bg-slate-950 transition-colors"
      >
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
          <GripHorizontal className="w-4 h-4 text-slate-500" />
          <Dices className="w-4 h-4 text-amber-400" />
          <span>Zar Masası (Sürüklenebilir)</span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); setDicePanelOpen(!isDicePanelOpen); }}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            {isDicePanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isDicePanelOpen && (
        <div className="p-3.5 space-y-3 text-xs">
          {/* Quick Config */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Zar atan ismi..."
              value={rollerName}
              onChange={(e) => setRollerName(e.target.value)}
              className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 px-2 py-1 rounded-lg">
              <span className="text-slate-500 font-mono">Bonus:</span>
              <input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(Number(e.target.value))}
                className="w-10 bg-transparent text-amber-400 font-bold text-center focus:outline-none"
              />
            </div>
          </div>

          {/* Dice Buttons Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {DICE_TYPES.map((dice) => (
              <button
                key={dice.type}
                disabled={rollingDice !== null}
                onClick={() => rollDice(dice.type, dice.max)}
                className={`py-2 px-1 rounded-xl font-black text-xs text-white bg-gradient-to-br ${dice.color} hover:brightness-125 active:scale-95 shadow-md transition-all flex flex-col items-center justify-center border border-white/10 cursor-pointer ${
                  rollingDice === dice.type ? 'animate-bounce' : ''
                }`}
              >
                <span>{dice.label}</span>
              </button>
            ))}

            {/* Quick Wheel of Fortune Trigger */}
            <button
              onClick={() => setWheelModalOpen(true)}
              className="py-2 px-1 rounded-xl font-black text-[11px] text-white bg-gradient-to-br from-purple-600 to-indigo-700 hover:brightness-125 active:scale-95 shadow-md transition-all flex flex-col items-center justify-center border border-white/10 cursor-pointer"
              title="Özelleştirilebilir Şans Çarkını Aç"
            >
              <RotateCw className="w-3.5 h-3.5 mb-0.5" />
              <span>Çark</span>
            </button>
          </div>

          {/* Latest Animated Result Banner */}
          {lastAnimatedResult && (
            <div className={`p-2.5 rounded-xl border text-center transition-all animate-in fade-in zoom-in-95 ${
              lastAnimatedResult.isCrit
                ? 'bg-amber-950/60 border-amber-400 text-amber-300'
                : lastAnimatedResult.isFumble
                ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                {lastAnimatedResult.isCrit ? '🌟 KRİTİK BAŞARI (NAT 20)!' : lastAnimatedResult.isFumble ? '💀 KRİTİK HATA (NAT 1)!' : 'Zar Sonucu'}
              </div>
              <div className="text-xl font-black font-mono my-0.5">
                {lastAnimatedResult.result} {modifier !== 0 ? `(${modifier >= 0 ? '+' : ''}${modifier}) = ${lastAnimatedResult.total}` : ''}
              </div>
            </div>
          )}

          {/* Roll History Log */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-bold">
              <span>Son Atılan Zarlar</span>
              {diceHistory.length > 0 && (
                <button
                  onClick={clearDiceHistory}
                  className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Temizle</span>
                </button>
              )}
            </div>

            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {diceHistory.length === 0 ? (
                <p className="text-[11px] text-slate-600 text-center py-2 italic">Henüz zar atılmadı.</p>
              ) : (
                diceHistory.map((roll) => (
                  <div
                    key={roll.id}
                    className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between font-mono text-xs ${
                      roll.isCrit
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 font-bold'
                        : roll.isFumble
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 font-bold'
                        : 'bg-slate-950 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] text-slate-500 font-sans">{roll.timestamp}</span>
                      <span className="font-bold uppercase text-amber-400">{roll.diceType}:</span>
                      <span className="truncate">{roll.rollerName}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {roll.isCrit && <Award className="w-3.5 h-3.5 text-amber-400" />}
                      {roll.isFumble && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                      <span className="font-black text-sm">{roll.result + roll.modifier}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
