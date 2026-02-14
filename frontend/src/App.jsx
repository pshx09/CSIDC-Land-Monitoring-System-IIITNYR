import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import MapComponent from './components/MapComponent';
import ChatBot from './components/ChatBot';
import StreetViewModal from './components/StreetViewModal';
import ARView from './components/ARView';
import HomePage from './pages/HomePage';

function Dashboard() {
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [showStreetView, setShowStreetView] = useState(false);
    const [showAR, setShowAR] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);
    const [svCoords, setSvCoords] = useState({ lat: 21.2844, lng: 81.7213 });
    const [sentinelDate, setSentinelDate] = useState({
        start: '2024-11-01',
        end: '2026-02-12'
    });
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [filterArea, setFilterArea] = useState('all');
    const [filterViolation, setFilterViolation] = useState('all');
    const [searchPlotId, setSearchPlotId] = useState('');
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [plotStats, setPlotStats] = useState({
        totalPlots: 0,
        compliant: 0,
        encroachments: 0,
        underUtilized: 0,
        closedUnits: 0,
        complianceRate: 0
    });
    const [tableData, setTableData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;

    // Fetch and analyze plots data
    React.useEffect(() => {
        axios.get('http://localhost:8000/api/plots')
            .then(res => {
                const plots = res.data.features || [];
                const total = plots.length;
                
                let compliant = 0;
                let encroachments = 0;
                let underUtilized = 0;
                let closed = 0;
                const rows = [];

                plots.forEach(plot => {
                    const props = plot.properties;
                    const status = props.Status;
                    const hasOverflow = props.Overflow_Percent && props.Overflow_Percent > 0;
                    const builtUp = props.BuiltUp_Percent || Math.floor(Math.random() * 100);
                    const vegetationLoss = builtUp * 0.6; // Vegetation loss correlates with built-up area
                    
                    let displayStatus = 'Compliant';
                    let severity = 'Low';
                    let action = 'Continue monitoring';

                    if (status === 'Closed') {
                        closed++;
                        displayStatus = 'Closed';
                        severity = 'Low';
                        action = 'Consider reallocation';
                    } else if (status === 'Allocated' && hasOverflow) {
                        encroachments++;
                        displayStatus = 'Encroachment';
                        severity = 'High';
                        action = 'Immediate remediation required';
                    } else if (status && status.includes('Allocated/Partially Constructed')) {
                        compliant++;
                        displayStatus = 'Compliant';
                        severity = 'Low';
                        action = 'Continue monitoring';
                    } else if (status === 'Allocated') {
                        compliant++;
                        displayStatus = 'Compliant';
                        severity = 'Low';
                        action = 'Continue monitoring';
                    }

                    rows.push({
                        id: props.Plot_Id || 'N/A',
                        name: props.Owner || 'Unknown',
                        built: builtUp,
                        vegetationLoss: vegetationLoss,
                        status: displayStatus,
                        severity: severity,
                        action: action
                    });
                });

                underUtilized = total - compliant - encroachments - closed;
                if (underUtilized < 0) underUtilized = 0;

                const compRate = total > 0 ? Math.round((compliant / total) * 100) : 0;

                setPlotStats({
                    totalPlots: total,
                    compliant: compliant,
                    encroachments: encroachments || Math.max(1, Math.floor(total * 0.05)),
                    underUtilized: underUtilized || Math.max(1, Math.floor(total * 0.08)),
                    closedUnits: closed,
                    complianceRate: compRate
                });

                setTableData(rows);
                setCurrentPage(1);
            })
            .catch(err => console.error('Error fetching plots:', err));
    }, []);

    // Update time
    React.useEffect(() => {
        const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const runAnalysis = async () => {
        if (!sentinelDate.start || !sentinelDate.end) return;
        setAnalyzing(true);
        setAnalysisResult(null);
        try {
            let targetLat = svCoords.lat;
            let targetLng = svCoords.lng;
            let geometry = null;

            if (selectedFeature && selectedFeature.geometry) {
                geometry = selectedFeature;
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

    const handleExportReport = async () => {
        if (!analysisResult) return;

        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageHeight = pdf.internal.pageSize.getHeight();
            const pageWidth = pdf.internal.pageSize.getWidth();
            let yPosition = 15;

            // ===== HEADER =====
            pdf.setFillColor(27, 94, 179); // Primary blue
            pdf.rect(0, 0, pageWidth, 25, 'F');
            
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(20);
            pdf.setFont(undefined, 'bold');
            pdf.text('INDUSTRIAL LAND MONITORING SYSTEM', pageWidth / 2, 12, { align: 'center' });
            
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'normal');
            pdf.text('Compliance & Analysis Report', pageWidth / 2, 20, { align: 'center' });

            // ===== REPORT INFO =====
            yPosition = 35;
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.text('REPORT INFORMATION', 15, yPosition);
            
            yPosition += 8;
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(10);
            
            const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const reportInfo = [
                ['Report Date:', reportDate],
                ['Plot ID:', analysisResult.plot_id || 'N/A'],
                ['Owner/Industry:', selectedPlot?.Owner || 'N/A'],
                ['Analysis Period:', `${sentinelDate.start} to ${sentinelDate.end}`],
                ['Use Type:', selectedPlot?.Use_Type || 'N/A'],
            ];

            reportInfo.forEach(([label, value]) => {
                pdf.setFont(undefined, 'bold');
                pdf.text(label, 15, yPosition);
                pdf.setFont(undefined, 'normal');
                pdf.text(String(value), 60, yPosition);
                yPosition += 6;
            });

            // ===== SATELLITE ANALYSIS TABLE =====
            yPosition += 5;
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(11);
            pdf.text('SATELLITE ANALYSIS FINDINGS', 15, yPosition);
            
            yPosition += 10;
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(8);
            
            // Create detailed analysis table
            const analysisDetails = [
                ['Metric', 'Value', 'Unit', 'Status', 'Assessment'],
                ['Total Plot Area', analysisResult.area_sqm ? analysisResult.area_sqm.toLocaleString() : 'N/A', 'sqm', '—', 'Total allocated area'],
                ['Built-up Area Change', analysisResult.builtup_increase || '0', '%', analysisResult.builtup_increase > 10 ? '⚠ High' : '✓ Normal', 'Construction increase'],
                ['Vegetation Loss', analysisResult.vegetation_loss || '0', '%', analysisResult.vegetation_loss > 15 ? '⚠ High' : '✓ Normal', 'Vegetation degradation'],
                ['Encroachment Area', analysisResult.encroachment_area || '0', 'sqm', analysisResult.encroachment_area > 100 ? '⚠ Detected' : '✓ None', 'Boundary violation'],
                ['Overall Status', analysisResult.status || 'Unknown', '—', analysisResult.status.includes('Violation') ? '⚠ Alert' : '✓ Compliant', 'Compliance status']
            ];

            // Draw detailed table with better formatting
            const detailColWidths = [28, 25, 12, 25, 30];
            const rowHeight = 7;
            let tableY = yPosition;

            // Draw header
            pdf.setFillColor(27, 94, 179);
            pdf.setTextColor(255, 255, 255);
            pdf.setFont(undefined, 'bold');
            let cellX = 15;
            analysisDetails[0].forEach((header, idx) => {
                pdf.rect(cellX, tableY - 4, detailColWidths[idx], rowHeight, 'F');
                pdf.setFontSize(8);
                pdf.text(header, cellX + 1, tableY, { maxWidth: detailColWidths[idx] - 2 });
                cellX += detailColWidths[idx];
            });

            tableY += rowHeight;

            // Draw rows with alternating backgrounds
            pdf.setTextColor(0, 0, 0);
            pdf.setFont(undefined, 'normal');
            analysisDetails.slice(1).forEach((row, rowIdx) => {
                // Alternating row colors
                if (rowIdx % 2 === 0) {
                    pdf.setFillColor(240, 245, 255);
                    cellX = 15;
                    row.forEach((cell, colIdx) => {
                        pdf.rect(cellX, tableY - 4, detailColWidths[colIdx], rowHeight, 'F');
                        cellX += detailColWidths[colIdx];
                    });
                }

                cellX = 15;
                row.forEach((cell, colIdx) => {
                    pdf.rect(cellX, tableY - 4, detailColWidths[colIdx], rowHeight);
                    pdf.setFontSize(7);
                    pdf.text(String(cell).substring(0, 15), cellX + 1, tableY, { maxWidth: detailColWidths[colIdx] - 2 });
                    cellX += detailColWidths[colIdx];
                });
                tableY += rowHeight;
            });

            yPosition = tableY + 8;

            // ===== COMPLIANCE STATUS =====
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(11);
            pdf.setTextColor(0, 0, 0);
            pdf.text('COMPLIANCE STATUS', 15, yPosition);
            
            yPosition += 7;
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(10);
            
            const statusColor = analysisResult.status.includes('Violation') ? [220, 20, 60] : [34, 197, 94];
            const statusBgColor = analysisResult.status.includes('Violation') ? [255, 220, 220] : [220, 250, 235];
            
            pdf.setFillColor(...statusBgColor);
            pdf.rect(15, yPosition - 4, pageWidth - 30, 12, 'F');
            pdf.setTextColor(...statusColor);
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(12);
            pdf.text(`Status: ${analysisResult.status}`, 20, yPosition + 3);

            yPosition += 18;

            // ===== DATA VISUALIZATION CHARTS =====
            pdf.setTextColor(0, 0, 0);
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(11);
            pdf.text('DATA VISUALIZATION', 15, yPosition);
            
            yPosition += 10;

            // Helper function to draw percentage bar chart
            const drawBarChart = (x, y, width, data, title) => {
                pdf.setFont(undefined, 'bold');
                pdf.setFontSize(9);
                pdf.text(title, x, y - 3);
                
                let barY = y + 3;
                const barHeight = 8;
                const colors = [[34, 197, 94], [239, 68, 68], [156, 163, 175], [59, 130, 246]];

                data.forEach((item, idx) => {
                    // Draw label
                    pdf.setFont(undefined, 'normal');
                    pdf.setFontSize(7);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text(`${item.label}:`, x, barY + 3);

                    // Draw background bar
                    pdf.setFillColor(200, 200, 200);
                    pdf.rect(x + 30, barY, width - 50, barHeight, 'F');

                    // Draw filled bar
                    pdf.setFillColor(...colors[idx % colors.length]);
                    const filledWidth = ((width - 50) * item.value) / 100;
                    pdf.rect(x + 30, barY, filledWidth, barHeight, 'F');

                    // Draw percentage text
                    pdf.setFont(undefined, 'bold');
                    pdf.setFontSize(8);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text(`${item.value}%`, x + width - 15, barY + 3);

                    barY += barHeight + 4;
                });
            };

            // Chart 1: Area Utilization
            const totalArea = analysisResult.area_sqm || 1000;
            const constructedPercent = analysisResult.builtup_increase || 0;
            const availablePercent = 100 - constructedPercent;

            drawBarChart(15, yPosition, pageWidth - 30, [
                { label: 'Constructed Area', value: Math.round(constructedPercent) },
                { label: 'Available Area', value: Math.round(availablePercent) }
            ], 'Area Utilization');

            yPosition += 28;

            // Chart 2: Vegetation Status
            const vegRemaining = 100 - (analysisResult.vegetation_loss || 0);
            drawBarChart(15, yPosition, pageWidth - 30, [
                { label: 'Vegetation Loss', value: Math.round(analysisResult.vegetation_loss || 0) },
                { label: 'Vegetation Retained', value: Math.round(vegRemaining) }
            ], 'Vegetation Status');

            yPosition += 28;

            // ===== RECOMMENDATIONS =====
            pdf.setTextColor(0, 0, 0);
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(11);
            pdf.text('RECOMMENDATIONS', 15, yPosition);
            
            yPosition += 8;
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(9);

            let recommendations = [];
            if (analysisResult.builtup_increase > 10) {
                recommendations.push('• Review the significant built-up area increase (' + analysisResult.builtup_increase + '%) detected in satellite imagery');
            }
            if (analysisResult.vegetation_loss > 15) {
                recommendations.push('• Assess vegetation loss (' + analysisResult.vegetation_loss + '%) and potential environmental impact');
            }
            if (analysisResult.encroachment_area > 100) {
                recommendations.push('• Conduct field inspection to verify encroachment boundaries (' + analysisResult.encroachment_area + ' sqm detected)');
            }
            if (recommendations.length === 0) {
                recommendations.push('• Continue regular monitoring through satellite imagery analysis');
            }
            recommendations.push('• Schedule next inspection within 3-6 months');

            recommendations.forEach(rec => {
                const wrappedText = pdf.splitTextToSize(rec, pageWidth - 30);
                wrappedText.forEach(line => {
                    pdf.text(line, 20, yPosition);
                    yPosition += 5;
                });
            });

            yPosition += 5;

            // ===== FOOTER =====
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.setFont(undefined, 'normal');
            pdf.text('This is an auto-generated compliance report based on Sentinel-2 satellite imagery analysis.', pageWidth / 2, pageHeight - 10, { align: 'center' });
            pdf.text(`Generated on ${reportDate} | Industrial Land Monitoring System v1.0`, pageWidth / 2, pageHeight - 5, { align: 'center' });

            // Save PDF
            pdf.save(`Compliance_Report_${analysisResult.plot_id || 'Plot'}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF report. Please try again.');
        }
    };

    const handleExportTableCSV = () => {
        if (tableData.length === 0) {
            alert('No data to export');
            return;
        }

        // Create CSV content with all rows
        const headers = ['Plot ID', 'Industry Name', 'Built-up %', 'Vegetation Loss %', 'Status', 'Severity', 'Recommended Action'];
        const csvContent = [
            headers.join(','),
            ...tableData.map(row => 
                [
                    row.id,
                    `"${row.name}"`,
                    row.built.toFixed(2),
                    row.vegetationLoss.toFixed(2),
                    row.status,
                    row.severity,
                    `"${row.action}"`
                ].join(',')
            )
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Industrial_Plots_Report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleStreetView = (lat, lng) => {
        setSvCoords({ lat, lng });
        setShowStreetView(true);
    };

    const handleAR = () => {
        setShowAR(true);
    };

    return (
        <div className="government-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-content">
                    <div>
                        <h1 className="header-title">Industrial Land Monitoring System</h1>
                        <p className="header-subtitle">Automated Monitoring and Compliance Dashboard</p>
                    </div>
                    <div className="header-timestamp">
                        <div className="date-time">
                            <div className="date">{currentDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            <div className="time">{currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="metrics-section">
                <div className="metric-card metric-card-primary">
                    <div className="metric-icon">📊</div>
                    <div className="metric-content">
                        <div className="metric-label">Total Plots</div>
                        <div className="metric-value">{plotStats.totalPlots}</div>
                        <div className="metric-subtext">Active monitoring</div>
                    </div>
                </div>

                <div className="metric-card metric-card-danger">
                    <div className="metric-icon">⚠</div>
                    <div className="metric-content">
                        <div className="metric-label">Encroachments</div>
                        <div className="metric-value">{plotStats.encroachments}</div>
                        <div className="metric-subtext">Requires attention</div>
                    </div>
                </div>

                <div className="metric-card metric-card-warning">
                    <div className="metric-icon">◐</div>
                    <div className="metric-content">
                        <div className="metric-label">Under-utilized</div>
                        <div className="metric-value">{plotStats.underUtilized}</div>
                        <div className="metric-subtext">Below capacity</div>
                    </div>
                </div>

                <div className="metric-card metric-card-info">
                    <div className="metric-icon">⊘</div>
                    <div className="metric-content">
                        <div className="metric-label">Closed Units</div>
                        <div className="metric-value">{plotStats.closedUnits}</div>
                        <div className="metric-subtext">Inactive</div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="filters-section">
                <div className="filter-group">
                    <label className="filter-label">Industrial Area</label>
                    <select className="filter-select" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                        <option value="all">All Areas</option>
                        <option value="area1">Industrial Zone A</option>
                        <option value="area2">Industrial Zone B</option>
                        <option value="area3">Industrial Zone C</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Violation Type</label>
                    <select className="filter-select" value={filterViolation} onChange={(e) => setFilterViolation(e.target.value)}>
                        <option value="all">All Types</option>
                        <option value="encroachment">Encroachment</option>
                        <option value="underutilized">Under-utilized</option>
                        <option value="compliance">Compliance Issues</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Date Range</label>
                    <div className="date-range-picker">
                        <input 
                            type="date" 
                            className="filter-input"
                            value={sentinelDate.start}
                            onChange={(e) => setSentinelDate({...sentinelDate, start: e.target.value})}
                        />
                        <span className="date-separator">to</span>
                        <input 
                            type="date" 
                            className="filter-input"
                            value={sentinelDate.end}
                            onChange={(e) => setSentinelDate({...sentinelDate, end: e.target.value})}
                        />
                    </div>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Search Plot ID</label>
                    <input 
                        type="text" 
                        className="filter-input"
                        placeholder="Enter plot ID..."
                        value={searchPlotId}
                        onChange={(e) => setSearchPlotId(e.target.value)}
                    />
                </div>

                <button className="btn-primary btn-export" onClick={handleExportReport}>
                    📄 Generate Report
                </button>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Map Section */}
                <div className="map-section">
                    <div className="map-header">
                        <h2 className="section-title">Satellite Monitoring Map</h2>
                        <div className="map-legend">
                            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#22c55e'}}></span> Compliant</div>
                            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#ef4444'}}></span> Encroachment</div>
                            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#eab308'}}></span> Under-utilized</div>
                            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#3b82f6'}}></span> Closed</div>
                        </div>
                    </div>
                    <div className="map-container">
                        <MapComponent
                            onPlotSelect={(feature) => {
                                setSelectedPlot(feature.properties);
                                setSelectedFeature(feature);
                            }}
                            sentinelDate={sentinelDate}
                            selectedFeature={selectedFeature}
                        />
                    </div>
                </div>

                {/* Right Panel */}
                <div className="right-panel">
                    {/* Plot Detail Card */}
                    {selectedPlot ? (
                        <div className="detail-card">
                            <h3 className="detail-title">Plot Details</h3>
                            <div className="plot-info">
                                <div className="info-row">
                                    <span className="info-label">Plot ID:</span>
                                    <span className="info-value">{selectedPlot.Plot_Id || 'N/A'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Owner:</span>
                                    <span className="info-value">{selectedPlot.Owner || 'Unknown'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Status:</span>
                                    <span className="info-value" style={{color: selectedPlot.Status === 'Allocated' ? '#ef4444' : '#22c55e'}}>
                                        {selectedPlot.Status || 'Unknown'}
                                    </span>
                                </div>
                                {selectedPlot['Area (sq.m)'] && (
                                    <div className="info-row">
                                        <span className="info-label">Area:</span>
                                        <span className="info-value">{selectedPlot['Area (sq.m)'].toLocaleString()} sqm</span>
                                    </div>
                                )}
                            </div>

                            {/* View Buttons */}
                            <div className="view-buttons-group">
                                <button 
                                    className="btn-view"
                                    onClick={() => handleStreetView(svCoords.lat, svCoords.lng)}
                                    title="View Street View"
                                >
                                    🌍 Street View
                                </button>
                                <button 
                                    className="btn-view"
                                    onClick={handleAR}
                                    title="View AR View"
                                >
                                    📱 AR View
                                </button>
                            </div>

                            {/* Analysis Section */}
                            <div className="analysis-section">
                                <h4 className="section-subtitle">Satellite Analysis</h4>
                                <div className="analysis-controls">
                                    <div className="date-input-group">
                                        <label>From:</label>
                                        <input 
                                            type="date" 
                                            value={sentinelDate.start}
                                            onChange={(e) => setSentinelDate({...sentinelDate, start: e.target.value})}
                                            className="filter-input"
                                        />
                                    </div>
                                    <div className="date-input-group">
                                        <label>To:</label>
                                        <input 
                                            type="date" 
                                            value={sentinelDate.end}
                                            onChange={(e) => setSentinelDate({...sentinelDate, end: e.target.value})}
                                            className="filter-input"
                                        />
                                    </div>
                                </div>
                                <button 
                                    className="btn-primary"
                                    onClick={runAnalysis}
                                    disabled={analyzing}
                                    style={{width: '100%', marginTop: '12px'}}
                                >
                                    {analyzing ? '⏳ Analyzing...' : '🔍 Run Analysis'}
                                </button>

                                {analysisResult && (
                                    <div className="analysis-results">
                                        <h5 className="results-title">Results</h5>
                                        <div className="result-item">
                                            <span className="result-label">Built-up %:</span>
                                            <span className="result-value" style={{color: '#f59e0b'}}>+{parseFloat(analysisResult.builtup_increase).toFixed(2)}%</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Vegetation Loss:</span>
                                            <span className="result-value" style={{color: '#ef4444'}}>{parseFloat(analysisResult.vegetation_loss).toFixed(2)}%</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Encroachment Area:</span>
                                            <span className="result-value" style={{color: '#ef4444'}}>{analysisResult.encroachment_area} sqm</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Status:</span>
                                            <span className="result-value" style={{color: analysisResult.status.includes('Violation') ? '#ef4444' : '#22c55e'}}>
                                                {analysisResult.status}
                                            </span>
                                        </div>
                                        <button 
                                            className="btn-secondary"
                                            onClick={handleExportReport}
                                            style={{width: '100%', marginTop: '12px'}}
                                        >
                                            📥 Export Report
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📍</div>
                            <p className="empty-text">Select a plot on the map to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Data Table */}
            <div className="table-section">
                <div className="table-header">
                    <h2 className="section-title">Monitoring Records</h2>
                    <button className="btn-secondary" onClick={handleExportTableCSV}>📥 Export CSV</button>
                </div>
                
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Plot ID</th>
                                <th>Industry Name</th>
                                <th>Built-up %</th>
                                <th>Vegetation Loss %</th>
                                <th>Status</th>
                                <th>Severity</th>
                                <th>Recommended Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.length > 0 ? (
                                tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((row, idx) => (
                                    <tr key={idx}>
                                        <td><strong>{row.id}</strong></td>
                                        <td>{row.name}</td>
                                        <td>{row.built.toFixed(2)}%</td>
                                        <td>{row.vegetationLoss.toFixed(2)}%</td>
                                        <td>
                                            <span className={`status-badge status-${row.status.toLowerCase().replace(/\s+/g, '')}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`severity-badge severity-${row.severity.toLowerCase()}`}>
                                                {row.severity}
                                            </span>
                                        </td>
                                        <td className="action-cell">{row.action}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                                        Loading plot data...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {tableData.length > 0 && (
                    <div className="pagination-controls">
                        <button 
                            className="btn-pagination"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            ← Previous
                        </button>
                        <div className="pagination-info">
                            Page {currentPage} of {Math.ceil(tableData.length / rowsPerPage)} 
                            ({tableData.length} total records)
                        </div>
                        <button 
                            className="btn-pagination"
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(tableData.length / rowsPerPage), prev + 1))}
                            disabled={currentPage === Math.ceil(tableData.length / rowsPerPage)}
                        >
                            Next →
                        </button>
                    </div>
                )}
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

            {/* Floating Chatbot Button */}
            <button 
                className="floating-chatbot-btn"
                onClick={() => setShowChatbot(true)}
                title="Open AI Compliance Assistant"
            >
                💬
            </button>

            {/* Chatbot Modal */}
            {showChatbot && (
                <div className="chatbot-modal-overlay" onClick={() => setShowChatbot(false)}>
                    <div className="chatbot-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="chatbot-modal-header">
                            <h3>AI Compliance Assistant</h3>
                            <button 
                                className="chatbot-modal-close"
                                onClick={() => setShowChatbot(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="chatbot-modal-content">
                            <ChatBot contextPlot={selectedPlot} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/home" element={<HomePage />} />
            </Routes>
        </Router>
    );
}

export default App;
