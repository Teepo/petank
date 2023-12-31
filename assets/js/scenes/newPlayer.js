import Phaser from 'phaser';

import { WAITING_MULTIPLAYER_MODE } from '../config';

import logo from './../../img/logo.png';

import backgroundSand from './../../img/background-sand.jpg';
import button from './../../img/ui-pack/blue_button13.png';
import buttonActive from './../../img/ui-pack/blue_button04.png';

import { socket } from './../modules/ws.js';
import { wsErrorHandler } from '../modules/wsErrorHandler.js';

export default class NewPlayer extends Phaser.Scene {

    constructor() {
        super('newPlayer');
    }

	preload() {
		this.load.image('background-sand', backgroundSand);
		this.load.image('logo', logo);
        this.load.image('button', button)
        this.load.image('buttonActive', buttonActive)
	}

	create() {

        this.restoreSessionIfNeeded();

		this.updateBackground();

        this.logo = this.add.image(window.innerWidth / 2, 150, 'logo');
        this.logo.setScale(.35);

        this.createForm();

        socket.on('joinedRoom', data => {

            const { socketId } = data;

            if (socket.id !== socketId) {
                return;
            }

            const error = wsErrorHandler(data);

            if (error) {
                this.addNewPlayerButton.once('pointerup', this.clickOnJoinButtonHandler.bind(this));
                return;
            }

            const { player } = data;

            sessionStorage.setItem('id', player.id);
            sessionStorage.setItem('room', 'petank');

            socket.removeAllListeners();

            this.scene.stop('newPlayer');
            this.scene.start('waitingRoom', {
                mode : WAITING_MULTIPLAYER_MODE
            });

            document.querySelector('.form-new-player').remove();
        });
	}

    createForm() {

        const form = document.querySelector('#template-form-new-player')?.content?.cloneNode(true);
        document.body?.appendChild(form);

        const { width, height } = this.scale;

        this.addNewPlayerButton =
        this.add.image(width * 0.5, height * 0.6, 'button')
            .setDisplaySize(150, 50)
            .setInteractive()
        ;

        this.addNewPlayerButton.on('pointerdown', this.setPlayButtonActiveState.bind(this));
        this.addNewPlayerButton.on('pointerout', this.setPlayButtonDisactiveState.bind(this));
        this.addNewPlayerButton.once('pointerup', this.clickOnJoinButtonHandler.bind(this));

        this.addNewPlayerButtonText =
        this.add.text(this.addNewPlayerButton.x, this.addNewPlayerButton.y, 'JOIN')
            .setOrigin(0.5, 0.60)
            .setFontSize(22)
            .setFontFamily('Helvetica')
            .setTint(0x1da1f2)
        ;
    }

    restoreSessionIfNeeded() {

        const id   = sessionStorage.getItem('id');
        const room = sessionStorage.getItem('room');

        if (!id || !room) {
            return;
        }

        socket.emit('getPlayer', {
            id       : id,
            roomName : room
        });

        socket.on('getPlayer', data => {

            const { player, error } = data;

            if (error) {
                return;
            }

            if (!player.id) {
                return;
            }

            document.querySelector('.form-new-player')?.remove();
            socket.removeAllListeners();
            this.scene.stop('home');
            this.scene.start('waitingRoom', {
                mode : WAITING_MULTIPLAYER_MODE
            });
		});
    }

    clickOnJoinButtonHandler() {

        const form = document.querySelector('.form-new-player');

        const login = form?.querySelector('input')?.value;

        socket.emit('joinRoom', {
            roomName : 'petank',
            login    : login
        });
    }

    setPlayButtonActiveState() {
        this.addNewPlayerButton.setTexture('buttonActive');
        this.addNewPlayerButtonText.setTint(0xffffff);
    }

    setPlayButtonDisactiveState() {
        this.addNewPlayerButton.setTexture('button');
        this.addNewPlayerButtonText.setTint(0x1da1f2);
    }

    update() {
        this.backgroundSand.tilePositionX -= .5;
        this.backgroundSand.tilePositionY -= .5;
    }

	updateBackground() {
		this.backgroundSand = this.add.tileSprite(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 'background-sand');
	}
}
