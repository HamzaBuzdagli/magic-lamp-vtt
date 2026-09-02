import React, { useState, useRef, useEffect } from 'react';
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
  Lock as LockIcon,
  Globe
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import { useTranslation } from '../../hooks/useTranslation';
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

  const { t, language, setLanguage } = useTranslation();

  const [sceneDropdownOpen, setSceneDropdownOpen] = useState(false);
  const sceneDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sceneDropdownRef.current && !sceneDropdownRef.current.contains(event.target as Node)) {
        setSceneDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeSession = (sessions || []).find((s) => s.id === activeSessionId) || sessions?.[0];

  const handleOpenPlayerWindow = () => {
    window.open(`${window.location.origin}${window.location.pathname}?mode=player`, '_blank', 'width=1280,height=720');
  };

  return (
    <header className="h-13 px-3 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between z-50 backdrop-blur-md select-none shrink-0 shadow-lg gap-1.5 max-w-full">
      
      {/* Left: Brand & Scene Switcher Dropdown */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div 
          onClick={() => { if (!isStreamerMode && !isLockedPlayerMode) setLampModalOpen(true); }}
          className={`flex items-center gap-1.5 shrink-0 ${!isStreamerMode && !isLockedPlayerMode ? 'cursor-pointer group' : ''}`}
          title={!isStreamerMode && !isLockedPlayerMode ? t('brand.openLamp') : t('brand.title')}
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform shadow-amber-500/20">
            🪔
          </div>
          <div className="hidden sm:block">
            <div className="font-black text-[10px] text-slate-100 tracking-wider uppercase leading-none">
              {t('brand.title')}
            </div>
          </div>
        </div>

        <div className="w-px h-4 bg-slate-800 mx-0.5 hidden sm:block" />

        {/* Unified Scene Switcher Dropdown (Harita / Tahta / Görseller) */}
        <div className="relative" ref={sceneDropdownRef}>
          <button
            onClick={() => setSceneDropdownOpen(!sceneDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0"
            title={t('nav.scene.change')}
          >
            {activeView === 'map' ? (
              <>
                <Map className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('nav.scene.map')}</span>
              </>
            ) : activeView === 'whiteboard' ? (
              <>
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('nav.scene.whiteboard')}</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('nav.scene.roleplay')}</span>
              </>
            )}
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${sceneDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {sceneDropdownOpen && (
            <div 
              className="absolute left-0 top-full mt-1.5 w-44 bg-slate-900 border border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden z-[100] p-1 flex flex-col gap-0.5 animate-in fade-in"
              onClick={() => setSceneDropdownOpen(false)}
            >
              <button
                onClick={() => setActiveView('map')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'map' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>{t('nav.scene.mapFull')}</span>
              </button>

              <button
                onClick={() => setActiveView('whiteboard')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'whiteboard' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>{t('nav.scene.whiteboardFull')}</span>
              </button>

              <button
                onClick={() => setActiveView('roleplay')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'roleplay' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{t('nav.scene.roleplayFull')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Campaign Session Selector Pill */}
        {!isStreamerMode && (
          <button
            onClick={() => setSessionModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 hidden md:flex"
            title={t('nav.sessions')}
          >
            <Scroll className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[80px] hidden xl:inline">{activeSession?.name || t('nav.sessions')}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </div>

      {/* Center: Action Tools (Compact & Responsive) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Magic Lamp Trigger (DM Only) */}
        {!isStreamerMode && !isLockedPlayerMode && (
          <button
            onClick={() => setLampModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0"
            title={t('nav.lampTooltip')}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t('nav.lamp')}</span>
          </button>
        )}

        {/* Initiative Tracker Button */}
        <button
          onClick={() => setInitiativeOpen(!isInitiativeOpen)}
          className={`flex items-center gap-1 px-2 py-1.5 font-bold text-xs rounded-xl border transition-all cursor-pointer shrink-0 ${
            isInitiativeOpen 
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title={t('nav.initiativeTooltip')}
        >
          <Swords className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">{t('nav.initiative')}</span>
        </button>

        {/* Dice Roller Toggle */}
        <button
          onClick={() => setDicePanelOpen(!isDicePanelOpen)}
          className={`flex items-center gap-1 px-2 py-1.5 font-bold text-xs rounded-xl border transition-all cursor-pointer shrink-0 ${
            isDicePanelOpen 
              ? 'bg-purple-950/80 border-purple-500 text-purple-300' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title={t('nav.diceTooltip')}
        >
          <Dices className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden lg:inline">{t('nav.dice')}</span>
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
            title={t('nav.ambienceTooltip')}
          >
            <Volume2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden lg:inline">{t('nav.ambience')}</span>
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
          title={t('nav.chatTooltip')}
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">{t('nav.chat')}</span>
        </button>

        {/* Rulebook & Notes */}
        <button
          onClick={() => setRulebookOpen(!isRulebookOpen)}
          className={`flex items-center gap-1 px-2 py-1.5 font-bold text-xs rounded-xl border transition-all cursor-pointer shrink-0 ${
            isRulebookOpen 
              ? 'bg-blue-950/80 border-blue-500 text-blue-300' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title={t('nav.rulesTooltip')}
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden lg:inline">{t('nav.rules')}</span>
        </button>

        {/* Wheel of Fortune Button */}
        <button
          onClick={() => setWheelModalOpen(true)}
          className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0"
          title={t('nav.wheelTooltip')}
        >
          <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
          <span className="hidden lg:inline">{t('nav.wheel')}</span>
        </button>

        {/* Doodle to Asset (DM Only) */}
        {!isStreamerMode && !isLockedPlayerMode && (
          <button
            onClick={() => setPaintModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-all cursor-pointer shrink-0"
            title={t('nav.assetTooltip')}
          >
            <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">{t('nav.asset')}</span>
          </button>
        )}

        {/* Dungeon Room Drawer */}
        {!isStreamerMode && activeView === 'map' && (
          <button
            onClick={() => setRoomDrawerOpen(!isRoomDrawerOpen)}
            className={`flex items-center gap-1 px-2 py-1.5 font-bold text-xs rounded-xl border transition-all cursor-pointer shrink-0 ${
              isRoomDrawerOpen 
                ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={t('nav.templatesTooltip')}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">{t('nav.templates')}</span>
          </button>
        )}
      </div>

      {/* Right: Controls, Language Switcher, Mode Switch & Reset */}
      <div className="flex items-center gap-1.5 shrink-0">
        
        {/* Language Switcher Toggle Button */}
        <button
          onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
          className="flex items-center gap-1 px-2 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-700 text-slate-200 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 shadow-sm"
          title={language === 'tr' ? 'Switch to English (EN)' : "Türkçe'ye Geç (TR)"}
        >
          <Globe className="w-3 h-3 text-amber-400" />
          <span>{language === 'tr' ? 'TR' : 'EN'}</span>
        </button>

        {/* Live Multiplayer Room Button */}
        <button
          onClick={() => setMultiplayerModalOpen(true)}
          className="flex items-center gap-1 px-2 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/50 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 shadow-sm"
          title={`${t('nav.inviteTooltip')} ${peerSyncService.roomId ? `(${peerSyncService.roomId})` : ''}`}
        >
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden lg:inline">{peerSyncService.status === 'hosting' ? t('nav.roomLive') : peerSyncService.status === 'connected' ? t('nav.roomConnected') : t('nav.invite')}</span>
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
            className="flex items-center gap-1 px-2 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-700 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 hidden md:flex"
            title={t('nav.streamPopoutTooltip')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{t('nav.streamPopout')}</span>
          </button>
        )}

        {/* Streamer / DM Mode Switch OR Locked Player Mode Badge */}
        {isLockedPlayerMode || (typeof window !== 'undefined' && window.location.search.includes('room=')) ? (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-amber-500/40 bg-amber-950/50 text-amber-300 font-bold text-xs font-mono shrink-0">
            <LockIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[80px]">{localPlayerName}</span>
          </div>
        ) : (
          <button
            onClick={() => setStreamerMode(!isStreamerMode)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold text-xs transition-all shadow-md cursor-pointer shrink-0 ${
              isStreamerMode
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
            }`}
            title={t('nav.modeTooltip')}
          >
            {isStreamerMode ? <Tv className="w-3.5 h-3.5 text-emerald-400" /> : <UserCheck className="w-3.5 h-3.5 text-indigo-400" />}
            <span className="hidden md:inline">{isStreamerMode ? t('nav.modePlayer') : t('nav.modeDm')}</span>
          </button>
        )}

        {/* Reset */}
        {!isStreamerMode && (
          <button
            onClick={() => {
              if (window.confirm(t('nav.resetConfirm'))) {
                resetScene();
              }
            }}
            className="p-1.5 bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
            title={t('nav.reset')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

      </div>
    </header>
  );
};
