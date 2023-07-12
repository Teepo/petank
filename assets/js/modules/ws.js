import { WS_HOST, WS_PORT } from './../config/index.js';

import { io } from 'socket.io-client';

export const socket = new io(`wss://${WS_HOST}:${WS_PORT}`);