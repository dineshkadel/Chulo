import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import {
  MapPin,
  RefreshCw,
  Navigation,
  Compass,
} from 'lucide-react'

// Kathmandu Valley popular presets for quick selection
const KTM_PRESETS = [
  { name: 'Thamel', lat: 27.7152, lng: 85.3123 },
  { name: 'Lazimpat', lat: 27.7215, lng: 85.3222 },
  { name: 'Jhamsikhel', lat: 27.6807, lng: 85.3166 },
  { name: 'Pulchowk', lat: 27.6766, lng: 85.3160 },
  { name: 'Baneshwor', lat: 27.6906, lng: 85.3428 },
]

// Custom crisp SVG pin icon for delivery marker
const deliveryPinIcon = L.divIcon({
  className: 'delivery-map-pin',
  html: `
    <div style="position: relative; width: 34px; height: 42px; transform: translate(-50%, -100%); cursor: grab;">
      <div style="
        width: 34px; 
        height: 34px; 
        background: #d84315; 
        border: 2.5px solid #ffffff; 
        border-radius: 50% 50% 50% 0; 
        transform: rotate(-45deg); 
        box-shadow: 0 4px 12px rgba(0,0,0,0.35); 
        display: flex; 
        align-items: center; 
        justify-content: center;
      ">
        <div style="transform: rotate(45deg); font-size: 13px; color: white; font-weight: bold;">
          📍
        </div>
      </div>
      <div style="
        width: 10px; 
        height: 4px; 
        background: rgba(0,0,0,0.3); 
        border-radius: 50%; 
        margin: 2px auto 0;
      "></div>
    </div>
  `,
  iconSize: [34, 42],
  iconAnchor: [17, 42],
})

interface DeliveryLocationMapPickerProps {
  lat: number
  lng: number
  address: string
  onChangeLocation: (lat: number, lng: number, suggestedAddress?: string) => void
  onChangeAddress: (address: string) => void
  isCalculating?: boolean
  distanceKm?: number
  estimatedMin?: number
  deliveryFee?: number
}

