import Phaser from 'phaser';
import GesturesPlugin from 'phaser3-rex-plugins/plugins/gestures-plugin.js';

import ball from './../img/ball.png';
import arrow from './../img/arrow.png';
import backgroundSand from './../img/background-sand.jpg';

class Game extends Phaser.Scene {

	targetingModeIsEnabled = false;
	cameraIsEnabled = true;

	currentLineTarget;

	preload() {
		this.load.image('ball', ball);
		this.load.image('arrow', arrow);
		this.load.image('background-sand', backgroundSand);
	}

	create() {

		this.matter.world.setBounds(0, 0, window.innerWidth, window.innerHeight, 32, true, true, false, true);
		this.matter.world.disableGravity()

		this.updateBackground();
		this.addBall();
		this.initPinchZoom();
	}

	addBall() {

		this.ball = this.matter.add.image(100, 100, 'ball');

		this.ball.setCircle();
		this.ball.setFriction(0.005);
		this.ball.setBounce(.2);
		this.ball.setInteractive({ draggable : true });

		this.ball.x = window.innerWidth / 2;
		this.ball.y = window.innerHeight - 300;

		this.ball.on('pointerdown', () => {
			this.addTargeting();
		});

		this.ball.on('drag', (event, x, y) => {
			this.drawVelocityIndicator(x, y)
		});

		this.ball.on('dragend', event => {
			this.shootBall(event.upX, event.upY);
			this.destroyVelocityIndicator();
		});
	}

	updateBackground() {
		this.backgroundSand = this.add.tileSprite(window.innerWidth / 2, window.innerHeight / 2, window.innerWidth, window.innerHeight, 'background-sand');
	}

	addTargeting() {

		if (this.targetingModeIsEnabled) {
			return;
		}

		this.targetingModeIsEnabled = true;
		this.cameraIsEnabled = false;

		// Draw arrow
		this.arrow = this.add.tileSprite(this.ball.x, this.ball.y-55, 32, 32, 'arrow');

		// Draw velocity indicator
		this.drawVelocityIndicator(this.ball.y);
	}

	drawVelocityIndicator(x, y) {

		if (this.currentLineTarget) {
			this.currentLineTarget.destroy();
		}

		this.currentLineTarget = this.add.graphics();

		this.currentLineTarget.clear();

		if (y <= this.ball.y) {
			return;
		}

		this.currentLineTarget.lineStyle(5, 0xff0000);
		this.currentLineTarget.lineBetween(this.ball.x, this.ball.y, x, y);
	}

	destroyVelocityIndicator() {

		this.targetingModeIsEnabled = false;

		this.arrow.destroy();
		this.currentLineTarget.destroy();
	}

	scaleValue(x, xMin, xMax, nMin, nMax) {
		const scaledValue = (x - xMin) / (xMax - xMin);
		const convertedValue = scaledValue * (nMax - nMin) + nMin;
		return convertedValue;
	}

	shootBall(x, y) {

		const min = -10;
		const max = 10;

		let vx = this.scaleValue(x, 0, window.innerWidth, min, max);
		const vy = this.scaleValue(y, 0, window.innerHeight, min, max);

		if (vx < 0) {
			vx = Math.abs(vx);
		} else if (vx > 0) {
			vx = -Math.abs(vx);
		}

		console.log(x, y, vx, -vy)

		this.ball.setVelocity(vx, -vy)
	}

	initPinchZoom() {

		const pinch = this.rexGestures.add.pinch();
		const camera = this.cameras.main;

		pinch.on('drag1', pinch => {

			if (!this.cameraIsEnabled) {
				return;
			}

			camera.scrollY -= pinch.drag1Vector.y / camera.zoom;
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
	physics: {
        default: 'matter',
        matter: {
            enableSleeping: true,
			debug: true,
        }
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