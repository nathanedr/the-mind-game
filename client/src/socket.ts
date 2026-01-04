import { io } from 'socket.io-client';

// En prod (si servi par le même serveur), on laisse undefined pour utiliser l'URL courante.
// En dev, on force localhost:3001
const URL = import.meta.env.PROD ? undefined : 'http://localhost:3001';

export const socket = io(URL || '', {
    autoConnect: false
});
