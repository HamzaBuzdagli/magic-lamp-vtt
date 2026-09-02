import { Peer, type DataConnection } from 'peerjs';

export type PeerConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'hosting' | 'error';

export interface PeerSyncMessage {
  type: 'FULL_STATE' | 'SYNC_STATE' | 'PLAYER_ACTION' | 'PING';
  payload?: any;
  action?: string;
  senderId?: string;
}

const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  }
};

class PeerSyncService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  public roomId: string | null = null;
  public isHost: boolean = false;
  public status: PeerConnectionStatus = 'disconnected';
  public connectedPeersCount: number = 0;
  private snapshotProvider: (() => any) | null = null;
  private pingInterval: any = null;
  private reconnectTimeout: any = null;
  private isExplicitDisconnect: boolean = false;

  private statusListeners: Set<(status: PeerConnectionStatus, roomId?: string) => void> = new Set();
  private peerCountListeners: Set<(count: number) => void> = new Set();
  private stateListeners: Set<(payload: any) => void> = new Set();
  private actionListeners: Set<(action: string, payload: any) => void> = new Set();

  public setSnapshotProvider(provider: () => any) {
    this.snapshotProvider = provider;
  }

  private setStatus(status: PeerConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach((cb) => cb(status, this.roomId || undefined));
  }

  private updatePeerCount() {
    this.connectedPeersCount = this.connections.size;
    this.peerCountListeners.forEach((cb) => cb(this.connectedPeersCount));
  }

  public onStatusChange(cb: (status: PeerConnectionStatus, roomId?: string) => void) {
    this.statusListeners.add(cb);
    cb(this.status, this.roomId || undefined);
    return () => this.statusListeners.delete(cb);
  }

  public onPeerCountChange(cb: (count: number) => void) {
    this.peerCountListeners.add(cb);
    cb(this.connectedPeersCount);
    return () => this.peerCountListeners.delete(cb);
  }

  public onStateReceived(cb: (payload: any) => void) {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  public onActionReceived(cb: (action: string, payload: any) => void) {
    this.actionListeners.add(cb);
    return () => this.actionListeners.delete(cb);
  }

  public generateRoomId(): string {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `lamba-${randomDigits}`;
  }

  // Initialize as Host (DM) with persistent room ID
  public async initHost(customRoomId?: string, getFullStateSnapshot?: () => any): Promise<string> {
    this.isExplicitDisconnect = false;
    if (this.peer) {
      this.disconnect(false);
    }

    if (getFullStateSnapshot) {
      this.snapshotProvider = getFullStateSnapshot;
    }

    const savedRoomId = typeof window !== 'undefined' ? localStorage.getItem('magic_lamp_active_host_room_id') : null;
    const targetRoomId = customRoomId || savedRoomId || this.generateRoomId();
    this.roomId = targetRoomId;
    this.isHost = true;
    this.setStatus('connecting');

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer(targetRoomId, PEER_CONFIG);
        this.peer = peer;

        peer.on('open', (id) => {
          this.roomId = id;
          if (typeof window !== 'undefined') {
            localStorage.setItem('magic_lamp_active_host_room_id', id);
          }
          this.setStatus('hosting');
          this.startHeartbeat();
          resolve(id);
        });

        peer.on('connection', (conn) => {
          this.setupHostConnection(conn);
        });

        peer.on('error', (err: any) => {
          console.warn('[PeerJS Host Error]:', err);
          if (err.type === 'unavailable-id') {
            // If ID is already taken or stale, re-generate
            const newId = this.generateRoomId();
            this.initHost(newId, getFullStateSnapshot).then(resolve).catch(reject);
          } else {
            this.setStatus('error');
            reject(err);
          }
        });

        peer.on('disconnected', () => {
          if (!this.isExplicitDisconnect) {
            this.peer?.reconnect();
          } else {
            this.setStatus('disconnected');
          }
        });
      } catch (err) {
        this.setStatus('error');
        reject(err);
      }
    });
  }

  private setupHostConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.updatePeerCount();

      // Send initial full state snapshot to the newly connected player immediately
      const state = this.snapshotProvider ? this.snapshotProvider() : null;
      if (state) {
        conn.send({
          type: 'FULL_STATE',
          payload: state,
        } as PeerSyncMessage);
      }
    });

    conn.on('data', (data: any) => {
      const msg = data as PeerSyncMessage;
      if (!msg) return;

      if (msg.type === 'PLAYER_ACTION' && msg.action === 'KICKED') {
        this.isExplicitDisconnect = true;
        this.disconnect(true);
        this.actionListeners.forEach((cb) => cb('KICKED', msg.payload));
        return;
      }

      if (msg.type === 'PLAYER_ACTION' && msg.action) {
        this.actionListeners.forEach((cb) => cb(msg.action!, msg.payload));
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.updatePeerCount();
    });

    conn.on('error', () => {
      this.connections.delete(conn.peer);
      this.updatePeerCount();
    });
  }

  // Connect as Player (Client) with Auto-Reconnect on Host reload
  public async connectToHost(hostRoomId: string): Promise<void> {
    this.isExplicitDisconnect = false;
    if (this.peer) {
      this.disconnect(false);
    }

    this.roomId = hostRoomId;
    this.isHost = false;
    this.setStatus('connecting');

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer(PEER_CONFIG);
        this.peer = peer;

        peer.on('open', () => {
          this.attemptHostConnection(peer, hostRoomId, resolve);
        });

        peer.on('error', (err) => {
          console.warn('[PeerJS Client Error]:', err);
          this.schedulePlayerReconnect(hostRoomId);
        });

        peer.on('disconnected', () => {
          if (!this.isExplicitDisconnect) {
            this.schedulePlayerReconnect(hostRoomId);
          } else {
            this.setStatus('disconnected');
          }
        });
      } catch (err) {
        this.setStatus('error');
        reject(err);
      }
    });
  }

  private attemptHostConnection(peer: Peer, hostRoomId: string, onConnected?: () => void) {
    const conn = peer.connect(hostRoomId, {
      reliable: true,
    });
    this.hostConnection = conn;

    conn.on('open', () => {
      this.setStatus('connected');
      this.startHeartbeat();

      // Send PLAYER_JOIN to host immediately upon connection!
      const pName = typeof window !== 'undefined' 
        ? (localStorage.getItem('magic_lamp_player_name') || `Oyuncu-${Math.floor(1000 + Math.random() * 9000)}`)
        : 'Oyuncu';

      conn.send({
        type: 'PLAYER_ACTION',
        action: 'PLAYER_JOIN',
        payload: {
          id: peer.id || conn.peer || pName,
          name: pName
        }
      } as PeerSyncMessage);

      if (onConnected) onConnected();
    });

    conn.on('data', (data: any) => {
      const msg = data as PeerSyncMessage;
      if (!msg) return;

      if (msg.type === 'PLAYER_ACTION' && msg.action === 'KICKED') {
        this.isExplicitDisconnect = true;
        this.disconnect(true);
        this.actionListeners.forEach((cb) => cb('KICKED', msg.payload));
        return;
      }

      if (msg.type === 'FULL_STATE' || msg.type === 'SYNC_STATE') {
        if (msg.payload) {
          this.stateListeners.forEach((cb) => cb(msg.payload));
        }
      }
    });

    conn.on('close', () => {
      if (!this.isExplicitDisconnect) {
        this.schedulePlayerReconnect(hostRoomId);
      } else {
        this.setStatus('disconnected');
        this.hostConnection = null;
      }
    });

    conn.on('error', (err) => {
      console.warn('[PeerJS Connection Error]:', err);
      if (!this.isExplicitDisconnect) {
        this.schedulePlayerReconnect(hostRoomId);
      }
    });
  }

  private schedulePlayerReconnect(hostRoomId: string) {
    if (this.isExplicitDisconnect) return;
    this.setStatus('connecting');
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      if (this.peer && !this.peer.destroyed) {
        this.attemptHostConnection(this.peer, hostRoomId);
      } else {
        this.connectToHost(hostRoomId).catch(() => {});
      }
    }, 2500);
  }

  private startHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.isHost) {
        this.connections.forEach((conn) => {
          if (conn.open) conn.send({ type: 'PING' });
        });
      } else if (this.hostConnection && this.hostConnection.open) {
        this.hostConnection.send({ type: 'PING' });
      }
    }, 10000);
  }

  // Broadcast state changes from Host to all connected players
  public broadcastToPeers(payload: any) {
    if (!this.isHost || this.connections.size === 0) return;

    const msg: PeerSyncMessage = {
      type: 'SYNC_STATE',
      payload,
    };

    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

    // Kick a specific peer from the room (DM only)
  public kickPeer(peerId: string) {
    if (!this.isHost) return;

    for (const [id, conn] of this.connections.entries()) {
      if (id === peerId || conn.peer === peerId || (conn as any).peerId === peerId) {
        try {
          conn.send({
            type: 'PLAYER_ACTION',
            action: 'KICKED',
            payload: { reason: 'DM tarafından odadan çıkarıldınız.' }
          } as PeerSyncMessage);
          setTimeout(() => {
            try { conn.close(); } catch (_) {}
          }, 300);
        } catch (e) {
          console.warn('Error kicking peer:', e);
        }
        this.connections.delete(id);
      }
    }
    this.updatePeerCount();
  }

  // Send player action (dice roll, chat, token move) to Host
  public sendActionToHost(action: string, payload: any) {
    if (this.isHost || !this.hostConnection || !this.hostConnection.open) return;

    const msg: PeerSyncMessage = {
      type: 'PLAYER_ACTION',
      action,
      payload,
    };

    this.hostConnection.send(msg);
  }

  // Disconnect & End Room
  public disconnect(isManual: boolean = true) {
    this.isExplicitDisconnect = isManual;

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (isManual && typeof window !== 'undefined') {
      localStorage.removeItem('magic_lamp_active_host_room_id');
    }

    this.connections.forEach((conn) => conn.close());
    this.connections.clear();

    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.roomId = null;
    this.isHost = false;
    this.setStatus('disconnected');
    this.updatePeerCount();
  }
}

export const peerSyncService = new PeerSyncService();
