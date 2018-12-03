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
    RESET_SEARCH_TERM,
    SHOW_LOADING,
    HIDE_LOADING,
} from './actionTypes.js';
import { setHashRoute } from '../history.js';


function setStoreVisibility(searchTerm, filters) {
    const searchTermLower = searchTerm.toLowerCase();
    return function (store) {
        const visibleBySearchTerm = store.location.some((locationBit) => locationBit.toLowerCase().includes(searchTermLower));
        const visibleByFilters = store.storeTypes.some((storeType) => filters.storeTypes.includes(storeType.id));

        store.visible = ((!searchTerm.length || visibleBySearchTerm)
            && (!filters.storeTypes.length || visibleByFilters));

        return store;
    }
}

function setStoreVisibilityBySearchTerm(searchTerm) {
    const searchTermLower = searchTerm.toLowerCase();
    return function (store) {
        const visibleBySearchTerm = store.location.some((locationBit) => locationBit.toLowerCase().includes(searchTermLower));

        store.visible = visibleBySearchTerm;

        return store;
    }
}

function setStoreVisibilityByFilters(filters) {
    return function (store) {
        const visibleByFilters = store.storeTypes.some((storeType) => filters.storeTypes.includes(storeType.id));

        store.visible = !filters.storeTypes.length || visibleByFilters;

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
            const visibleStores = action.stores.map(setStoreVisibility(state.searchTerm, state.filters));
            return {
                ...state,
                stores: visibleStores,
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
                    searchTerm: action.searchTerm,
                    stores: state.stores.map(setStoreVisibility(action.searchTerm, state.filters)),
                }
            }

        case RESET_SEARCH_TERM:
            return {
                ...state,
                searchTerm: '',
                stores: state.stores.map(setStoreVisibilityByFilters(state.filters)),
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
                    stores: state.stores.map(setStoreVisibility(state.searchTerm, filters)),
                    filters,
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
                    stores: state.stores.map(setStoreVisibility(state.searchTerm, filters)),
                    filters,
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
                    stores: state.stores.map(setStoreVisibilityBySearchTerm(state.searchTerm)),
                    filters,
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
                    stores: state.stores.map(setStoreVisibilityByCoords(action.coords.ne, action.coords.sw)),
                    coordinates: action.coords,
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

        case SHOW_LOADING:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    showLoading: true,
                }
            }

        case HIDE_LOADING:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    showLoading: false,
                }
            }

        default:
            return state;
    }
}

export default reducer;