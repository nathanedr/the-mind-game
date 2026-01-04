import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';

interface PileHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    pile: number[];
}

export const PileHistoryModal = ({ isOpen, onClose, pile }: PileHistoryModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col relative z-10 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <span className="text-3xl">📚</span> Historique de la pile
                            </h2>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-900/50">
                            {pile.length === 0 ? (
                                <div className="text-center text-slate-500 py-12 italic">
                                    Aucune carte jouée pour le moment...
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                    {pile.map((card, index) => (
                                        <motion.div 
                                            key={`${card}-${index}`}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex flex-col items-center gap-2"
                                        >
                                            <div className="relative group">
                                                <Card value={card} compact disableAnimations />
                                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center text-xs font-mono text-slate-400 shadow-lg">
                                                    {index + 1}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 border-t border-slate-800 bg-slate-800/30 text-center text-slate-500 text-sm">
                            Total : <span className="text-white font-bold">{pile.length}</span> cartes jouées
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
