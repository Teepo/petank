import Phaser from 'phaser';

import { createApp } from 'vue';

import { vuetify } from '../plugins/vuetify';

import {
    WAITING_MULTIPLAYER_MODE,
    WAITING_ONEPLAYER_MODE,
    WAITING_TRAINIG_MODE
} from '../config';

import logo from './../../img/logo.png';
import backgroundSand from './../../img/background-sand.jpg';

import { socket } from './../modules/ws.js';
import { wsErrorHandler } from '../modules/wsErrorHandler.js';

import {
    HUMAN_TYPE,
    Player
} from '../modules/player.js';

import PlayerList from '../components/PlayerList.vue';
import { mergeObjectsWithPrototypes } from '../utils/object';

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

        // clean score
        this.players.toArray().map(player => {
            player.customData.score = 0;
        });

		this.updateBackground();

        this.logo = this.add.image(window.innerWidth / 2, 150, 'logo');
        this.logo.setScale(.35);

        if (this.isOneplayer() || this.isTraining()) {

            document.body.insertAdjacentHTML('beforeEnd', `<div class="player-list"></div>`);
            createApp(PlayerList, {
                _players      : this.players,
                _mode         : this.mode,
                _sceneManager : this.scene
            })
            .use(vuetify)
            .mount('.player-list');
        }
        else if (this.isMultiplayer()) {
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

            let { player } = data;

            const customPlayer = new Player({
                type : HUMAN_TYPE,
                ball : 'beach-ball.png',
            });

            this.player = mergeObjectsWithPrototypes(customPlayer, player);
            this.player.customData = customPlayer.customData;

            socket.emit('updatePlayer', {
                player   : this.player,
                roomName : this.room
            });
		});

        socket.on('updatedPlayer', () => {

            socket.removeAllListeners();

            document.body.insertAdjacentHTML('beforeEnd', `<div class="player-list"></div>`);
            createApp(PlayerList, {
                _player       : this.player,
                _mode         : this.mode,
                _sceneManager : this.scene
            })
            .use(vuetify)
            .mount('.player-list');
        });

        window.addEventListener("beforeunload", () => {
            socket.emit('setPlayerIsReady', {
                player   : this.player,
                roomName : this.room,
                value    : false
            });
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

    isTraining() {
        return this.mode === WAITING_TRAINIG_MODE;
    }
}
