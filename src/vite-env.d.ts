/// <reference types="vite/client" />

// Add Leaflet type declarations
declare module 'leaflet' {
  export interface Map {
    // Map methods and properties
    setView(center: LatLngExpression, zoom: number): this;
    getZoom(): number;
    fitBounds(bounds: LatLngBounds, options?: FitBoundsOptions): this;
    removeLayer(layer: Layer): this;
    remove(): this;
    zoomIn(delta?: number): this;
    zoomOut(delta?: number): this;
  }

  export interface MapOptions {
    center?: LatLngExpression;
    zoom?: number;
    layers?: Layer[];
    zoomControl?: boolean;
  }

  export interface LatLngExpression {
    lat: number;
    lng: number;
  }

  export type LatLngTuple = [number, number];

  export interface LatLngBounds {
    // LatLngBounds methods and properties
  }

  export interface FitBoundsOptions {
    padding?: PointExpression;
  }

  export interface PointExpression {
    x: number;
    y: number;
  }

  export interface Layer {
    // Layer methods and properties
    addTo(map: Map): this;
    remove(): this;
  }

  export interface Marker extends Layer {
    // Marker methods and properties
    setLatLng(latlng: LatLngExpression | LatLngTuple): this;
    bindTooltip(content: string, options?: TooltipOptions): this;
    unbindTooltip(): this;
    on(event: string, fn: Function): this;
  }

  export interface MarkerOptions {
    icon?: Icon;
  }

  export interface Icon {
    // Icon methods and properties
  }

  export interface DivIcon extends Icon {
    // DivIcon methods and properties
  }

  export interface DivIconOptions {
    html?: string;
    className?: string;
    iconSize?: PointExpression;
    iconAnchor?: PointExpression;
  }

  export interface Polyline extends Layer {
    // Polyline methods and properties
    setLatLngs(latlngs: LatLngExpression[] | LatLngTuple[]): this;
    getBounds(): LatLngBounds;
  }

  export interface PolylineOptions {
    color?: string;
    weight?: number;
    opacity?: number;
    lineJoin?: string;
  }

  export interface Circle extends Layer {
    // Circle methods and properties
    setLatLng(latlng: LatLngExpression | LatLngTuple): this;
    setRadius(radius: number): this;
  }

  export interface CircleOptions {
    radius?: number;
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
    weight?: number;
  }

  export interface TooltipOptions {
    permanent?: boolean;
    direction?: string;
    className?: string;
  }

  export interface Control {
    // Control methods and properties
  }

  export interface ControlOptions {
    position?: string;
  }

  export interface ScaleOptions extends ControlOptions {
    maxWidth?: number;
    metric?: boolean;
    imperial?: boolean;
    updateWhenIdle?: boolean;
  }

  export function map(element: HTMLElement | string, options?: MapOptions): Map;
  export function marker(latlng: LatLngExpression | LatLngTuple, options?: MarkerOptions): Marker;
  export function divIcon(options?: DivIconOptions): DivIcon;
  export function polyline(latlngs: LatLngExpression[] | LatLngTuple[], options?: PolylineOptions): Polyline;
  export function circle(latlng: LatLngExpression | LatLngTuple, options?: CircleOptions): Circle;
  export function tileLayer(urlTemplate: string, options?: any): Layer;

  export namespace control {
    export function scale(options?: ScaleOptions): Control;
  }
}