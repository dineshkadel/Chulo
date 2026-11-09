import { useEffect, useRef } from 'react'
import { divIcon, map, marker, tileLayer, type Map, type Marker } from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type Coordinates = { lat: number; lng: number }

type LocationPickerProps = {
  coordinates: Coordinates
  onChange: (coordinates: Coordinates) => void
}

const pinIcon = divIcon({
  className: 'restaurant-map-pin',
  html: '<span aria-hidden="true">&#128205;</span>',
  iconSize: [34, 42],
  iconAnchor: [17, 38],
})

export function LocationPicker({ coordinates, onChange }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const leafletMap = map(containerRef.current, { scrollWheelZoom: false }).setView(
      [coordinates.lat, coordinates.lng],
      14,
    )
    tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(leafletMap)

    const updateCoordinates = ({ lat, lng }: Coordinates) => onChange({ lat, lng })
    const pin = marker([coordinates.lat, coordinates.lng], { draggable: true, icon: pinIcon }).addTo(leafletMap)
    pin.on('dragend', () => updateCoordinates(pin.getLatLng()))
    leafletMap.on('click', (event) => updateCoordinates(event.latlng))

    mapRef.current = leafletMap
    markerRef.current = pin
    return () => {
      leafletMap.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [onChange])

  useEffect(() => {
    markerRef.current?.setLatLng([coordinates.lat, coordinates.lng])
  }, [coordinates])

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
      <div ref={containerRef} className="h-64 w-full" aria-label="Restaurant location map" />
      <p className="m-0 border-t border-stone-200 bg-white px-3 py-2 text-xs text-stone-500">
        Click the map or drag the pin to your restaurant’s entrance. Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
      </p>
    </div>
  )
}
