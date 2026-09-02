import { useEffect } from 'react';
import { TopNavbar } from './components/ui/TopNavbar';
import { Toolbar } from './components/ui/Toolbar';
import { LayerSelector } from './components/ui/LayerSelector';
import { GameCanvas } from './components/canvas/GameCanvas';
import { BackstageDrawer } from './components/dm/BackstageDrawer';
import { RoomTemplates } from './components/dungeon/RoomTemplates';
import { DoodleToAssetModal } from './components/paint/DoodleToAssetModal';
import { MagicLampModal } from './components/dm/MagicLampModal';
import { DiceRoller } from './components/dice/DiceRoller';
import { RulebookModal } from './components/rules/RulebookModal';
import { RoleplayBoard } from './components/roleplay/RoleplayBoard';
import { SpotlightOverlay } from './components/roleplay/SpotlightOverlay';
import { WhiteboardScene } from './components/whiteboard/WhiteboardScene';
import { WheelOfFortuneModal } from './components/wheel/WheelOfFortuneModal';
import { SessionManagerModal } from './components/dm/SessionManagerModal';
import { MultiplayerModal } from './components/network/MultiplayerModal';
import { InitiativeTracker } from './components/combat/InitiativeTracker';
import { PartyChatDrawer } from './components/chat/PartyChatDrawer';
import { SoundboardModal } from './components/audio/SoundboardModal';
import { peerSyncService } from './services/peerSyncService';
import { useGameStore } from './hooks/useGameStore';

export function App() {
  const { 
    activeView, 
    setStreamerMode, 
    setLockedPlayerMode 
  } = useGameStore();

  useEffect(() => {
    // Provide full state snapshot getter to PeerSyncService
    peerSyncService.setSnapshotProvider(() => useGameStore.getState());

    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const roomParam = params.get('room');

    if (mode === 'player' || roomParam) {
      setStreamerMode(true);
      setLockedPlayerMode(true);
      if (roomParam) {
        peerSyncService.connectToHost(roomParam).catch((err) => {
          console.warn('Auto-connect to room failed:', roomParam, err);
        });
      }
    }
  }, [setStreamerMode, setLockedPlayerMode]);

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* Top Navigation Bar with Scene Switcher */}
      <TopNavbar />

      {/* Main Stage: Map Canvas, Whiteboard, or Roleplay Board */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {activeView === 'map' ? (
          <>
            {/* Map Canvas with Grid, Rooms, Corridors & Tokens */}
            <GameCanvas />

            {/* Floating Tools */}
            <Toolbar />

            {/* Multi-Floor Map Layer Selector */}
            <LayerSelector />

            {/* Dungeon Room Templates Drawer */}
            <RoomTemplates />

            {/* DM Secret Backstage Vault */}
            <BackstageDrawer />
          </>
        ) : activeView === 'whiteboard' ? (
          /* Fullscreen Collaborative Free Whiteboard / Paint Canvas */
          <WhiteboardScene />
        ) : (
          /* Roleplay Scene Art, Handouts & NPC Gallery */
          <RoleplayBoard />
        )}

        {/* Global Floating Dice Roller */}
        <DiceRoller />
      </main>

      {/* Modals & Fullscreen Overlays */}
      <DoodleToAssetModal />
      <MagicLampModal />
      <RulebookModal />
      <SpotlightOverlay />
      <WheelOfFortuneModal />
      <SessionManagerModal />
      <MultiplayerModal />
      <InitiativeTracker />
      <PartyChatDrawer />
      <SoundboardModal />
    </div>
  );
}

export default App;
