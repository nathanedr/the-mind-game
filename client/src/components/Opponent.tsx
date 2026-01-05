import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './Card';
import { useState } from 'react';

interface OpponentProps {
    name: string;
    cardCount: number;
    hand?: number[];
    onForcePlay?: (card: number) => void;
    canXray?: boolean;
}

export const Opponent = ({ name, cardCount, hand, onForcePlay, canXray }: OpponentProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isTapped, setIsTapped] = useState(false);

    const showXray = (isHovered || isTapped) && hand && hand.length > 0 && canXray;

    return (
        <>
            {/* Backdrop pour fermer le X-Ray sur mobile */}
            {isTapped && (
                <div 
                    className="fixed inset-0 z-[150] bg-transparent" 
                    onClick={() => setIsTapped(false)}
                />
            )}
            
            <div 
                className="flex flex-col items-center gap-2 p-2 md:p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm w-24 md:w-32 relative transition-colors hover:bg-slate-800/80"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setIsTapped(!isTapped)}
            >
                {/* X-Ray View */}
            <AnimatePresence>
                {showXray && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-500/50 shadow-2xl z-[200] flex flex-wrap gap-2 w-max max-w-[300px] md:max-w-[600px] justify-center"
                    >
                        {/* Petite flèche vers le haut */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-t border-l border-slate-500/50 rotate-45" />
                        
                        {hand.map(card => (
                            <div 
                                key={card} 
                                className={`scale-75 origin-top ${onForcePlay ? 'cursor-pointer hover:scale-90 transition-transform' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onForcePlay && onForcePlay(card);
                                }}
                                title={onForcePlay ? "Forcer cette carte" : undefined}
                            >
                                <Card value={card} compact disableAnimations />
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative">
                <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-lg md:text-2xl font-bold shadow-lg text-white">
                    {name[0].toUpperCase()}
                </div>
                {/* Badge nombre de cartes */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-700 font-bold text-xs md:text-sm text-white">
                    {cardCount}
                </div>
            </div>
            <div className="font-medium text-slate-300 text-xs md:text-sm truncate w-full text-center px-1" title={name}>{name}</div>
            
            {/* Représentation visuelle des cartes (Dos) */}
            <div className="flex -space-x-2 h-6 md:h-8 items-center justify-center">
                {Array.from({ length: Math.min(cardCount, 5) }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-6 md:w-6 md:h-9 rounded border-2 border-white/80 shadow-md"
                        style={{ backgroundColor: '#e11d48' }} // Rouge MindLink
                    />
                ))}
                {cardCount > 5 && <span className="text-xs text-slate-500 pl-1">...</span>}
            </div>
        </div>
        </>
    );
};
