import { BALL_COUNT_PER_PLAYER } from "../config";

export const HUMAN_TYPE    = 'human';
export const COMPUTER_TYPE = 'computer';

export class Player {

    /**
     * @param {String} id
     * @param {String} login
     * @param {String} type
     * @param {String} ball
     * @param {Number} remainingBallCount
     *
     */
    constructor({ id, login, type, ball, remainingBallCount = BALL_COUNT_PER_PLAYER }) {

        this.id      = id;
        this.login   = login;
        this.isReady = true;

        this.customData = {
            type  : type,
            ball  : ball,
            score : 0,
            remainingBallCount : remainingBallCount
        };
    }

    /**
     *
     * @return {Boolean}
     */
    isHuman() {
        return this.customData.type === HUMAN_TYPE;
    }

    /**
     *
     * @return {Boolean}
     */
    isComputer() {
        return this.customData.type === COMPUTER_TYPE;
    }

    resetRemainingBallCount() {
        this.customData.remainingBallCount = BALL_COUNT_PER_PLAYER;
    }
}