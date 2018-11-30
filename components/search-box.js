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
                --border-thickness: 2px;
                margin-bottom: 1rem;
            }
            .searchInputAndButtons {
                display: flex;
            }
            .searchInputAndIcons {
                display: flex;
                border: solid var(--border-thickness) black;
                margin-right: 0.5rem;
                flex: 1;
            }
            search-suggestions {
                position: absolute;
                left: 0;
                width: 100%;
                bottom: 0;
                transform: translateY(calc(100% + 1px));
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
                flex: 1;
                position: relative;
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
                <div class="searchInput">
                    <input id="searchInput" type="text" placeholder="Inserisci una località" oninput="${this.getHandlerRef(this.handleInput)}" value="${searchTerm}"/>
                    ${this.renderChildComponent('search-suggestions')}
                </div>
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