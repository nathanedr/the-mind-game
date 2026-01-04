import { motion } from 'framer-motion';
import clsx from 'clsx';

interface CardProps {
    value: number;
    onClick?: () => void;
    isPlayable?: boolean;
    isPile?: boolean;
    compact?: boolean;
    disableAnimations?: boolean;
}

export const Card = ({ value, onClick, isPlayable = false, isPile = false, compact = false, disableAnimations = false }: CardProps) => {
    return (
        <motion.div
            layoutId={disableAnimations ? undefined : `card-${value}`}
            className={clsx(
                "relative flex items-center justify-center font-bold rounded-xl shadow-2xl border-4 select-none transition-colors",
                isPile 
                    ? "w-32 h-48 text-6xl md:w-48 md:h-72 md:text-8xl bg-gradient-to-br from-slate-100 to-slate-300 text-slate-900 border-white z-10" 
                    : compact
                        ? "w-12 h-16 text-xl md:w-20 md:h-32 md:text-3xl bg-gradient-to-br from-white to-slate-200 text-slate-800 border-white"
                        : "w-20 h-32 text-3xl md:w-28 md:h-44 md:text-5xl bg-gradient-to-br from-white to-slate-200 text-slate-800 border-white",
                isPlayable && "cursor-pointer md:hover:shadow-emerald-500/50 md:hover:border-emerald-200 active:scale-95"
            )}
            whileHover={!disableAnimations && isPlayable ? { y: -15, scale: 1.1, rotate: Math.random() * 4 - 2, zIndex: 50 } : {}}
            whileTap={!disableAnimations && isPlayable ? { scale: 0.95 } : {}}
            onClick={onClick}
            initial={!disableAnimations && !isPile ? { y: 100, opacity: 0 } : undefined}
            animate={!disableAnimations ? { y: 0, opacity: 1 } : { opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            {/* Coins */}
            <div className={clsx("absolute opacity-40", compact ? "top-1 left-1 text-xs" : "top-2 left-2 md:top-3 md:left-3 text-sm md:text-lg")}>{value}</div>
            <div className={clsx("absolute opacity-40 rotate-180", compact ? "bottom-1 right-1 text-xs" : "bottom-2 right-2 md:bottom-3 md:right-3 text-sm md:text-lg")}>{value}</div>
            
            {/* Centre */}
            <div className={clsx("relative z-10", isPile ? "drop-shadow-md" : "")}>
                {value}
            </div>

            {/* Effet de brillance subtil */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.div>
    );
};
