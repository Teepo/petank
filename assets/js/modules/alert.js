import Noty from 'noty';
import { GAME_BALL_WIDTH } from '../config';

class AlertManager {

    /**
     * @param {String} str
     * @param {String} type
     * @param {Player} player
     *
     */
    add({ str, type = 'info', player }) {

        if (player) {
            str = `<img src="assets/img/balls/${player.customData.ball}" width="${GAME_BALL_WIDTH}"> ${str}`;
        }

        (new Noty({
            theme     : 'metroui',
            type      : type,
            text      : str,
            layout    : 'topLeft',
            closeWith : ['click', 'button'],
            timeout   : 3000
        })).show();
    }
}

export const Alert = new AlertManager;