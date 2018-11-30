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
import LeftArrow from './icons/leftArrow.js';
import PhoneIcon from './icons/phone.js';
import MailIcon from './icons/mail.js';
import {iconForText} from '../styles.js';

function renderStore(store) {
    return /*html*/`
        <div class="store">
            <div class="store_name">${store.name}</div>
            <div class="store_phone">
                <span class="icon">${PhoneIcon()}</span>
                <span class="text">${store.phone}</span>
            </div>
            <div class="store_mail">
                <span class="icon">${MailIcon()}</span>
                <span class="text"><a href="mailto:${store.mail}">${store.mail}</a></span>
            </div>
            <div class="store_categoriesTitle">Store categories</div>
            <ul class="store_categories">
                ${store.productCategory.map((category) => /*html*/`<li>${category.name}</li>`).join('')}
            </ul>
            <div class="store_servicesTitle">Store services</div>
            <ul class="store_services">
                ${store.hasMadeToMeasure ? '<li>Made to measure</li>' : ''}
                ${store.hasTailoring ? '<li>Tailoring</li>' : ''}
                ${store.gifCardAccepted ? '<li>Gift card accepted</li>' : ''}
                ${store.hasWiFi ? '<li>Wi-Fi</li>' : ''}
                ${store.reserveInStore ? '<li>Reserve in store</li>' : ''}
                ${store.pickUpInStore ? '<li>Pick-up in store</li>' : ''}
                ${store.returnInStore ? '<li>Return in store</li>' : ''}
                ${store.clickFromStore ? '<li>Click from store</li>' : ''}
                ${store.bookable ? '<li>Bookable</li>' : ''}
            </ul>
        </div>
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
        const storeDetailsCssClass = this.randomizeCssClass('storeDetails');
        const backButtonCssClass = this.randomizeCssClass('backButton');
        const iconCssClass = this.randomizeCssClass('backIcon');
        
        this.html(/*html*/`
            <style>
                .${storeDetailsCssClass} {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: white;
                }
                .${backButtonCssClass} {
                    background-color: black;
                    color: white;
                    display: flex;
                    width: 100%;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .${iconCssClass} {
                    width: var(--input-height);
                    height: var(--input-height); 
                    display: inline-block;
                }
                .${iconCssClass} svg {
                    stroke: white;
                    width: 100%;
                    height: 100%;
                }
                .${storeDetailsCssClass} .store {
                    padding: var(--padding);
                }
                .${storeDetailsCssClass} .store_name {
                    font-size: 1.2rem;
                    margin-bottom: 0.5rem;
                    font-weight: bold;
                }
                .${storeDetailsCssClass} .store_mail,
                .${storeDetailsCssClass} .store_phone {
                    display: flex;
                    align-items: center;
                }
                .${storeDetailsCssClass} .store_mail {
                    margin-bottom: 0.25rem;
                }
                .${storeDetailsCssClass} .store_phone {
                    margin-bottom: 0.75rem;
                }
                .${storeDetailsCssClass} .icon {
                    ${iconForText}
                }
                .${storeDetailsCssClass} .store_mail,
                .${storeDetailsCssClass} .store_categories {
                    margin-bottom: 0.5rem;
                }
                .${storeDetailsCssClass} .store_categories li {
                    display: inline;
                }
                .${storeDetailsCssClass} .store_categories li::after {
                    content: ", ";
                }
                .${storeDetailsCssClass} .store_categories li:last-child::after {
                    content: ".";
                }
                .${storeDetailsCssClass} .store_categoriesTitle,
                .${storeDetailsCssClass} .store_servicesTitle {
                    font-size: 1.2rem;
                    margin-bottom: 0.25rem;
                }
            </style>
            <div class="${storeDetailsCssClass} ${getAnimationClass(Boolean(store), Boolean(oldStore), ['hidden', 'slide-in-left', '', 'slide-out-right'])}">
                <button class="${backButtonCssClass}" onclick="${this.getHandlerRef(this.closePanel)}">
                    <span class="${iconCssClass}">${LeftArrow()}</span>
                    <span class="text">close</span>
                </button>
                ${storeToRender ? renderStore(storeToRender) : ''}
            </div>
        `);
    }

    closePanel() {
        dispatch(openStoreDetailsAction(null));
    }
}

window.customElements.define('store-details', extendComponent(StoreDetails));
