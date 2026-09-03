import { useTranslation } from '../../hooks/useTranslation';
import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Lock,
  GripHorizontal
} from 'lucide-react';
import { useGameStore } from '../../hooks/useGameStore';
import type { ChatMessage } from '../../types/game';

export const PartyChatDrawer: React.FC = () => {
  const { t } = useTranslation();
  const {
    isChatOpen,
    setChatOpen,
    chatMessages,
    addChatMessage,
    localPlayerName,
    isStreamerMode,
    connectedPlayers
  } = useGameStore();

  const [messageText, setMessageText] = useState('');
  const [recipient, setRecipient] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Draggable window coordinates
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(16, window.innerWidth - 390),
        y: Math.max(70, window.innerHeight - 490)
      };
    }
    return { x: 500, y: 300 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [chatMessages, isChatOpen]);

  // Mouse Dragging Logic
  const handleMouseDownHeader = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const newX = Math.max(10, Math.min(window.innerWidth - 380, dragStartRef.current.startX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 480, dragStartRef.current.startY + dy));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const isWhisper = recipient !== 'all';
    const isDm = !isStreamerMode;
    const targetPlayer = connectedPlayers.find(p => p.id === recipient || p.name === recipient);

    const newMsg: ChatMessage = {
      id: 'chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      senderId: isDm ? 'DM' : localPlayerName,
      senderName: isDm ? '🛡️ Zindan Efendisi (DM)' : localPlayerName,
      isDm,
      text: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isWhisper,
      recipientId: recipient,
      recipientName: recipient === 'DM' ? '🛡️ DM' : (targetPlayer?.name || recipient)
    };

    addChatMessage(newMsg);
    setMessageText('');
  };

  if (!isChatOpen) return null;

  const isDm = !isStreamerMode;
  const filteredMessages = chatMessages.filter((msg) => {
    if (!msg.isWhisper) return true;
    if (isDm) return true;
    if (msg.senderId === localPlayerName || msg.senderName === localPlayerName) return true;
    if (msg.recipientId === localPlayerName || msg.recipientName === localPlayerName) return true;
    return false;
  });

  return (
    <div 
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      className="fixed z-50 w-80 md:w-96 h-[460px] bg-slate-900/95 border-2 border-amber-500/70 rounded-3xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden select-none text-xs pointer-events-auto"
    >
      {/* Draggable Header */}
      <div 
        onMouseDown={handleMouseDownHeader}
        className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 shrink-0 cursor-move"
        title="Pencereyi ekranda taşımak için buraya basıp sürükleyin"
      >
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <GripHorizontal className="w-4 h-4 text-slate-500" />
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span>Canlı Sohbet & Fısıldama</span>
        </div>

        <button
          onClick={() => setChatOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Channel Selector */}
      <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
        <span className="text-[10px] text-slate-400 font-bold">{t('chat.channel')}</span>
        <select
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-2 py-1 text-[11px] font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="all">{t('chat.global')}</option>
          {isStreamerMode ? (
            <option value="DM">{t('chat.whisperDm')}</option>
          ) : (
            connectedPlayers.map((p) => (
              <option key={p.id} value={p.id}>{t('chat.whisperTo', { name: p.name })}</option>
            ))
          )}
        </select>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-[11px] text-center p-4">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <span>{t('chat.noMessages')}</span>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isOwn = (isDm && msg.isDm) || (!isDm && msg.senderId === localPlayerName);
            return (
              <div
                key={msg.id}
                className={'flex flex-col ' + (isOwn ? 'items-end' : 'items-start')}
              >
                <div className="flex items-center gap-1 mb-0.5 text-[10px] text-slate-400 font-bold px-1">
                  {msg.isWhisper ? (
                    <span className="flex items-center gap-1 text-purple-400">
                      <Lock className="w-2.5 h-2.5" />
                      <span>{msg.senderName} ➔ {msg.recipientName}</span>
                    </span>
                  ) : (
                    <span>{msg.senderName}</span>
                  )}
                  <span className="text-slate-600 font-normal font-mono">{msg.timestamp}</span>
                </div>

                <div
                  className={
                    'p-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ' +
                    (msg.isWhisper
                      ? 'bg-purple-950/80 border border-purple-700/80 text-purple-200 shadow-md'
                      : isOwn
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-md rounded-br-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-none')
                  }
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder={t('chat.placeholder')}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-amber-500"
        />

        <button
          type="submit"
          disabled={!messageText.trim()}
          className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
