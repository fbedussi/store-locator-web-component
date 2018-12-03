import { 
    subscribePartialState, 
    dispatch 
} from '../state/state-manager.js';
import {
    openStoreDetailsAction,
    hideLoadingAction,
    showLoadingAction,
} from '../state/actions.js';
import { 
    extendComponent,
} from '../wc-utils.js';
import { throttle } from '../utils.js';
import RightArrow from './icons/arrowRight.js';
import PhoneIcon from './icons/phone.js';

class StoresList extends HTMLElement {
    constructor() {
        super();
        this.registerComponent();
    }
    
    connectedCallback() {
        subscribePartialState('stores', throttle((state) => {
            this.render(state.stores);
        }, 900));
    }

    render(stores = []) {
        const storeNameCssClass = this.randomizeCssClass('storeName');
        const storePhoneCssClass = this.randomizeCssClass('storePhone');
        this.innerHTML = /*html*/ `
            <style>
                stores-list ul {
                    padding: var(--padding);
                    height: 100%;
                    overflow-y: scroll;
                }

                stores-list ul::-webkit-scrollbar {
                    width: 0.3em;
                }
                
                stores-list ul::-webkit-scrollbar-track {
                    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
                }
                stores-list ul li {
                    border-bottom: solid 1px lightgray;
                    padding: 1em 0;
                    display: flex;
                    justify-content: space-between;
                }
                stores-list ul li:first-child {
                    border-top: solid 1px lightgray;
                }
                stores-list ul::-webkit-scrollbar-thumb {
                    background-color: black;
                    outline: 1px solid slategrey;
                }
                
                stores-list ul .action {
                    max-width: 50px;
                    cursor: pointer;
                }

                .${storeNameCssClass} {
                    margin-bottom: 0.5em;
                }

                .${storePhoneCssClass} .icon {
                    width: 1em;
                    height: 1em;
                    display: inline-block;
                    verical-align: middle;
                }
            </style>
            <ul>
                ${stores
                    .filter(function filterVisibleStores(store) {return store.visible})
                    .map((store, i) => /*html*/`
                        <li onclick="${this.getHandlerRef(this.handleStoreClick, store)}">
                            <div>
                                <div class="${storeNameCssClass}">${store.name}</div>
                                <div class="${storePhoneCssClass}">
                                    <span class="icon">${PhoneIcon()}</span>
                                    <span class="text">${store.phone}</span>
                                </div>
                            </div>
                            <div class="action">
                                ${RightArrow()}
                            </div>
                        </li>`).join('')}
            </ul>
        `;
        dispatch(hideLoadingAction());
    }

    handleStoreClick(ev, store) {
        dispatch(openStoreDetailsAction(store));
    }
}

window.customElements.define('stores-list', extendComponent(StoresList));