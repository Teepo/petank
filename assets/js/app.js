import Phaser from 'phaser';

import GesturesPlugin from 'phaser3-rex-plugins/plugins/gestures-plugin.js';

import HomeScene from './scenes/home.js';
import NewPlayer from './scenes/newPlayer.js';
import WaitingRoom from './scenes/waitingRoom.js';
import GameScene from './scenes/game.js';

const config = {
	type: Phaser.AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	antialias: true,
	scale: {
        mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		zoom: Phaser.Scale.MAX_ZOOM,
    },
	physics: {
        default: 'matter',
        matter: {
			debug: true,
        }
    },
	dom: {
        createContainer: true
    },
	plugins: {
		scene: [{
			key: 'rexGestures',
			plugin: GesturesPlugin,
			mapping: 'rexGestures'
		}]
	},
	scene: [HomeScene, NewPlayer, WaitingRoom, GameScene]
};

new Phaser.Game(config);