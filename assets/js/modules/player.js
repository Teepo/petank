import { BALL_COUNT_PER_PLAYER } from "../config";

export const HUMAN_TYPE    = 'human';
export const COMPUTER_TYPE = 'computer';

export class Player {

    constructor({ id = 0, login = '', type, ball }) {

        this.id      = id;
        this.login   = login;
        this.isReady = true;
        this.type    = type;
        this.ball    = ball;
        this.remainingBallCount = BALL_COUNT_PER_PLAYER;
    }

    isHuman() {
        return this.type === HUMAN_TYPE;
    }

    isComputer() {
        return this.type === COMPUTER_TYPE;
    }
}