import Phaser from 'phaser';

import { createApp } from 'vue';

import { vuetify } from '../plugins/vuetify';

import {
	BALL_COUNT_PER_PLAYER,
	GAME_BALL_BOUNCE,
	GAME_BALL_FRICTION,
	GAME_BALL_FRICTION_AIR,
	GAME_BALL_WIDTH,
	POINTS_TO_WIN,
	WAITING_MULTIPLAYER_MODE,
	WAITING_ONEPLAYER_MODE,
	WAITING_TRAINIG_MODE
} from '../config';

import { mergeObjectsWithPrototypes } from './../utils/object';
import { sleep } from './../utils/timing';

import { Alert } from '../modules/alert';
import { HUMAN_TYPE, Player } from '../modules/player';

import { socket } from './../modules/ws.js';

import OverlayScore from '../components/OverlayScore.vue';

export default class GameScene extends Phaser.Scene {

    constructor(sceneName) {
		super(sceneName);
    }

	init({ players = [], mode = WAITING_ONEPLAYER_MODE }) {

		this.players = players;
		this.mode    = mode;

		this.targetingModeIsEnabled = false;
		this.ballIsInMovement = false;
		this.cameraIsEnabled = true;

		this.currentLineTarget = null;

		this.playersBalls = [];
		this.currentBall= null;

		this.turnCount = 0;

		this.isCochonetMode = true;

		if (this.isMultiplayer()) {
			this.initMultiplayerMode();
		}

		if (this.checkIfPlayWinTheGame()) {
			this.scene.pause();
			this.showOverlayScore(true);
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
		this.drawButtonShowOverlayScore();
		this.addCochonnet();
		this.initPinchZoom();
		this.resetCameraToCurrentBall();
	}

	initMultiplayerMode() {

		this.id   = sessionStorage.getItem('id');
		this.room = sessionStorage.getItem('room');

		this.players.toArray().map(player => {
			this.players.set(player.id, mergeObjectsWithPrototypes(new Player({
				type : HUMAN_TYPE,
				ball : player.customData.ball
			}), player));
		});

		socket.on('updatedPlayer', data => {
			const { player } = data;
			this.players.set(player.id, player);
		});
	}

	update() {
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

		if (document.querySelector('.button-center-camera-to-current-ball')) {
			return;
		}

		document.body.insertAdjacentHTML('beforeEnd', `
			<button class="button button-center-camera-to-current-ball">
				<img src="./assets/img/center.png" class="u-icon">
			</button>`);

		document.querySelector('.button-center-camera-to-current-ball').addEventListener('click', () => {
			this.resetCameraToCurrentBall();
		});
	}

	drawButtonShowOverlayScore() {

		if (this.isTraining()) {
			return;
		}

		if (document.querySelector('.button-show-overlay-score')) {
			return;
		}

		document.body.insertAdjacentHTML('beforeEnd', `
			<button class="button button-show-overlay-score">
				<img src="./assets/img/trophy.png" class="u-icon">
			</button>`)

		document.querySelector('.button-show-overlay-score').addEventListener('click', () => {
			this.showOverlayScore();
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
		return this.players.toArray().filter(player => {
			return player.customData.remainingBallCount <= 0;
		}).length === this.players.size;
	}

	checkIfPlayWinTheGame() {
		return !!this.players.toArray().find(player => {
			return player.customData.score >= POINTS_TO_WIN;
		})
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

		const distance = this.getDistanceBetweenBallAndCochonnet(this.currentBall);

		Alert.add({ str : `${this.player.login} - ${this.getPixelDistanceToHumanDistance(distance)}`, player : this.player });

		this.player = this.getPlayerForThisTurn();

		this.player.customData.remainingBallCount--;

		if (this.checkIfAllPlayersHaveShootedTheirBalls()) {
			this.theEndOfRound();
			return;
		}

		this.currentBall.disableInteractive();
		this.ballIsInMovement = false;

		this.playersBalls.map(({ ball }) => {
			ball.setVelocity(0);
		});

		this.nextTurn();

		this.addBall();

		this.resetCameraToCurrentBall();

		if (this.player.isComputer()) {

			setTimeout(() => {
				this.shootBall(200, 500);
			}, 2000);
		}
	}

	theEndOfRound() {

		this.scene.pause();

		const { player, score } = this.getWinnerPlayerOfTurn();

		player.customData.score += score;

		Alert.add({ str : `${player.login} win round, got ${score}pts`, player : player })

		this.resetPlayersRemainingBall();

		if (this.isMultiplayer()) {

			socket.emit('updatePlayer', {
				roomName : this.room,
				player   : player
			});

			socket.emit('stop', {
				roomName : this.room
			});
		}

		this.nextRound();
	}

	async nextRound() {

		if (this.isMultiplayer()) {
			socket.removeAllListeners();
		}

		Alert.add({ str : `New round begin...` });

		await sleep(5000);

		this.removeOverlayScore();

		let scene;

		if (this.isOneplayer()) {
			scene = 'onePlayer';
		}
		else if (this.isMultiplayer()) {
			scene = 'multiPlayer';
		}
		else if (this.isTraining()) {
			scene = 'training';
		}

		this.scene.stop(scene);
		this.scene.start(scene, {
			players : this.players,
			mode    : this.mode
		});
	}

	showOverlayScore(end = false) {

		this.removeOverlayScore();

		const node = document.createElement('div');
		node.classList.add('overlay-score');
		document.body.appendChild(node);

		createApp(OverlayScore, {
			_players      : this.players.toArray(),
			_sceneManager : this.scene,
			_end          : end
		})
		.use(vuetify)
		.mount('.overlay-score');
	}

	removeOverlayScore() {
		document.querySelector('.overlay-score')?.remove();
	}

	resetPlayersRemainingBall() {

		this.players.toArray().map(player => {
			player.resetRemainingBallCount();
		});
	}

	getPlayerForThisTurn() {
		const index = this.turnCount % this.players.size;
		return this.players.toArray()[index];
	}

	getWinnerPlayerOfTurn() {

		const players = this.playersBalls.map( ({ player, ball }) => {
			return { player : player, distance : this.getDistanceBetweenBallAndCochonnet(ball) };
		});

		const winner = players.reduce((acc, player) => player.distance < acc.distance ? player : acc);

		const score = this.getScoreForWinnerPlayer(players);

		return {
			player : winner.player,
			score  : score
		};
	}

	getScoreForWinnerPlayer(players) {

		const sortedPlayers = players.slice().sort((oldPlayer, newPlayer) => oldPlayer.distance - newPlayer.distance);

		const firstPlayer = sortedPlayers[0].player;

		let score = 0;

		for (let { player } of sortedPlayers) {

			if (player.id !== firstPlayer.id) {
				break;
			}

			score++;
		}

		return score;
	}

	resetCameraToCurrentBall() {
		this.getCamera().startFollow(this.currentBall);
		this.getCamera().stopFollow();
	}

	getDistanceBetweenBallAndCochonnet(ball) {
		return Phaser.Math.Distance.Between(ball.x, ball.y, this.cochonnet.x, this.cochonnet.y) - (GAME_BALL_WIDTH / 2);
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

		if (this.isMultiplayer()) {
			socket.removeAllListeners();
		}

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
			Alert.add({ str : `${this.player.login} - Ball ${this.getBallCounterInRound()}`, player : this.player });
		}, 1000);

		if (this.player.isHuman()) {

			if (this.isThisMyTurn()) {

				this.currentBall.setInteractive({ draggable : true })

				this.currentBall.on('pointerdown', this.addTargeting.bind(this));
				this.currentBall.on('drag', (event, x, y) => { this.onDragBall({x, y}); });
				this.currentBall.on('dragend', (event) => { this.onDragEndBall(event); });
			}
			else {
				socket.on('pointerdown', this.addTargeting.bind(this));
				socket.on('drag', data => { this.onDragBall(data); });
				socket.on('dragend', data => { this.onDragEndBall(data); });
			}
		}

		this.playersBalls.push({
			player : this.player,
			ball   : this.currentBall
		});
	}

	getBallCounterInRound() {

		if (this.isTraining()) {
			return this.turnCount + 1;
		}

		return (BALL_COUNT_PER_PLAYER - this.player.customData.remainingBallCount) + 1;
	}

	addCochonnet() {

		if (this.isMultiplayer()) {
			socket.removeAllListeners();
		}

		const circle = this.add.circle(window.innerWidth / 2, 200, 10, 0xff0000);
		const body   = this.matter.add.circle(window.innerWidth / 2, 200, 10)

		this.cochonnet = this.matter.add.gameObject(circle, body);

		this.cochonnet.x = this.game.config.width / 2;
		this.cochonnet.y = this.game.config.height * 2 - 300;

		this.getCamera().startFollow(this.cochonnet);
		this.getCamera().stopFollow();

		this.cochonnet.setFriction(GAME_BALL_FRICTION);
		this.cochonnet.setFrictionAir(GAME_BALL_FRICTION_AIR);
		this.cochonnet.setBounce(GAME_BALL_BOUNCE);

		if (this.isThisMyTurn()) {

			this.cochonnet.setInteractive({ draggable : true });

			this.cochonnet.on('pointerdown', this.addTargeting.bind(this));
			this.cochonnet.on('drag', (event, x, y) => { this.onDragBall({x, y}); });
			this.cochonnet.on('dragend', (event) => { this.onDragEndBall(event); });
		}
		else {
			socket.on('pointerdown', this.addTargeting.bind(this));
			socket.on('drag', data => { this.onDragBall(data); });
			socket.on('dragend', data => { this.onDragEndBall(data); });
		}

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

		if (this.isMultiplayer() && this.isThisMyTurn()) {
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

		if (this.isMultiplayer() && this.isThisMyTurn()) {
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

		if (this.isMultiplayer() && this.isThisMyTurn()) {
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

	isThisMyTurn() {

		if ((this.isOneplayer() || this.isTraining()) && this.player.isHuman()) {
			return true;
		}
		else if (this.isMultiplayer() && this.player.id === this.id) {
			return true;
		}

		return false;
	}

	isMultiplayer() {
		return this.mode === WAITING_MULTIPLAYER_MODE;
	}

	isOneplayer() {
		return this.mode === WAITING_ONEPLAYER_MODE;
	}

	isTraining() {
		return this.mode === WAITING_TRAINIG_MODE;
	}
}