import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface NotificationProps {
    message: string | null;
    onClose: () => void;
}

export const Notification = ({ message, onClose }: NotificationProps) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    const isAdminMessage = message?.startsWith("📢 ADMIN:");

    return (
        <AnimatePresence>
            {message && (
                <motion.div 
                    initial={isAdminMessage ? { scale: 0.5, opacity: 0 } : { y: -100, opacity: 0 }}
                    animate={isAdminMessage ? { scale: 1, opacity: 1 } : { y: 0, opacity: 1 }}
                    exit={isAdminMessage ? { scale: 0.5, opacity: 0 } : { y: -100, opacity: 0 }}
                    className={isAdminMessage 
                        ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] bg-red-900/95 border-2 border-red-500 text-white px-12 py-8 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-4 max-w-2xl text-center"
                        : "fixed top-24 left-1/2 -translate-x-1/2 z-[90] bg-slate-800/90 border border-slate-600 text-white px-6 py-4 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-4 max-w-md text-center"
                    }
                >
                    <span className={isAdminMessage ? "text-5xl animate-bounce" : "text-2xl"}>
                        {isAdminMessage ? "📢" : "ℹ️"}
                    </span>
                    <span className={isAdminMessage ? "text-3xl font-bold" : "font-medium"}>
                        {isAdminMessage ? message.replace("📢 ADMIN:", "").trim() : message}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
