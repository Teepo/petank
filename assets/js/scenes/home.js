import Phaser from 'phaser';

import { socket } from './../modules/ws.js';

import logo from './../../img/logo.png';

import backgroundSand from './../../img/background-sand.jpg';
import button from './../../img/ui-pack/blue_button13.png';
import buttonActive from './../../img/ui-pack/blue_button04.png';

export default class HomeScene extends Phaser.Scene {

    constructor() {
        super('home')
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

        this.createButtons();
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

            socket.removeAllListeners();
            this.scene.stop('home');
            this.scene.start('waitingRoom');
		});
    }

    createButtons() {

        const { width, height } = this.scale;

        this.onePlayerButton =
        this.add.image(width * .5, height * .5, 'button')
            .setDisplaySize(150, 50)
            .setInteractive()
        ;

        this.onePlayerButtonText =
        this.add.text(this.onePlayerButton.x, this.onePlayerButton.y, 'ONE PLAYER')
            .setOrigin(.5, .60)
            .setFontSize(18)
            .setFontFamily('Helvetica')
            .setTint(0x1da1f2)
        ;

        this.onePlayerButton.on('pointerdown', this.setButtonActiveState.bind(this, this.onePlayerButton, this.onePlayerButtonText));
        this.onePlayerButton.on('pointerout', this.setButtonDisactiveState.bind(this, this.onePlayerButton, this.onePlayerButtonText));
        this.onePlayerButton.on('pointerup', () => {
        });

        // ----------------------------

        this.multiPlayerButton =
        this.add.image(width * .5, height * .6, 'button')
            .setDisplaySize(150, 50)
            .setInteractive()
        ;

        this.multiPlayerButtonText =
        this.add.text(this.multiPlayerButton.x, this.multiPlayerButton.y, 'MULTIPLAYER')
            .setOrigin(.5, .60)
            .setFontSize(18)
            .setFontFamily('Helvetica')
            .setTint(0x1da1f2)
        ;

        this.multiPlayerButton.on('pointerdown', this.setButtonActiveState.bind(this, this.multiPlayerButton, this.multiPlayerButtonText));
        this.multiPlayerButton.on('pointerout', this.setButtonDisactiveState.bind(this, this.multiPlayerButton, this.multiPlayerButtonText));
        this.multiPlayerButton.once('pointerup', () => {
            this.scene.start('newPlayer');
        });

        // ----------------------------

        this.trainingButton =
        this.add.image(width * .5, height * .7, 'button')
            .setDisplaySize(150, 50)
            .setInteractive()
        ;

        this.trainingButtonText =
        this.add.text(this.trainingButton.x, this.trainingButton.y, 'TRAINING')
            .setOrigin(.5, .60)
            .setFontSize(18)
            .setFontFamily('Helvetica')
            .setTint(0x1da1f2)
        ;

        this.trainingButton.on('pointerdown', this.setButtonActiveState.bind(this, this.trainingButton, this.trainingButtonText));
        this.trainingButton.on('pointerout', this.setButtonDisactiveState.bind(this, this.trainingButton, this.trainingButtonText));
        this.trainingButton.on('pointerup', () => {
            this.scene.start('game');
        });
    }

    setButtonActiveState(button, buttonText) {
        button.setTexture('buttonActive');
        buttonText.setTint(0xffffff);
    }

    setButtonDisactiveState(button, buttonText) {
        button.setTexture('button');
        buttonText.setTint(0x1da1f2);
    }

    update() {
        this.backgroundSand.tilePositionX -= .5;
        this.backgroundSand.tilePositionY -= .5;
    }

	updateBackground() {
		this.backgroundSand = this.add.tileSprite(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 'background-sand');
	}
}