export function DeliveryLocationMapPicker({
  lat,
  lng,
  address,
  onChangeLocation,
  onChangeAddress,
  isCalculating = false,
  distanceKm,
  estimatedMin,
  deliveryFee,
}: DeliveryLocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const [isLocating, setIsLocating] = useState(false)
  const [reverseGeocoding, setReverseGeocoding] = useState(false)

  // Reverse geocode lat/lng to readable Kathmandu area address via OSM Nominatim
  const reverseGeocode = useCallback(
    async (targetLat: number, targetLng: number) => {
      setReverseGeocoding(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        )
        if (res.ok) {
          const data = await res.json()
          if (data && data.address) {
            const road =
              data.address.road ||
              data.address.pedestrian ||
              data.address.suburb ||
              data.address.neighbourhood ||
              ''
            const city =
              data.address.city ||
              data.address.town ||
              data.address.municipality ||
              'Kathmandu'
            const parts = [road, city].filter(Boolean)
            if (parts.length > 0) {
              const fullAddr = parts.join(', ')
              onChangeLocation(targetLat, targetLng, fullAddr)
              return
            }
          }
        }
      } catch {
        // Fallback: coordinate string
      } finally {
        setReverseGeocoding(false)
      }
      onChangeLocation(targetLat, targetLng)
    },
    [onChangeLocation]
  )

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return // Already initialized

    const initialLat = lat || 27.7172
    const initialLng = lng || 85.324

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    })

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Add draggable marker
    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: deliveryPinIcon,
    }).addTo(map)

    marker.bindPopup(
      '<div style="font-size: 11px; font-weight: bold; padding: 2px;">Delivery Pin<br><span style="font-weight: normal; color: #666;">Drag to change location</span></div>'
    )

    // Marker drag event
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      reverseGeocode(pos.lat, pos.lng)
    })

    // Click anywhere on map to move pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      reverseGeocode(e.latlng.lat, e.latlng.lng)
    })

    mapInstanceRef.current = map
    markerRef.current = marker

    // Invalidate map size after mount/drawer transition
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      clearTimeout(timer)
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, []) // Mount once

  // Sync marker position if coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const currentPos = markerRef.current.getLatLng()
      const diffLat = Math.abs(currentPos.lat - lat)
      const diffLng = Math.abs(currentPos.lng - lng)
      if (diffLat > 0.0001 || diffLng > 0.0001) {
        markerRef.current.setLatLng([lat, lng])
        mapInstanceRef.current.panTo([lat, lng], { animate: true })
      }
    }
  }, [lat, lng])

  // Browser HTML5 Geolocation handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude

        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([userLat, userLng])
          mapInstanceRef.current.flyTo([userLat, userLng], 15, { duration: 1.2 })
        }
        reverseGeocode(userLat, userLng)
      },
      (err) => {
        setIsLocating(false)
        alert(`Location access failed: ${err.message}`)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  // Quick preset jump
  const handleSelectPreset = (preset: { name: string; lat: number; lng: number }) => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([preset.lat, preset.lng])
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 15, { duration: 0.8 })
    }
    onChangeLocation(preset.lat, preset.lng, `${preset.name}, Kathmandu`)
  }

  return (
    <div className="space-y-2.5">
      {/* Label and "Use Current Location" button */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
          <MapPin size={14} className="text-[var(--red)]" /> Pin Your Delivery Location
        </label>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50/80 px-2.5 py-1 text-[11px] font-bold text-[var(--red)] hover:bg-orange-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isLocating ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <Navigation size={12} />
          )}
          {isLocating ? 'Locating...' : 'Use My GPS'}
        </button>
      </div>

      {/* Map Container */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-xs">
        <div ref={mapContainerRef} className="h-48 w-full z-0" />

        {/* Live recalculation overlay badge */}
        <div className="absolute top-2 left-2 right-2 pointer-events-none z-10 flex justify-between items-center">
          <span className="rounded-lg bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
            💡 Drag pin or tap map to set location
          </span>
          {isCalculating ? (
            <span className="rounded-lg bg-[var(--red)] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm flex items-center gap-1 animate-pulse">
              <RefreshCw size={10} className="animate-spin" /> Recalculating fee...
            </span>
          ) : distanceKm !== undefined && deliveryFee !== undefined ? (
            <span className="rounded-lg bg-emerald-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
              {distanceKm.toFixed(1)} km · Rs.{deliveryFee} {estimatedMin ? `(~${estimatedMin}m)` : ''}
            </span>
          ) : null}
        </div>

        {/* Coordinates indicator */}
        <div className="absolute bottom-2 left-2 pointer-events-none z-10">
          <span className="rounded-md bg-white/85 px-2 py-0.5 text-[10px] font-mono text-stone-700 shadow-xs backdrop-blur-sm">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Quick Location Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1 flex items-center gap-0.5">
          <Compass size={11} /> Quick Area:
        </span>
        {KTM_PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => handleSelectPreset(p)}
            className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] font-semibold text-stone-600 hover:border-[var(--red)] hover:text-[var(--red)] transition-colors cursor-pointer shadow-2xs"
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Editable Address Text Input */}
      <div className="space-y-1 pt-1">
        <div className="flex justify-between items-center text-[11px]">
          <span className="font-bold text-stone-600">Street Address / Landmark</span>
          {reverseGeocoding && (
            <span className="text-orange-600 flex items-center gap-1 text-[10px]">
              <RefreshCw size={10} className="animate-spin" /> Updating address...
            </span>
          )}
        </div>
        <input
          type="text"
          value={address}
          onChange={(e) => onChangeAddress(e.target.value)}
          placeholder="e.g. Lazimpat, House #42, near Hotel Shanker"
          className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
        />
      </div>
    </div>
  )
}
