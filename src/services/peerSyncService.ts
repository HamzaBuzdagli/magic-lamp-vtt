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

  // Initialize as Host (DM)
  public async initHost(customRoomId?: string, getFullStateSnapshot?: () => any): Promise<string> {
    if (this.peer) {
      this.disconnect();
    }

    if (getFullStateSnapshot) {
      this.snapshotProvider = getFullStateSnapshot;
    }

    const targetRoomId = customRoomId || this.generateRoomId();
    this.roomId = targetRoomId;
    this.isHost = true;
    this.setStatus('connecting');

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer(targetRoomId, PEER_CONFIG);
        this.peer = peer;

        peer.on('open', (id) => {
          this.roomId = id;
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
            const newId = this.generateRoomId();
            this.initHost(newId, getFullStateSnapshot).then(resolve).catch(reject);
          } else {
            this.setStatus('error');
            reject(err);
          }
        });

        peer.on('disconnected', () => {
          this.setStatus('disconnected');
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

  // Connect as Player (Client) to DM Host
  public async connectToHost(hostRoomId: string): Promise<void> {
    if (this.peer) {
      this.disconnect();
    }

    this.roomId = hostRoomId;
    this.isHost = false;
    this.setStatus('connecting');

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer(PEER_CONFIG);
        this.peer = peer;

        peer.on('open', () => {
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
                id: conn.peer || pName,
                name: pName
              }
            } as PeerSyncMessage);

            resolve();
          });

          conn.on('data', (data: any) => {
            const msg = data as PeerSyncMessage;
            if (!msg) return;

            if (msg.type === 'FULL_STATE' || msg.type === 'SYNC_STATE') {
              if (msg.payload) {
                this.stateListeners.forEach((cb) => cb(msg.payload));
              }
            }
          });

          conn.on('close', () => {
            this.setStatus('disconnected');
            this.hostConnection = null;
          });

          conn.on('error', (err) => {
            console.warn('[PeerJS Connection Error]:', err);
            this.setStatus('error');
          });
        });

        peer.on('error', (err) => {
          console.warn('[PeerJS Client Error]:', err);
          this.setStatus('error');
          reject(err);
        });

        peer.on('disconnected', () => {
          this.setStatus('disconnected');
        });
      } catch (err) {
        this.setStatus('error');
        reject(err);
      }
    });
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

  // Disconnect
  public disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
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
