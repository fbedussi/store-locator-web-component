import {
    subscribePartialState
} from '../state/state-manager.js';

class ResultsNumber extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        subscribePartialState('stores', (state) => {
            this.render(state.stores);
        });
    }

    render(stores = []) {
        const numebrOfSelectedStores = stores.filter((store) => store.visible).length;
        switch (numebrOfSelectedStores) {
            case 0:
                this.innerHTML = /*html*/ `
                    <div>No store found, check che search query</div>
                `;
                break;
            case 1:
                this.innerHTML = /*html*/ `
                    <div>1 store found</div>
                `;
                break;

            default:
                this.innerHTML = /*html*/ `
                    <div>${numebrOfSelectedStores} stores found</div>
                `;
                break;
        }
    }
}

window.customElements.define('results-number', ResultsNumber);