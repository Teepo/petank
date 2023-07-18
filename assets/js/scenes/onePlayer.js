import { COMPUTER_TYPE, HUMAN_TYPE, Player } from '../modules/player.js';
import Game from './game.js';

export default class OnePlayerScene extends Game {

    constructor() {

        super('onePlayer', [new Player({
            type : HUMAN_TYPE
        }), new Player({
            type : COMPUTER_TYPE
        })]);
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