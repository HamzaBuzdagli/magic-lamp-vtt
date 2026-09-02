import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Copy, 
  Check, 
  Radio, 
  Sparkles, 
  X, 
  LogOut,
  Palette
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import { peerSyncService } from '../../services/peerSyncService';

export const MultiplayerModal: React.FC = () => {
  const {
    isMultiplayerModalOpen,
    setMultiplayerModalOpen,
    localPlayerName,
    setLocalPlayerName,
    connectedPlayers,
    
    togglePlayerDrawingPermission,
    isStreamerMode
  } = useGameStore();

  const [status, setStatus] = useState(peerSyncService.status);
  const [roomId, setRoomId] = useState(peerSyncService.roomId || '');
  const [peersCount, setPeersCount] = useState(peerSyncService.connectedPeersCount);
  const [copiedPlayer, setCopiedPlayer] = useState(false);
  const [inputRoomId, setInputRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [, setJoinError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(localPlayerName);

  useEffect(() => {
    const unsubStatus = peerSyncService.onStatusChange((s, id) => {
      setStatus(s);
      if (id) setRoomId(id);
    });
    const unsubCount = peerSyncService.onPeerCountChange((c) => {
      setPeersCount(c);
    });
    return () => {
      unsubStatus();
      unsubCount();
    };
  }, []);

  if (!isMultiplayerModalOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const playerInviteUrl = `${currentOrigin}${currentPath}?mode=player&room=${roomId}`;

  const handleCopyPlayerUrl = () => {
    navigator.clipboard.writeText(playerInviteUrl);
    setCopiedPlayer(true);
    setTimeout(() => setCopiedPlayer(false), 2500);
  };

  const handleHostNewRoom = async () => {
    try {
      setIsJoining(true);
      setJoinError(null);
      const newId = await peerSyncService.initHost(undefined, () => {
        return useGameStore.getState();
      });
      setRoomId(newId);
    } catch (err: any) {
      setJoinError('Oda başlatılırken bir hata oluştu: ' + (err?.message || err));
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinCustomRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomId.trim()) return;
    try {
      setIsJoining(true);
      setJoinError(null);
      await peerSyncService.connectToHost(inputRoomId.trim());
      setRoomId(inputRoomId.trim());
      setInputRoomId('');
    } catch (err: any) {
      setJoinError("Odaya bağlanılamadı. Oda kodunu kontrol edin veya DM'in odada olduğundan emin olun.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleDisconnect = () => {
    peerSyncService.disconnect();
    setStatus('disconnected');
    setRoomId('');
    setPeersCount(0);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingName.trim()) {
      setLocalPlayerName(editingName.trim());
    }
  };

  const isDm = !isStreamerMode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg text-lg">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-amber-300 flex items-center gap-2">
                <span>Canlı Çok Oyunculu Oda</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  WebRTC P2P
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                Oyuncuları davet edin ve çizim tahtası izinlerini yönetin.
              </p>
            </div>
          </div>

          <button
            onClick={() => setMultiplayerModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">

          {/* Player Name / Tag Input */}
          <form onSubmit={handleSaveName} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">İsminiz / Karakter Unvanınız</span>
              <span className="font-black text-slate-200 text-xs">{localPlayerName}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="İsim değiştir..."
                className="w-32 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 cursor-pointer shadow-sm"
              >
                Kaydet
              </button>
            </div>
          </form>

          {/* ACTIVE ROOM STATUS */}
          {status === 'hosting' ? (
            <div className="bg-gradient-to-b from-amber-950/40 to-slate-950 p-5 rounded-2xl border border-amber-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-black text-slate-100 text-sm">Odanız Canlı Yayında!</span>
                </div>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-xl font-mono font-bold text-amber-400 text-xs">
                  {roomId}
                </span>
              </div>

              {/* Invite Link Card */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300">
                  🔗 Oyuncular İçin Güvenli Davet Linki:
                </label>
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={playerInviteUrl}
                    className="w-full bg-transparent text-[11px] font-mono text-slate-400 focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyPlayerUrl}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer transition-all shadow-md"
                  >
                    {copiedPlayer ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPlayer ? 'Kopyalandı!' : 'Kopyala'}</span>
                  </button>
                </div>
              </div>

              {/* Connected Players & Drawing Permissions */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Bağlı Oyuncular & İzinler ({peersCount})</span>
                  </span>
                </div>

                {peersCount === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                    Henüz odaya katılan oyuncu yok. Yukarıdaki linki arkadaşlarınıza gönderin!
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {connectedPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 truncate mr-2">
                          <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px]">
                            {player.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-200 truncate">{player.name}</span>
                        </div>

                        {/* Drawing Permission Toggle Button for DM */}
                        {isDm && (
                          <button
                            onClick={() => togglePlayerDrawingPermission(player.id)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                              player.canDrawWhiteboard
                                ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300 shadow-sm'
                                : 'bg-slate-900 border border-slate-700 text-slate-500 hover:text-slate-300'
                            }`}
                            title="Oyuncunun Çizim Tahtasını kullanabilmesini sağlar"
                          >
                            <Palette className="w-3 h-3" />
                            <span>{player.canDrawWhiteboard ? '✏️ Çizim İzni Açık' : '🔒 Çizim İzni Kapalı'}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* End Room Button */}
              <div className="pt-2">
                <button
                  onClick={handleDisconnect}
                  className="w-full py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold rounded-xl border border-rose-800 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Odayı Kapat & Yayını Sonlandır</span>
                </button>
              </div>

            </div>
          ) : status === 'connected' ? (
            <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/50 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                <Check className="w-5 h-5" />
                <span>DM'in Odasına Bağlandınız ({roomId})</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Zindan Efendisinin (DM) yaptığı tüm hareketler, sis açılışları ve can barları anlık olarak ekranınıza yansıyor.
              </p>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
              >
                Odadan Ayrıl
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Host button */}
              <button
                onClick={handleHostNewRoom}
                disabled={isJoining}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-101 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isJoining ? 'Oda Başlatılıyor...' : '🚀 Yeni Çok Oyunculu Oda Başlat (DM)'}</span>
              </button>

              {/* Or join with code */}
              <form onSubmit={handleJoinCustomRoom} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <span className="font-bold text-slate-300 text-xs">Veya Bir Odaya Katıl:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Oda Kodu (Örn: lamba-4829)"
                    value={inputRoomId}
                    onChange={(e) => setInputRoomId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!inputRoomId.trim() || isJoining}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs border border-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    Katıl
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
