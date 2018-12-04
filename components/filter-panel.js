import { 
    extendComponent,
    getAnimationClass,
} from '../wc-utils.js';
import { 
    dispatch, 
    subscribePartialState 
} from '../state/state-manager.js';
import { 
    toggleFilterPanelAction, 
    resetStoreTypesAction,
    toggleStoreTypeAction,
    actionWithLoading,
} from '../state/actions.js';
import defaultState from '../state/state.js';
import './collapsable-tab.js';
import ArrowDown from './icons/arrowDown.js';
import RemoveIcon from './icons/remove.js';
import CircleRemoveIcon from './icons/circleRemove.js';
import {iconForText} from '../styles.js';

class FilterPanel extends HTMLElement {
    constructor() {
        super();
        this.registerComponent();
    }
    
    connectedCallback() {
        subscribePartialState(['storeTypes', 'ui.filterPanelOpen', 'filters.storeTypes'], (state, oldState) => {
            this.render(state, oldState);
        });
    }

    render(state = defaultState, oldState = defaultState) {
        const storeTypes = state.storeTypes;
        const filterPanelOpen = state.ui.filterPanelOpen;
        const prevFilterPanelOpen = oldState ? oldState.ui.filterPanelOpen : undefined;
        const selectedStoreTypesId = state.filters.storeTypes;
        const removeIconCssClass = this.randomizeCssClass('removeIcon');
        this.html(/*html*/`
            <style>
                filter-panel {
                    padding: var(--padding);
                }
                .filter-panel_toggleBtn {
                    display: inline-flex;
                    align-items: center;
                }
                .filter-panel_toggleBtn_text {
                    margin-right: 0.5rem;
                }
                .filter-panel_arrow svg {
                    width: var(--input-height);
                    height: auto;
                    transition: transform 400ms;
                }
                .open .filter-panel_arrow svg {
                    transform: rotate(180deg);
                }
                .storeTypeBtn .icon,
                .${removeIconCssClass} {
                    ${iconForText}
                }
            </style>
            <div class="filter-bar_header">
                <button class="${`filter-panel_toggleBtn${filterPanelOpen ? ' open' : ''}`}" onclick="${this.getHandlerRef(this.handleToggle)}">
                    <span class="filter-panel_toggleBtn_text">Filter results</span>
                    <span class="icon filter-panel_arrow">${ArrowDown()}</span>
                </button>
                <button 
                    class="btn filter-panel_resetBtn ${getAnimationClass(filterPanelOpen, prevFilterPanelOpen, ['invisible', 'fade-in', 'visible', 'fade-out'])}" 
                    onclick="${this.getHandlerRef(this.handleReset)}"
                >
                    <span class="${removeIconCssClass}">${CircleRemoveIcon()}</span>
                    <span class="text">reset filters</span>
                </button>
            </div>
            <collapsable-tab open=${filterPanelOpen}>
                <ul>
                ${storeTypes.map((storeType) => {
                    const isActive = selectedStoreTypesId.includes(storeType.id);
                    const wasActive = oldState.filters.storeTypes.includes(storeType.id);
                    const animationClass = getAnimationClass(isActive, wasActive, ['invisible', 'fade-in', 'visible', 'fade-out']);
                    return /*html*/`
                        <li>
                            <button class="storeTypeBtn" 
                                onclick="${this.getHandlerRef(this.handleFilterClick, storeType)}">
                                <span class="icon ${animationClass}">${RemoveIcon()}</span>    
                                <span class="text">${storeType.name}</span>
                            </button>
                        </li>
                    `
                }).join('')}
                </ul>
            </collapsable-tab>`);
    }

    handleToggle() {
        dispatch(toggleFilterPanelAction());
    }

    handleFilterClick(event, storeType) {
        dispatch(toggleStoreTypeAction(storeType.id));
    }

    handleReset() {
        dispatch(actionWithLoading(resetStoreTypesAction()));
    }
}

window.customElements.define('filter-panel', extendComponent(FilterPanel));