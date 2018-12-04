import { dispatch, getState, subscribePartialState } from '../state/state-manager.js';
import MarkerClusterer from '../vendor/marker-clusterer.js';
import { throttle } from '../utils.js';
import { updateCoordsAction } from '../state/actions.js';

class StoresMap extends HTMLElement {
  constructor() {
    super();

    this.map = null;
    this.markers = [];
    this.bootstrapMap = true;
    this.bootstrapBounds = false;

    const styleNode = document.createElement('style');
    styleNode.textContent = `
            :host {
              position: relative;
            }
            .map {
              position: relative;
              width: 100%;
              height: 100%;
            }
            .gm-bundled-control {
                bottom: 69px!important;
                right: 28px!important;
            }
            .gm-bundled-control > div > div {
                width: 28px!important;
                height: 55px!important;
            }
            .gm-bundled-control > div > div > div {
                width: 24px!important;
                margin: 0 3px!important;
            }
            .gm-bundled-control button {
                width: 28px!important;
                height: 27px!important;
            }
            .gm-bundled-control button img {
                height: 12px!important;
                width: 11px!important;
                margin: 8px!important;
            }
        `;
    this.appendChild(styleNode);

    this.mapElement = document.createElement('div');
    this.mapElement.classList = 'map';

    this.appendChild(this.mapElement);
  }

  connectedCallback() {
    window.initGoogleMap = this.init.bind(this);

    const googleMapsJsNode = document.createElement('script');
    googleMapsJsNode.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCRTnC96aFUTP62mNuxDBUoHcLvR35MLOI&callback=initGoogleMap';
    this.appendChild(googleMapsJsNode);
  }

    bindEvents() {
        this.map.addListener('bounds_changed', this.dispatchUpdatedCoords.bind(this));
    }

    unbindEvents() {
        google.maps.event.clearListeners(this.map, 'bounds_changed');
    }

    init() {
        var myLatLng = { lat: 48.074766, lng: 7.574985 };
        var silverStyle = [
        {
            "elementType": "geometry",
            "stylers": [
            {
                "color": "#f5f5f5"
            }
            ]
        },
        {
            "elementType": "labels.icon",
            "stylers": [
            {
                "visibility": "off"
            }
            ]
        },
        {
            "elementType": "labels.text.fill",
            "stylers": [
            {
                "color": "#616161"
            }
            ]
        },
        {
            "elementType": "labels.text.stroke",
            "stylers": [
            {
                "color": "#f5f5f5"
            }
            ]
        },
        {
            "featureType": "administrative.land_parcel",
            "elementType": "labels.text.fill",
            "stylers": [
            {
                "color": "#bdbdbd"
            }
            ]
        },
        {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [
            {
                "color": "#eeeeee"
            }
            ]
        },
        {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [
            {
                "color": "#757575"
            }
            ]
        },
        {
            "featureType": "poi.business",
            "stylers": [
            {
                "visibility": "off"
            }
            ]
        },
        {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [
            {
                "color": "#e5e5e5"
            }
            ]
        },
        {
            "featureType": "poi.park",
            "elementType": "labels.text",
            "stylers": [
            {
                "visibility": "off"
            }
            ]
        },
        {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [
            {
                "color": "#9e9e9e"
            }
            ]
        },
        {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [
            {
                "color": "#ffffff"
            }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "labels.text.fill",
            "stylers": [
            {
                "color": "#757575"
            }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [
            {
                "color": "#dadada"
            }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "labels.text.fill",
            "stylers": [
            {
                "color": "#616161"
            }
            ]
        },
        {
            "featureType": "road.local",
            "elementType": "labels.text.fill",
            "stylers": [
            {
                "color": "#9e9e9e"
            }
            ]
        },
        {
            "featureType": "transit.line",
            "elementType": "geometry",
            "stylers": [
            {
                "color": "#e5e5e5"
            }
            ]
        },
        {
            "featureType": "transit.station",
            "elementType": "geometry",
            "stylers": [
            {
                "color": "#eeeeee"
            }
            ]
        },
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
            {
                "color": "#c9c9c9"
            }
            ]
        },
        {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [
            {
                "color": "#9e9e9e"
            }
            ]
        }
        ];

        this.map = new google.maps.Map(this.mapElement, {
            center: myLatLng,
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            styles: silverStyle,
            zoom: 4,
            zoomControl: true,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.SMALL
            }
        });

        subscribePartialState(['stores'], throttle(state => {
            this.stores = state.stores;

            this.resetMarkers();
            this.setMarkers();
        }, 100));

        subscribePartialState('userLocation', (state) => {
            if(state.geolocation) {
                this.map.setCenter(state.geolocation);

                this.dispatchUpdatedCoords();
            }
        });

        subscribePartialState('mapInitialCoords', (state) => {
            if(state.mapInitialCoords) {
                const ne = new google.maps.LatLng({lat: state.mapInitialCoords.ne.lat, lng: state.mapInitialCoords.ne.lng});
                const sw = new google.maps.LatLng({lat: state.mapInitialCoords.sw.lat, lng: state.mapInitialCoords.sw.lng});

                let bounds = new google.maps.LatLngBounds();
                bounds.extend(ne);
                bounds.extend(sw);

                this.bootstrapBounds = true;

                this.map.fitBounds(bounds, 0);
            }
        });

        this.bindEvents();
    }

    setMarkers() {
        if (!this.map) {
            return;
        }

        this.markers = this.stores.filter((store) => store.visible).map(store => {
            return new google.maps.Marker({
                map: this.map,
                position: { lat: Number(store.lat), lng: Number(store.lng) },
                title: store.post_title
            });
        });

        this.markerCluster = new MarkerClusterer(this.map, this.markers, {
            gridSize: 40,
            styles: [{
                url: 'https://media.yoox.biz/ytos/resources/BALMAIN/Images/icons/pinmap-cluster.svg',
                width: 35,
                height: 35
            }]
        });
    }

    resetMarkers() {
        if (this.markerCluster) {
            this.markerCluster.clearMarkers();
        }

        this.markers.map((marker) => {
            marker.setMap(null);
        });

        this.markers = [];
    }

    dispatchUpdatedCoords() { 
        if(this.bootstrapMap) {
            this.bootstrapMap = false;
            
            return;
        }
        
        if(this.bootstrapBounds) {
            this.bootstrapBounds = false;

            return;
        }
        
        const coords = {
            center: {
                lat: this.map.center.lat(),
                lng: this.map.center.lng()
            },
            ne: {
                lat: this.map.getBounds().getNorthEast().lat(),
                lng: this.map.getBounds().getNorthEast().lng()
            },
            sw: {
                lat: this.map.getBounds().getSouthWest().lat(),
                lng: this.map.getBounds().getSouthWest().lng()
            }
        };

        dispatch(updateCoordsAction(coords));
    }
}

window.customElements.define('stores-map', StoresMap);