import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'antd/dist/reset.css';
import './App.css';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DatePicker, Skeleton } from 'antd';
import dayjs from 'dayjs';
import MapComponent from './components/MapComponent';
import ChatBot from './components/ChatBot';
import StreetViewModal from './components/StreetViewModal';
import ARView from './components/ARView';
import PieChart from './components/PieChart';
import MonitoringRecordsVisualization from './components/MonitoringRecordsVisualization';
import HomePage from './pages/HomePage';
import CSIDCLogo from './images/CSIDClogo.jpeg';
import vishnuDeoSai from './images/Shri-Vishnu-Deo-Sai.webp';
import lakhanLalDewangan from './images/Shri_Lakhan_Lal_Dewangan-e1744784449713.webp';
import rajeevAgrawal from './images/Shri-Rajeev-Agrawal-1.webp';

// Utility function to calculate polygon area from coordinates (in square meters)
// Using Haversine formula for approximate area calculation
const calculatePolygonArea = (coordinates) => {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
        return 0;
    }
    
    const R = 6371000; // Earth's radius in meters
    let area = 0;
    
    for (let i = 0; i < coordinates.length - 1; i++) {
        const p1 = coordinates[i];
        const p2 = coordinates[i + 1];
        
        const lat1 = (p1[1] * Math.PI) / 180;
        const lat2 = (p2[1] * Math.PI) / 180;
        const lon1 = (p1[0] * Math.PI) / 180;
        const lon2 = (p2[0] * Math.PI) / 180;
        
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        
        const term1 = Math.sin(dLat / 2) * Math.cos(lat1);
        const term2 = Math.sin(dLon / 2) * Math.cos((lat1 + lat2) / 2);
        
        area += Math.abs(term1 * term2) * R * R / 2;
    }
    
    return Math.round(area);
};

