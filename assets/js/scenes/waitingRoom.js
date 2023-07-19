import Phaser from 'phaser';

import { createApp } from 'vue';

import { vuetify } from '../plugins/vuetify';

import {
    WAITING_MULTIPLAYER_MODE,
    WAITING_ONEPLAYER_MODE
} from '../config';

import logo from './../../img/logo.png';
import backgroundSand from './../../img/background-sand.jpg';

import { socket } from './../modules/ws.js';
import { wsErrorHandler } from '../modules/wsErrorHandler.js';

import PlayerList from '../components/PlayerList.vue';

export default class WaitingRoom extends Phaser.Scene {

    constructor() {
        super('waitingRoom');
    }

	preload() {
		this.load.image('background-sand', backgroundSand);
        this.load.image('logo', logo);
	}

	init({ mode = WAITING_ONEPLAYER_MODE, players = [] }) {

        this.mode    = mode;
        this.players = players;

		this.updateBackground();

        this.logo = this.add.image(window.innerWidth / 2, 150, 'logo');
        this.logo.setScale(.35);

        if (this.isOneplayer()) {

            createApp(PlayerList, {
                _players      : this.players,
                _mode         : this.mode,
                _sceneManager : this.scene
            })
            .use(vuetify)
            .mount('.player-list');
        }

        if (this.isMultiplayer()) {
            this.initMultiplayerMode();
        }
	}

    initMultiplayerMode() {

        this.id   = sessionStorage.getItem('id');
        this.room = sessionStorage.getItem('room');

        if (!this.id || !this.room) {
            socket.removeAllListeners();
            this.scene.stop('waitingRoom');
            this.scene.start('newPlayer');
            return;
        }

        socket.on('connect', () => {
            this.socket.emit('getAllPlayers');
        });

        socket.emit('getPlayer', {
            id       : this.id,
            roomName : this.room
        });

        socket.on('getPlayer', data => {

            const error = wsErrorHandler(data);

            if (error) {
                sessionStorage.clear();
                socket.removeAllListeners();
                this.scene.stop('waitingRoom');
                this.scene.start('newPlayer');
                return;
            }

            const { player } = data;
			this.player = player;

            createApp(PlayerList, {
                _player : this.player,
                _mode   : this.mode
            })
            .use(vuetify)
            .mount('.player-list');
		});

        socket.on('start', () => {
            socket.removeAllListeners();
            document.querySelector('.player-list').remove();
            this.scene.stop('waitingRoom');
            this.scene.start('game');
		});
    }

    update() {
        this.backgroundSand && (this.backgroundSand.tilePositionX -= .5);
        this.backgroundSand && (this.backgroundSand.tilePositionY -= .5);
    }

	updateBackground() {
		this.backgroundSand = this.add.tileSprite(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 'background-sand');
	}

    isMultiplayer() {
        return this.mode === WAITING_MULTIPLAYER_MODE;
    }

    isOneplayer() {
        return this.mode === WAITING_ONEPLAYER_MODE;
    }
}
