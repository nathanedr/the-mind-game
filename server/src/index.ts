import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const app = express();
app.use(cors());

// Servir les fichiers statiques du client (build)
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// Pour toutes les autres routes, renvoyer l'index.html (SPA)
app.get('*', (req, res) => {
    // Si la requête ne demande pas un fichier (pas d'extension), on renvoie index.html
    if (!req.path.includes('.')) {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    } else {
        res.status(404).end();
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- TYPES ---

type Card = number;

interface Player {
    id: string;
    name: string;
    roomId: string;
    hand: Card[];
    isReady: boolean;
    isAdmin: boolean;
}

interface GameState {
    status: 'waiting' | 'playing' | 'won' | 'lost' | 'paused' | 'shuriken_reveal';
    level: number;
    lives: number;
    shurikens: number;
    currentPile: Card[];
    lowestCardOnBoard: number | null;
    shurikenVote: {
        active: boolean;
        proposedBy: string | null;
        votes: Record<string, boolean | null>; // null = pas encore voté
    };
    shurikenRevealData?: {
        discardedCards: { player: string, card: number }[];
        readyPlayers: string[];
    };
    lastGameResult?: {
        won: boolean;
        level: number;
    };
    trainingMode: boolean;
}

interface Room {
    id: string;
    hostId: string;
    players: Player[];
    gameState: GameState;
    history: string[]; // JSON stringified GameState + Players hands
}

const rooms: Record<string, Room> = {};
const players: Record<string, Player> = {};

// Helper pour envoyer les infos joueurs sans révéler les cartes
const getSanitizedPlayers = (room: Room) => {
    return room.players.map(p => ({
        id: p.id,
        name: p.name,
        roomId: p.roomId,
        isReady: p.isReady,
        cardCount: p.hand.length,
        isAdmin: p.isAdmin,
        hand: room.gameState.trainingMode ? p.hand : undefined // Révéler les mains en mode entraînement
    }));
};

// Helper pour envoyer les infos complètes (pour l'admin)
const getFullPlayers = (room: Room) => {
    return room.players.map(p => ({
        id: p.id,
        name: p.name,
        roomId: p.roomId,
        isReady: p.isReady,
        cardCount: p.hand.length,
        isAdmin: p.isAdmin,
        hand: p.hand
    }));
};

// --- LOGIQUE DU JEU ---

const generateDeck = () => {
    return Array.from({ length: 100 }, (_, i) => i + 1);
};

const shuffleDeck = (deck: number[]) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const startLevel = (room: Room) => {
    const deck = shuffleDeck(generateDeck());
    
    // Distribuer 'level' cartes à chaque joueur
    room.players.forEach(player => {
        player.hand = deck.splice(0, room.gameState.level).sort((a, b) => a - b);
    });

    room.gameState.currentPile = [];
    
    // Notifier tout le monde
    io.to(room.id).emit('game_update', {
        gameState: room.gameState,
        players: getSanitizedPlayers(room),
        hostId: room.hostId
    });

    // Envoyer les infos complètes aux admins
    room.players.filter(p => p.isAdmin).forEach(admin => {
        io.to(admin.id).emit('admin_players_update', getFullPlayers(room));
    });

    // Envoyer sa main à chaque joueur individuellement
    room.players.forEach(player => {
        io.to(player.id).emit('hand_update', player.hand);
    });
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Créer une room
    socket.on('create_room', ({ playerName, password }: { playerName: string, password?: string }, callback) => {
        const roomId = uuidv4().slice(0, 6).toUpperCase();
        
        let isAdmin = false;
        if (playerName === "Nathinho") {
            if (password === "TheMind16") {
                isAdmin = true;
            } else {
                return callback({ success: false, message: "Mot de passe incorrect" });
            }
        }

        const newPlayer: Player = { 
            id: socket.id, 
            name: playerName, 
            roomId, 
            hand: [], 
            isReady: false,
            isAdmin
        };
        
        rooms[roomId] = {
            id: roomId,
            hostId: socket.id,
            players: [newPlayer],
            gameState: {
                status: 'waiting',
                level: 1,
                lives: 0,
                shurikens: 1,
                currentPile: [],
                lowestCardOnBoard: null,
                shurikenVote: {
                    active: false,
                    proposedBy: null,
                    votes: {}
                },
                trainingMode: false
            },
            history: []
        };
        players[socket.id] = newPlayer;

        socket.join(roomId);
        callback({ 
            success: true, 
            roomId, 
            players: getSanitizedPlayers(rooms[roomId]), 
            gameState: rooms[roomId].gameState, 
            hostId: rooms[roomId].hostId,
            isAdmin
        });
    });

    // Rejoindre une room
    socket.on('join_room', ({ roomId, playerName }: { roomId: string, playerName: string }, callback) => {
        const room = rooms[roomId];
        if (!room) {
            return callback({ success: false, message: "Room introuvable" });
        }
        if (room.gameState.status !== 'waiting') {
            return callback({ success: false, message: "Partie déjà en cours" });
        }
        if (room.players.length >= 7) {
            return callback({ success: false, message: "Room complète" });
        }

        const newPlayer: Player = { 
            id: socket.id, 
            name: playerName, 
            roomId, 
            hand: [], 
            isReady: false,
            isAdmin: false
        };
        room.players.push(newPlayer);
        players[socket.id] = newPlayer;

        socket.join(roomId);
        
        io.to(roomId).emit('update_players', getSanitizedPlayers(room));
        
        // Update admins
        room.players.filter(p => p.isAdmin).forEach(admin => {
            io.to(admin.id).emit('admin_players_update', getFullPlayers(room));
        });

        callback({ success: true, players: getSanitizedPlayers(room), gameState: room.gameState, hostId: room.hostId });
    });

    // Actions Admin
    socket.on('admin_action', ({ type, value, targetId }: { type: string, value?: any, targetId?: string }) => {
        const player = players[socket.id];
        if (!player || !player.isAdmin) return;
        const room = rooms[player.roomId];
        if (!room) return;

        if (type === 'setLevel') {
            room.gameState.level = value;
            // Si on change de niveau, on relance le niveau
            if (room.gameState.status === 'playing' || room.gameState.status === 'paused') {
                startLevel(room);
            }
        } else if (type === 'setLives') {
            room.gameState.lives = value;
        } else if (type === 'setShurikens') {
            room.gameState.shurikens = value;
        } else if (type === 'togglePause') {
            if (room.gameState.status === 'playing') {
                room.gameState.status = 'paused';
            } else if (room.gameState.status === 'paused') {
                room.gameState.status = 'playing';
            }
        } else if (type === 'toggleTraining') {
            room.gameState.trainingMode = !room.gameState.trainingMode;
        } else if (type === 'reset') {
            room.gameState.status = 'waiting';
            room.gameState.level = 1;
            room.gameState.lives = 0;
            room.gameState.shurikens = 0;
            room.gameState.currentPile = [];
            room.gameState.lastGameResult = undefined;
            room.history = [];
            room.players.forEach(p => p.hand = []);
            
            // Notify everyone
            io.to(room.id).emit('game_update', {
                gameState: room.gameState,
                players: getSanitizedPlayers(room),
                hostId: room.hostId
            });
            // Clear hands on client
             room.players.forEach(p => {
                io.to(p.id).emit('hand_update', []);
            });
        } else if (type === 'kick' && targetId) {
            const targetPlayer = room.players.find(p => p.id === targetId);
            if (targetPlayer) {
                // Emit kicked event specifically
                io.to(targetId).emit('player_kicked', { message: "Vous avez été exclu de la partie par l'administrateur." });
                
                // Remove player logic
                room.players = room.players.filter(p => p.id !== targetId);
                delete players[targetId];
                
                // Disconnect socket after a short delay to ensure message is sent
                setTimeout(() => {
                    io.sockets.sockets.get(targetId)?.disconnect(true);
                }, 500);
            }
        } else if (type === 'forcePlay' && targetId) {
            const targetPlayer = room.players.find(p => p.id === targetId);
            if (targetPlayer && targetPlayer.hand.length > 0) {
                let cardToPlay = value;
                // If value is 0 or invalid (not in hand), default to lowest
                if (!cardToPlay || !targetPlayer.hand.includes(cardToPlay)) {
                     cardToPlay = Math.min(...targetPlayer.hand);
                }
                playCardLogic(room, targetPlayer, cardToPlay);
            }
        } else if (type === 'undo') {
            if (room.history.length > 0) {
                const previousState = JSON.parse(room.history.pop()!);
                room.gameState = previousState.gameState;
                // Restore hands
                room.players.forEach(p => {
                    const savedPlayer = previousState.players.find((sp: any) => sp.id === p.id);
                    if (savedPlayer) {
                        p.hand = savedPlayer.hand;
                    }
                });
                
                // Notify everyone of full restore
                room.players.forEach(p => {
                    io.to(p.id).emit('hand_update', p.hand);
                });
            }
        }

        io.to(room.id).emit('game_update', {
            gameState: room.gameState,
            players: getSanitizedPlayers(room),
            hostId: room.hostId
        });

        // Update admins (Fix for hover bug after level change)
        room.players.filter(p => p.isAdmin).forEach(admin => {
            io.to(admin.id).emit('admin_players_update', getFullPlayers(room));
        });
    });

    const saveHistory = (room: Room) => {
        const stateSnapshot = {
            gameState: JSON.parse(JSON.stringify(room.gameState)),
            players: room.players.map(p => ({ id: p.id, hand: [...p.hand] }))
        };
        room.history.push(JSON.stringify(stateSnapshot));
        if (room.history.length > 10) room.history.shift(); // Keep last 10 states
    };

    // Helper for playing a card (refactored from socket listener)
    const playCardLogic = (room: Room, player: Player, cardValue: number) => {
        if (room.gameState.status !== 'playing') return;
        if (!player.hand.includes(cardValue)) return;

        // SAVE HISTORY BEFORE ACTION
        saveHistory(room);

        // LOGIQUE DE JEU CRITIQUE
        let lowestCardHeld = 101;
        let ownerOfLowestName = "";

        for (const p of room.players) {
            if (p.hand.length > 0 && p.hand[0] < lowestCardHeld) {
                lowestCardHeld = p.hand[0];
                ownerOfLowestName = p.name;
            }
        }

        if (cardValue > lowestCardHeld) {
            // ERREUR !
            room.gameState.lives -= 1;
            io.to(room.id).emit('game_error', { 
                wrongCard: cardValue, 
                playedBy: player.name,
                shouldHavePlayed: lowestCardHeld,
                ownerOfLowest: ownerOfLowestName
            });

            if (room.gameState.lives <= 0) {
                room.gameState.status = 'waiting';
                room.gameState.lastGameResult = { won: false, level: room.gameState.level };
                
                io.to(room.id).emit('game_update', {
                    gameState: room.gameState,
                    players: getSanitizedPlayers(room),
                    hostId: room.hostId
                });
                io.to(room.id).emit('game_over', { won: false });
            } else {
                // On retire la carte jouée (même si erreur) ET toutes les cartes inférieures
                player.hand = player.hand.filter(c => c !== cardValue);
                
                room.players.forEach(p => {
                    const discarded = p.hand.filter(c => c < cardValue);
                    if (discarded.length > 0) {
                        p.hand = p.hand.filter(c => c >= cardValue);
                    }
                });
                
                // Mise à jour des mains
                room.players.forEach(p => {
                    io.to(p.id).emit('hand_update', p.hand);
                });
            }
        } else {
            // SUCCÈS
            player.hand = player.hand.filter(c => c !== cardValue);
            room.gameState.currentPile.push(cardValue);
            
            io.to(player.id).emit('hand_update', player.hand);
            io.to(room.id).emit('card_played', { card: cardValue, player: player.name });
        }

        // Vérifier fin de niveau
        const totalCardsRemaining = room.players.reduce((sum, p) => sum + p.hand.length, 0);
        if (totalCardsRemaining === 0 && room.gameState.status === 'playing') {
            // Niveau terminé !
            room.gameState.level += 1;
            if (room.gameState.level > 12) {
                room.gameState.status = 'won';
                io.to(room.id).emit('game_over', { won: true });
            } else {
                // Bonus logic... (omitted for brevity, assuming it's handled in startLevel or here)
                // Actually, bonus logic is here in the original code. I need to keep it.
                // Since I'm replacing the socket listener with this helper, I need to make sure I didn't delete the bonus logic.
                // Wait, I am replacing 'admin_action' block, but I need to replace 'play_card' listener too to use this helper.
                
                // ... (Bonus logic from original code) ...
                const numPlayers = room.players.length;
                const justFinishedLevel = room.gameState.level - 1;
                
                // Shurikens : Réussite des niveaux 2, 5, 8
                if ([2, 5, 8].includes(justFinishedLevel)) {
                    if (room.gameState.shurikens < 3) {
                        room.gameState.shurikens++;
                    }
                }

                // Vies
                let maxLives = 5;
                let lifeLevels = [3, 6, 9, 10, 11]; // 7+ joueurs

                if (numPlayers < 3) {
                    maxLives = 3;
                    lifeLevels = [3, 6, 9];
                } else if (numPlayers <= 6) {
                    maxLives = 4;
                    lifeLevels = [3, 6, 9, 11];
                }

                if (lifeLevels.includes(justFinishedLevel)) {
                    if (room.gameState.lives < maxLives) {
                        room.gameState.lives++;
                    }
                }
                
                setTimeout(() => {
                    startLevel(room);
                }, 2000);
            }
        }

        // Envoyer l'état global mis à jour
        io.to(room.id).emit('game_update', {
            gameState: room.gameState,
            players: getSanitizedPlayers(room),
            hostId: room.hostId
        });

        // Update admins
        room.players.filter(p => p.isAdmin).forEach(admin => {
            io.to(admin.id).emit('admin_players_update', getFullPlayers(room));
        });
    };



    // Lancer la partie
    socket.on('start_game', () => {
        const player = players[socket.id];
        if (!player) return;
        const room = rooms[player.roomId];
        if (!room) return;

        // Only host can start
        if (room.hostId !== socket.id) return;

        // Empêcher le redémarrage si la partie est déjà en cours (évite les doubles clics sur Rejouer)
        if (room.gameState.status === 'playing') return;

        // Config initiale
        room.gameState.status = 'playing';
        room.gameState.level = 1;
        room.gameState.lastGameResult = undefined;
        
        // Démarrage à 0 (Pas de bonus initiaux)
        room.gameState.lives = 0;
        room.gameState.shurikens = 0;
        room.gameState.shurikenVote = { active: false, proposedBy: null, votes: {} };
        
        startLevel(room);
    });

    // Retry current level (Host only)
    socket.on('retry_level', () => {
        const player = players[socket.id];
        if (!player) return;
        const room = rooms[player.roomId];
        if (!room) return;

        if (room.hostId !== socket.id) return;
        if (room.gameState.status === 'playing') return;

        // Use the level from lastGameResult if available, or current level
        const levelToRetry = room.gameState.lastGameResult?.level || room.gameState.level;

        room.gameState.status = 'playing';
        room.gameState.level = levelToRetry;
        room.gameState.lastGameResult = undefined;

        // Reset lives/shurikens to 0/0
        room.gameState.lives = 0;
        room.gameState.shurikens = 0;
        room.gameState.shurikenVote = { active: false, proposedBy: null, votes: {} };

        startLevel(room);
    });

    // Proposer un Shuriken
    socket.on('propose_shuriken', () => {
        const player = players[socket.id];
        if (!player) return;
        const room = rooms[player.roomId];
        if (!room || room.gameState.status !== 'playing') return;
        if (room.gameState.shurikens <= 0) return;
        if (room.gameState.shurikenVote.active) return;

        room.gameState.shurikenVote = {
            active: true,
            proposedBy: player.name,
            votes: { [player.id]: true } // Le proposeur vote oui automatiquement
        };

        io.to(room.id).emit('game_update', {
            gameState: room.gameState,
            players: getSanitizedPlayers(room),
            hostId: room.hostId
        });
    });

    // Voter pour le Shuriken
    socket.on('vote_shuriken', (vote: boolean) => {
        const player = players[socket.id];
        if (!player) return;
        const room = rooms[player.roomId];
        if (!room || !room.gameState.shurikenVote.active) return;

        room.gameState.shurikenVote.votes[player.id] = vote;

        // Vérifier si tout le monde a voté
        const allVotes = Object.values(room.gameState.shurikenVote.votes);
        const totalPlayers = room.players.length;
        
        // Si quelqu'un a voté NON, on annule tout de suite
        if (vote === false) {
            room.gameState.shurikenVote = { active: false, proposedBy: null, votes: {} };
            io.to(room.id).emit('game_message', { text: `${player.name} a refusé le Shuriken.` });
        } 
        // Si tout le monde a voté OUI
        else if (Object.keys(room.gameState.shurikenVote.votes).length === totalPlayers) {
            // Exécuter le Shuriken
            room.gameState.shurikens -= 1;
            room.gameState.shurikenVote = { active: false, proposedBy: null, votes: {} };
            
            const discardedCards: { player: string, card: number }[] = [];

            room.players.forEach(p => {
                if (p.hand.length > 0) {
                    const lowest = Math.min(...p.hand);
                    p.hand = p.hand.filter(c => c !== lowest);
                    discardedCards.push({ player: p.name, card: lowest });
                    io.to(p.id).emit('hand_update', p.hand);
                }
            });

            // PAUSE DU JEU POUR REVELATION
            room.gameState.status = 'shuriken_reveal';
            room.gameState.shurikenRevealData = {
                discardedCards: discardedCards,
                readyPlayers: []
            };

            io.to(room.id).emit('shuriken_effect', discardedCards);
        }

        io.to(room.id).emit('game_update', {
            gameState: room.gameState,
            players: getSanitizedPlayers(room),
            hostId: room.hostId
        });
    });

    // Validation de la reprise après Shuriken
    socket.on('shuriken_continue', () => {
        const player = players[socket.id];
        if (!player) return;
        const room = rooms[player.roomId];
        if (!room || room.gameState.status !== 'shuriken_reveal' || !room.gameState.shurikenRevealData) return;

        if (!room.gameState.shurikenRevealData.readyPlayers.includes(player.id)) {
            room.gameState.shurikenRevealData.readyPlayers.push(player.id);
        }

        // Si tout le monde est prêt
        if (room.gameState.shurikenRevealData.readyPlayers.length === room.players.length) {
            room.gameState.status = 'playing';
            const discardedCards = room.gameState.shurikenRevealData.discardedCards; // Keep ref for logic check
            room.gameState.shurikenRevealData = undefined;

            // Vérifier fin de niveau (Copie de la logique de play_card)
            // On le fait MAINTENANT, après que tout le monde ait vu les cartes
            const totalCardsRemaining = room.players.reduce((sum, p) => sum + p.hand.length, 0);
            if (totalCardsRemaining === 0) {
                // Niveau terminé !
                room.gameState.level += 1;
                if (room.gameState.level > 12) {
                    room.gameState.status = 'won';
                    io.to(room.id).emit('game_over', { won: true });
                } else {
                    // Bonus
                    const numPlayers = room.players.length;
                    const justFinishedLevel = room.gameState.level - 1;
                    
                    // Shurikens : Réussite des niveaux 2, 5, 8
                    if ([2, 5, 8].includes(justFinishedLevel)) {
                        if (room.gameState.shurikens < 3) {
                            room.gameState.shurikens++;
                        }
                    }

                    // Vies
                    let maxLives = 5;
                    let lifeLevels = [3, 6, 9, 10, 11]; // 7+ joueurs

                    if (numPlayers < 3) {
                        maxLives = 3;
                        lifeLevels = [3, 6, 9];
                    } else if (numPlayers <= 6) {
                        maxLives = 4;
                        lifeLevels = [3, 6, 9, 11];
                    }

                    if (lifeLevels.includes(justFinishedLevel)) {
                        if (room.gameState.lives < maxLives) {
                            room.gameState.lives++;
                        }
                    }
                    
                    setTimeout(() => {
                        startLevel(room);
                    }, 2000);
                }
            }
        }

        io.to(room.id).emit('game_update', {
            gameState: room.gameState,
            players: getSanitizedPlayers(room),
            hostId: room.hostId
        });
    });

    // Jouer une carte
    socket.on('play_card', (cardValue: number) => {
        const player = players[socket.id];
        if (!player) return;
        const room = rooms[player.roomId];
        if (!room || room.gameState.status !== 'playing') return;

        playCardLogic(room, player, cardValue);
    });

    socket.on('disconnect', () => {
        const player = players[socket.id];
        if (player) {
            const room = rooms[player.roomId];
            if (room) {
                room.players = room.players.filter(p => p.id !== socket.id);
                if (room.players.length === 0) {
                    delete rooms[player.roomId];
                } else {
                    io.to(player.roomId).emit('update_players', getSanitizedPlayers(room));
                }
            }
            delete players[socket.id];
            console.log(`${player.name} disconnected`);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
