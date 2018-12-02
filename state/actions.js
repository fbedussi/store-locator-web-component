import {
    LOAD_LOCATIONS,
    LOAD_STORE_TYPES,
    LOAD_STORES,
    OPEN_STORE_DETAILS,
    RESET_STORE_TYPES,
    SET_USER_LOCATION,
    SET_STORE_TYPES,
    TOGGLE_FILTER_PANEL,
    TOGGLE_SEARCH_LAYER,
    TOGGLE_STORE_TYPE,
    UPDATE_SEARCH_TERM,
    RESET_SEARCH_TERM,
} from './actionTypes.js';

export const loadStoresAction = (stores) => ({ type: LOAD_STORES, stores });

export const loadStoreTypesAction = (storeTypes) => ({ type: LOAD_STORE_TYPES, storeTypes });

export const loadLocationsAction = (locations) => ({ type: LOAD_LOCATIONS, locations });

export const updateSearchTermAction = (searchTerm) => ({ type: UPDATE_SEARCH_TERM, searchTerm });

export const resetSearchTermAction = () => ({type: RESET_SEARCH_TERM});

export const toggleFilterPanelAction = () => ({ type: TOGGLE_FILTER_PANEL });

export const setStoreTypesAction = (storeTypes) => ({ type: SET_STORE_TYPES, storeTypes });

export const toggleStoreTypeAction = (storeTypeId) => ({ type: TOGGLE_STORE_TYPE, storeTypeId});

export const resetStoreTypesAction = () => ({ type: RESET_STORE_TYPES });

export const openStoreDetailsAction = (store) => ({type: OPEN_STORE_DETAILS, store});

export const toggleSearchLayerAction = () => ({type: TOGGLE_SEARCH_LAYER});

export const setUserLocationAction = (userLocation) => ({type: SET_USER_LOCATION, userLocation})
