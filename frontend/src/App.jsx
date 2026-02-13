import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import { MapComponent } from './components/MapComponent';
import ChatBot from './components/ChatBot';
import StreetViewModal from './components/StreetViewModal';
import ARView from './components/ARView';
import { ShieldAlert } from 'lucide-react';
import HomePage from './pages/HomePage';

function Dashboard() {
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null); // Store full feature (geometry)
    const [showStreetView, setShowStreetView] = useState(false);
    const [showAR, setShowAR] = useState(false);
    const [svCoords, setSvCoords] = useState({ lat: 21.2844, lng: 81.7213 });

    // SentinelHub Date State
    // SentinelHub Date State
    const [sentinelDate, setSentinelDate] = useState({
        start: '2024-11-01',
        end: '2026-02-12'
    });

    // Analysis State
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);

    const runAnalysis = async () => {
        if (!sentinelDate.start || !sentinelDate.end) return;
        setAnalyzing(true);
        setAnalysisResult(null);
        try {
            // Use current center or selected plot center. For now, using center of map or fixed area. 
            // Ideally should analyze *selected plot*.
            // If no plot selected, analyze current svCoords (which is camera center roughly or last click).
            // Let's use svCoords as "target location" for analysis.
            let targetLat = svCoords.lat;
            let targetLng = svCoords.lng;
            let geometry = null;

            // If plot selected, use plot geometry.
            if (selectedFeature && selectedFeature.geometry) {
                geometry = selectedFeature.geometry;
            }

            const res = await axios.post('http://localhost:8000/api/sentinel/ndbi-analysis', {
                lat: targetLat,
                lng: targetLng,
                start_date: sentinelDate.start,
                end_date: sentinelDate.end,
                geometry: geometry
            });

            if (res.data.error) {
                alert(res.data.error);
            } else {
                setAnalysisResult(res.data);
            }
        } catch (e) {
            console.error(e);
            alert("Analysis failed.");
        }
        setAnalyzing(false);
    };

    // Handler passed to map
    const handleStreetView = (lat, lng) => {
        setSvCoords({ lat, lng });
        setShowStreetView(true);
    };

    const handleAR = () => {
        setShowAR(true);
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="header">
                    <h1>
                        <span style={{ fontSize: '2rem' }}>🛰️</span>
                        CSIDC Smart-Eye
                    </h1>
                    <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>Industrial Land Monitoring System</p>
                </div>

                {/* Live Status Card */}
                <div className="card status-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: 10, height: 10, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 5px #22c55e' }}></div>
                        <h3>SYSTEM ONLINE</h3>
                    </div>

                    <div className="stat-row">
                        <span>Detected Encroachments:</span>
                        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <ShieldAlert size={16} /> 1 Critical
                        </span>
                    </div>
                </div>

                {/* Chat Interface */}
                <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>AI LEGAL ASSISTANT</h3>
                <ChatBot contextPlot={selectedPlot} />

                {/* Sentinel Controls */}
                <div className="card" style={{ marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>🛰️ SENTINEL LAYER</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.8rem' }}>Start Date:</label>
                        <input
                            type="date"
                            value={sentinelDate.start}
                            onChange={(e) => setSentinelDate(prev => ({ ...prev, start: e.target.value }))}
                            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <label style={{ fontSize: '0.8rem' }}>End Date:</label>
                        <input
                            type="date"
                            value={sentinelDate.end}
                            onChange={(e) => setSentinelDate(prev => ({ ...prev, end: e.target.value }))}
                            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />

                        <button
                            onClick={runAnalysis}
                            disabled={analyzing}
                            style={{
                                marginTop: '10px',
                                padding: '8px',
                                background: analyzing ? '#94a3b8' : '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {analyzing ? "Analyzing..." : "🔍 Run NDBI Analysis"}
                        </button>

                        {analysisResult && (
                            <div className="analysis-result" style={{
                                marginTop: '10px',
                                padding: '10px',
                                background: '#f1f5f9',
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                            }}>
                                <p style={{ margin: '5px 0' }}>🏗️ Built-up: <strong>+{analysisResult.builtup_increase_percent}%</strong></p>
                                <p style={{ margin: '5px 0' }}>🌱 Veg Loss: <strong style={{ color: '#ef4444' }}>{analysisResult.vegetation_loss_percent}%</strong></p>
                                <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Status: {analysisResult.status}</p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>{analysisResult.details}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Map */}
            <div className="map-container">
                <MapComponent
                    onPlotSelect={(feature) => {
                        setSelectedPlot(feature.properties);
                        setSelectedFeature(feature);
                    }}
                    onOpenStreetView={handleStreetView}
                    onOpenAR={handleAR}
                    sentinelDate={sentinelDate}
                />
            </div>

            {/* Modals */}
            <StreetViewModal
                isOpen={showStreetView}
                onClose={() => setShowStreetView(false)}
                lat={svCoords.lat}
                lng={svCoords.lng}
            />

            <ARView
                isOpen={showAR}
                onClose={() => setShowAR(false)}
                plot={selectedPlot}
            />
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
}

export default App;
