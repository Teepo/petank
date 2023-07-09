import Phaser from 'phaser';

import ball from './../../img/ball.png';
import arrow from './../../img/arrow.png';
import backgroundSand from './../../img/background-sand.jpg';

export default class GameScene extends Phaser.Scene {

	targetingModeIsEnabled = false;
	ballIsInMovement = false;
	cameraIsEnabled = true;

	currentLineTarget;

	balls = [];
	currentBall;

    constructor() {
        super('game')
    }

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
		this.addCochonnet();
		this.initPinchZoom();
	}

	update() {
		this.checkIfAddAnotherBallIsNeeded()
	}

	checkIfAddAnotherBallIsNeeded() {

		if (!this.currentBall) {
			return;
		}

		if (!this.ballIsInMovement) {
			return;
		}

		if (this.currentBall.body.speed <= 0.1) {

			this.currentBall.disableInteractive();
			this.ballIsInMovement = false;

			this.balls.map(ball => {
				ball.setVelocity(0)
			});

			this.addBall();
		}
	}

	addBall() {

		this.currentBall = this.matter.add.image(84, 84, 'ball');

		this.currentBall.setCircle();
		this.currentBall.setFriction(0.005);
		this.currentBall.setBounce(.2);
		this.currentBall.setVelocity(0);
		this.currentBall.setFrictionAir(.015);
		this.currentBall.setInteractive({ draggable : true });

		this.currentBall.x = window.innerWidth / 2;
		this.currentBall.y = window.innerHeight - 300;

		this.currentBall.on('pointerdown', () => {
			this.addTargeting();
		});

		this.currentBall.on('drag', (event, x, y) => {
			this.currentBall.setVelocity(0);
			this.drawVelocityIndicator(x, y)
		});

		this.currentBall.on('dragend', event => {
			this.currentBall.setVelocity(0);
			this.shootBall(event.upX, event.upY);
			this.destroyVelocityIndicator();
		});

		this.balls.push(this.currentBall);
	}

	addCochonnet() {

		const circle = this.add.circle(window.innerWidth / 2, 200, 10, 0xff0000);
		const body = this.matter.add.circle(window.innerWidth / 2, 200, 10)

		this.cochonnet = this.matter.add.gameObject(circle, body)

		this.cochonnet.setFriction(0.005);
		this.cochonnet.setBounce(.2);
		this.cochonnet.setFriction(.015);
		this.cochonnet.setInteractive({ draggable : true });
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
		this.arrow = this.add.tileSprite(this.currentBall.x, this.currentBall.y-55, 32, 32, 'arrow');

		// Draw velocity indicator
		this.drawVelocityIndicator(this.currentBall.y);
	}

	drawVelocityIndicator(x, y) {

		if (this.currentLineTarget) {
			this.currentLineTarget.destroy();
		}

		this.currentLineTarget = this.add.graphics();

		this.currentLineTarget.clear();

		if (y <= this.currentBall.y) {
			return;
		}

		this.currentLineTarget.lineStyle(5, 0xff0000);
		this.currentLineTarget.lineBetween(this.currentBall.x, this.currentBall.y, x, y);
	}

	destroyVelocityIndicator() {

		this.targetingModeIsEnabled = false;
		this.cameraIsEnabled = true;

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
		let vy = this.scaleValue(y, 0, window.innerHeight, min, max);

		if (vx < 0) {
			vx = Math.abs(vx);
		} else if (vx > 0) {
			vx = -Math.abs(vx);
		}

		vy = -vy

		// @TODO make same linear scalke for angular velocity
		this.currentBall.setAngularVelocity(vx < 0 ? -.05 : .05);
		this.currentBall.setVelocity(vx, vy);

		this.ballIsInMovement = true;
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