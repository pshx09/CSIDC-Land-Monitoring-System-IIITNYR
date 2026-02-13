import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Box } from 'lucide-react';

const ARView = ({ isOpen, onClose, plot }) => {
    const videoRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let stream = null;

        if (isOpen) {
            navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            })
                .then((s) => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch((err) => {
                    console.error("Error accessing camera:", err);
                    setError("Could not access camera. Ensure permissions are granted and you are on localhost or HTTPS.");
                });
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px', height: '80vh', background: '#000', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '10px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                    <h3 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>AR Inspection Mode</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
                </div>

                {/* Live Camera Feed */}
                <div style={{ flex: 1, position: 'relative', background: 'black' }}>
                    {error ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red', padding: '20px', textAlign: 'center' }}>
                            {error}
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}

                    {/* AR Overlay - Mocking a Digital Boundary */}
                    {plot && !error && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '80%',
                            height: '40%',
                            border: `4px dashed ${plot.status === 'Encroachment Detected' ? 'red' : '#22c55e'}`,
                            borderRadius: '10px',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            background: 'rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                    <Box size={24} color="#60a5fa" />
                                    <h3 style={{ margin: 0, color: 'white' }}>AVG Plot Boundary</h3>
                                </div>
                                <p style={{ color: 'white', margin: '5px 0' }}>Plot No: {plot.plot_no}</p>
                                <p style={{ color: plot.status === 'Encroachment Detected' ? '#ef4444' : '#22c55e', fontWeight: 'bold', margin: 0 }}>
                                    {plot.status.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: '15px', background: '#1e293b', color: 'white', textAlign: 'center', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
                        <Camera size={16} />
                        <span>Align the dashed box with the physical land boundaries.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ARView;
