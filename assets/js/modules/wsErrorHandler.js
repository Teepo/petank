import { showAlert } from './alert.js';

export const wsErrorHandler = data => {

    const { error } = data;

    if (!!error) {
        showAlert(error.message, 'error');
    }

    return !!error;
}