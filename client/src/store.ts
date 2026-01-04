import { create } from 'zustand';

interface Player {
    id: string;
    name: string;
    roomId: string;
    isReady: boolean;
    cardCount: number;
    hand?: number[]; // Pour l'admin
}

interface GameInfo {
    status: 'waiting' | 'playing' | 'won' | 'lost' | 'paused' | 'shuriken_reveal';
    level: number;
    lives: number;
    shurikens: number;
    currentPile: number[];
    shurikenVote?: {
        active: boolean;
        proposedBy: string | null;
        votes: Record<string, boolean | null>;
    };
    shurikenRevealData?: {
        discardedCards: { player: string, card: number }[];
        readyPlayers: string[];
    };
    lastGameResult?: {
        won: boolean;
        level: number;
    };
    trainingMode?: boolean;
}

interface GameState {
    isConnected: boolean;
    roomId: string | null;
    hostId: string | null;
    playerName: string | null;
    isAdmin: boolean;
    players: Player[];
    hand: number[];
    gameInfo: GameInfo;
    
    setConnected: (connected: boolean) => void;
    setRoomInfo: (roomId: string, playerName: string, hostId: string, isAdmin: boolean) => void;
    setPlayers: (players: Player[]) => void;
    setHand: (hand: number[]) => void;
    setGameInfo: (info: GameInfo) => void;
    setHostId: (hostId: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
    isConnected: false,
    roomId: null,
    hostId: null,
    playerName: null,
    isAdmin: false,
    players: [],
    hand: [],
    gameInfo: {
        status: 'waiting',
        level: 1,
        lives: 0,
        shurikens: 0,
        currentPile: []
    },

    setConnected: (connected) => set({ isConnected: connected }),
    setRoomInfo: (roomId, playerName, hostId, isAdmin) => set({ roomId, playerName, hostId, isAdmin }),
    setPlayers: (players) => set({ players }),
    setHand: (hand) => set({ hand }),
    setGameInfo: (info) => set({ gameInfo: info }),
    setHostId: (hostId) => set({ hostId }),
}));
