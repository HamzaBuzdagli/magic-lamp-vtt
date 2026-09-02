import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Wifi, 
  Copy, 
  Check, 
  Radio, 
  Sparkles, 
  X, 
  LogIn, 
  LogOut,
  Share2,
  Tv
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import { peerSyncService } from '../../services/peerSyncService';

export const MultiplayerModal: React.FC = () => {
  const {
    isMultiplayerModalOpen,
    setMultiplayerModalOpen,
  } = useGameStore();

  const [status, setStatus] = useState(peerSyncService.status);
  const [roomId, setRoomId] = useState(peerSyncService.roomId || '');
  const [peersCount, setPeersCount] = useState(peerSyncService.connectedPeersCount);
  const [copiedPlayer, setCopiedPlayer] = useState(false);
  const [inputRoomId, setInputRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/20 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
                <span>Canlı Çok Oyunculu Oda</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  WebRTC P2P
                </span>
              </h2>
              <p className="text-xs text-slate-400">Arkadaşlarınla anlık senkronize masaüstü oturumu</p>
            </div>
          </div>
          <button
            onClick={() => setMultiplayerModalOpen(false)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Connection Status Badge */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${
                status === 'hosting' ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse' :
                status === 'connected' ? 'bg-emerald-500 ring-4 ring-emerald-500/20' :
                status === 'connecting' ? 'bg-amber-500 ring-4 ring-amber-500/20 animate-spin' :
                'bg-slate-600'
              }`} />
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {status === 'hosting' ? '🟢 Odayı Sen Yönetiyorsun (DM Host)' :
                   status === 'connected' ? '🟢 Odaya Canlı Bağlı (Oyuncu)' :
                   status === 'connecting' ? '🟡 Bağlantı Kuruluyor...' :
                   '⚪ Çevrimdışı (Bağlantı Yok)'}
                </div>
                {roomId && (
                  <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                    Oda Kodu: <span className="font-black underline tracking-wider">{roomId}</span>
                  </div>
                )}
              </div>
            </div>
            {status === 'hosting' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-xl border border-slate-700 text-xs font-bold text-amber-300">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>{peersCount} Oyuncu Bağlı</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {joinError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300">
              ⚠️ {joinError}
            </div>
          )}

          {/* If Hosting: Show Share Links */}
          {status === 'hosting' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>Oyunculara Gönderilecek Bağlantı</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Bu linki arkadaşlarına WhatsApp veya Discord'dan at. Sayfayı açtıklarında <strong>otomatik olarak senin odana bağlanırlar</strong> ve tüm token hareketlerini, sis açılışlarını canlı izlerler!
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={playerInviteUrl}
                    className="flex-1 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-200 truncate select-all focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleCopyPlayerUrl}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-transform active:scale-95 shrink-0"
                  >
                    {copiedPlayer ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPlayer ? 'Kopyalandı!' : 'Linki Kopyala'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                  <Tv className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200">Savaş Sisi Koruması</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Oyuncular yalnızca açtığın odaları ve gizlenmemiş tokenları görür.</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200">Sıfır Gecikme</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">WebRTC Peer-to-Peer ile doğrudan senin tarayıcından oyunculara akar.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Oturumu Kapat</span>
                </button>
                <button
                  onClick={handleHostNewRoom}
                  disabled={isJoining}
                  className="text-xs text-slate-400 hover:text-amber-400 underline cursor-pointer"
                >
                  Yeni Farklı Oda Kodu Al
                </button>
              </div>
            </div>
          )}

          {/* If Connected as Player */}
          {status === 'connected' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <Wifi className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">DM Hostuna Başarıyla Bağlandın!</h3>
                <p className="text-xs text-slate-400 mt-1">Harita ve çizim tahtası DM'in hareketlerine göre anlık senkronize ediliyor.</p>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Odadan Ayrıl</span>
              </button>
            </div>
          )}

          {/* If Disconnected: Offer to Host or Join */}
          {status === 'disconnected' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>Yeni Canlı Masa / Oda Başlat (DM)</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Önerilen
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Kendi oyun masanı aç ve arkadaşlarına tek tıkla davet linki gönder.
                </p>
                <button
                  onClick={handleHostNewRoom}
                  disabled={isJoining}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-transform active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isJoining ? 'Oda Başlatılıyor...' : 'Oda Oluştur & Davet Linki Al'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-slate-600 text-xs">
                <div className="flex-1 h-px bg-slate-800" />
                <span>veya başka bir odaya katıl</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <form onSubmit={handleJoinCustomRoom} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Örn: lamba-4829"
                    value={inputRoomId}
                    onChange={(e) => setInputRoomId(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 px-3 py-2 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isJoining || !inputRoomId.trim()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isJoining ? 'Bağlanıyor...' : 'Odaya Katıl'}</span>
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
