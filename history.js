import { 
    dispatch, 
} from './state/state-manager.js';
import { 
    applyFiltersAction,
    setMapInitialCoords,
    setStoreTypesAction,
    updateSearchTermAction,
    updateCoordsAction,
} from './state/actions.js';

const keysMap = {
    'store-types': {
        action: setStoreTypesAction,
        filterKey: 'storeTypes',
        formatValue: (value) => value[0].split(','),
    }, 
    'search': {
        action: updateSearchTermAction,
        filterKey: 'search',
        formatValue: (value) => value[0],
    },
    'coords': {
        action: updateCoordsAction,
        filterKey: 'coords',
        formatValue: (value) => {
            const center = value[0].split(',')
            const ne = value[2].split(',')
            const sw = value[4].split(',')

            return {
                center: {
                    lat: Number(center[0]),
                    lng: Number(center[1])
                },
                ne: {
                    lat: Number(ne[0]),
                    lng: Number(ne[1])
                },
                sw: {
                    lat: Number(sw[0]),
                    lng: Number(sw[1])
                }
            }
        }
    }
}

const keys = Object.keys(keysMap);

export function setHashRoute(filters) {
    let hash = '#';

    hash += filters.search ? `/search/${filters.search}` : '';

    if(filters.coords) {
        const coords = filters.coords;

        hash += `/coords/${coords.center.lat},${coords.center.lng}/ne/${coords.ne.lat},${coords.ne.lng}/sw/${coords.sw.lat},${coords.sw.lng}`;
    }
    
    hash += (filters.storeTypes && filters.storeTypes.length) ? `/store-types/${filters.storeTypes.join(',')}` : '';

    const route = `${window.location.pathname}${hash}`;

    window.history.pushState({}, '', route);
}

export function decodeRoute() {
    const segments = window.location.hash.slice(1).split('/');
    
    let filters = {
        search: null,
        storeTypes: [],
        coords: null,
    };

    keys.forEach((key) => {
        if (segments.includes(key)) {
            const segmentsAfterKey = segments.slice(segments.indexOf(key) + 1);
            const nextKeyIndex = keys.map((k) => segmentsAfterKey.indexOf(k)).filter((index) => index > -1).sort()[0] || segmentsAfterKey.length;
            const value = segmentsAfterKey.slice(0, nextKeyIndex)
            
            if (value.length) {
                filters[keysMap[key].filterKey] = keysMap[key].formatValue(value)
            }
        }
    });

    dispatch(applyFiltersAction(filters));
    dispatch(setMapInitialCoords(filters.coords));
}
