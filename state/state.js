export default {
    stores: [],
    numberOfVisibleStores: null,
    storeTypes: [],
    locations: [],
    ui: {
        filterPanelOpen: false,
        resultPanelOpen: true,
        searchLayerOpen: false,
    },
    searchTerm: '',
    userLocation: null,
    openeStore: null,
    filters: {
        search: null,
        coords: null,
        storeTypes: []
    }
}

/*
    Ok non piace nemmeno a me ma per ora lo lascio qui poi vedremo:

    Coords type
    {       
        center: {
            lat: '',
            lng: ''
        },
        ne: {
            lat: '',
            lng: ''
        },
        sw: {
            lat: '',
            lng: ''
        }
    }    
*/