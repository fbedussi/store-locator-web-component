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
import RightArrow from './icons/arrowRight.js';
import PhoneIcon from './icons/phone.js';

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
        const storeNameCssClass = this.randomizeCssClass('storeName');
        const storePhoneCssClass = this.randomizeCssClass('storePhone');
        const liStyle = (index) => `
            ${index === 0 ? 'border-top: solid 1px lightgray;' : ''}
            border-bottom: solid 1px lightgray;
            padding: 1em 0;
            display: flex;
            justify-content: space-between;
        `;
        
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
                            <div>
                                ${RightArrow()}
                            </div>
                        </li>`).join('')}
            </ul>
        `;
    }

    handleStoreClick(ev, store) {
        dispatch(openStoreDetailsAction(store));
    }
}

window.customElements.define('stores-list', extendComponent(StoresList));