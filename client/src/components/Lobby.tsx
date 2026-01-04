import { useState } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../store';
import clsx from 'clsx';

export const Lobby = () => {
    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    
    const setRoomInfo = useGameStore(state => state.setRoomInfo);

    const handleCreateClick = () => {
        if (!name) return alert('Entrez un pseudo');
        if (name === "Nathinho") {
            setShowPasswordModal(true);
        } else {
            createRoom();
        }
    };

    const createRoom = (pwd?: string) => {
        socket.connect();
        socket.emit('create_room', { playerName: name, password: pwd }, (response: any) => {
            if (response.success) {
                setRoomInfo(response.roomId, name, response.hostId, response.isAdmin);
            } else {
                if (response.message === "Mot de passe incorrect") {
                    setError("Mot de passe incorrect");
                    setIsLocked(true);
                    setTimeout(() => {
                        setIsLocked(false);
                        setError("");
                    }, 3000); // 3 secondes de délai
                } else {
                    alert(response.message);
                }
            }
        });
    };

    const handlePasswordSubmit = () => {
        if (isLocked) return;
        createRoom(password);
    };

    const joinRoom = () => {
        if (!name || !roomCode) return alert('Entrez un pseudo et un code');
        socket.connect();
        socket.emit('join_room', { roomId: roomCode, playerName: name }, (response: any) => {
            if (response.success) {
                setRoomInfo(roomCode, name, response.hostId, false);
            } else {
                alert(response.message);
                socket.disconnect();
            }
        });
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white gap-8 relative">
            {showPasswordModal && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-8 rounded-xl border border-slate-600 flex flex-col gap-4 w-80">
                        <h3 className="text-xl font-bold text-center">Authentification Requise</h3>
                        <input 
                            type="password" 
                            placeholder="Mot de passe" 
                            className={clsx("p-3 rounded bg-slate-900 border text-white", error ? "border-red-500" : "border-slate-700")}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            disabled={isLocked}
                        />
                        {error && <div className="text-red-500 text-sm text-center">{error} {isLocked && "(Attendez...)"}</div>}
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1 p-3 bg-slate-600 hover:bg-slate-500 rounded font-bold"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handlePasswordSubmit}
                                disabled={isLocked}
                                className={clsx("flex-1 p-3 rounded font-bold", isLocked ? "bg-slate-700 text-slate-500" : "bg-emerald-600 hover:bg-emerald-500")}
                            >
                                Valider
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <h1 className="text-6xl font-bold tracking-tighter">THE MIND</h1>
            
            <div className="flex flex-col gap-4 w-80">
                <input 
                    type="text" 
                    placeholder="Votre Pseudo" 
                    className="p-3 rounded bg-slate-800 border border-slate-700 text-white"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                
                <div className="h-px bg-slate-700 my-2"></div>

                <button 
                    onClick={handleCreateClick}
                    className="p-4 bg-emerald-600 hover:bg-emerald-500 rounded font-bold transition-colors"
                >
                    CRÉER UNE ROOM
                </button>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Code Room" 
                        className="p-3 rounded bg-slate-800 border border-slate-700 text-white flex-1 uppercase"
                        value={roomCode}
                        onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    />
                    <button 
                        onClick={joinRoom}
                        className="p-3 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors"
                    >
                        REJOINDRE
                    </button>
                </div>
            </div>
        </div>
    );
};
