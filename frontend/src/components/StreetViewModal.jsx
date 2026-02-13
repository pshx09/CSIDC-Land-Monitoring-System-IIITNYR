import React from 'react';
import { GoogleMap, StreetViewPanorama, useJsApiLoader } from '@react-google-maps/api';
import { X } from 'lucide-react';

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem'
};

const StreetViewModal = ({ isOpen, onClose, lat, lng }) => {
    // API Key from Vite env
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: API_KEY
    });

    if (!isOpen) return null;

    const center = {
        lat: lat || 21.2844,
        lng: lng || 81.7213
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 1000,
                    background: 'white',
                    borderRadius: '50%',
                    padding: '5px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }} onClick={onClose}>
                    <X color="black" />
                </div>

                {API_KEY && isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={18}
                        options={{
                            disableDefaultUI: true, // Hide default map UI to focus on Street View
                        }}
                    >
                        {/* Street View handles its own visibility, but ensuring it overlays the map */}
                        <StreetViewPanorama
                            position={center}
                            visible={true}
                            options={{
                                pov: { heading: 100, pitch: 0 },
                                zoom: 1,
                                addressControl: true,
                                fullscreenControl: true,
                                motionTracking: true,
                                motionTrackingControl: true,
                            }}
                        />
                    </GoogleMap>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
                        {API_KEY ? <h3>Loading Street View...</h3> : (
                            <>
                                <h3>⚠️ Google Maps API Key Missing</h3>
                                <p>Please add VITE_GOOGLE_MAPS_KEY to your frontend/.env file.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StreetViewModal;
