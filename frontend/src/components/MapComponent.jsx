import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap, WMSTileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { Map as MapIcon, Eye, Smartphone } from 'lucide-react';

const { BaseLayer, Overlay } = LayersControl;

// Helper to attach event listeners to popups dynamically
const PopupLogic = ({ onOpenStreetView, onOpenAR }) => {
    const map = useMap();

    useEffect(() => {
        map.on('popupopen', (e) => {
            const popupNode = e.popup._contentNode;

            // Find buttons
            const btnSv = popupNode.querySelector('.btn-street');
            const btnAr = popupNode.querySelector('.btn-ar');

            if (btnSv) {
                btnSv.onclick = () => {
                    // Extract latlng from popup source
                    // For polygons, latlng might be the click point or center.
                    // Leaflet's e.popup._latlng is usually where the popup opened.
                    const latlng = e.popup._latlng;
                    onOpenStreetView(latlng.lat, latlng.lng);
                }
            }
            if (btnAr) {
                btnAr.onclick = () => {
                    onOpenAR();
                }
            }
        });
    }, [map, onOpenStreetView, onOpenAR]);

    return null;
}

const MapComponent = ({ onPlotSelect, onOpenStreetView, onOpenAR, sentinelDate }) => {
    const [plots, setPlots] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8000/api/plots')
            .then(res => setPlots(res.data))
            .catch(err => console.error(err));
    }, []);

    const onEachFeature = (feature, layer) => {
        const status = feature.properties.Status;
        let color = '#3388ff'; // Default blue

        if (status === 'Allocated') {
            color = '#e32b2d'; // Red
        } else if (status && status.includes('Allocated/Partially Constructed')) {
            color = '#33a02c'; // Green
        } else if (status === 'Closed') {
            color = '#b2df8a'; // Light Blue (Light Green hex actually, but per request)
        }

        layer.setStyle({ color, weight: 2, fillOpacity: 0.6, fillColor: color });

        layer.on('click', () => {
            onPlotSelect(feature);
        });

        // Create HTML Content for Popup
        const content = `
            <div class="popup-content">
                <h3>Plot ${feature.properties.Plot_Id || 'N/A'}</h3>
                <p><b>Owner:</b> ${feature.properties.Owner || 'Unknown'}</p>
                <p><b>Status:</b> ${status || 'Unknown'}</p>
                <button class="popup-btn btn-street">🌍 Street View</button>
                <button class="popup-btn btn-ar">📱 AR View</button>
            </div>
        `;
        layer.bindPopup(content);
    };

    return (
        <MapContainer center={[21.2845, 81.7212]} zoom={17} style={{ height: '100%', width: '100%' }} id="map">
            <LayersControl position="topright">
                <BaseLayer checked name="OpenStreetMap">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OpenStreetMap" />
                </BaseLayer>
                <BaseLayer name="Google Satellite">
                    <TileLayer url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" attribution="Google" />
                </BaseLayer>
                <BaseLayer name="ISRO Bhuvan Satellite">
                    <TileLayer
                        url="https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms?service=WMS&request=GetMap&layers=bhuvan:LULC50K_1112&format=image/png&transparent=false&version=1.1.1&width=256&height=256&srs=EPSG:3857"
                        attribution="ISRO/NRSC"
                    />
                </BaseLayer>
                <Overlay name="ISRO Bhuvan LULC Logic">
                    <TileLayer
                        url="https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms?service=WMS&request=GetMap&layers=lulc:BR_LULC50K_1112&format=image/png&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG:3857"
                        attribution="ISRO/NRSC"
                        opacity={0.6}
                    />
                </Overlay>

                <Overlay name="SentinelHub NDBI Layer">
                    <WMSTileLayer
                        key={sentinelDate ? `${sentinelDate.start}-${sentinelDate.end}` : 'default'}
                        url={import.meta.env.VITE_SENTINEL_WMS_URL}
                        layers={import.meta.env.VITE_SENTINEL_LAYER_NAME}
                        format="image/png"
                        transparent={true}
                        version="1.3.0"
                        attribution="SentinelHub"
                        time={`${sentinelDate?.start}/${sentinelDate?.end}`}
                        maxcc="20"
                    />
                </Overlay>
            </LayersControl>

            {plots && <GeoJSON data={plots} onEachFeature={onEachFeature} />}
            <PopupLogic onOpenStreetView={onOpenStreetView} onOpenAR={onOpenAR} />
        </MapContainer>
    );
};

export { MapComponent };
