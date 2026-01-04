import { motion } from 'framer-motion';
import { Card } from './Card';

interface OpponentProps {
    name: string;
    cardCount: number;
    hand?: number[];
    onForcePlay?: (card: number) => void;
}

export const Opponent = ({ name, cardCount, hand, onForcePlay }: OpponentProps) => {
    return (
        <div className="flex flex-col items-center gap-2 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm min-w-[100px] group relative">
            {/* Admin View: Hover to see cards */}
            {hand && hand.length > 0 && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 p-4 rounded-xl border border-slate-600 shadow-2xl z-[100] hidden group-hover:flex flex-wrap gap-2 w-max max-w-[300px] justify-center">
                    {hand.map(card => (
                        <div 
                            key={card} 
                            className={`scale-75 origin-top ${onForcePlay ? 'cursor-pointer hover:scale-90 transition-transform' : ''}`}
                            onClick={() => onForcePlay && onForcePlay(card)}
                            title={onForcePlay ? "Forcer cette carte" : undefined}
                        >
                            <Card value={card} compact disableAnimations />
                        </div>
                    ))}
                </div>
            )}

            <div className="relative">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold shadow-lg text-white">
                    {name[0].toUpperCase()}
                </div>
                {/* Badge nombre de cartes */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-700 font-bold text-xs md:text-sm text-white">
                    {cardCount}
                </div>
            </div>
            <div className="font-medium text-slate-300 text-sm md:text-base truncate max-w-[120px]">{name}</div>
            
            {/* Représentation visuelle des cartes (Dos) */}
            <div className="flex -space-x-2 h-6 md:h-8 items-center justify-center">
                {Array.from({ length: Math.min(cardCount, 5) }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-6 md:w-6 md:h-9 rounded border-2 border-white/80 shadow-md"
                        style={{ backgroundColor: '#e11d48' }} // Rouge The Mind
                    />
                ))}
                {cardCount > 5 && <span className="text-xs text-slate-500 pl-1">...</span>}
            </div>
        </div>
    );
};
