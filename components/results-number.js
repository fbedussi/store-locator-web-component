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
        let text = 'No store found, check che search query';
        
        switch (numebrOfSelectedStores) {
            case 1:
                text = '1 store found';
                break;
            
            default:
                text = `${numebrOfSelectedStores} stores found`;
                break;
        }
        this.innerHTML = /*html*/ `
            <style>
                results-number {
                    padding: var(--padding);
                }
            </style>
            <div>${text}</div>
        `;
    }
}

window.customElements.define('results-number', ResultsNumber);