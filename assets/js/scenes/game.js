import Phaser from 'phaser';

import {
	GAME_BALL_BOUNCE,
	GAME_BALL_FRICTION,
	GAME_BALL_FRICTION_AIR,
	GAME_BALL_WIDTH
} from '../config';

import { mergeObjectsWithPrototypes } from './../utils/object';

import { Alert } from '../modules/alert';
import { HUMAN_TYPE, Player } from '../modules/player';

import { socket } from './../modules/ws.js';

export default class GameScene extends Phaser.Scene {

	targetingModeIsEnabled = false;
	ballIsInMovement = false;
	cameraIsEnabled = true;

	currentLineTarget;

	balls = [];
	currentBall;

	turnCount = 0;
	players = [];

	isCochonetMode = true;

    constructor(sceneName) {
		super(sceneName);
    }

	init({ players = [], isMultiplayerMode = false }) {

		this.players           = players;
		this.isMultiplayerMode = isMultiplayerMode;

		if (this.isMultiplayerMode) {

			this.id   = sessionStorage.getItem('id');
			this.room = sessionStorage.getItem('room');

			this.players.toArray().map(player => {
				this.players.set(player.id, mergeObjectsWithPrototypes(new Player({
					type : HUMAN_TYPE,
					ball : player.customData.ball
				}), player));
			});
		}
	}

	preload() {

		this.load.image('arrow', './assets/img/arrow.png');
		this.load.image('background-sand', './assets/img/background-sand.jpg');

		this.loadPlayersBall();
	}

