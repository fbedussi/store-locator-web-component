import { 
    extendComponent,
} from '../wc-utils.js';
import { 
    dispatch, 
    subscribePartialState 
} from '../state/state-manager.js';
import {
    updateSearchTermAction,
} from '../state/actions.js';
import './collapsable-tab.js';

class SearchSuggestions extends HTMLElement {
    constructor() {
        super();
        this.registerComponent();
        this.oldSuggestions = [];
    }
    
    connectedCallback() {
        subscribePartialState('searchTerm', (state) => {
            this.render(state);
        });
    }

    render(state = {searchTerm: '', locations: []}) {
        const searchTerm = state.searchTerm;
        const locations = state.locations
        const suggestions = searchTerm.length > 2 ? locations.filter((location) => location.name.toLowerCase().includes(searchTerm.toLowerCase())) : [];
        const thereAreSuggestions = Boolean(suggestions.length);
        const suggestionsToRender = thereAreSuggestions ? suggestions : this.oldSuggestions;
        this.oldSuggestions = suggestions;
        
        this.html(/*HTML*/  `<collapsable-tab open=${thereAreSuggestions}>        
            <ul>
                ${suggestionsToRender.map((suggestion) => `<li onclick="${this.getHandlerRef(this.handleSuggestionClick, suggestion.name)}">${suggestion.name}</li>`).join('')}
            </ul>  
        </collapsable-tab>`);
    }    

    handleSuggestionClick(ev, suggestion) {
        dispatch(updateSearchTermAction(suggestion));
    }
}

window.customElements.define('search-suggestions', extendComponent(SearchSuggestions));