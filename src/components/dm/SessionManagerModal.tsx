import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Copy, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  FolderCheck, 
  Layers, 
  Sparkles,
  Layers as FloorIcon,
  Palette,
  Check,
  Play
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { CampaignSession } from '../../types/game';

export const SessionManagerModal: React.FC = () => {
  const { t } = useTranslation();
  const { 
    sessions, 
    activeSessionId, 
    isSessionModalOpen, 
    setSessionModalOpen, 
    createSession, 
    switchSession, 
    renameSession, 
    duplicateSession, 
    deleteSession,
    importSession 
  } = useGameStore();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [copyCurrentState, setCopyCurrentState] = useState(false);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isSessionModalOpen) return null;

  const activeSession = (sessions || []).find((s) => s.id === activeSessionId) || sessions?.[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    createSession(newSessionName.trim(), copyCurrentState);
    setNewSessionName('');
    setIsCreatingNew(false);
    showNotice('"' + newSessionName.trim() + '" oturumu oluşturuldu ve açıldı!');
  };

  const handleSaveRename = (sessionId: string) => {
    if (!editingName.trim()) {
      setEditingSessionId(null);
      return;
    }
    renameSession(sessionId, editingName.trim());
    setEditingSessionId(null);
    showNotice('Oturum adı güncellendi.');
  };

  const handleExportJson = (session: CampaignSession) => {
    const isCurrentActive = session.id === activeSessionId;
    const currentState = useGameStore.getState();

    const sessionToExport: CampaignSession = isCurrentActive
      ? {
          ...session,
          updatedAt: Date.now(),
          data: {
            rooms: currentState.rooms,
            connections: currentState.connections,
            tokens: currentState.tokens,
            drawings: currentState.drawings,
            layers: currentState.layers,
            activeLayerId: currentState.activeLayerId,
            whiteboardPages: currentState.whiteboardPages,
            activeWhiteboardPageId: currentState.activeWhiteboardPageId,
            whiteboardAssets: currentState.whiteboardAssets,
            whiteboardHealthBars: currentState.whiteboardHealthBars || [],
            backstageTokens: currentState.backstageTokens,
            encounterPresets: currentState.encounterPresets,
            rulebookNotes: currentState.rulebookNotes,
            npcProfiles: currentState.npcProfiles,
            lampChatHistory: currentState.lampChatHistory,
            handouts: currentState.handouts,
            activeView: currentState.activeView
          }
        }
      : session;

    const jsonStr = JSON.stringify(sessionToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sihirli_lamba_${session.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice('"' + session.name + '" oturum yedeği (tüm şablonlar ve referanslarla) indirildi.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importSession(content);
      if (success) {
        showNotice('Yedek oturum başarıyla içe aktarıldı!');
      } else {
        alert('Geçersiz oturum yedek dosyası!');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const showNotice = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-b border-amber-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg text-xl">
              📜
            </div>
            <div>
              <h2 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                <span>{t('session.title')}</span>
              </h2>
              <p className="text-[10px] text-amber-400/80 font-semibold">
                Farklı arkadaş gruplarınız veya ayrı maceralarınız için bağımsız oturumlar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Import JSON button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="JSON Yedek Dosyasından Oturum Yükle"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('session.importJson')}</span>
            </button>

            <button
              onClick={() => setSessionModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 max-h-[78vh] text-xs">
          
          {/* Active Session Highlight Card */}
          {activeSession && (
            <div className="bg-gradient-to-r from-amber-500/10 via-slate-950 to-amber-500/10 border border-amber-500/50 p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Play className="w-4 h-4 fill-slate-950" />
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Şu An Oynanan Aktif Oturum</span>
                  <h3 className="text-sm font-black text-slate-100">{activeSession.name}</h3>
                </div>
              </div>

              <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500 text-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Canlıda</span>
              </span>
            </div>
          )}

          {feedbackNotice && (
            <div className="p-2.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-bold rounded-xl text-center text-xs animate-in fade-in flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>{feedbackNotice}</span>
            </div>
          )}

          {/* CREATE NEW SESSION SECTION */}
          {!isCreatingNew ? (
            <button
              onClick={() => {
                setNewSessionName(`Yeni Macera (${(sessions || []).length + 1}. Grup)`);
                setIsCreatingNew(true);
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-101"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yeni Oturum / Kampanya Başlat</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="bg-slate-950 p-4 rounded-2xl border border-amber-500/70 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 text-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Yeni Oturum Oluştur</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Oturum / Grup Adı</label>
                <input
                  type="text"
                  placeholder="Örn: 2. Arkadaş Grubu - Ravenloft Macerası"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              {/* Start mode selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <label className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-0.5 ${
                  !copyCurrentState 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="session_mode"
                      checked={!copyCurrentState}
                      onChange={() => setCopyCurrentState(false)}
                      className="accent-amber-500"
                    />
                    <span className="font-bold text-xs">✨ Sıfırdan Boş Harita</span>
                  </div>
                  <span className="text-[10px] text-slate-400 pl-5">Yeni zindan odaları oluşturabileceğiniz temiz bir sayfa açar.</span>
                </label>

                <label className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-0.5 ${
                  copyCurrentState 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="session_mode"
                      checked={copyCurrentState}
                      onChange={() => setCopyCurrentState(true)}
                      className="accent-amber-500"
                    />
                    <span className="font-bold text-xs">📋 Mevcut Haritayı Kopyala</span>
                  </div>
                  <span className="text-[10px] text-slate-400 pl-5">Şu anki odaları ve katmanları yeni oturuma kopyalayarak başlar.</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer text-xs shadow"
                >
                  Oturumu Oluştur & Aç
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer text-xs"
                >
                  İptal
                </button>
              </div>
            </form>
          )}

          {/* SESSIONS LIST */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
              <span>Kayıtlı Oturumlar ({(sessions || []).length})</span>
            </div>

            {(sessions || []).map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = editingSessionId === session.id;
              const roomCount = session.data?.rooms?.length || 0;
              const tokenCount = session.data?.tokens?.length || 0;
              const layerCount = session.data?.layers?.length || 1;
              const pageCount = session.data?.whiteboardPages?.length || 1;

              return (
                <div
                  key={session.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-slate-950 border-amber-500 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                      isActive ? 'bg-amber-500/20 text-amber-400 border border-amber-500/60' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      📜
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(session.id);
                              if (e.key === 'Escape') setEditingSessionId(null);
                            }}
                            className="px-2 py-0.5 bg-slate-900 border border-amber-500 rounded text-slate-100 text-xs font-bold focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveRename(session.id)}
                            className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold rounded text-[11px]"
                          >
                            Kaydet
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-xs truncate">{session.name}</h4>
                          {isActive && (
                            <span className="px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/60 text-amber-300 rounded text-[9px] font-bold">
                              Aktif
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats Pills */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 flex-wrap font-mono">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Layers className="w-3 h-3 text-amber-400" />
                          <span>{roomCount} Oda</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <FolderCheck className="w-3 h-3 text-rose-400" />
                          <span>{tokenCount} Token</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <FloorIcon className="w-3 h-3 text-blue-400" />
                          <span>{layerCount} Kat</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Palette className="w-3 h-3 text-purple-400" />
                          <span>{pageCount} Çizim Sayfası</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900">
                    <div className="flex items-center gap-1">
                      {/* Switch / Open Button */}
                      {!isActive ? (
                        <button
                          onClick={() => {
                            switchSession(session.id);
                            showNotice('"' + session.name + '" oturumuna geçiş yapıldı!');
                          }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all shadow"
                        >
                          <Play className="w-3 h-3 fill-slate-950" />
                          <span>Oturumu Aç</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-amber-400/90 font-bold rounded-xl text-[11px] flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Açık</span>
                        </span>
                      )}

                      {/* Rename */}
                      <button
                        onClick={() => {
                          setEditingSessionId(session.id);
                          setEditingName(session.name);
                        }}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-xl border border-slate-800 cursor-pointer"
                        title="Oturum Adını Değiştir"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => {
                          duplicateSession(session.id);
                          showNotice('Oturum klonlandı.');
                        }}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-xl border border-slate-800 cursor-pointer"
                        title="Oturumu Kopyala / Klonla"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Export JSON */}
                      <button
                        onClick={() => handleExportJson(session)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-xl border border-slate-800 cursor-pointer"
                        title="JSON Yedek İndir"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      {sessions.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm('"' + session.name + '" oturumunu kalıcı olarak silmek istediğinize emin misiniz?')) {
                              deleteSession(session.id);
                              showNotice('Oturum silindi.');
                            }
                          }}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded-xl border border-slate-800 cursor-pointer"
                          title="Oturumu Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
