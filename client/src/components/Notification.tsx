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

    return (
        <AnimatePresence>
            {message && (
                <motion.div 
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] bg-slate-800/90 border border-slate-600 text-white px-6 py-4 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-4 max-w-md text-center"
                >
                    <span className="text-2xl">ℹ️</span>
                    <span className="font-medium">{message}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
