import img1 from '../imgs/home_image1.jpg'
import img2 from '../imgs/home_image2.PNG'
import img3 from '../imgs/home_image3.PNG'
import img4 from '../imgs/home_image4.PNG'
import img5 from '../imgs/home_image5.PNG'
import img6 from '../imgs/home_image6.PNG'
import img7 from '../imgs/home_image7.PNG'
import img8 from '../imgs/home_image8.PNG'
import img9 from '../imgs/home_image9.PNG'
import img10 from '../imgs/home_image10.PNG'
import { useState, useEffect } from 'react'
import { fetchAllEvents } from '../api'
import '../App.css'

const DiscoverSkeleton = () => (
  <div className="disc-skel">
    {/* ── Dark nav skeleton ── */}
    <div className="disc-skel-hdr">
      {/* Row 1: centered title + flag avatar */}
      <div className="disc-skel-r1">
        <div className="disc-skel-title-bar"></div>
        <div className="disc-skel-avatar-circle"></div>
      </div>
      {/* Row 2: two filter chips */}
      <div className="disc-skel-r2">
        <div className="disc-skel-chip"></div>
        <div className="disc-skel-chip"></div>
      </div>
      {/* Row 3: search / filter bar */}
      <div className="disc-skel-r3">
        <div className="disc-skel-searchbar"></div>
      </div>
    </div>

    {/* ── Light content skeleton ── */}
    <div className="disc-skel-body">
      {/* Hero banner placeholder */}
      <div className="disc-skel-hero">
        <div className="disc-skel-shimmer-stripe"></div>
        <div className="disc-skel-hero-texts">
          <div className="disc-skel-ht disc-skel-ht--wide"></div>
          <div className="disc-skel-ht disc-skel-ht--narrow"></div>
        </div>
      </div>

      {/* White separator */}
      <div className="disc-skel-sep"></div>

      {/* Event card image placeholder */}
      <div className="disc-skel-card-wrap">
        <div className="disc-skel-card-img">
          <div className="disc-skel-shimmer-stripe disc-skel-shimmer-stripe--delay"></div>
        </div>
        <div className="disc-skel-card-meta">
          <div className="disc-skel-ml disc-skel-ml--s"></div>
          <div className="disc-skel-ml disc-skel-ml--l"></div>
        </div>
      </div>
    </div>
  </div>
)

const Homepage = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchAllEvents();
        setEvents(data);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();

    // A phone browser tab left open (or a homescreen PWA switched back into)
    // never re-runs this effect on its own — it just keeps showing whatever
    // was fetched on the last load, even after an admin holds/releases an
    // event elsewhere. Re-fetch whenever the tab becomes visible/focused
    // again so a held event actually disappears without a manual reload.
    const handleVisible = () => { if (document.visibilityState === 'visible') loadEvents(); };
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('focus', loadEvents);
    return () => {
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('focus', loadEvents);
    };
  }, []);

  if (loading) return <DiscoverSkeleton />

  return (
    <div className="homepage">
      <img src={img1} alt="Home1"/>
      <img src={img2} alt="" />
      <img src={img3} alt="" />
      <img src={img4} alt="" />
      <img src={img5} alt="" />
      <img src={img6} alt="" />
      <img src={img7} alt="" />
      <img src={img8} alt="" />
      <img src={img9} alt="" />
      <img src={img10} alt="" />

      {/* Display admin-created events */}
      {events.length > 0 && (
        <div className="admin-events-section">
          <h2 className="admin-events-title">Available Events</h2>
          <div className="admin-events-grid">
            {events.map((event, index) => (
              <div key={event.id || index} className="admin-event-card">
                <img
                  src={event.IMG || event.image_url || ''}
                  alt={event.name}
                  className="admin-event-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (!e.target.nextElementSibling?.classList.contains('admin-event-image-placeholder')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'admin-event-image-placeholder';
                      placeholder.textContent = '🎫';
                      e.target.parentNode.insertBefore(placeholder, e.target.nextSibling);
                    }
                  }}
                />
                <div className="admin-event-info">
                  <h3 className="admin-event-name">{event.name}</h3>
                  <p className="admin-event-venue">{event.stadium}</p>
                  <p className="admin-event-location">{event.city}, {event.state}</p>
                  <p className="admin-event-datetime">
                    {event.day} • {event.date} • {event.time}
                  </p>
                  <p className="admin-event-tickets">{event.tickets?.length || 0} tickets available</p>
                  {event.createdBy && (
                    <p className="admin-event-created-by">Created by: {event.createdBy}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Homepage