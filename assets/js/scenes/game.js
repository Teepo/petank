import Phaser from 'phaser';

import {
	GAME_BALL_BOUNCE,
	GAME_BALL_FRICTION,
	GAME_BALL_FRICTION_AIR,
	GAME_BALL_WIDTH
} from '../config';

import arrow from './../../img/arrow.png';
import center from './../../img/center.png';
import backgroundSand from './../../img/background-sand.jpg';

import { showAlert } from './../modules/alert.js'
import { mergeObjectsWithPrototypes } from '../utils/object';
import { HUMAN_TYPE, Player } from '../modules/player';

export default class GameScene extends Phaser.Scene {

	targetingModeIsEnabled = false;
	ballIsInMovement = false;
	cameraIsEnabled = true;

	currentLineTarget;

	balls = [];
	currentBall;

	turnCount = 0;
	players = [];

    constructor(sceneName) {
		super(sceneName);
    }

	init({ players = [], isMultiplayerMode = false }) {

		this.players           = players;
		this.isMultiplayerMode = isMultiplayerMode;

		this.isMultiplayerMode && this.players.toArray().map(player => {
			this.players.set(player.id, mergeObjectsWithPrototypes(new Player({
                type : HUMAN_TYPE,
                ball : player.customData.ball
            }), player));
		});
	}

	preload() {

		this.load.image('arrow', arrow);
		this.load.image('background-sand', backgroundSand);

		this.loadPlayersBall();
	}

	create() {

		this.matter.world.setBounds(0, 0, this.game.config.width, this.game.config.height * 2);
		this.matter.world.disableGravity();
		this.getCamera().setBounds(0, 0, this.game.config.width, this.game.config.height * 2);

		this.updateBackground();
		this.drawButtonCenterCameraToCurrentBall();
		this.addBall();
		this.addCochonnet();
		this.initPinchZoom();
		this.resetCameraToCurrentBall();
	}

	update() {

		if (this.checkIfAllPlayersHaveShootedTheirBalls()) {
			console.log('the end');
			return;
		}

		this.checkIfAddAnotherBallIsNeeded();
	}

	updateBackground() {
		this.backgroundSand = this.add.tileSprite(this.game.config.width / 2, this.game.config.height / 2, this.game.config.width, this.game.config.height * 10, 'background-sand');
		this.backgroundSand.setDepth(-1);
	}

	nextTurn() {
		this.turnCount++;
	}

	loadPlayersBall() {

		this.players.toArray().map(async player => {
			this.load.image(player.customData.ball, (await import(`./../../img/balls/${player.customData.ball}`)).default);
		});
	}

	drawButtonCenterCameraToCurrentBall() {

		document.body.insertAdjacentHTML('beforeEnd', `
			<button class="button button-center-camera-to-current-ball">
				<img src="${center}" class="u-icon">
			</button>`)

		document.querySelector('.button-center-camera-to-current-ball').addEventListener('click', () => {
			this.resetCameraToCurrentBall();
		});
	}

	checkIfAddAnotherBallIsNeeded() {

		if (!this.currentBall) {
			return;
		}

		if (!this.ballIsInMovement) {
			return;
		}

		if (this.currentBall.body.speed <= 0.1) {
			this.theEndOfBallShoot();
		}
	}

	checkIfAllPlayersHaveShootedTheirBalls() {
		return this.players.toArray().filter(player => player.customData.remainingBallCount <= 0).length === this.players.size;
	}

	theEndOfBallShoot() {

		this.nextTurn();

		const player = this.getPlayerForThisTurn();

		player.customData.remainingBallCount--;

		this.currentBall.disableInteractive();
		this.ballIsInMovement = false;

		this.balls.map(ball => {
			ball.setVelocity(0);
		});

		const distance = this.getDistanceBetweenBallAndCochonnet();

		showAlert(this.getPixelDistanceToHumanDistance(distance));

		this.addBall();

		this.resetCameraToCurrentBall();

		if (player.isComputer()) {

			setTimeout(() => {
				this.shootBall(200, 700);
			}, 2000);
		}
	}

	getPlayerForThisTurn() {
		const index = this.turnCount % this.players.size;
		return this.players.toArray()[index];
	}

	resetCameraToCurrentBall() {
		this.getCamera().startFollow(this.currentBall);
		this.getCamera().stopFollow();
	}

	getDistanceBetweenBallAndCochonnet() {
		return Phaser.Math.Distance.Between(this.currentBall.x, this.currentBall.y, this.cochonnet.x, this.cochonnet.y) - (GAME_BALL_WIDTH / 2);
	}

	getPixelDistanceToHumanDistance(px) {

		const pxByMeter = 250;
		const pxByCentimeter = 25;

		let value;
		let metric;

		if (px >= pxByMeter) {
			value = px / pxByMeter;
			metric = 'm';
		}
		else {
			value = px / pxByCentimeter;
			metric = 'cm';
		}

		return `${value.toFixed(2)}${metric}`;
	}

	addBall() {

		const player = this.getPlayerForThisTurn();

		this.currentBall = this.matter.add.image(GAME_BALL_WIDTH, GAME_BALL_WIDTH, player.customData.ball);

		this.currentBall.setCircle();
		this.currentBall.setFriction(GAME_BALL_FRICTION);
		this.currentBall.setFrictionAir(GAME_BALL_FRICTION_AIR);
		this.currentBall.setBounce(GAME_BALL_BOUNCE);
		this.currentBall.setVelocity(0);

		this.currentBall.x = this.game.config.width / 2;
		this.currentBall.y = this.game.config.height * 2 - 300;

		if (player.isHuman()) {

			this.currentBall.setInteractive({ draggable : true })

			this.currentBall.on('pointerdown', () => {
				this.addTargeting();
			});

			this.currentBall.on('drag', (event, x, y) => {
				this.currentBall.setVelocity(0);
				this.cochonnet.setVelocity(0);
				this.drawVelocityIndicator(x, y)
			});

			this.currentBall.on('dragend', event => {
				this.currentBall.setVelocity(0);
				this.cochonnet.setVelocity(0);
				this.shootBall(event.upX, event.upY);
				this.destroyVelocityIndicator();
			});
		}

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

	addTargeting() {

		if (this.targetingModeIsEnabled) {
			return;
		}

		this.targetingModeIsEnabled = true;
		this.cameraIsEnabled = false;

		// Draw arrow
		this.arrow = this.add.tileSprite(this.currentBall.x, this.currentBall.y-32, GAME_BALL_WIDTH, GAME_BALL_WIDTH, 'arrow');

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

		console.log(x, y)

		const min = -10;
		const max = 10;

		let vx = this.scaleValue(x, 0, window.innerWidth, min, max);
		let vy = this.scaleValue(y, 0, window.innerHeight, min, max);

		if (vx < 0) {
			vx = Math.abs(vx);
		} else if (vx > 0) {
			vx = -Math.abs(vx);
		}

		vy = -vy;

		const VELOCITY_MULTIPLICATOR = 2;

		vx *= VELOCITY_MULTIPLICATOR;
		vy *= VELOCITY_MULTIPLICATOR;

		this.getCamera().startFollow(this.currentBall);

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

	getCamera() {
		return this.cameras.main;
	}
}