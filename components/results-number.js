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
        const texts = [
            'No store found, check che search query',
            '1 store found',
            `${numebrOfSelectedStores} stores found`];
        
        this.innerHTML = /*html*/ `
            <style>
                results-number {
                    padding: var(--padding);
                }   
            </style>
            <div>${texts[Math.min(2,numebrOfSelectedStores)]}</div>
        `;
    }
}

window.customElements.define('results-number', ResultsNumber);