import React from 'react';
import { 
  Radio,
  Sparkles, 
  Paintbrush, 
  LayoutGrid, 
  Dices, 
  Tv, 
  UserCheck, 
  RotateCcw, 
  BookOpen, 
  ExternalLink,
  Map,
  Image as ImageIcon,
  Palette,
  RotateCw,
  Scroll,
  ChevronDown,
  Swords,
  Volume2,
  MessageSquare,
  Lock as LockIcon
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import { peerSyncService } from '../../services/peerSyncService';

export const TopNavbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    isStreamerMode,
    setStreamerMode,
    setPaintModalOpen,
    setLampModalOpen,
    setRoomDrawerOpen,
    isRoomDrawerOpen,
    setDicePanelOpen,
    isDicePanelOpen,
    setRulebookOpen,
    isRulebookOpen,
    setWheelModalOpen,
    resetScene,
    sessions,
    activeSessionId,
    setSessionModalOpen,
    setMultiplayerModalOpen,
    isInitiativeOpen,
    setInitiativeOpen,
    isSoundboardOpen,
    setSoundboardOpen,
    isChatOpen,
    setChatOpen,
    localPlayerName,
    isLockedPlayerMode,
  } = useGameStore();

  const activeSession = (sessions || []).find((s) => s.id === activeSessionId) || sessions?.[0];

  const handleOpenPlayerWindow = () => {
    window.open(`${window.location.origin}${window.location.pathname}?mode=player`, '_blank', 'width=1280,height=720');
  };

  return (
    <header className="h-14 px-3 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between z-40 backdrop-blur-md select-none shrink-0 shadow-lg overflow-x-auto scrollbar-none gap-2">
      
      {/* Left: Brand & Scene Switcher */}
      <div className="flex items-center gap-2 shrink-0">
        <div 
          onClick={() => setLampModalOpen(true)}
          className="flex items-center gap-1.5 cursor-pointer group shrink-0"
          title="Sihirli Lambayı Aç"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform shadow-amber-500/20">
            🪔
          </div>
          <div className="hidden sm:block">
            <div className="font-black text-[11px] text-slate-100 tracking-wider uppercase leading-none">
              SİHİRLİ LAMBA
            </div>
            <p className="text-[8px] text-slate-400 font-mono leading-tight">VTT</p>
          </div>
        </div>

        <div className="w-px h-5 bg-slate-800 mx-0.5" />

        {/* 3 Scene View Tabs */}
        <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveView('map')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
              activeView === 'map'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Harita Sahnesi"
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Harita</span>
          </button>

          <button
            onClick={() => setActiveView('whiteboard')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
              activeView === 'whiteboard'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Çizim Tahtası Sahnesi"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tahta</span>
          </button>

          <button
            onClick={() => setActiveView('roleplay')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
              activeView === 'roleplay'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Rol Yapma & Görseller"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Görseller</span>
          </button>
        </div>

        {/* Campaign Session Selector Pill */}
        {!isStreamerMode && (
          <button
            onClick={() => setSessionModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            title="Oturumları Yönet"
          >
            <Scroll className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[90px] hidden xl:inline">{activeSession?.name || 'Oturumlar'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </div>

      {/* Center: Tools & Action Buttons */}
      <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
        {/* Magic Lamp Trigger */}
        <button
          onClick={() => setLampModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0"
          title="AI Sihirli Lamba"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Lamba</span>
        </button>

        {/* Initiative Tracker Button */}
        <button
          onClick={() => setInitiativeOpen(!isInitiativeOpen)}
          className={`flex items-center gap-1 px-2 py-1.5 font-bold text-xs rounded-xl border transition-all cursor-pointer shrink-0 ${
            isInitiativeOpen 
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title="Savaş İnisiyatif Sırası Takipçisi"
        >
          <Swords className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">İnisiyatif</span>
        </button>

        {/* Dice Roller Toggle */}
        <button
          onClick={() => setDicePanelOpen(!isDicePanelOpen)}
          className={`flex items-center gap-1 px-2 py-1.5 font-bold text-xs rounded-xl border transition-all cursor-pointer shrink-0 ${
            isDicePanelOpen 
              ? 'bg-purple-950/80 border-purple-500 text-purple-300' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title="Zar Atıcı"
        >
          <Dices className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden lg:inline">Zarlar</span>
        </button>

        {/* Ambient Soundboard Button */}
        {!isStreamerMode && (
          <button
            onClick={() => setSoundboardOpen(!isSoundboardOpen)}
            className={`flex items-center gap-1 px-2 py-1.5 font-bold text-xs rounded-xl border transition-all cursor-pointer shrink-0 ${
              isSoundboardOpen 
                ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-sm' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Zindan Ambiyansları ve Ses Efektleri"
          >
            <Volume2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">Ambiyans</span>
          </button>
        )}

        {/* Chat Button */}
        <button
          onClick={() => setChatOpen(!isChatOpen)}
          className={`flex items-center gap-1 px-2 py-1.5 font-bold text-xs rounded-xl border transition-all cursor-pointer shrink-0 ${
            isChatOpen 
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title="Canlı Parti Sohbeti ve DM Fısıldama"
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">Sohbet</span>
        </button>

        {/* Rulebook & Notes */}
        <button
          onClick={() => setRulebookOpen(!isRulebookOpen)}
          className={`flex items-center gap-1 px-2 py-1.5 font-bold text-xs rounded-xl border transition-all cursor-pointer shrink-0 ${
            isRulebookOpen 
              ? 'bg-blue-950/80 border-blue-500 text-blue-300' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title="Oyun Kuralları & Not Defteri"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden lg:inline">Kurallar</span>
        </button>

        {/* Wheel of Fortune Button */}
        <button
          onClick={() => setWheelModalOpen(true)}
          className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0"
          title="Şans Çarkı"
        >
          <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
          <span className="hidden lg:inline">Çark</span>
        </button>

        {/* Doodle to Asset */}
        <button
          onClick={() => setPaintModalOpen(true)}
          className="flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-all cursor-pointer shrink-0"
          title="Özel Varlık Çizimi"
        >
          <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">Varlık</span>
        </button>

        {/* Dungeon Room Drawer */}
        {!isStreamerMode && activeView === 'map' && (
          <button
            onClick={() => setRoomDrawerOpen(!isRoomDrawerOpen)}
            className={`flex items-center gap-1 px-2 py-1.5 font-bold text-xs rounded-xl border transition-all cursor-pointer shrink-0 ${
              isRoomDrawerOpen 
                ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Zindan Oda Şablonları"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Şablonlar</span>
          </button>
        )}
      </div>

      {/* Right: Controls, Mode Switch & Reset */}
      <div className="flex items-center gap-1.5 shrink-0">
        
        {/* Live Multiplayer Room Button */}
        <button
          onClick={() => setMultiplayerModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/50 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 shadow-sm"
          title="Çok Oyunculu Canlı Oda"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">{peerSyncService.status === 'hosting' ? `🔴 ${peerSyncService.roomId}` : peerSyncService.status === 'connected' ? `🟢 ${peerSyncService.roomId}` : 'Davet Et'}</span>
          {peerSyncService.connectedPeersCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black">
              {peerSyncService.connectedPeersCount}
            </span>
          )}
        </button>

        {/* Open Discord Stream Popout Window */}
        {!isStreamerMode && (
          <button
            onClick={handleOpenPlayerWindow}
            className="flex items-center gap-1 px-2 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-700 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0"
            title="Yayın Penceresi Aç"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Yayın</span>
          </button>
        )}

        {/* Streamer / DM Mode Switch OR Locked Player Mode Badge */}
        {isLockedPlayerMode || (typeof window !== 'undefined' && window.location.search.includes('room=')) ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-amber-500/40 bg-amber-950/50 text-amber-300 font-bold text-xs font-mono shrink-0">
            <LockIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[90px]">{localPlayerName}</span>
          </div>
        ) : (
          <button
            onClick={() => setStreamerMode(!isStreamerMode)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold text-xs transition-all shadow-md cursor-pointer shrink-0 ${
              isStreamerMode
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
            }`}
            title={isStreamerMode ? 'Oyuncu / Discord Görünümü' : 'DM / Yönetici Modu'}
          >
            {isStreamerMode ? <Tv className="w-3.5 h-3.5 text-emerald-400" /> : <UserCheck className="w-3.5 h-3.5 text-indigo-400" />}
            <span className="hidden md:inline">{isStreamerMode ? 'Oyuncu' : 'DM'}</span>
          </button>
        )}

        {/* Reset */}
        {!isStreamerMode && (
          <button
            onClick={() => {
              if (window.confirm('Tüm sahneyi varsayılana sıfırlamak istediğine emin misin?')) {
                resetScene();
              }
            }}
            className="p-1.5 bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Haritayı Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

      </div>
    </header>
  );
};
