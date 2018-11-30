import {
    LOAD_STORES,
    LOAD_STORE_TYPES,
    LOAD_LOCATIONS,
    UPDATE_SEARCH_TERM,
    TOGGLE_FILTER_PANEL,
    SET_STORE_TYPES,
    RESET_STORE_TYPES,
    TOGGLE_STORE_TYPE,
    OPEN_STORE_DETAILS,
    TOGGLE_SEARCH_LAYER,
} from './actionTypes.js';

export const loadStoresAction = (stores) => ({ type: LOAD_STORES, stores });

export const loadStoreTypesAction = (storeTypes) => ({ type: LOAD_STORE_TYPES, storeTypes });

export const loadLocationsAction = (locations) => ({ type: LOAD_LOCATIONS, locations });

export const updateSearchTermAction = (searchTerm) => ({ type: UPDATE_SEARCH_TERM, searchTerm });

export const toggleFilterPanelAction = () => ({ type: TOGGLE_FILTER_PANEL });

export const setStoreTypesAction = (storeTypes) => ({ type: SET_STORE_TYPES, storeTypes });

export const toggleStoreTypeAction = (storeTypeId) => ({ type: TOGGLE_STORE_TYPE, storeTypeId});

export const resetStoreTypesAction = () => ({ type: RESET_STORE_TYPES });

export const openStoreDetailsAction = (store) => ({type: OPEN_STORE_DETAILS, store});

export const toggleSearchLayerAction = () => ({type: TOGGLE_SEARCH_LAYER});