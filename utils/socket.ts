import { io } from 'socket.io-client';
const socket = io('http://192.168.1.229:3002');
export default socket;
