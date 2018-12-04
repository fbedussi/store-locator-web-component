import {
    APPLY_FILTERS,
    HIDE_LOADING,
    LOAD_STORES,
    LOAD_STORE_TYPES,
    LOAD_LOCATIONS,
    OPEN_STORE_DETAILS,
    RESET_STORE_TYPES,
    RESET_SEARCH_TERM,
    SET_MAP_INITIAL_COORDS,
    SET_USER_LOCATION,
    SET_STORE_TYPES,
    SHOW_LOADING,
    TOGGLE_FILTER_PANEL,
    TOGGLE_SEARCH_LAYER,
    TOGGLE_STORE_TYPE,
    UPDATE_COORDS,
    UPDATE_SEARCH_TERM,
} from './actionTypes.js';
import { setHashRoute } from '../history.js';

function storeIsInLocation(store, location) {
    return store.location.some((locationBit) => locationBit.toLowerCase().includes(location.toLowerCase()))
}

function storeIsOfType(store, storeTypes) {
    return store.storeTypes.some((storeType) => storeTypes.includes(storeType.id));
}

function storeIsInsideBoundaries(store, ne, sw) {
    return ne.lat >= Number(store.lat) && Number(store.lat) >= sw.lat && ne.lng >= Number(store.lng) && Number(store.lng) >= sw.lng
}

function setStoreVisibilityFromFilters(filters) {
    return function (store) {
        const visibleBySearchTerm = !filters.search || storeIsInLocation(store, filters.search);
        const visibleByFilters = !filters.storeTypes.length || storeIsOfType(store, filters.storeTypes);
        const visibleByCoords = !filters.coords || storeIsInsideBoundaries(store, filters.coords.ne, filters.coords.sw);

        store.visible = visibleBySearchTerm && visibleByFilters && visibleByCoords;

        return store;
    }
}

function toggleStoreType(storeTypeIds, storeTypeId) {
    return storeTypeIds.includes(storeTypeId) ?
           storeTypeIds.filter((id) => id !== storeTypeId) : 
           storeTypeIds.concat(storeTypeId);
}

const reducer = (state, action) => {
    switch (action.type) {
        case LOAD_STORES:
            const visibleStores = action.stores.map(setStoreVisibilityFromFilters(state.filters));

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
                    stores: state.stores.map(setStoreVisibilityFromFilters(filters)),
                    filters,
                }
            }

        case RESET_SEARCH_TERM:
            {
                const filters = {
                    ...state.filters,
                    search: null
                }

                setHashRoute(filters);

                return {
                    ...state,
                    searchTerm: '',
                    stores: state.stores.map(setStoreVisibilityFromFilters(filters)),
                    filters,
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
                    stores: state.stores.map(setStoreVisibilityFromFilters(filters)),
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
                    stores: state.stores.map(setStoreVisibilityFromFilters(filters)),
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
                    stores: state.stores.map(setStoreVisibilityFromFilters(filters)),
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
                    searchTerm: '',
                    stores: state.stores.map(setStoreVisibilityFromFilters(filters)),
                    filters,
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

        case APPLY_FILTERS:
            return {
                ...state,
                searchTerm: action.filters.search || '',
                stores: state.stores.map(setStoreVisibilityFromFilters(action.filters)),
                filters: action.filters,
            }

        case SET_MAP_INITIAL_COORDS:
            return {
                ...state,
                mapInitialCoords: action.coords,
            }

        default:
            return state;
    }
}

export default reducer;