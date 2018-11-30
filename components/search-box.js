import { 
    dispatch,
    subscribePartialState,
} from '../state/state-manager.js';
import { 
    updateSearchTermAction 
} from '../state/actions.js';
import { 
    extendComponent,
} from '../wc-utils.js';

import './search-suggestions.js';
import IconButton from './ui/icon-button.js';
import SearchIcon from './icons/search.js';
import RemoveIcon from './icons/remove.js';
import GeolocalizeIcon from './icons/geolocalize.js';

class SeachBox extends HTMLElement {
    constructor() {
        super();
        this.registerComponent();
    }
    
    connectedCallback() {
        subscribePartialState(['searchTerm'], (state, oldState) => {
            this.render(state.searchTerm);
        });
    }

    render(searchTerm = '') {
        this.html(/*html*/ `
        <style>
            search-box {
                position: relative;
                --border-thickness: 2px;
                --search-input-width: 15rem;
                margin-bottom: 1rem;
            }
            .searchInputAndButtons {
                display: flex;
            }
            .searchInputAndIcons {
                display: flex;
                border: solid var(--border-thickness) black;
                margin-right: 0.5rem;
            }
            search-suggestions {
                position: absolute;
                left: calc(var(--input-height) + var(--border-thickness));
                width: var(--search-input-width);
            }
            search-suggestions [open="true"] ul {
                border: solid 1px lightgray;
                box-shadow: 2px 2px 2px lightgray;
            }
            search-suggestions ul {
                background-color: white;
                padding: var(--padding);
            }
            .searchIcon {
                width: var(--input-height);
                height: var(--input-height);
                padding: var(--padding);
            }
            .searchInput {
                padding: var(--padding);
                width: var(--search-input-width);
            }
            .geolocalizeIcon {
                height: calc(var(--input-height) + (var(--border-thickness) * 2));
                width: calc(var(--input-height) + (var(--border-thickness) * 2));
            }
        </style>
        <div class="searchInputAndButtons">
            <label for="searchInput" class="visuallyHidden">Cerca un negozio</label>
            <div class="searchInputAndIcons">
                ${SearchIcon()}
                <input id="searchInput" class="searchInput" type="text" placeholder="Inserisci una località" oninput="${this.getHandlerRef(this.handleInput)}" value="${searchTerm}"/>
                ${IconButton({
                    icon: RemoveIcon(), 
                    label: 'clear search', 
                    clickHandler: this.getHandlerRef(this.handleReset), 
                    cssClass: "clearSearch"
                })}
            </div>
            ${IconButton({
                icon: GeolocalizeIcon(), 
                label: 'geolocate me', 
                clickHandler: this.getHandlerRef(this.handleReset), 
                cssClass: 'btn geolocalizeIcon'
            })}
        </div>
        ${this.renderChildComponent('search-suggestions')}
                    `);
    }
    
    handleInput(ev) {
        dispatch(updateSearchTermAction(ev.target.value));
    }

    handleReset() {
        dispatch(updateSearchTermAction(''));
    }
}

window.customElements.define('search-box', extendComponent(SeachBox));