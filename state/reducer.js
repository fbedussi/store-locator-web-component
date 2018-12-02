import {
    LOAD_STORES,
    LOAD_STORE_TYPES,
    LOAD_LOCATIONS,
    OPEN_STORE_DETAILS,
    RESET_STORE_TYPES,
    SET_USER_LOCATION,
    SET_STORE_TYPES,
    TOGGLE_FILTER_PANEL,
    TOGGLE_STORE_TYPE,
    UPDATE_COORDS,
    UPDATE_SEARCH_TERM,
    TOGGLE_SEARCH_LAYER,
} from './actionTypes.js';
import { setHashRoute } from '../history.js';

function setStoreVisibilityBySearchTerm(searchTerm) {
    return function (store) {
        store.visible = store.location.some((locationBit) => locationBit.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return store;
    }
}

function setStoreVisibilityByFilters(filters) {
    return function (store) {
        store.visible = !filters.storeTypes.length || store.storeTypes.some((storeType) => filters.storeTypes.includes(storeType.id));
        
        return store;
    }
}

function setStoreVisibilityByCoords(ne, sw) {
    return function (store) {
        store.visible = ne.lat >= store.lat && store.lat >= sw.lat && ne.lng >= store.lng && store.lng >= sw.lng;

        return store;
    }
}

function toggleStoreType(storeTypeIds, storeTypeId) {
    return storeTypeIds.includes(storeTypeId) ?
        storeTypeIds.filter((id) => id !== storeTypeId)
        : storeTypeIds.concat(storeTypeId)
    ;
}

const reducer = (state, action) => {
    switch (action.type) {
        case LOAD_STORES:
            return {
                ...state,
                stores: action.stores.map(setStoreVisibilityByFilters(state.filters)).map(setStoreVisibilityBySearchTerm(state.searchTerm))
            };

        case LOAD_STORE_TYPES:
            return {
                ...state,
                storeTypes: action.storeTypes
            };

        case LOAD_LOCATIONS:
            return {
                ...state,
                locations: action.locations
            };

        case UPDATE_SEARCH_TERM:
            {
                const filters = {
                    ...state.filters,
                    search: action.searchTerm,
                    coords: null
                }
    
                setHashRoute(filters);
                
                return {
                    ...state,
                    filters,
                    searchTerm: action.searchTerm,
                    stores: state.stores.map(setStoreVisibilityBySearchTerm(action.searchTerm))
                }
            }

        case TOGGLE_FILTER_PANEL:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    filterPanelOpen: !state.ui.filterPanelOpen,
                }
            }

        case SET_STORE_TYPES:
            {
                const filters = {
                    ...state.filters,
                    storeTypes: action.storeTypes,
                };

                setHashRoute(filters);

                return {
                    ...state,
                    filters,
                    stores: state.stores.map(setStoreVisibilityByFilters(filters)),
                }
            }

        case TOGGLE_STORE_TYPE:
            {
                const filters = {
                    ...state.filters,
                    storeTypes: toggleStoreType(state.filters.storeTypes, action.storeTypeId),
                };
    
                setHashRoute(filters);
                
                return {
                    ...state,
                    filters,
                    stores: state.stores.map(setStoreVisibilityByFilters(filters)),
                }                    
            }

        case RESET_STORE_TYPES:
            {
                const filters = {
                    ...state.filters,
                    storeTypes: [],
                };
    
                setHashRoute(filters);

                return {
                    ...state,
                    filters,
                    stores: state.stores.map(setStoreVisibilityByFilters(filters)),
                }    
            }

        case OPEN_STORE_DETAILS:
            return {
                ...state,
                openedStore: action.store,
            }

        case UPDATE_COORDS:
            {
                const filters = {
                    ...state.filters,
                    search: null,
                    coords: action.coords,
                };
    
                setHashRoute(filters);
    
                return {
                    ...state,
                    filters,
                    stores: state.stores.map(setStoreVisibilityByCoords(action.coords.ne, action.coords.sw)),
                }
            }

        case TOGGLE_SEARCH_LAYER:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    searchLayerOpen: !state.ui.searchLayerOpen
                }
            }
        
        case SET_USER_LOCATION:
            return {
                ...state,
                userLocation: action.center
            }

        default:
            return state;
    }
}

export default reducer;