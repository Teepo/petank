import Phaser from 'phaser';

import logo from './../../img/logo.png';

import backgroundSand from './../../img/background-sand.jpg';

import { socket } from './../modules/ws.js';

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
	}

    update() {
        this.backgroundSand.tilePositionX -= .5;
        this.backgroundSand.tilePositionY -= .5;
    }

	updateBackground() {
		this.backgroundSand = this.add.tileSprite(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 'background-sand');
	}
}
