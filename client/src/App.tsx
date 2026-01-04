import { useEffect, useState, useCallback, useRef } from 'react';
import { socket } from './socket';
import { useGameStore } from './store';
import { Lobby } from './components/Lobby';
import { Card } from './components/Card';
import { Opponent } from './components/Opponent';
import { GameOverModal } from './components/GameOverModal';
import { Notification } from './components/Notification';
import { RulesModal } from './components/RulesModal';
import { PileHistoryModal } from './components/PileHistoryModal';
import { useGameSounds } from './hooks/useGameSounds.ts';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

function App() {
  const { 
    roomId, 
    hostId,
    players, 
    hand, 
    gameInfo, 
    isAdmin,
    setPlayers, 
    setConnected, 
    setHand, 
    setGameInfo,
    setHostId,
    setIsAdmin
  } = useGameStore();

  const [shake, setShake] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [gameOverState, setGameOverState] = useState<{ show: boolean, won: boolean }>({ show: false, won: false });
  const [shurikenAnimation, setShurikenAnimation] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [kicked, setKicked] = useState(false);
  const [showPileHistory, setShowPileHistory] = useState(false);
  
  // Admin X-Ray features
  const [xrayEnabled, setXrayEnabled] = useState(false);
  const [xrayTemporarilyDisabled, setXrayTemporarilyDisabled] = useState(false);
  const lastPileLength = useRef(0);
  
  const sounds = useGameSounds();

  useEffect(() => {
    function onConnect() {
      setConnected(true);
    }

    function onDisconnect() {
      setConnected(false);
    }

    function onUpdatePlayers(updatedPlayers: any[]) {
        setPlayers(updatedPlayers);
        
        // Sync local isAdmin state
        const myPlayer = updatedPlayers.find(p => p.id === socket.id);
        if (myPlayer) {
            setIsAdmin(myPlayer.isAdmin);
        }
        sounds.playJoinSound();
    }

    function onAdminPlayersUpdate(updatedPlayers: any[]) {
        setPlayers(updatedPlayers);
    }

    function onGameUpdate(data: { gameState: any, players: any[], hostId: string }) {
        // Détecter changement de niveau pour son (optionnel, à implémenter si on veut un son de level up)
        setGameInfo(data.gameState);
        setPlayers(data.players);
        if (data.hostId) setHostId(data.hostId);

        // X-Ray Logic: Si une carte est jouée (pile augmente), on réactive le X-Ray
        if (data.gameState.currentPile.length > lastPileLength.current) {
            setXrayTemporarilyDisabled(false);
        }
        lastPileLength.current = data.gameState.currentPile.length;

        // Si la partie redémarre, on ferme la modale de fin de partie pour tout le monde
        if (data.gameState.status === 'playing') {
            setGameOverState({ show: false, won: false });
        }
    }

    function onHandUpdate(newHand: number[]) {
        setHand(newHand);
    }

    function onGameError(data: any) {
        console.log("ERREUR !", data);
        if (data.message) setNotification(data.message);
        setShake(true);
        sounds.playErrorSound();
        setTimeout(() => setShake(false), 500);
    }

    function onPlayerKicked(data: { message: string }) {
        setKicked(true);
        setNotification(data.message);
        sounds.playLoseSound();
    }

    function onShurikenEffect(discardedCards: { player: string, card: number }[]) {
        const msg = discardedCards.map(d => `${d.player}: ${d.card}`).join(', ');
        setNotification(`SHURIKEN ! Cartes défaussées : ${msg}`);
        sounds.playShurikenSound();
        setShurikenAnimation(true);
        setXrayTemporarilyDisabled(true); // Désactiver X-Ray temporairement
        setTimeout(() => setShurikenAnimation(false), 1000);
    }

    function onGameMessage(data: { text: string }) {
        setNotification(data.text);
    }

    function onGameOver(data: { won: boolean }) {
        if (data.won) {
            setGameOverState({ show: true, won: true });
            sounds.playWinSound();
        } else {
            // En cas de défaite, on joue juste le son. L'interface bascule automatiquement vers le lobby (status: waiting)
            sounds.playLoseSound();
            setGameOverState({ show: false, won: false });
        }
    }

    function onCardPlayed(_data: { card: number, player: string }) {
        sounds.playCardSound();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('update_players', onUpdatePlayers);
    socket.on('admin_players_update', onAdminPlayersUpdate);
    socket.on('game_update', onGameUpdate);
    socket.on('hand_update', onHandUpdate);
    socket.on('game_error', onGameError);
    socket.on('player_kicked', onPlayerKicked);
    socket.on('shuriken_effect', onShurikenEffect);
    socket.on('game_message', onGameMessage);
    socket.on('game_over', onGameOver);
    socket.on('card_played', onCardPlayed);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('update_players', onUpdatePlayers);
      socket.off('admin_players_update', onAdminPlayersUpdate);
      socket.off('game_update', onGameUpdate);
      socket.off('hand_update', onHandUpdate);
      socket.off('game_error', onGameError);
      socket.off('player_kicked', onPlayerKicked);
      socket.off('shuriken_effect', onShurikenEffect);
      socket.off('game_message', onGameMessage);
      socket.off('game_over', onGameOver);
      socket.off('card_played', onCardPlayed);
    };
  }, []);

  const startGame = () => {
      setHand([]); // Vider la main localement pour éviter les glitchs visuels
      socket.emit('start_game');
      setGameOverState({ show: false, won: false });
  };

  const retryLevel = () => {
      setHand([]);
      socket.emit('retry_level');
      setGameOverState({ show: false, won: false });
  };

  const playCard = (card: number) => {
      if (sounds.isPlaying) return; // Bloquer si un son est en cours
      socket.emit('play_card', card);
  };

  const proposeShuriken = () => {
      socket.emit('propose_shuriken');
  };

  const voteShuriken = (vote: boolean) => {
      socket.emit('vote_shuriken', vote);
  };

  const continueShuriken = () => {
      socket.emit('shuriken_continue');
  };

  const closeNotification = useCallback(() => {
      setNotification(null);
  }, []);

  const adminAction = (type: string, value: any, targetId?: string) => {
      socket.emit('admin_action', { type, value, targetId });
  };

  if (kicked) {
      return (
          <div className="h-screen bg-slate-900 text-white flex items-center justify-center p-8">
              <div className="bg-red-900/20 border border-red-500 p-8 rounded-2xl max-w-md text-center shadow-2xl backdrop-blur-sm">
                  <div className="text-6xl mb-4">🚫</div>
                  <h1 className="text-3xl font-bold text-red-500 mb-4">EXCLU</h1>
                  <p className="text-slate-300 mb-8">Vous avez été exclu de la partie par l'administrateur.</p>
                  <button 
                      onClick={() => window.location.reload()} 
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-colors"
                  >
                      Retour à l'accueil
                  </button>
              </div>
          </div>
      );
  }

  if (!roomId) {
    return (
        <>
            <Lobby />
            <RulesModal />
        </>
    );
  }

  // Séparer les adversaires de moi-même
  const opponents = players.filter(p => p.id !== socket.id);

  return (
    <motion.div 
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className={clsx("h-screen bg-slate-900 text-white p-4 md:p-8 overflow-hidden flex flex-col", shake && "bg-red-900/20")}
    >
        <Notification message={notification} onClose={closeNotification} />
        
        {/* PAUSE OVERLAY */}
        {gameInfo.status === 'paused' && (
            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                <div className="text-6xl font-bold text-white tracking-widest animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">PAUSE</div>
            </div>
        )}

        {/* SHURIKEN REVEAL OVERLAY */}
        {gameInfo.status === 'shuriken_reveal' && gameInfo.shurikenRevealData && (
            <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8">
                <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-8 animate-pulse">SHURIKEN !</h2>
                <div className="text-xl text-slate-300 mb-8">Cartes les plus faibles défaussées :</div>
                
                <div className="flex flex-wrap justify-center gap-6 mb-12">
                    {gameInfo.shurikenRevealData.discardedCards.map((data, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ scale: 0, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex flex-col items-center gap-2"
                        >
                            <Card value={data.card} isPile={false} />
                            <div className="font-bold text-emerald-400">{data.player}</div>
                        </motion.div>
                    ))}
                </div>

                {!gameInfo.shurikenRevealData.readyPlayers.includes(socket.id!) ? (
                    <button 
                        onClick={continueShuriken}
                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xl shadow-lg transition-transform hover:scale-105"
                    >
                        PRÊT À CONTINUER
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-emerald-400 font-bold text-xl">✓ Vous êtes prêt</div>
                        <div className="text-slate-400 animate-pulse">
                            En attente des autres joueurs ({gameInfo.shurikenRevealData.readyPlayers.length}/{players.length})...
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* SHURIKEN ANIMATION */}
        <AnimatePresence>
            {shurikenAnimation && (
                <motion.div
                    initial={{ x: '-20vw', rotate: 0, opacity: 0 }}
                    animate={{ x: '120vw', rotate: 1080, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="fixed top-1/2 left-0 z-[100] w-48 h-48 -mt-24 pointer-events-none text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.6)]"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                    </svg>
                </motion.div>
            )}
        </AnimatePresence>

        {gameOverState.show && (
            <GameOverModal won={gameOverState.won} onRestart={startGame} />
        )}

        {/* HEADER */}
        <header className="flex justify-between items-center mb-4 md:mb-8 z-50 relative">
            <div className="flex flex-col gap-1">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl md:text-2xl font-bold">Room: <span className="text-emerald-400">{roomId}</span></h1>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(roomId);
                                setNotification("Code copié !");
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 hover:border-emerald-500 p-1.5 rounded-lg transition-all active:scale-95"
                            title="Copier le code"
                        >
                            📋
                        </button>
                    </div>
                    <div className="text-slate-400 text-xs md:text-sm">Joueurs: {players.length}/7</div>
                </div>
                {/* Volume Control */}
                <div className="flex items-center gap-2 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700 w-fit">
                    <span className="text-xs">🔊</span>
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        value={sounds.volume} 
                        onChange={(e) => sounds.setVolume(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        title={`Volume: ${Math.round(sounds.volume * 100)}%`}
                    />
                </div>
                {/* Admin Toggle */}
                {isAdmin && (
                    <button 
                        onClick={() => setShowAdminPanel(!showAdminPanel)}
                        className="mt-2 text-xs bg-red-900/50 text-red-200 px-2 py-1 rounded border border-red-700 hover:bg-red-900 z-[70] relative"
                    >
                        {showAdminPanel ? "Masquer Admin" : "Panneau Admin"}
                    </button>
                )}
            </div>
            
            {(gameInfo.status === 'playing' || gameInfo.status === 'paused' || gameInfo.status === 'shuriken_reveal') && (
                <div className="flex gap-4 md:gap-8 text-lg md:text-xl font-bold bg-slate-800/80 p-3 rounded-xl backdrop-blur-md border border-slate-700">
                    <div className="text-emerald-400 flex items-center gap-2">
                        <span>Niveau</span>
                        <span className="text-2xl">{gameInfo.level}</span>
                    </div>
                    <div className="text-red-400 flex items-center gap-2">
                        <span>♥</span>
                        <span className="text-2xl">{gameInfo.lives}</span>
                    </div>
                    <div className="text-yellow-400 flex items-center gap-2">
                        <span>★</span>
                        <span className="text-2xl">{gameInfo.shurikens}</span>
                    </div>
                </div>
            )}
        </header>

        {/* ADMIN PANEL */}
        {isAdmin && showAdminPanel && (
            <div className="absolute top-20 left-4 z-[60] bg-slate-900 border border-red-500 p-4 rounded-xl shadow-2xl flex flex-col gap-3 w-72 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-red-900 pb-2">
                    <h3 className="text-red-500 font-bold">ADMINISTRATION</h3>
                    <button 
                        onClick={() => setShowAdminPanel(false)}
                        className="text-red-400 hover:text-red-200 font-bold px-2"
                    >
                        ✕
                    </button>
                </div>
                
                {/* ACTIONS RAPIDES */}
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => adminAction('undo', 0)} className="bg-orange-700 hover:bg-orange-600 text-xs py-2 rounded text-white">↩ Undo</button>
                    <button onClick={() => adminAction('togglePause', 0)} className="bg-blue-700 hover:bg-blue-600 text-xs py-2 rounded text-white">⏯ Pause</button>
                    <button onClick={() => adminAction('toggleTraining', 0)} className={clsx("text-xs py-2 rounded text-white", gameInfo.trainingMode ? "bg-green-600" : "bg-purple-700 hover:bg-purple-600")}>
                        {gameInfo.trainingMode ? "🎓 Training ON" : "🎓 Training OFF"}
                    </button>
                    <button onClick={() => adminAction('toggleInvincible', 0)} className={clsx("text-xs py-2 rounded text-white", gameInfo.invincibleMode ? "bg-yellow-600 text-black font-bold" : "bg-slate-700 hover:bg-slate-600")}>
                        {gameInfo.invincibleMode ? "🛡️ GOD MODE ON" : "🛡️ God Mode OFF"}
                    </button>
                    <button onClick={() => adminAction('skipLevel', 0)} className="bg-emerald-700 hover:bg-emerald-600 text-xs py-2 rounded text-white">⏩ Skip Level</button>
                    <button onClick={() => adminAction('distract', 0)} className="bg-yellow-700 hover:bg-yellow-600 text-xs py-2 rounded text-white">⚡ Distract</button>
                    <button onClick={() => {
                        const msg = prompt("Message système :");
                        if (msg) adminAction('broadcastMessage', msg);
                    }} className="bg-cyan-700 hover:bg-cyan-600 text-xs py-2 rounded text-white hidden md:block">📢 Broadcast</button>
                    <button onClick={() => { if(confirm('Reset game?')) adminAction('reset', 0) }} className="bg-red-800 hover:bg-red-700 text-xs py-2 rounded text-white">⚠ Reset</button>
                </div>

                <div className="flex items-center gap-2 bg-slate-800 p-2 rounded">
                    <input 
                        type="checkbox" 
                        id="xrayToggle" 
                        checked={xrayEnabled} 
                        onChange={(e) => setXrayEnabled(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="xrayToggle" className="text-xs text-slate-300 cursor-pointer select-none flex-1">
                        👁 X-Ray (Voir cartes)
                    </label>
                </div>

                <div className="h-px bg-slate-700 my-1"></div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Niveau (1-12)</label>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            min="1" max="12" 
                            value={gameInfo.level} 
                            onChange={(e) => adminAction('setLevel', parseInt(e.target.value))}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-full text-white"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Vies</label>
                    <div className="flex gap-2">
                        <button onClick={() => adminAction('setLives', gameInfo.lives - 1)} className="bg-slate-700 px-2 rounded text-white">-</button>
                        <span className="flex-1 text-center bg-slate-800 rounded py-1 text-white">{gameInfo.lives}</span>
                        <button onClick={() => adminAction('setLives', gameInfo.lives + 1)} className="bg-slate-700 px-2 rounded text-white">+</button>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Shurikens</label>
                    <div className="flex gap-2">
                        <button onClick={() => adminAction('setShurikens', gameInfo.shurikens - 1)} className="bg-slate-700 px-2 rounded text-white">-</button>
                        <span className="flex-1 text-center bg-slate-800 rounded py-1 text-white">{gameInfo.shurikens}</span>
                        <button onClick={() => adminAction('setShurikens', gameInfo.shurikens + 1)} className="bg-slate-700 px-2 rounded text-white">+</button>
                    </div>
                </div>

                <div className="h-px bg-slate-700 my-1"></div>

                {/* GESTION JOUEURS */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-slate-400">Joueurs</label>
                    {players.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-slate-800 p-1 rounded text-xs">
                            <span className="truncate max-w-[100px] text-white">{p.name}</span>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => {
                                        const newName = prompt("Nouveau nom :", p.name);
                                        if (newName && newName !== p.name) {
                                            adminAction('renamePlayer', newName, p.id);
                                        }
                                    }}
                                    className="bg-blue-900 text-blue-400 hover:bg-blue-800 px-1 rounded text-[10px]"
                                    title="Renommer"
                                >
                                    ✎
                                </button>
                                <button 
                                    onClick={() => adminAction('forcePlay', 0, p.id)}
                                    className="bg-emerald-900 text-emerald-400 hover:bg-emerald-800 px-1 rounded text-[10px]"
                                    title="Forcer à jouer"
                                >
                                    ▶
                                </button>
                                <button 
                                    onClick={() => { if(confirm(`Kick ${p.name}?`)) adminAction('kick', 0, p.id) }}
                                    className="text-red-500 hover:bg-red-900/50 px-1 rounded"
                                    title="Kick"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* GAME AREA */}
        <div className="flex-1 flex flex-col items-center justify-between relative pb-16">
            
            {/* OPPONENTS AREA (TOP) */}
            {(gameInfo.status === 'playing' || gameInfo.status === 'paused' || gameInfo.status === 'shuriken_reveal') && (
                <div className="flex justify-center gap-4 w-full flex-wrap mb-4 relative z-50">
                    {opponents.map(opponent => (
                        <Opponent 
                            key={opponent.id} 
                            name={opponent.name} 
                            cardCount={opponent.cardCount}
                            hand={opponent.hand}
                            onForcePlay={isAdmin ? (cardValue) => adminAction('forcePlay', cardValue, opponent.id) : undefined}
                            canXray={(xrayEnabled || !!gameInfo.trainingMode) && !xrayTemporarilyDisabled}
                        />
                    ))}
                </div>
            )}

            {/* WAITING ROOM */}
            {gameInfo.status === 'waiting' && (
                <div className="text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-screen overflow-y-auto p-4">
                    <img src="/MindLink_logo.png" alt="MindLink Logo" className="w-32 md:w-48 h-auto mx-auto mb-4 md:mb-8" />
                    <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-12 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        {gameInfo.lastGameResult ? (gameInfo.lastGameResult.won ? "Victoire !" : "Défaite") : "En attente des joueurs..."}
                    </h2>
                    <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8 md:mb-12 max-h-[40vh] overflow-y-auto p-2">
                        {players.map(player => (
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                key={player.id} 
                                className="bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-700 flex flex-col items-center gap-2 md:gap-3 min-w-[120px] md:min-w-[150px] shadow-xl"
                            >
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold shadow-inner">
                                    {player.name[0].toUpperCase()}
                                </div>
                                <div className="font-bold text-base md:text-lg">{player.name}</div>
                                {player.id === socket.id && <div className="text-xs text-emerald-400 font-mono bg-emerald-900/30 px-2 py-1 rounded">(Vous)</div>}
                                {player.id === hostId && <div className="text-xs text-yellow-400 font-mono bg-yellow-900/30 px-2 py-1 rounded">Hôte</div>}
                            </motion.div>
                        ))}
                    </div>
                    
                    {socket.id === hostId ? (
                        <div className="flex flex-col gap-4 items-center pb-8">
                            {gameInfo.lastGameResult && !gameInfo.lastGameResult.won && (
                                <button 
                                    onClick={retryLevel}
                                    className="px-8 py-3 md:px-12 md:py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-2xl font-bold text-lg md:text-xl transition-all shadow-lg"
                                >
                                    RÉESSAYER NIVEAU {gameInfo.lastGameResult.level}
                                </button>
                            )}
                            <button 
                                onClick={startGame}
                                className="px-8 py-4 md:px-12 md:py-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl font-bold text-xl md:text-2xl transition-all shadow-lg shadow-emerald-900/50 hover:scale-105 active:scale-95"
                            >
                                {gameInfo.lastGameResult ? "RECOMMENCER (NIVEAU 1)" : "LANCER LA PARTIE"}
                            </button>
                        </div>
                    ) : (
                        <div className="text-lg md:text-xl text-slate-400 animate-pulse pb-8">
                            En attente de l'hôte...
                        </div>
                    )}
                </div>
            )}

            {/* PLAYING BOARD (CENTER) */}
            {(gameInfo.status === 'playing' || gameInfo.status === 'paused' || gameInfo.status === 'shuriken_reveal') && (
                <div className="flex-1 flex items-center justify-center w-full relative">
                    
                    {/* VOTE SHURIKEN OVERLAY */}
                    <AnimatePresence>
                        {gameInfo.shurikenVote?.active && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute z-50 bg-slate-900/90 p-8 rounded-2xl border-2 border-yellow-400 shadow-2xl flex flex-col items-center gap-6 backdrop-blur-sm"
                            >
                                <div className="text-2xl font-bold text-yellow-400 animate-pulse">VOTE SHURIKEN</div>
                                <div className="text-center">
                                    <span className="font-bold text-emerald-400">{gameInfo.shurikenVote.proposedBy}</span> propose d'utiliser un Shuriken.
                                </div>
                                
                                {/* État des votes */}
                                <div className="flex gap-2">
                                    {players.map(p => {
                                        const vote = gameInfo.shurikenVote?.votes[p.id];
                                        let statusColor = "bg-slate-700";
                                        if (vote === true) statusColor = "bg-emerald-500";
                                        if (vote === false) statusColor = "bg-red-500";
                                        
                                        return (
                                            <div key={p.id} className="flex flex-col items-center gap-1">
                                                <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                                                <span className="text-xs text-slate-400">{p.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Boutons de vote (si je n'ai pas encore voté) */}
                                {gameInfo.shurikenVote.votes[socket.id!] === undefined && (
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => voteShuriken(true)}
                                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold"
                                        >
                                            ACCEPTER
                                        </button>
                                        <button 
                                            onClick={() => voteShuriken(false)}
                                            className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold"
                                        >
                                            REFUSER
                                        </button>
                                    </div>
                                )}
                                {gameInfo.shurikenVote.votes[socket.id!] !== undefined && (
                                    <div className="text-slate-400 italic">En attente des autres...</div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* PILE CENTRALE */}
                    <div 
                        className="relative w-32 h-48 md:w-48 md:h-72 flex items-center justify-center cursor-pointer group"
                        onClick={() => setShowPileHistory(true)}
                        title="Voir l'historique de la pile"
                    >
                        {/* Placeholder pour la pile vide */}
                        <div className="absolute inset-0 border-4 border-dashed border-slate-700 rounded-xl flex items-center justify-center group-hover:border-slate-500 transition-colors">
                            <span className="text-slate-700 font-bold text-lg md:text-xl group-hover:text-slate-500 transition-colors">PILE</span>
                        </div>

                        {/* Cartes jouées */}
                        <AnimatePresence>
                            {gameInfo.currentPile.map((val) => (
                                <div key={val} className="absolute inset-0">
                                    <Card 
                                        value={val} 
                                        isPile={true} 
                                    />
                                </div>
                            ))}
                        </AnimatePresence>
                        
                        {/* Indication visuelle au survol */}
                        <div className="absolute -bottom-12 md:-bottom-16 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-slate-400 text-xs md:text-sm flex items-center gap-1 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700 backdrop-blur-sm pointer-events-none z-[100] whitespace-nowrap">
                            <span>🔍</span> Cliquer sur la pile pour voir l'historique
                        </div>
                    </div>
                </div>
            )}

            {/* MA MAIN (BOTTOM) */}
            {(gameInfo.status === 'playing' || gameInfo.status === 'paused' || gameInfo.status === 'shuriken_reveal') && (
                <div className="w-full max-w-6xl mx-auto pb-4 relative z-30">
                    {/* BOUTON SHURIKEN */}
                    {gameInfo.shurikens > 0 && !gameInfo.shurikenVote?.active && (
                        <button 
                            onClick={proposeShuriken}
                            className="absolute -top-16 right-4 md:right-0 w-12 h-12 md:w-16 md:h-16 bg-slate-800 border-2 border-yellow-400 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg group"
                            title="Proposer un Shuriken"
                        >
                            <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform">★</span>
                        </button>
                    )}

                    <div className={clsx(
                        "flex justify-center items-end transition-all duration-300 px-4 overflow-x-auto pb-4 pt-4 md:pt-12 mx-auto custom-scrollbar",
                        hand.length > 12 ? "h-40 md:h-52 -space-x-4 md:-space-x-8 hover:-space-x-2 md:hover:-space-x-4" : 
                        hand.length > 8 ? "h-40 md:h-52 -space-x-3 md:-space-x-6 hover:-space-x-1 md:hover:-space-x-2" : 
                        "h-44 md:h-60 -space-x-2 md:-space-x-4 hover:space-x-1 md:hover:space-x-2"
                    )}>
                        <AnimatePresence>
                            {hand.map((card) => (
                                <div key={card} className={`transition-all duration-300 md:hover:-translate-y-2 z-0 md:hover:z-10 ${sounds.isPlaying ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                                    <Card 
                                        value={card} 
                                        isPlayable={!sounds.isPlaying} 
                                        onClick={() => playCard(card)}
                                        compact={hand.length > 8}
                                    />
                                </div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <div className="text-center mt-2 text-slate-400 text-sm uppercase tracking-widest">Votre main</div>
                </div>
            )}
        </div>
        <RulesModal />
        <PileHistoryModal 
            isOpen={showPileHistory} 
            onClose={() => setShowPileHistory(false)} 
            pile={gameInfo.currentPile} 
        />
    </motion.div>
  );
}

export default App;
