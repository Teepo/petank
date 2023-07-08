import Phaser from 'phaser';

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

		this.updateBackground();

        this.logo = this.add.image(window.innerWidth / 2, 150, 'logo');
        this.logo.setScale(.35);

        this.createButtons();
	}

    createButtons() {

        const { width, height } = this.scale;

        this.playButton =
        this.add.image(width * 0.5, height * 0.6, 'button')
            .setDisplaySize(150, 50)
            .setInteractive()
        ;

        this.playButton.on('pointerdown', () => {
            this.setPlayButtonActiveState();
            this.scene.start('game');
        });
        this.playButton.on('pointerup', this.setPlayButtonDisactiveState.bind(this));
        this.playButton.on('pointerout', this.setPlayButtonDisactiveState.bind(this));

        this.playButtonText =
        this.add.text(this.playButton.x, this.playButton.y, 'PLAY')
            .setOrigin(0.5, 0.60)
            .setFontSize(22)
            .setFontFamily('Helvetica')
            .setTint(0x1da1f2)
        ;
    }

    setPlayButtonActiveState() {
        this.playButton.setTexture('buttonActive');
        this.playButtonText.setTint(0xffffff);
    }

    setPlayButtonDisactiveState() {
        this.playButton.setTexture('button');
        this.playButtonText.setTint(0x1da1f2);
    }

    update() {
        this.backgroundSand.tilePositionX -= .5;
        this.backgroundSand.tilePositionY -= .5;
    }

	updateBackground() {
		this.backgroundSand = this.add.tileSprite(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 'background-sand');
	}
}
