import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import MapComponent from './components/MapComponent';
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
                geometry = selectedFeature; // Send full feature or geometry
            }

            const res = await axios.post('http://localhost:8000/api/sentinel/advanced-analysis', {
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

    const handleExportReport = () => {
        if (!analysisResult) return;

        const reportContent = `
            CSIDC LAND MONITORING REPORT
            ----------------------------
            Date: ${new Date().toLocaleDateString()}
            Plot ID: ${analysisResult.plot_id || 'N/A'}
            Owner: ${selectedPlot?.Owner || 'N/A'}
            
            Analysis Period: ${sentinelDate.start} to ${sentinelDate.end}
            
            FINDINGS:
            - Plot Area: ${analysisResult.area_sqm ? analysisResult.area_sqm.toLocaleString() : 'N/A'} sqm
            - Vegetation Loss: ${analysisResult.vegetation_loss}%
            - Built-up Increase: ${analysisResult.builtup_increase}%
            
            ENCROACHMENT STATUS: ${analysisResult.status}
            - Encroachment Area: ${analysisResult.encroachment_area} sqm
            
            This is an auto-generated report based on Sentinel-2 satellite imagery analysis.
        `;

        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_Plot_${analysisResult.plot_id || 'Unk'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
                    <h1 style={{ background: 'linear-gradient(135deg, #60a5fa, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        <span style={{ fontSize: '2rem' }}>🛰️</span>
                        CSIDC Smart-Eye
                    </h1>
                    <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>Industrial Land Monitoring System</p>
                </div>

                {/* Live Status Card */}
                <div className="card status-card" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))', borderLeft: '4px solid #22c55e' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: 12, height: 12, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e', animation: 'pulse 2s infinite' }}></div>
                        <h3 style={{ margin: 0, color: '#22c55e', fontWeight: 'bold' }}>SYSTEM ONLINE</h3>
                    </div>

                    <div className="stat-row">
                        <span>Detected Encroachments:</span>
                        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                            <ShieldAlert size={16} /> 1 Critical
                        </span>
                    </div>
                </div>

                {/* Chat Interface */}
                <h3 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>💬 AI Legal Assistant</h3>
                <div style={{ flex: '0 1 200px', marginBottom: '1rem' }}>
                    <ChatBot contextPlot={selectedPlot} />
                </div>

                {/* Sentinel Controls */}
                <div className="card" style={{ marginTop: '1rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', borderLeft: '4px solid #3b82f6' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '10px', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>🛰️ Sentinel Layer</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '500', color: '#cbd5e1' }}>📅 Start Date:</label>
                        <input
                            type="date"
                            value={sentinelDate.start}
                            onChange={(e) => setSentinelDate(prev => ({ ...prev, start: e.target.value }))}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}
                        />
                        <label style={{ fontSize: '0.8rem', fontWeight: '500', color: '#cbd5e1' }}>📅 End Date:</label>
                        <input
                            type="date"
                            value={sentinelDate.end}
                            onChange={(e) => setSentinelDate(prev => ({ ...prev, end: e.target.value }))}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#f8fafc', fontSize: '0.9rem', cursor: 'pointer' }}
                        />

                        <button
                            onClick={runAnalysis}
                            disabled={analyzing}
                            style={{
                                marginTop: '12px',
                                padding: '10px 14px',
                                background: analyzing ? '#64748b' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: analyzing ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                transition: 'all 0.3s',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}
                        >
                            {analyzing ? "⏳ Analyzing..." : "🔍 Run Analysis"}
                        </button>

                        {analysisResult && (
                            <div className="analysis-result" style={{
                                marginTop: '12px',
                                padding: '12px',
                                background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.05), rgba(100, 116, 139, 0.05))',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                border: '1px solid #475569'
                            }}>
                                <p style={{ margin: '6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>🏗️ Built-up:</span> <strong style={{ color: '#fbbf24' }}>+{analysisResult.builtup_increase}%</strong></p>
                                <p style={{ margin: '6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>🌱 Veg Loss:</span> <strong style={{ color: '#ef4444' }}>{analysisResult.vegetation_loss}%</strong></p>
                                <p style={{ margin: '6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>⚠️ Encroach:</span> <strong style={{ color: '#f87171' }}>{analysisResult.encroachment_area} sqm</strong></p>
                                <p style={{ margin: '6px 0', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>✓ Status:</span> <span style={{ color: analysisResult.status.includes('Violation') ? '#ef4444' : '#22c55e' }}>{analysisResult.status}</span></p>

                                <button
                                    onClick={handleExportReport}
                                    style={{
                                        width: '100%',
                                        marginTop: '8px',
                                        padding: '6px',
                                        background: '#334155',
                                        color: '#e2e8f0',
                                        border: '1px solid #475569',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    📄 Export Report
                                </button>
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
