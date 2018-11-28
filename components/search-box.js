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
        this.html(/*html*/ `<label for="searchInput" class="visuallyHidden">Cerca un negozio</label>
            <input id="searchInput" type="text" placeholder="Inserisci una località" oninput="${this.getHandlerRef(this.handleInput)}" value="${searchTerm}"/>
            <button id="resetSearchBtn" onclick="${this.getHandlerRef(this.handleReset)}">
                <span class="icon"></span>
                <span class="visuallyHidden">x</span>
            </button>
            <button id="geolocationBtn">
                <span class="icon"></span>
                <span class="visuallyHidden">Geolocalizzami</span>
            </button>
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