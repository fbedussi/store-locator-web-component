import {
    dispatch,
    subscribePartialState,
} from '../state/state-manager.js';
import { getAnimationClass } from '../wc-utils.js';
import { toggleSearchLayerAction } from '../state/actions.js';
import { desktopMinWidth } from '../styles.js';

class LeftPanel extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        subscribePartialState('ui.searchLayerOpen', (state, oldState) => {
            this.className = getAnimationClass(state.ui.searchLayerOpen, oldState && oldState.ui.searchLayerOpen, ['hidden', 'slide-in-left', '', 'slide-out-right'])
        })
        this.render();
        this.addEventListener('touchstart', (ev) => {
            this.touchStart = ev.touches[0].clientX;
        });

        this.addEventListener('touchend', (ev) => {
            if (this.touchStart - ev.changedTouches[0].clientX > 100) {
                dispatch(toggleSearchLayerAction());
            }
        });
    }

    render() {
        this.innerHTML = /*html*/`
            <style>
                left-panel {
                    display: flex;
                    flex-direction: column;
                    margin: var(--padding);
                    padding: var(--padding);
                    position: absolute;
                    z-index: 20;
                    background-color: white;
                    height: calc(100vh - (var(--padding) * 2));
                    width: calc(100% - (var(--padding) * 2));
                    box-shadow: 4px 4px 4px lightgray;
                }

                .storesAndStoreDetails {
                    position: relative;
                    overflow: hidden;
                    flex: 1;
                }
                
                @media screen and (min-width: ${desktopMinWidth}) {
                    left-panel {
                        display: block;
                        transform: translateX(0);
                        width: 24rem;
                    }
                }
            </style>
            <search-box></search-box>
            <results-number></results-number>
            <filter-panel></filter-panel>
            <div class="storesAndStoreDetails">
                <stores-list></stores-list>
                <store-details></store-details>
            </div>
        `;
    }
}

window.customElements.define('left-panel', LeftPanel);