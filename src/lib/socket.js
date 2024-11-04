import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL, {
    withCredentials: true // For at sikre cookies sendes
});

export default socket;
