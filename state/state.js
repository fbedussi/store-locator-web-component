export default {
    stores: [],
    storeTypes: [],
    locations: [],
    ui: {
        filterPanelOpen: false,
        resultPanelOpen: true,
    },
    searchTerm: '',
    openeStore: null,
    filters: {
        continent: '',
        country: '',
        city: '',
        coordinates: {
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
        },
        storeTypes: []
    }
}