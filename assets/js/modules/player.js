export const HUMAN_TYPE    = 'human';
export const COMPUTER_TYPE = 'computer';

export class Player {

    constructor({ id = 0, login = '', type }) {

        this.id      = id;
        this.login   = login;
        this.isReady = true;
        this.type    = type;
    }

    isHuman() {
        return this.type === HUMAN_TYPE;
    }

    isComputer() {
        return this.type === COMPUTER_TYPE;
    }
}