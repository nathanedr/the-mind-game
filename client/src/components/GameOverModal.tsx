import { motion } from 'framer-motion';

interface GameOverModalProps {
    won: boolean;
    onRestart: () => void;
}

export const GameOverModal = ({ won, onRestart }: GameOverModalProps) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`relative p-8 rounded-3xl border-4 shadow-2xl max-w-md w-full text-center overflow-hidden ${
                    won ? 'bg-slate-900 border-emerald-500 shadow-emerald-900/50' : 'bg-slate-900 border-red-600 shadow-red-900/50'
                }`}
            >
                {/* Background Glow */}
                <div className={`absolute inset-0 opacity-20 ${won ? 'bg-emerald-500' : 'bg-red-600'}`} />

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="text-6xl mb-2">{won ? '🏆' : '💀'}</div>
                    
                    <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-wider ${
                        won ? 'text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-emerald-600' : 'text-red-500'
                    }`}>
                        {won ? 'VICTOIRE !' : 'DÉFAITE'}
                    </h2>
                    
                    <p className="text-slate-300 text-lg">
                        {won 
                            ? "Vous avez synchronisé vos esprits à la perfection." 
                            : "Le lien mental s'est brisé. Réessayez."}
                    </p>

                    <button 
                        onClick={onRestart}
                        className={`px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 active:scale-95 ${
                            won 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900' 
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900'
                        }`}
                    >
                        REJOUER
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
