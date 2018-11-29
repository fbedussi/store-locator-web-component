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
        this.html(/*html*/ `<style>
                .searchIcon {
                    width: 1em;
                    height: 1em;
                }
            </style>
            <label for="searchInput" class="visuallyHidden">Cerca un negozio</label>
            ${SearchIcon()}
            <input id="searchInput" type="text" placeholder="Inserisci una località" oninput="${this.getHandlerRef(this.handleInput)}" value="${searchTerm}"/>
            ${IconButton({icon: RemoveIcon(), label: 'clear search', clickHandler: this.getHandlerRef(this.handleReset)})}
            ${IconButton({icon: GeolocalizeIcon(), label: 'geolocate me', clickHandler: this.getHandlerRef(this.handleReset)})}
            ${this.renderChildComponent('search-suggestions')}`);
    }
    
    handleInput(ev) {
        dispatch(updateSearchTermAction(ev.target.value));
    }

    handleReset() {
        dispatch(updateSearchTermAction(''));
    }
}

window.customElements.define('search-box', extendComponent(SeachBox));