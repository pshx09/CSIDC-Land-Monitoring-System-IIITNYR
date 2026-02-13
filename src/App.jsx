import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Marker Icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [1, 2] });
L.Marker.prototype.options.icon = DefaultIcon;

function App() {
    const [plots, setPlots] = useState(null);
    const = useState(null);
    const [chatInput, setChatInput] = useState("");
    const = useState("Hello! Click a plot to analyze.");

    // Fetch Data from Python Backend
    useEffect(() => {
        axios.get('http://localhost:8000/api/plots')
            .then(res => setPlots(res.data))
            .catch(err => console.error(err));
    },);

    // Chat with Gemini
    const handleChat = async () => {
        setChatResponse("Thinking...");
        const context = selectedPlot ? `Plot: ${selectedPlot.plot_no}, Owner: ${selectedPlot.owner}, Status: ${selectedPlot.status}` : "No plot selected.";

        const res = await axios.post('http://localhost:8000/api/chat', {
            message: chatInput,
            context: context
        });
        setChatResponse(res.data.reply);
    };

    // Open Street View
    const openStreetView = () => {
        // Replace with your plot's lat/long. Using static for demo.
        window.open(`https://www.google.com/maps?q&layer=c&cbll=21.2844,81.7213`, "_blank");
    };

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>

            {/* SIDEBAR */}
            <div style={{ width: '350px', background: '#1e293b', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ borderBottom: '1px solid #475569', paddingBottom: '10px' }}>🛰️ CSIDC Smart-Eye</h2>

                {/* Status Card */}
                <div style={{ background: '#334155', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h4>Live Status</h4>
                    <p>Total Plots: {plots?.features?.length |

| 0}</p>
                    <p style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠ Active Alerts: 1</p>
                </div>

                {/* AI Chatbot */}
                <div style={{ background: '#334155', padding: '15px', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4>🤖 AI Assistant</h4>
                    <div style={{ flex: 1, overflowY: 'auto', background: '#1e293b', padding: '10px', borderRadius: '5px', marginBottom: '10px', fontSize: '0.9em' }}>
                        {chatResponse}
                    </div>
                    <input
                        style={{ padding: '10px', borderRadius: '5px', border: 'none', marginBottom: '10px' }}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask: Draft a notice..."
                    />
                    <button onClick={handleChat} style={{ padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Ask Gemini
                    </button>
                </div>
            </div>

            {/* MAP AREA */}
            <div style={{ flex: 1 }}>
                <MapContainer center={[21.2844, 81.7213]} zoom={16} style={{ height: '100%', width: '100%' }}>
                    <LayersControl position="topright">

                        <LayersControl.BaseLayer checked name="Google Satellite">
                            <TileLayer url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" attribution="Google" />
                        </LayersControl.BaseLayer>

                        <LayersControl.BaseLayer name="ISRO Bhuvan (LULC)">
                            <TileLayer
                                url="https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms?service=WMS&request=GetMap&layers=lulc:BR_LULC50K_1112&format=image/png&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG:3857"
                                attribution="ISRO/NRSC"
                            />
                        </LayersControl.BaseLayer>

                    </LayersControl>

                    {/* Render Plots */}
                    {plots && <GeoJSON
                        data={plots}
                        style={(feature) => ({
                            color: feature.properties.status === 'Encroachment Detected' ? '#ef4444' : '#22c55e',
                            weight: 2,
                            fillOpacity: 0.4
                        })}
                        onEachFeature={(feature, layer) => {
                            layer.on('click', () => {
                                setSelectedPlot(feature.properties);
                                const popupContent = `
                  <div style="min-width:200px">
                    <h3>Plot ${feature.properties.plot_no}</h3>
                    <p><b>Owner:</b> ${feature.properties.owner}</p>
                    <p><b>Status:</b> ${feature.properties.status}</p>
                    ${feature.properties.status === 'Encroachment Detected' ? '<p style="color:red; font-weight:bold">⚠️ Violation Found</p>' : ''}
                    <button id="btn-sv" style="width:100%; padding:5px; margin-top:5px; background:#3b82f6; color:white; border:none; border-radius:3px; cursor:pointer;">🌍 Open Street View</button>
                  </div>
                `;
                                layer.bindPopup(popupContent).openPopup();

                                // Add event listener for the button inside popup
                                setTimeout(() => {
                                    const btn = document.getElementById('btn-sv');
                                    if (btn) btn.onclick = openStreetView;
                                }, 100);
                            });
                        }}
                    />}
                </MapContainer>
            </div>
        </div>
    );
}

export default App;