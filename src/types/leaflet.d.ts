import * as L from 'leaflet';

declare module 'leaflet' {
  interface Marker {
    getLatLng(): L.LatLng;
    bindPopup(content: string): this;
    openPopup(): this;
  }

  interface Control {
    addTo(map: L.Map): this;
  }

  namespace L {
    function latLng(lat: number, lng: number): L.LatLng;
  }
}