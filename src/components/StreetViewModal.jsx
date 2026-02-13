import React from 'react';
import { GoogleMap, StreetViewPanorama, LoadScript } from '@react-google-maps/api';
import { X } from 'lucide-react';

const containerStyle = { width: '100%', height: '100%' };

const StreetViewModal = ({ position, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-10">
      <div className="bg-white w-full h-full relative rounded-lg overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition shadow-lg"
        >
          <X size={24} />
        </button>

        {/* Replace with your actual Google Maps API Key */}
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}>
          <GoogleMap mapContainerStyle={containerStyle} center={position} zoom={18}>
            <StreetViewPanorama
              position={position}
              visible={true}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
                addressControl: true,
                fullscreenControl: false
              }}
            />
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
};

export default StreetViewModal;