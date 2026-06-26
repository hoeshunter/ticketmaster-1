import { useState, useEffect } from 'react'

const MapEmbed = ({ stadium, city, state, preloadedCoords }) => {
  const [coords, setCoords]   = useState(preloadedCoords || null)
  const [mapsUrl, setMapsUrl] = useState('')
  const [loading, setLoading] = useState(!preloadedCoords)

  useEffect(() => {
    const query = stadium + ', ' + city + ', ' + state
    setMapsUrl('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query))

    // Already have coords from preload — skip the fetch entirely
    if (preloadedCoords) {
      setCoords(preloadedCoords)
      setLoading(false)
      return
    }

    // Fallback: geocode on the spot if preload hasn't resolved yet
    fetch(
      'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) + '&format=json&limit=1',
      { headers: { Accept: 'application/json' } }
    )
      .then(r => r.json())
      .then(data => {
        if (data && data[0])
          setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [stadium, city, state, preloadedCoords])

  if (loading) {
    return (
      <div className="tp-map-shell tp-map-loading">
        <div className="tp-map-spinner" />
      </div>
    )
  }

  if (!coords) {
    return (
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="tp-map-shell tp-map-fallback">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#888">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span className="tp-map-fallback-text">{stadium}</span>
        <span className="tp-map-fallback-sub">{city}, {state}</span>
      </a>
    )
  }

  const src = 'https://maps.google.com/maps?q=' + coords.lat + ',' + coords.lon + '&z=17&t=h&output=embed'

  return (
    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="tp-map-link-wrap">
      <iframe
        title="venue-map"
        src={src}
        className="tp-map-iframe"
        loading="lazy"
        scrolling="no"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="tp-map-tap-overlay" />
    </a>
  )
}

export default MapEmbed