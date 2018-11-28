function toBoolean(numberAsstring) {
    return numberAsstring === "0" ? false : true;
}

export function decodeStores(rawStores) {
    return rawStores.map((store) => ({
            id: String(store.ID) || '',
            name: store.post_title || '',
            address: store["wpcf-store-address"] || '',
            geolocationAddress: store["wpcf-store-geolocation-address"] || '',
            lat: store["_store-lat"] || '',
            lng: store["_store-lng"] || '',
            phone: store["wpcf-store-phone"] || '',
            mail: store["wpcf-store-email-storelocator"] || '',
            mails: store["wpcf-store-email"] || '',
            brand: store["wpcf-store-main-store-brand"] || '',
            classification: store["wpcf-store-type-classification"] || '',
            isFlagship: toBoolean(store["wpcf-store-is-flagship"]),
            gifCardAccepted: toBoolean(store["wpcf-store-gift-card-accepted"]),
            hasWiFi: toBoolean(store["wpcf-store-has-wifi"]),
            hasMadeToMeasure: toBoolean(store["wpcf-store-has-made-to-measure"]),
            hasTailoring: toBoolean(store["wpcf-store-has-tailoring"]),
            bookable: toBoolean(store["wpcf-store-bookable"]),
            checkAvailability: toBoolean(store["wpcf-store-attr-check-availabilty"]),
            reserveInStore: toBoolean(store["wpcf-store-attr-reserve-in-store"]),
            pickUpInStore: toBoolean(store["wpcf-store-attr-pick-up-in-store"]),
            returnInStore: toBoolean(store["wpcf-store-attr-return-in-store"]),
            clickFromStore: toBoolean(store["wpcf-store-attr-click-from-store"]),
            gender: store.gender ? 
                store.gender.map((gender) => ({
                    id: gender.term_id,
                    name: gender.name,
                }))
                : [],
            storeTypes: store["store-type"] ?
                store["store-type"].map((storeType) => ({
                    id: String(storeType.term_id),
                    name: storeType.name,
                }))
                : [],
            productCategory: store["product-category"] ? 
                store["product-category"].map((productCategory) => ({
                    id: productCategory.id,
                    name: productCategory.name,
                }))
                : [],
            location: store.location ? 
                Object.keys(store.location).map((key) => store.location[key].name)
                : [],
            visible: true,
    }));
}

export function decodeLocations(rawLocations) {
    return rawLocations.terms.map((location) => ({
        id: String(location.term_id) || '',
        name: location.name || '',
    }));
}

export function decodeStoreTypes(rawStoreTypes) {
    return rawStoreTypes.terms.map((storeType) => ({
        id: String(storeType.term_id) || '',
        name: storeType.name || '',
    }));
}
