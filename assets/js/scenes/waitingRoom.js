import Phaser from 'phaser';

import { createApp } from 'vue';

import { vuetify } from '../plugins/vuetify';

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

	create() {

		this.updateBackground();

        this.logo = this.add.image(window.innerWidth / 2, 150, 'logo');
        this.logo.setScale(.35);

        socket.on('connect', () => {
            this.socket.emit('getAllPlayers');
        });

        this.id   = sessionStorage.getItem('id');
        this.room = sessionStorage.getItem('room');

        if (!this.id || !this.room) {
            return this.scene.start('newPlayer');
        }

        socket.emit('getPlayer', {
            id       : this.id,
            roomName : this.room
        });

        socket.on('getPlayer', data => {

            const error = wsErrorHandler(data);

            if (error) {
                sessionStorage.clear();
                this.scene.start('newPlayer');
                return;
            }

            const { player } = data;
			this.player = player;

            createApp(PlayerList)
            .use(vuetify)
            .mount('#player-list');
		});
	}

    update() {
        this.backgroundSand.tilePositionX -= .5;
        this.backgroundSand.tilePositionY -= .5;
    }

	updateBackground() {
		this.backgroundSand = this.add.tileSprite(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 'background-sand');
	}
}
