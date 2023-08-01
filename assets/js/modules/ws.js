import { WS_PROTOCOL, WS_HOST, WS_PORT } from './../config/index.js';

import { io } from 'socket.io-client';

export const socket = new io(`${WS_PROTOCOL}://${WS_HOST}:${WS_PORT}`);