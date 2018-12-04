import { 
    dispatch, 
} from './state/state-manager.js';
import { 
    setStoreTypesAction,
    updateSearchTermAction,
} from './state/actions.js';

const keysMap = {
    'store-type': {
        action: setStoreTypesAction,
        formatValue: (value) => value[0].split(','),
    }, 
    'search': {
        action: updateSearchTermAction,
        formatValue: (value) => value[0],
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
    

    keys.forEach((key) => {
        if (segments.includes(key)) {
            const segmentsAfterKey = segments.slice(segments.indexOf(key) + 1);
            const nextKeyIndex = keys.map((key) => segmentsAfterKey.indexOf(key)).filter((index) => index > -1).sort()[0] || segmentsAfterKey.length;
            const value = segmentsAfterKey.slice(0, nextKeyIndex)
            if (value.length) {
                dispatch(keysMap[key].action(keysMap[key].formatValue(value)));
            }
        }
    })
}