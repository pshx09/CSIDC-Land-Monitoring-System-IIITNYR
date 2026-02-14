import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap, WMSTileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const { BaseLayer, Overlay } = LayersControl;const MapComponent = ({ onPlotSelect, sentinelDate, selectedFeature }) => {
    const [plots, setPlots] = useState(null);
    const layersRef = useRef({});

    useEffect(() => {
        axios.get('http://localhost:8000/api/plots')
            .then(res => setPlots(res.data))
            .catch(err => console.error(err));
    }, []);

    // Update styling when selectedFeature changes
    useEffect(() => {
        Object.keys(layersRef.current).forEach(key => {
            const layer = layersRef.current[key];
            const feature = layer.feature;
            const status = feature.properties.Status;
            let color = '#3388ff';

            if (status === 'Allocated') {
                color = '#e32b2d';
            } else if (status && status.includes('Allocated/Partially Constructed')) {
                color = '#33a02c';
            } else if (status === 'Closed') {
                color = '#b2df8a';
            }

            // Darken if selected
            if (selectedFeature && selectedFeature.properties.Plot_Id === feature.properties.Plot_Id) {
                const darkColor = getDarkerColor(color);
                layer.setStyle({ color: darkColor, weight: 3, fillOpacity: 0.8, fillColor: darkColor });
            } else {
                layer.setStyle({ color, weight: 2, fillOpacity: 0.6, fillColor: color });
            }
        });
    }, [selectedFeature]);

    const getDarkerColor = (color) => {
        const num = parseInt(color.slice(1), 16);
        const amt = 50;
        const usePound = true;
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return (usePound ? "#" : "") + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
            (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
            .toString(16).slice(1);
    };

    const onEachFeature = (feature, layer) => {
        const status = feature.properties.Status;
        let color = '#3388ff';

        if (status === 'Allocated') {
            color = '#e32b2d';
        } else if (status && status.includes('Allocated/Partially Constructed')) {
            color = '#33a02c';
        } else if (status === 'Closed') {
            color = '#b2df8a';
        }

        layer.setStyle({ color, weight: 2, fillOpacity: 0.6, fillColor: color });
        layer.feature = feature;

        // Create popup content
        const popupContent = `
            <div class="popup-content">
                <div class="popup-header">
                    <h3>Plot ${feature.properties.Plot_Id || 'N/A'}</h3>
                </div>
                <div class="popup-body">
                    <div class="popup-row">
                        <span class="popup-label">Owner:</span>
                        <span class="popup-val">${feature.properties.Owner || 'Unknown'}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Status:</span>
                        <span class="popup-val">${status || 'Unknown'}</span>
                    </div>
                    <div class="popup-row">
                        <span class="popup-label">Use Type:</span>
                        <span class="popup-val">${feature.properties.Use_Type || 'N/A'}</span>
                    </div>
                    ${feature.properties['Area (sq.m)'] ? `
                    <div class="popup-row">
                        <span class="popup-label">Area:</span>
                        <span class="popup-val">${feature.properties['Area (sq.m)'].toLocaleString()} sqm</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        layer.bindPopup(popupContent);

        // Store layer reference using ref
        layersRef.current[feature.properties.Plot_Id] = layer;

        layer.on('click', () => {
            onPlotSelect(feature);
        });
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
        </MapContainer>
    );
};

export { MapComponent };
export default MapComponent;
