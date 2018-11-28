import { 
    getState, 
    subscribePartialState, 
    dispatch 
} from '../state/state-manager.js';
import {
    openStoreDetailsAction,
} from '../state/actions.js';
import { 
    extendComponent,
} from '../wc-utils.js';


class StoresList extends HTMLElement {
    constructor() {
        super();
        this.registerComponent();
    }
    
    connectedCallback() {
        subscribePartialState('stores', (state) => {
          this.render(state.stores);
        });
    }

    render(stores = []) {
        this.innerHTML = /*html*/ `
          <ul>
            ${stores
                .filter((store) => store.visible)
                .map((store) => /*html*/`<li onclick="${this.getHandlerRef(this.handleStoreClick, store)}">${store.name}</li>`).join('')}
          </ul>
        `;
    }

    handleStoreClick(ev, store) {
        dispatch(openStoreDetailsAction(store));
    }
}

window.customElements.define('stores-list', extendComponent(StoresList));