	create() {

		this.player = this.getPlayerForThisTurn();

		this.matter.world.setBounds(0, 0, this.game.config.width, this.game.config.height * 2);
		this.matter.world.disableGravity();
		this.getCamera().setBounds(0, 0, this.game.config.width, this.game.config.height * 2);

		this.updateBackground();
		this.drawButtonCenterCameraToCurrentBall();
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
			this.load.image(player.customData.ball, `./assets/img/balls/${player.customData.ball}`);
		});
	}

	drawButtonCenterCameraToCurrentBall() {

		document.body.insertAdjacentHTML('beforeEnd', `
			<button class="button button-center-camera-to-current-ball">
				<img src="./assets/img/center.png" class="u-icon">
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

		if (this.isCochonetMode) {

			this.isCochonetMode = false;

			this.ballIsInMovement = false;

			this.currentBall.disableInteractive();
			this.currentBall.setVelocity(0);

			this.addBall();

			this.resetCameraToCurrentBall();

			return;
		}

		const distance = this.getDistanceBetweenBallAndCochonnet();

		Alert.add({ str : `${this.player.login} => ${this.getPixelDistanceToHumanDistance(distance)}`, player : this.player });

		this.nextTurn();

		this.player = this.getPlayerForThisTurn();

		this.player.customData.remainingBallCount--;

		this.currentBall.disableInteractive();
		this.ballIsInMovement = false;

		this.balls.map(ball => {
			ball.setVelocity(0);
		});

		this.addBall();

		this.resetCameraToCurrentBall();

		if (this.player.isComputer()) {

			setTimeout(() => {
				this.shootBall(200, 500);
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

		this.player = this.getPlayerForThisTurn();

		this.currentBall = this.matter.add.image(GAME_BALL_WIDTH, GAME_BALL_WIDTH, this.player.customData.ball);

		this.currentBall.setCircle();
		this.currentBall.setFriction(GAME_BALL_FRICTION);
		this.currentBall.setFrictionAir(GAME_BALL_FRICTION_AIR);
		this.currentBall.setBounce(GAME_BALL_BOUNCE);
		this.currentBall.setVelocity(0);

		this.currentBall.x = this.game.config.width / 2;
		this.currentBall.y = this.game.config.height * 2 - 300;

		setTimeout(() => {
			Alert.add({ str : `${this.player.login} turn ${this.getTurnCount()}`, player : this.player })
		}, 2000);

		if (this.player.isHuman()) {

			if (!this.isThisMyTurn()) {

				socket.removeAllListeners();
				socket.on('pointerdown', this.addTargeting.bind(this));
				socket.on('drag', data => { this.onDragBall(data); });
				socket.on('dragend', data => { this.onDragEndBall(data); });
				return;
			}

			this.currentBall.setInteractive({ draggable : true })

			this.currentBall.on('pointerdown', this.addTargeting.bind(this));
			this.currentBall.on('drag', (event, x, y) => { this.onDragBall({x, y}); });
			this.currentBall.on('dragend', (event) => { this.onDragEndBall(event); });
		}

		this.balls.push(this.currentBall);
	}

	addCochonnet() {

		const circle = this.add.circle(window.innerWidth / 2, 200, 10, 0xff0000);
		const body = this.matter.add.circle(window.innerWidth / 2, 200, 10)

		this.cochonnet = this.matter.add.gameObject(circle, body);

		this.cochonnet.x = this.game.config.width / 2;
		this.cochonnet.y = this.game.config.height * 2 - 300;

		this.getCamera().startFollow(this.cochonnet);
		this.getCamera().stopFollow();

		this.cochonnet.setFriction(0.005);
		this.cochonnet.setBounce(.2);
		this.cochonnet.setFriction(.015);
		this.cochonnet.setInteractive({ draggable : true });

		this.cochonnet.on('pointerdown', this.addTargeting.bind(this));
		this.cochonnet.on('drag', (event, x, y) => { this.onDragBall({x, y}); });
		this.cochonnet.on('dragend', (event) => { this.onDragEndBall(event); });

		this.currentBall = this.cochonnet;

		Alert.add({ str : `${this.player.login} throws cochonet`, player : this.player })
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

		vy = -vy;

		const VELOCITY_MULTIPLICATOR = 2;

		vx *= VELOCITY_MULTIPLICATOR;
		vy *= VELOCITY_MULTIPLICATOR;

		this.getCamera().startFollow(this.currentBall);

		// @TODO make same linear scale for angular velocity
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

	addTargeting() {

		if (this.targetingModeIsEnabled) {
			return;
		}

		this.targetingModeIsEnabled = true;

		if (this.isThisMyTurn()) {
			this.cameraIsEnabled = false;
		}

		// Draw arrow
		this.arrow = this.add.tileSprite(this.currentBall.x, this.currentBall.y-32, GAME_BALL_WIDTH, GAME_BALL_WIDTH, 'arrow');

		// Draw velocity indicator
		this.drawVelocityIndicator(this.currentBall.y);

		if (this.isMultiplayer()) {
			socket.emit('data', {
				eventType : 'pointerdown',
				id        : this.id,
				roomName  : this.room
			});
		}
	}

	onDragBall({x, y}) {

		this.currentBall.setVelocity(0);
		this.cochonnet.setVelocity(0);
		this.drawVelocityIndicator(x, y);

		if (this.isMultiplayer()) {
			socket.emit('data', {
				eventType : 'drag',
				id        : this.id,
				roomName  : this.room,
				data : {
					x : x,
					y : y
				}
			});
		}
	}

	onDragEndBall({ upX, upY }) {

		this.currentBall.setVelocity(0);
		this.cochonnet.setVelocity(0);
		this.shootBall(upX, upY);
		this.destroyVelocityIndicator();

		if (this.isMultiplayer()) {
			socket.emit('data', {
				eventType : 'dragend',
				id        : this.id,
				roomName  : this.room,
				data : {
					upX : upX,
					upY : upY
				}
			});
		}
	}

	getTurnCount() {
		return this.player.customData.remainingBallCount % (this.turnCount+1) + 1;
	}

	isThisMyTurn() {

		if (this.isOneplayer() && this.player.isHuman()) {
			return true;
		}
		else if (this.isMultiplayer() && this.player.id === this.id) {
			return true;
		}

		return false;
	}

	isMultiplayer() {
		return this.isMultiplayerMode;
	}

	isOneplayer() {
		return !this.isMultiplayerMode;
	}
}