import Phaser from 'phaser'
import GesturesPlugin from 'phaser3-rex-plugins/plugins/gestures-plugin.js';

import ball from './../img/ball.png'
import backgroundSand from './../img/background-sand.jpg'

class Game extends Phaser.Scene {

	preload() {
		this.load.image('ball', ball);
		this.load.image('background-sand', backgroundSand);
	}

	create() {

		this.updateBackground();
		this.addBall();
		this.initPinchZoom();
	}

	update() {
	}

	addBall() {

		const image = this.add.image(window.innerWidth / 2, window.innerHeight - 300, 'ball').setInteractive({
			draggable: true
		});

		image.inputEnabled = true;
		image.fixedToCamera  = true;
		image.input.priorityID = 1;

		image.on('pointerdown', () => {}, this);

		image.on('drag', (pointer, x, y) => {
			image.x = x;
			image.y = y;
		});
	}

	updateBackground() {
		this.backgroundSand = this.add.tileSprite(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 'background-sand');
	}

	initPinchZoom() {

		const pinch = this.rexGestures.add.pinch();

		pinch.on('pinch', pinch => {
			this.cameras.main.zoom *= pinch.scaleFactor;
		});
	}
}

const config = {
	type: Phaser.AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	scale: {
        mode: Phaser.Scale.SHOW_ALL,
		zoom: Phaser.Scale.MAX_ZOOM,
		pageAlignHorizontally: true,
		pageAlignVertically : true
    },
	plugins: {
		scene: [{
			key: 'rexGestures',
			plugin: GesturesPlugin,
			mapping: 'rexGestures'
		}]
	},
	scene: Game
};

new Phaser.Game(config);