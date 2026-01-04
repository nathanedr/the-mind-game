import { useCallback, useState } from 'react';

export const useGameSounds = () => {
    const [volume, setVolume] = useState(0.5);
    const [isPlaying, setIsPlaying] = useState(false);

    const playSound = useCallback((soundNames: string[], blocking: boolean = false) => {
        try {
            // Sélection aléatoire d'un son parmi les variantes
            const randomSound = soundNames[Math.floor(Math.random() * soundNames.length)];
            const audio = new Audio(`/sounds/${randomSound}`);
            audio.volume = volume;

            if (blocking) {
                setIsPlaying(true);
                // On libère le blocage quand le son est terminé
                audio.onended = () => setIsPlaying(false);
                audio.onerror = () => setIsPlaying(false); 
            }

            audio.play().catch(e => {
                console.log("Audio play failed", e);
                if (blocking) setIsPlaying(false);
            });
        } catch (error) {
            console.error("Error playing sound:", error);
            if (blocking) setIsPlaying(false);
        }
    }, [volume]);

    return {
        volume,
        setVolume,
        isPlaying,
        playCardSound: () => playSound(['play1.mp3', 'play2.mp3', 'play3.mp3', 'play4.mp3', 'play5.mp3', 'play6.mp3'], true),
        playErrorSound: () => playSound(['error.mp3'], true),
        playWinSound: () => playSound(['victory1.mp3', 'victory2.mp3', 'victory3.mp3', 'victory4.mp3', 'victory5.mp3']),
        playLoseSound: () => playSound(['lose1.mp3', 'lose2.mp3', 'lose3.mp3', 'lose4.mp3', 'lose5.mp3']),
        playShurikenSound: () => playSound(['shuriken.mp3'], true),
        playJoinSound: () => playSound(['join.mp3']),
    };
};
