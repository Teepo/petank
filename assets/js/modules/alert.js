import delegate from 'delegate';

delegate(document.body, '.alert .u-icon-close', 'click', () => {
    close();
});

const close = () => {

    clearTimeout(openTimeoutHandler);

    document.querySelectorAll('.alert').forEach(node => {
        node.remove();
    });
};

let openTimeoutHandler;
const open = () => {

    document.querySelectorAll('.alert').forEach(node => {
        node.classList.add('alert--is-visible');
    });

    openTimeoutHandler = setTimeout(() => {
        close();
    }, 5000);
};

export const showAlert = (str, state = 'normal') => {

    close();

    document.body.insertAdjacentHTML('beforeend', `
        <div class="alert" role="alert">
            <div class="alert-content alert-${state}">
                ${str}
                <svg class="u-icon u-icon-close" viewBox="0 0 100 100">
                    <polygon points="77.6,21.1 49.6,49.2 21.5,21.1 19.6,23 47.6,51.1 19.6,79.2 21.5,81.1 49.6,53 77.6,81.1 79.6,79.2   51.5,51.1 79.6,23"/>
                </svg>
            </div>
        </div>
    `);

    open();
};