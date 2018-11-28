import { 
    dispatch, 
} from './state/state-manager.js';
import { 
    setStoreTypesAction,
    updateSearchTermAction,
} from './state/actions.js';

export function setRoute(key, value) {
    const separatorChar = window.location.hash.length ? '/' : '#';
    const route = value.length ? `${window.location.hash}${separatorChar}${key}/${value}` : '/';

    window.history.pushState({}, '', route);
}

export function decodeRoute() {
    const segments = window.location.hash.slice(1).split('/');
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