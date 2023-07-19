import Game from './game.js';

import {
    HUMAN_TYPE,
    Player
} from '../modules/player.js';

export default class TrainingScene extends Game {

    constructor() {

		super('training', [new Player({
			type  : HUMAN_TYPE,
			login : 'Player'
		})], true);
    }

	preload() {
		super.preload();
	}

	create() {
		super.create();
	}

	update() {
        super.update();
	}
}