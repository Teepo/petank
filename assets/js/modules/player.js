import { BALL_COUNT_PER_PLAYER } from "../config";

export const HUMAN_TYPE    = 'human';
export const COMPUTER_TYPE = 'computer';

export class Player {

    constructor({ id = 0, login = '', type, ball, remainingBallCount = BALL_COUNT_PER_PLAYER }) {

        this.id      = id;
        this.login   = login;
        this.isReady = true;

        this.customData = {
            type : type,
            ball : ball,
            remainingBallCount : remainingBallCount
        };
    }

    isHuman() {
        return this.customData.type === HUMAN_TYPE;
    }

    isComputer() {
        return this.customData.type === COMPUTER_TYPE;
    }
}