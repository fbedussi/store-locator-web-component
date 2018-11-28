import { 
    extendComponent,
    getAnimationClass,
} from '../wc-utils.js';
import {
    openStoreDetailsAction,
} from '../state/actions.js';
import { 
    dispatch, 
    subscribePartialState 
} from '../state/state-manager.js';
import defaultState from '../state/state.js';

function renderStore(store) {
    return /*html*/`
        <div>Store name: ${store.name}</div>
        <div>Store address: ${store.address}</div>
    `
}

class StoreDetails extends HTMLElement {
    constructor() {
        super();
        this.registerComponent();
    }

    connectedCallback() {
        subscribePartialState('openedStore', this.render.bind(this));
    }

    render(state = defaultState, oldState = defaultState) {
        const store = state.openedStore;
        const oldStore = oldState && oldState.openedStore;
        const storeToRender = store || oldStore;
        
        this.innerHTML = /*html*/`
            <style>
                .storeDetails {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: red;
                }
            </style>
            <div class="storeDetails ${getAnimationClass(Boolean(store), Boolean(oldStore), ['hidden', 'slide-in-left', '', 'slide-out-right'])}">
                <button onclick="${this.getHandlerRef(this.closePanel)}">close</button>
                ${storeToRender ? renderStore(storeToRender) : ''}
            </div>
        `;
    }

    closePanel() {
        dispatch(openStoreDetailsAction(null));
    }
}

window.customElements.define('store-details', extendComponent(StoreDetails));
