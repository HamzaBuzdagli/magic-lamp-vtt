import React from 'react';
import { 
  Swords, 
  ChevronRight, 
  RotateCcw, 
  Plus, 
  Dices, 
  X 
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { InitiativeItem } from '../../types/game';

export const InitiativeTracker: React.FC = () => {
  const {
    initiativeList,
    setInitiativeList,
    currentTurnIndex,
    setCurrentTurnIndex,
    roundNumber,
    setRoundNumber,
    isInitiativeOpen,
    setInitiativeOpen,
    tokens,
    isStreamerMode
  } = useGameStore();

  if (!isInitiativeOpen) return null;

  const sortedList = [...initiativeList].sort((a, b) => b.score - a.score);
  const activeCombatant = sortedList[currentTurnIndex % Math.max(1, sortedList.length)];

  const handleNextTurn = () => {
    if (sortedList.length === 0) return;
    const nextIdx = currentTurnIndex + 1;
    if (nextIdx >= sortedList.length) {
      setCurrentTurnIndex(0);
      setRoundNumber(roundNumber + 1);
    } else {
      setCurrentTurnIndex(nextIdx);
    }
  };

  const handleRollAll = () => {
    const updated = initiativeList.map((c) => ({
      ...c,
      score: Math.floor(1 + Math.random() * 20)
    }));
    setInitiativeList(updated);
    setCurrentTurnIndex(0);
  };

  const handleAddTokensFromMap = () => {
    const existingTokenIds = new Set(initiativeList.map((i) => i.tokenId).filter(Boolean));
    const newItems: InitiativeItem[] = [];

    tokens.forEach((t) => {
      if (!existingTokenIds.has(t.id)) {
        newItems.push({
          id: 'init-' + t.id + '-' + Date.now(),
          tokenId: t.id,
          name: t.name,
          image: t.image,
          color: t.color,
          score: Math.floor(1 + Math.random() * 20),
          currentHp: t.hp?.current,
          maxHp: t.hp?.max,
          isMonster: t.type === 'monster'
        });
      }
    });

    if (newItems.length > 0) {
      setInitiativeList([...initiativeList, ...newItems]);
    }
  };

  const handleDeleteItem = (id: string) => {
    setInitiativeList(initiativeList.filter((c) => c.id !== id));
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border-2 border-amber-500/70 rounded-3xl shadow-2xl backdrop-blur-md max-w-2xl w-full p-3.5 select-none animate-in slide-in-from-top-4">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-100">İnisiyatif & Savaş Takipçisi</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-sm">
                Tur: {roundNumber}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {sortedList.length > 0 ? ('Sıradaki: ' + (activeCombatant?.name || '-')) : 'Henüz savaşta savaşçı yok'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!isStreamerMode && (
            <>
              <button
                onClick={handleAddTokensFromMap}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
                title="Haritadaki tüm tokenları savaşa ekle"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Haritadan Çek</span>
              </button>

              <button
                onClick={handleRollAll}
                className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 font-bold rounded-xl text-xs flex items-center gap-1 border border-purple-700 cursor-pointer"
                title="Herkes için 1d20 zar at"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Zarları At</span>
              </button>

              <button
                onClick={handleNextTurn}
                disabled={sortedList.length === 0}
                className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-md cursor-pointer disabled:opacity-50"
              >
                <span>Sıradaki</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => { setInitiativeList([]); setCurrentTurnIndex(0); setRoundNumber(1); }}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-800 cursor-pointer"
                title="Savaşı Bitir / Sıfırla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={() => setInitiativeOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Combatants Horizontal List */}
      <div className="pt-2.5 flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {sortedList.length === 0 ? (
          <div className="w-full text-center py-4 text-slate-500 text-xs font-semibold">
            {isStreamerMode ? 'DM savaşı başlattığında savaş sırası burada görünecek.' : 'Haritadan token eklemek için "Haritadan Çek" butonuna basın.'}
          </div>
        ) : (
          sortedList.map((combatant, idx) => {
            const isActive = idx === (currentTurnIndex % sortedList.length);
            return (
              <div
                key={combatant.id}
                className={
                  'flex-shrink-0 w-36 p-2.5 rounded-2xl border transition-all relative ' +
                  (isActive
                    ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-amber-400'
                    : 'bg-slate-950/80 border-slate-800 opacity-80')
                }
              >
                {isActive && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full uppercase tracking-wider shadow">
                    Sıra Sende
                  </div>
                )}

                <div className="flex items-center gap-2 mb-1.5">
                  <div 
                    className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center font-bold text-white text-xs shrink-0 border border-slate-700"
                    style={{ backgroundColor: combatant.color || '#3b82f6' }}
                  >
                    {combatant.image ? (
                      <img src={combatant.image} alt={combatant.name} className="w-full h-full object-cover" />
                    ) : (
                      combatant.name.charAt(0)
                    )}
                  </div>

                  <div className="truncate flex-1">
                    <div className="font-bold text-slate-100 truncate text-[11px]">{combatant.name}</div>
                    <div className="flex items-center gap-1 font-mono text-[9px] text-amber-400 font-bold">
                      <span>İnisiyatif:</span>
                      <span>{combatant.score}</span>
                    </div>
                  </div>

                  {!isStreamerMode && (
                    <button
                      onClick={() => handleDeleteItem(combatant.id)}
                      className="text-slate-600 hover:text-rose-400 p-0.5 cursor-pointer"
                      title="Sıradan Çıkar"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {combatant.maxHp ? (
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, ((combatant.currentHp || 0) / combatant.maxHp) * 100))}%` }}
                    />
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
