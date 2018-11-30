import {
    extendComponent,
} from '../wc-utils.js';
import {
    dispatch,
} from '../state/state-manager.js';
import { toggleSearchLayerAction } from '../state/actions.js';
import SearchIcon from './icons/search.js';
import { desktopMinWidth } from '../styles.js';

class SearchOpener extends HTMLButtonElement {
    constructor() {
        super();
        this.registerComponent();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML =/*html*/`
            <style>
                .searchOpener {
                    border: solid 1px lightgray;
                    position: absolute;
                    z-index: 10;
                    background-color: white;
                    margin: var(--padding);
                }

                @media screen and (min-width: ${desktopMinWidth}) {
                    .searchOpener {
                        display: none;
                    }
                }
            </style>
            <span class="icon">${SearchIcon()}</span>
            <span class="text visuallyHidden">Search</span>
        `;
        this.addEventListener('click', function () {
            dispatch(toggleSearchLayerAction());
        })
    }
}

window.customElements.define('search-opener', extendComponent(SearchOpener), { extends: 'button' });