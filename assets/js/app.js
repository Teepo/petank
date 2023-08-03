import Phaser from 'phaser';

import GesturesPlugin from 'phaser3-rex-plugins/plugins/gestures-plugin.js';

import HomeScene from './scenes/home.js';
import NewPlayer from './scenes/newPlayer.js';
import WaitingRoom from './scenes/waitingRoom.js';
import OnePlayerScene from './scenes/onePlayer.js';
import MultiPlayerScene from './scenes/multiPlayer.js';

Map.prototype.toArray = function() {
    return Array.from(this.values());
};

const config = {
	type: Phaser.AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	antialias: true,
	fps: {
		forceSetTimeOut: true,
		target: 60
	},
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
	scene: [HomeScene, WaitingRoom, OnePlayerScene, MultiPlayerScene, NewPlayer]
};

new Phaser.Game(config);