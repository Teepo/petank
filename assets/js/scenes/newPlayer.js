import Phaser from 'phaser';

import logo from './../../img/logo.png';

import backgroundSand from './../../img/background-sand.jpg';
import button from './../../img/ui-pack/blue_button13.png';
import buttonActive from './../../img/ui-pack/blue_button04.png';

import { WS_HOST, WS_PORT, ROOM_NAME } from './../config/index.js';

export default class NewPlayer extends Phaser.Scene {

    constructor() {

        super('newPlayer');

        this.socket = new WebSocket(`wss://${WS_HOST}:${WS_PORT}`);
        window.ws = this.socket

        // Gérer les événements de la connexion WebSocket
        this.socket.addEventListener('open', () => {

            this.socket.send(JSON.stringify({ type: 'createRoom', data : {
                roomName : ROOM_NAME
            }}));
        });

        this.socket.addEventListener('message', event => {
        });

        this.socket.addEventListener('close', () => {
            this.socket.send(JSON.stringify({ type: 'createRoom', data : {
                roomName : ROOM_NAME
            }}));
        });
    }

	preload() {
		this.load.image('background-sand', backgroundSand);
		this.load.image('logo', logo);
        this.load.image('button', button)
        this.load.image('buttonActive', buttonActive)
	}

	create() {

		this.updateBackground();

        this.logo = this.add.image(window.innerWidth / 2, 150, 'logo');
        this.logo.setScale(.35);

        this.createForm();
	}

    createForm() {

        const form = document.querySelector('#template-form-new-player').content.cloneNode(true);
        document.body.appendChild(form);

        const { width, height } = this.scale;

        this.addNewPlayerButton =
        this.add.image(width * 0.5, height * 0.6, 'button')
            .setDisplaySize(150, 50)
            .setInteractive()
        ;

        this.addNewPlayerButton.on('pointerdown', this.setPlayButtonActiveState.bind(this));
        this.addNewPlayerButton.on('pointerout', this.setPlayButtonDisactiveState.bind(this));
        this.addNewPlayerButton.on('pointerup', () => {

            const form = document.querySelector('.form-new-player');

            if (!form) {
                return;
            }

            const login = form.querySelector('input').value

            this.socket.send(JSON.stringify({ type: 'joinRoom', data : {
                roomName : ROOM_NAME
            }}));

            form.remove();

            this.scene.start('game');
        });

        this.addNewPlayerButtonText =
        this.add.text(this.addNewPlayerButton.x, this.addNewPlayerButton.y, 'JOIN')
            .setOrigin(0.5, 0.60)
            .setFontSize(22)
            .setFontFamily('Helvetica')
            .setTint(0x1da1f2)
        ;
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
