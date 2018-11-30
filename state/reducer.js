import {
    LOAD_STORES,
    LOAD_STORE_TYPES,
    LOAD_LOCATIONS,
    OPEN_STORE_DETAILS,
    RESET_STORE_TYPES,
    SET_STORE_TYPES,
    TOGGLE_FILTER_PANEL,
    TOGGLE_STORE_TYPE,
    UPDATE_COORDS,
    UPDATE_SEARCH_TERM,
    TOGGLE_SEARCH_LAYER,
} from './actionTypes.js';
import { setRoute } from '../history.js';

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
            return {
                ...state,
                searchTerm: action.searchTerm,
                stores: state.stores.map(setStoreVisibilityBySearchTerm(action.searchTerm))
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
                const updatedFilters = {
                    ...state.filters,
                    storeTypes: action.storeTypes,
                };
                return {
                    ...state,
                    stores: state.stores.map(setStoreVisibilityByFilters(updatedFilters)),
                    filters: updatedFilters,
                }
            }

        case TOGGLE_STORE_TYPE:
            {
                const updatedFilters = {
                    ...state.filters,
                    storeTypes: toggleStoreType(state.filters.storeTypes, action.storeTypeId),
                };
                setRoute('store-type', updatedFilters.storeTypes.join(','));
                return {
                    ...state,
                    stores: state.stores.map(setStoreVisibilityByFilters(updatedFilters)),
                    filters: updatedFilters,
                }
            }

        case RESET_STORE_TYPES:
            {
                const updatedFilters = {
                    ...state.filters,
                    storeTypes: [],
                };
                setRoute('store-type', '');
                return {
                    ...state,
                    stores: state.stores.map(setStoreVisibilityByFilters(updatedFilters)),
                    filters: updatedFilters,
                }
            }

        case OPEN_STORE_DETAILS:
            return {
                ...state,
                openedStore: action.store,
            }

        case UPDATE_COORDS:
            setRoute('coords', '');
            setRoute('coords', `${action.coords.center.lat},${action.coords.center.lng}/ne/${action.coords.ne.lat},${action.coords.ne.lng}/sw/${action.coords.sw.lat},${action.coords.sw.lng}`);

            return {
                ...state,
                coordinates: action.coords,
                stores: state.stores.map(setStoreVisibilityByCoords(action.coords.ne, action.coords.sw))
            }

        case TOGGLE_SEARCH_LAYER:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    searchLayerOpen: !state.ui.searchLayerOpen
                }
            }

        default:
            return state;
    }
}

export default reducer;