function Dashboard() {
    const [selectedPlot, setSelectedPlot] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [showStreetView, setShowStreetView] = useState(false);
    const [showAR, setShowAR] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);
    const [showDroneForm, setShowDroneForm] = useState(false);
    const [showVisitForm, setShowVisitForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [droneFormData, setDroneFormData] = useState({
        inspectionDate: '',
        inspectionTime: '',
        remarks: ''
    });
    const [visitFormData, setVisitFormData] = useState({
        inspectionDate: '',
        inspectionTime: '',
        purpose: ''
    });
    const [svCoords, setSvCoords] = useState({ lat: 21.2844, lng: 81.7213 });
    const [sentinelDate, setSentinelDate] = useState({
        start: '2024-11-01',
        end: '2026-02-12'
    });
    const [chatbotDimensions, setChatbotDimensions] = useState({ width: 420, height: 600 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
    const chatbotModalRef = React.useRef(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [filterArea, setFilterArea] = useState('all');
    const [filterViolation, setFilterViolation] = useState('all');
    const [searchPlotId, setSearchPlotId] = useState('');
    const [filterLatitude, setFilterLatitude] = useState('');
    const [filterLongitude, setFilterLongitude] = useState('');
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

    const handleResizeStart = (e) => {
        setIsResizing(true);
        setResizeStart({ x: e.clientX, y: e.clientY });
    };

    React.useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e) => {
            const deltaX = e.clientX - resizeStart.x;
            const deltaY = e.clientY - resizeStart.y;

            setChatbotDimensions(prev => ({
                width: Math.max(280, prev.width + deltaX),
                height: Math.max(300, prev.height + deltaY)
            }));

            setResizeStart({ x: e.clientX, y: e.clientY });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, resizeStart]);

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

                    // Generate last inspection date (mock data - can be replaced with actual field from backend)
                    const lastInspectionDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
                    
                    rows.push({
                        id: props.Plot_Id || 'N/A',
                        name: props.Owner || 'Unknown',
                        built: builtUp,
                        lastInspection: lastInspectionDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
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
                
                // Add delay before hiding skeleton
                setTimeout(() => {
                    setIsLoading(false);
                }, 800);
            })
            .catch(err => {
                console.error('Error fetching plots:', err);
                setTimeout(() => {
                    setIsLoading(false);
                }, 800);
            });
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
            let allocatedArea = selectedPlot?.['Area (sq.m)'] || null;

            if (selectedFeature && selectedFeature.geometry) {
                geometry = selectedFeature;
            }

            const res = await axios.post('http://localhost:8000/api/sentinel/advanced-analysis', {
                lat: targetLat,
                lng: targetLng,
                start_date: sentinelDate.start,
                end_date: sentinelDate.end,
                geometry: geometry,
                allocated_area_sqm: allocatedArea
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
            let yPosition = 40;

            // ===== HEADER WITH LOGO =====
            pdf.setFillColor(27, 94, 179); // Primary blue
            pdf.rect(0, 0, pageWidth, 36, 'F');
            
            // Load and add CSIDC logo
            try {
                const logoDataUrl = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/jpeg'));
                    };
                    img.onerror = reject;
                    img.src = CSIDCLogo;
                });
                pdf.addImage(logoDataUrl, 'JPEG', 12, 5, 14, 14);
            } catch (e) {
                console.error('Could not load logo:', e);
            }

            // Add organization text
            pdf.setTextColor(255, 255, 255);
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(16);
            pdf.text('Chhattisgarh State Industrial Development Corporation', pageWidth / 2, 13, { align: 'center' });
            
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(12);
            pdf.text('(A Govt. of Chhattisgarh Undertaking)', pageWidth / 2, 19, { align: 'center' });

            // ===== REPORT INFO =====
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
            ];

            reportInfo.forEach(([label, value]) => {
                pdf.setFont(undefined, 'bold');
                pdf.text(label, 15, yPosition);
                pdf.setFont(undefined, 'normal');
                pdf.text(String(value), 60, yPosition);
                yPosition += 6;
            });

            // ===== ANALYSIS DETAILS TABLE =====
            yPosition += 8;
            pdf.setTextColor(0, 0, 0);
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(11);
            pdf.text('ANALYSIS DETAILS', 15, yPosition);
            
            yPosition += 10;

            // Calculate table data
            const allottedArea = selectedPlot?.['Area (sq.m)'] || analysisResult.area_sqm || 1000;
            const builtupArea = analysisResult.builtup_area_sqm || 0;
            const builtupPercent = analysisResult.builtup_increase || 0;
            const encroachmentArea = analysisResult.encroachment_area || 0;
            const encroachmentPercent = analysisResult?.encroachment_percent || ((encroachmentArea / allottedArea) * 100).toFixed(2);
            const vegetationLoss = analysisResult.vegetation_loss || 0;
            const overallStatus = analysisResult.status || 'Unknown';

            // Table data
            const tableData = [
                ['Metric', 'Value'],
                ['Total Allotted Area', `${allottedArea.toLocaleString()} sqm`],
                ['Built-up Area', `${builtupArea.toLocaleString()} sqm`],
                ['Built-up %', `${parseFloat(builtupPercent).toFixed(2)}%`],
                ['Encroachment Area', `${encroachmentArea.toLocaleString()} sqm`],
                ['Encroachment %', `${parseFloat(encroachmentPercent).toFixed(2)}%`],
                ['Vegetation Loss', `${parseFloat(vegetationLoss).toFixed(2)}%`],
                ['Overall Status', overallStatus]
            ];

            // Table styling
            const tableColWidths = [50, 75];
            const tableRowHeight = 7;
            let tableX = 20;
            let tableY = yPosition;

            // Draw header row
            pdf.setFillColor(27, 94, 179);
            pdf.setTextColor(255, 255, 255);
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(9);
            
            tableData[0].forEach((header, idx) => {
                pdf.rect(tableX, tableY - 4, tableColWidths[idx], tableRowHeight, 'F');
                pdf.setDrawColor(0, 0, 0);
                pdf.rect(tableX, tableY - 4, tableColWidths[idx], tableRowHeight);
                pdf.text(header, tableX + 2, tableY + 1);
                tableX += tableColWidths[idx];
            });

            tableY += tableRowHeight;
            tableX = 20;

            // Draw data rows with alternating colors
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(0, 0, 0);

            tableData.slice(1).forEach((row, rowIdx) => {
                // Alternating row background
                if (rowIdx % 2 === 0) {
                    pdf.setFillColor(240, 245, 255);
                    pdf.rect(tableX, tableY - 4, tableColWidths[0] + tableColWidths[1], tableRowHeight, 'F');
                }

                // Draw cell borders
                tableX = 20;
                row.forEach((cell, colIdx) => {
                    pdf.setDrawColor(0, 0, 0);
                    pdf.rect(tableX, tableY - 4, tableColWidths[colIdx], tableRowHeight);
                    pdf.text(String(cell).substring(0, 25), tableX + 2, tableY + 1);
                    tableX += tableColWidths[colIdx];
                });
                
                tableY += tableRowHeight;
            });

            yPosition = tableY + 8;

            // ===== COMPLIANCE STATUS =====
            pdf.setTextColor(0, 0, 0);
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(11);
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

            // ===== AREA VISUALIZATION CHART =====
            pdf.setTextColor(0, 0, 0);
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(11);
            pdf.text('AREA ANALYSIS', 15, yPosition);
            
            yPosition += 10;

            // Calculate additional area data for chart
            const availableArea = Math.max(0, allottedArea - encroachmentArea);
            
            // Draw bar chart for areas
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(9);
            
            const chartX = 15;
            const chartWidth = pageWidth - 30;
            const maxArea = Math.max(allottedArea, encroachmentArea * 2);
            const barHeight = 12;
            const barSpacing = 20;
            
            let chartY = yPosition;
            
            // Bar 1: Allotted Area
            pdf.setTextColor(0, 0, 0);
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(8);
            pdf.text('Allotted Area:', chartX, chartY + 4);
            
            const allottedBarWidth = (allottedArea / maxArea) * (chartWidth - 100);
            pdf.setFillColor(52, 152, 219); // Blue
            pdf.rect(chartX + 45, chartY, allottedBarWidth, barHeight, 'F');
            pdf.setDrawColor(0, 0, 0);
            pdf.rect(chartX + 45, chartY, allottedBarWidth, barHeight);
            
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${allottedArea.toLocaleString()} sqm`, chartX + 45 + allottedBarWidth + 5, chartY + 4);
            
            chartY += barSpacing;
            
            // Bar 2: Encroachment Area
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(8);
            pdf.text('Encroachment:', chartX, chartY + 4);
            
            const encroachmentBarWidth = encroachmentArea > 0 ? (encroachmentArea / maxArea) * (chartWidth - 100) : 0;
            pdf.setFillColor(231, 76, 60); // Red
            pdf.rect(chartX + 45, chartY, encroachmentBarWidth, barHeight, 'F');
            pdf.setDrawColor(0, 0, 0);
            pdf.rect(chartX + 45, chartY, encroachmentBarWidth, barHeight);
            
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${encroachmentArea.toLocaleString()} sqm`, chartX + 45 + encroachmentBarWidth + 5, chartY + 4);
            
            chartY += barSpacing;
            
            // Bar 3: Available Area
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(8);
            pdf.text('Available Area:', chartX, chartY + 4);
            
            const availableBarWidth = (availableArea / maxArea) * (chartWidth - 100);
            pdf.setFillColor(46, 204, 113); // Green
            pdf.rect(chartX + 45, chartY, availableBarWidth, barHeight, 'F');
            pdf.setDrawColor(0, 0, 0);
            pdf.rect(chartX + 45, chartY, availableBarWidth, barHeight);
            
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${availableArea.toLocaleString()} sqm`, chartX + 45 + availableBarWidth + 5, chartY + 4);
            
            yPosition = chartY + barSpacing + 5;

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
        const headers = ['Plot ID', 'Industry Name', 'Built-up %', 'Last Inspection', 'Status', 'Severity', 'Action'];
        const csvContent = [
            headers.join(','),
            ...tableData.map(row => 
                [
                    row.id,
                    `"${row.name}"`,
                    row.built.toFixed(2),
                    row.lastInspection,
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
                    <div className="header-left">
                        {/* CSIDC Logo */}
                        <div className="header-logo">
                            <img src={CSIDCLogo} alt="CSIDC Logo" className="logo-image" />
                        </div>
                        {/* Header Text */}
                        <div className="header-text-content">
                            <h1 className="header-title">Chhattisgarh State Industrial Development Corporation</h1>
                            <p className="header-subtitle">(A Govt. of Chhattisgarh Undertaking)</p>
                        </div>
                    </div>
                    
                    {/* Official Portraits */}
                    <div className="header-officials">
                        {[
                            { name: 'Shri Vishnu Deo Sai', title: 'Hon\'ble Chief Minister', image: vishnuDeoSai },
                            { name: 'Shri Lakhan Lal Dewangan', title: 'Hon\'ble Minister', image: lakhanLalDewangan },
                            { name: 'Shri Rajeev Agrawal', title: 'Chairman', image: rajeevAgrawal }
                        ].map((official, idx) => (
                            <div key={idx} className="official-card">
                                <div className="official-image">
                                    <img src={official.image} alt={official.name} />
                                </div>
                                <p className="official-name">{official.name}</p>
                                <p className="official-title">{official.title}</p>
                            </div>
                        ))}
                    </div>
                    
                    <div className="header-timestamp">
                        <div className="date-time">
                            <div className="date">{currentDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            <div className="time">{currentDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Cards & Pie Chart */}
            {isLoading ? (
                <div className="metrics-section">
                    <div className="metrics-cards-container">
                        {[1, 2, 3, 4].map((idx) => (
                            <div key={idx} className="metric-card" style={{ backgroundColor: '#f5f5f5', padding: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Skeleton.Node active style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                                    <div style={{ flex: 1 }}>
                                        <Skeleton active paragraph={{ rows: 2 }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="metrics-chart-container">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                            <Skeleton.Node active style={{ width: '180px', height: '180px', borderRadius: '50%', margin: '0 auto' }} />
                            <Skeleton active paragraph={{ rows: 4 }} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="metrics-section">
                    {/* Left side - Cards */}
                    <div className="metrics-cards-container">
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

                    {/* Right side - Pie Chart */}
                    <div className="metrics-chart-container">
                        <PieChart 
                            data={[
                                { 
                                    label: 'Compliant', 
                                    value: plotStats.compliant, 
                                    color: '#22c55e'
                                },
                                { 
                                    label: 'Encroachment', 
                                    value: plotStats.encroachments, 
                                    color: '#ef4444'
                                },
                                { 
                                    label: 'Under-utilized', 
                                    value: plotStats.underUtilized, 
                                    color: '#eab308'
                                },
                                { 
                                    label: 'Closed', 
                                    value: plotStats.closedUnits, 
                                    color: '#3b82f6'
                                }
                            ]} 
                        />
                    </div>
                </div>
            )}

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
                    <label className="filter-label">Search Plot ID</label>
                    <input 
                        type="text" 
                        className="filter-input"
                        placeholder="Enter plot ID..."
                        value={searchPlotId}
                        onChange={(e) => setSearchPlotId(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label className="filter-label">Latitude</label>
                    <input 
                        type="text" 
                        className="filter-input"
                        placeholder="Enter latitude..."
                        value={filterLatitude}
                        onChange={(e) => setFilterLatitude(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label className="filter-label">Longitude</label>
                    <input 
                        type="text" 
                        className="filter-input"
                        placeholder="Enter longitude..."
                        value={filterLongitude}
                        onChange={(e) => setFilterLongitude(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Map Section */}
                <div className="map-section">
                    <div className="map-header">
                        <h2 className="section-title">Satellite Monitoring Map</h2>
                        <div className="map-legend">
                            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#e32b2d'}}></span> Allocated</div>
                            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#33a02c'}}></span> Allocated/Partially Constructed</div>
                            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#b2df8a'}}></span> Closed</div>
                            <div className="legend-item"><span className="legend-dot" style={{backgroundColor: '#3388ff'}}></span> Others</div>
                        </div>
                    </div>
                    <div className="map-container">
                        <MapComponent
                            onPlotSelect={(feature) => {
                                const plotProps = feature.properties;
                                // Calculate area from geometry if not present
                                if (!plotProps['Area (sq.m)'] && feature.geometry && feature.geometry.coordinates) {
                                    plotProps['Area (sq.m)'] = calculatePolygonArea(feature.geometry.coordinates[0]);
                                }
                                setSelectedPlot(plotProps);
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
                            <h3 className="detail-title">📍 Plot Information</h3>
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
                                    <span className="info-value" style={{color: selectedPlot.Status === 'Allocated' ? '#c62828' : '#2e7d32'}}>
                                        {selectedPlot.Status || 'Unknown'}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Use Type:</span>
                                    <span className="info-value">{selectedPlot.Use_Type || 'N/A'}</span>
                                </div>
                                <div className="info-row" style={{borderTop: '2px solid var(--border-color)', paddingTop: '12px', marginTop: '12px'}}>
                                    <span className="info-label">Allotted Area:</span>
                                    <span className="info-value" style={{fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)'}}>
                                        {selectedPlot['Area (sq.m)'] ? selectedPlot['Area (sq.m)'].toLocaleString() : 'N/A'} sqm
                                    </span>
                                </div>
                                
                                {/* Date Range Picker */}
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '1px', marginBottom: '4px'}}>
                                    <div>
                                        <label style={{fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px'}}>From:</label>
                                        <DatePicker 
                                            value={sentinelDate.start ? dayjs(sentinelDate.start) : null}
                                            onChange={(date) => setSentinelDate({...sentinelDate, start: date ? date.format('YYYY-MM-DD') : ''})}
                                            format="YYYY-MM-DD"
                                            style={{width: '100%'}}
                                            placeholder="Select start date"
                                        />
                                    </div>
                                    <div>
                                        <label style={{fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px'}}>To:</label>
                                        <DatePicker 
                                            value={sentinelDate.end ? dayjs(sentinelDate.end) : null}
                                            onChange={(date) => setSentinelDate({...sentinelDate, end: date ? date.format('YYYY-MM-DD') : ''})}
                                            format="YYYY-MM-DD"
                                            style={{width: '100%'}}
                                            placeholder="Select end date"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Section */}
                            <div className="analysis-section">
                                <button 
                                    className="btn-primary"
                                    onClick={runAnalysis}
                                    disabled={analyzing}
                                    style={{width: '100%', marginTop: '0px'}}
                                >
                                    {analyzing ? '⏳ Analyzing...' : '🔍 Run Analysis'}
                                </button>

                                {analysisResult && (
                                    <div className="analysis-results">
                                        <h5 className="results-title">📊 Analysis Results</h5>
                                        
                                        {/* Detailed Metrics */}
                                        <div style={{backgroundColor: 'var(--gray-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                                            <div className="result-item" style={{marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between'}}>
                                                <span className="result-label">Built-up Usage:</span>
                                                <span className="result-value" style={{color: 'var(--warning)', fontWeight: 'bold'}}>{parseFloat(analysisResult.builtup_increase).toFixed(2)}%</span>
                                            </div>
                                            <div className="result-item" style={{marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between'}}>
                                                <span className="result-label">Built-up Area:</span>
                                                <span className="result-value" style={{color: 'var(--warning)', fontWeight: 'bold'}}>{analysisResult.builtup_area_sqm?.toLocaleString() || '0'} sqm</span>
                                            </div>
                                            <div className="result-item" style={{marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between'}}>
                                                <span className="result-label">Encroachment %:</span>
                                                <span className="result-value" style={{color: 'var(--danger)', fontWeight: 'bold'}}>{analysisResult.encroachment_percent?.toFixed(2) || '0'}%</span>
                                            </div>
                                            <div className="result-item" style={{marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between'}}>
                                                <span className="result-label">Encroachment Area:</span>
                                                <span className="result-value" style={{color: 'var(--danger)', fontWeight: 'bold'}}>{analysisResult.encroachment_area?.toLocaleString() || '0'} sqm</span>
                                            </div>
                                            <div className="result-item" style={{marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between'}}>
                                                <span className="result-label">Vegetation Loss:</span>
                                                <span className="result-value" style={{color: 'var(--danger)', fontWeight: 'bold'}}>{parseFloat(analysisResult.vegetation_loss).toFixed(2)}%</span>
                                            </div>
                                            <div className="result-item" style={{display: 'flex', justifyContent: 'space-between'}}>
                                                <span className="result-label">Overall Status:</span>
                                                <span className="result-value" style={{color: analysisResult.status.includes('Violation') ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold'}}>
                                                    {analysisResult.status}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            className="btn-secondary"
                                            onClick={handleExportReport}
                                            style={{width: '100%', marginTop: '12px'}}
                                        >
                                            📥 Export Report
                                        </button>
                                        
                                        {/* View Buttons */}
                                        <div className="view-buttons-group" style={{marginTop: '12px'}}>
                                            <button 
                                                className="btn-view"
                                                onClick={() => handleStreetView(svCoords.lat, svCoords.lng)}
                                                title="View Street View"
                                            >
                                                Street View
                                            </button>
                                            <button 
                                                className="btn-view"
                                                onClick={handleAR}
                                                title="View AR View"
                                            >
                                                AR View
                                            </button>
                                            <button 
                                                className="btn-action"
                                                onClick={() => setShowDroneForm(true)}
                                                title="Arrange Drone Inspection"
                                            >
                                                Drone Inspection
                                            </button>
                                            <button 
                                                className="btn-action"
                                                onClick={() => setShowVisitForm(true)}
                                                title="Schedule Offline Inspection"
                                            >
                                                Schedule Visit
                                            </button>
                                            <button 
                                                className="btn-legal"
                                                onClick={() => {
                                                    // Dummy button - no action
                                    }}
                                                title="Send Legal Notice"
                                            >
                                                Legal Notice
                                            </button>
                                        </div>
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
                
                {isLoading ? (
                    <div style={{ padding: '20px' }}>
                        <Skeleton active paragraph={{ rows: 8 }} />
                    </div>
                ) : (
                    <MonitoringRecordsVisualization 
                        tableData={tableData}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        rowsPerPage={rowsPerPage}
                    />
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
                ⚙️
            </button>

            {/* Chatbot Modal */}
            {showChatbot && (
                <div className="chatbot-modal-overlay" onClick={() => setShowChatbot(false)}>
                    <div 
                        ref={chatbotModalRef}
                        className="chatbot-modal" 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: `${chatbotDimensions.width}px`,
                            maxHeight: `${chatbotDimensions.height}px`,
                            width: '100%',
                            height: '70vh'
                        }}
                    >
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
                        <div 
                            className="chatbot-modal-resize"
                            onMouseDown={handleResizeStart}
                            title="Drag to resize"
                        />
                    </div>
                </div>
            )}

            {/* Drone Inspection Form Modal */}
            {showDroneForm && (
                <div className="form-overlay" onClick={() => setShowDroneForm(false)}>
                    <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0 }}>Arrange Drone Inspection</h2>
                            <button 
                                onClick={() => setShowDroneForm(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '0',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="form-field">
                            <label>Inspection Date</label>
                            <input 
                                type="date"
                                value={droneFormData.inspectionDate}
                                onChange={(e) => setDroneFormData({...droneFormData, inspectionDate: e.target.value})}
                            />
                        </div>
                        <div className="form-field">
                            <label>Inspection Time</label>
                            <input 
                                type="time"
                                value={droneFormData.inspectionTime}
                                onChange={(e) => setDroneFormData({...droneFormData, inspectionTime: e.target.value})}
                            />
                        </div>
                        <div className="form-field">
                            <label>Remarks</label>
                            <textarea 
                                rows="4"
                                placeholder="Enter any remarks or special instructions..."
                                value={droneFormData.remarks}
                                onChange={(e) => setDroneFormData({...droneFormData, remarks: e.target.value})}
                            />
                        </div>
                        <div className="form-buttons">
                            <button className="form-btn-cancel" onClick={() => setShowDroneForm(false)}>Cancel</button>
                            <button className="form-btn-submit" onClick={() => {
                                console.log('Drone Inspection Scheduled:', droneFormData);
                                alert('Drone Inspection scheduled for ' + droneFormData.inspectionDate);
                                setShowDroneForm(false);
                                setDroneFormData({ inspectionDate: '', inspectionTime: '', remarks: '' });
                            }}>Schedule</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Visit Form Modal */}
            {showVisitForm && (
                <div className="form-overlay" onClick={() => setShowVisitForm(false)}>
                    <div className="form-modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0 }}>Schedule Site Visit</h2>
                            <button 
                                onClick={() => setShowVisitForm(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '0',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="form-field">
                            <label>Inspection Date</label>
                            <input 
                                type="date"
                                value={visitFormData.inspectionDate}
                                onChange={(e) => setVisitFormData({...visitFormData, inspectionDate: e.target.value})}
                            />
                        </div>
                        <div className="form-field">
                            <label>Inspection Time</label>
                            <input 
                                type="time"
                                value={visitFormData.inspectionTime}
                                onChange={(e) => setVisitFormData({...visitFormData, inspectionTime: e.target.value})}
                            />
                        </div>
                        <div className="form-field">
                            <label>Purpose of Visit</label>
                            <textarea 
                                rows="4"
                                placeholder="Enter purpose of site visit..."
                                value={visitFormData.purpose}
                                onChange={(e) => setVisitFormData({...visitFormData, purpose: e.target.value})}
                            />
                        </div>
                        <div className="form-buttons">
                            <button className="form-btn-cancel" onClick={() => setShowVisitForm(false)}>Cancel</button>
                            <button className="form-btn-submit" onClick={() => {
                                console.log('Site Visit Scheduled:', visitFormData);
                                alert('Site visit scheduled for ' + visitFormData.inspectionDate);
                                setShowVisitForm(false);
                                setVisitFormData({ inspectionDate: '', inspectionTime: '', purpose: '' });
                            }}>Schedule</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="dashboard-footer">
                <div className="footer-content">
                    <div className="footer-section footer-info">
                        <h4>Head Office</h4>
                        <p>
                            Udyog Bhawan, Ring Road No. 1<br/>
                            Telibandha, Raipur - 492099<br/>
                            <strong>Phone:</strong> +91-771-2583818<br/>
                            <strong>Email:</strong> info@csidc.org
                        </p>
                    </div>
                    <div className="footer-section">
                        <h4>Important Links</h4>
                        <ul>
                            <li><a href="#">Chief Minister Office</a></li>
                            <li><a href="#">Commerce & Industries</a></li>
                            <li><a href="#">Ease of Doing Business</a></li>
                            <li><a href="#">Invest India</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="#">Tenders</a></li>
                            <li><a href="#">Circulars</a></li>
                            <li><a href="#">Photo Gallery</a></li>
                            <li><a href="#">Right to Services</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 Chhattisgarh State Industrial Development Corporation. All Rights Reserved.</p>
                </div>
            </footer>
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
