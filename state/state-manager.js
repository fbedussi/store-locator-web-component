import { createStore, applyMiddleware } from './redux4.min.js';
import thunk from '../redux-thunk.js';
import reducer from './reducer.js';
import state from './state.js';

const initialState = state;

const store = createStore(reducer, initialState, applyMiddleware(thunk));

export default store;

export const getState = () => store.getState()

export const subscribeState = (listener) => {
    store.subscribe( () => listener(store.getState()) );
}

function getNestedValue(obj, key) {
    return key
        .split('.')
        .reduce((nestedValue, partialKey) => {
            return nestedValue && nestedValue.hasOwnProperty(partialKey) ? nestedValue[partialKey] : undefined;
        }, obj);
}

export const subscribePartialState = (partialStateKeys, listener) => {
    let currentState;

    partialStateKeys = [].concat(partialStateKeys);
    
    function handleChange() {
        let nextState = store.getState();
        if (
            !currentState 
            || partialStateKeys
                .some((partialStateKey) => 
                    getNestedValue(nextState, partialStateKey) !== getNestedValue(currentState, partialStateKey))
            ) {
            listener(nextState, currentState);
            currentState = nextState;
        }
    }
    
    let unsubscribe = store.subscribe(handleChange);
    handleChange();
    return unsubscribe;
}



export const dispatch = (action) => store.dispatch(action);