import React, { useState } from 'react';

const MonitoringRecordsVisualization = ({ tableData, currentPage, setCurrentPage, rowsPerPage }) => {
    const [selectedRow, setSelectedRow] = useState(null);
    if (!tableData || tableData.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#999',
                fontSize: '16px'
            }}>
                Loading plot data...
            </div>
        );
    }

    const paginatedData = tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const totalPages = Math.ceil(tableData.length / rowsPerPage);

    const getStatusColor = (status) => {
        const colors = {
            'Compliant': '#22c55e',
            'Encroachment': '#ef4444',
            'Under-utilized': '#eab308',
            'Closed': '#3b82f6'
        };
        return colors[status] || '#999';
    };

    const getSeverityColor = (severity) => {
        const colors = {
            'Low': '#22c55e',
            'Medium': '#f59e0b',
            'High': '#ef4444'
        };
        return colors[severity] || '#666';
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Table Wrapper */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                marginBottom: '20px'
            }}>
                <div style={{
                    overflowX: 'auto'
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                    }}>
                        {/* Table Header */}
                        <thead>
                            <tr style={{
                                backgroundColor: '#0066cc',
                                color: 'white'
                            }}>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'left',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderRight: '1px solid rgba(255,255,255,0.2)'
                                }}>
                                    Plot ID
                                </th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'left',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderRight: '1px solid rgba(255,255,255,0.2)'
                                }}>
                                    Industry Name
                                </th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'center',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderRight: '1px solid rgba(255,255,255,0.2)'
                                }}>
                                    Built-up %
                                </th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'center',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderRight: '1px solid rgba(255,255,255,0.2)'
                                }}>
                                    Last Inspection
                                </th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'center',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderRight: '1px solid rgba(255,255,255,0.2)'
                                }}>
                                    Status
                                </th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'center',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    borderRight: '1px solid rgba(255,255,255,0.2)'
                                }}>
                                    Severity
                                </th>
                                <th style={{
                                    padding: '16px 20px',
                                    textAlign: 'center',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Action
                                </th>
                            </tr>
                        </thead>

                        {/* Table Body */}
                        <tbody>
                            {paginatedData.map((row, idx) => (
                                <tr
                                    key={idx}
                                    style={{
                                        borderBottom: '1px solid #e5e7eb',
                                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f3f8fc',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#e6f2ff';
                                        e.currentTarget.style.boxShadow = 'inset 0 0 10px rgba(0, 102, 204, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f3f8fc';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <td style={{
                                        padding: '16px 20px',
                                        fontWeight: '700',
                                        color: '#0066cc',
                                        borderRight: '1px solid #e5e7eb'
                                    }}>
                                        {row.id}
                                    </td>
                                    <td style={{
                                        padding: '16px 20px',
                                        color: '#374151',
                                        borderRight: '1px solid #e5e7eb',
                                        maxWidth: '200px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {row.name}
                                    </td>
                                    <td style={{
                                        padding: '16px 20px',
                                        textAlign: 'center',
                                        borderRight: '1px solid #e5e7eb'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}>
                                            <div style={{
                                                width: '60px',
                                                height: '6px',
                                                backgroundColor: '#e5e7eb',
                                                borderRadius: '3px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${Math.min(row.built, 100)}%`,
                                                    height: '100%',
                                                    backgroundColor: row.built > 80 ? '#ef4444' : row.built > 50 ? '#f59e0b' : '#3b82f6'
                                                }}></div>
                                            </div>
                                            <span style={{
                                                fontWeight: '700',
                                                color: row.built > 80 ? '#dc2626' : row.built > 50 ? '#d97706' : '#096',
                                                minWidth: '35px'
                                            }}>
                                                {row.built.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{
                                        padding: '16px 20px',
                                        textAlign: 'center',
                                        borderRight: '1px solid #e5e7eb'
                                    }}>
                                        <span style={{
                                            color: '#374151',
                                            fontWeight: '500',
                                            fontSize: '13px'
                                        }}>
                                            {row.lastInspection}
                                        </span>
                                    </td>
                                    <td style={{
                                        padding: '16px 20px',
                                        textAlign: 'center',
                                        borderRight: '1px solid #e5e7eb'
                                    }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: getStatusColor(row.status),
                                            color: 'white',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            textTransform: 'capitalize',
                                            letterSpacing: '0.3px',
                                            minWidth: '110px',
                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                        }}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td style={{
                                        padding: '16px 20px',
                                        textAlign: 'center',
                                        borderRight: '1px solid #e5e7eb'
                                    }}>
                                        <span style={{
                                            display: 'inline-block',
                                            color: getSeverityColor(row.severity),
                                            fontWeight: '700',
                                            fontSize: '12px'
                                        }}>
                                            {row.severity}
                                        </span>
                                    </td>
                                    <td style={{
                                        padding: '16px 20px',
                                        textAlign: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <button 
                                            onClick={() => setSelectedRow(row)}
                                            style={{
                                            padding: '8px 28px',
                                            backgroundColor: '#0066cc',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '12px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            transition: 'all 0.3s ease',
                                            hover: {
                                                backgroundColor: '#0052a3'
                                            }
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#0052a3';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#0066cc';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}>
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedRow && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.3s ease-in-out'
                }} onClick={() => setSelectedRow(null)}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        maxWidth: '450px',
                        width: '90%',
                        animation: 'slideUpIn 0.4s ease-out'
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '2px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#f9fafb'
                        }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#0066cc'
                            }}>
                                Plot Details - {selectedRow.id}
                            </h3>
                            <button 
                                onClick={() => setSelectedRow(null)}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#6b7280'
                                }}>
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{
                            padding: '20px',
                            display: 'grid',
                            gap: '16px'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                backgroundColor: '#f9fafb',
                                padding: '14px',
                                borderRadius: '8px'
                            }}>
                                <div>
                                    <label style={{
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: '#0066cc',
                                        display: 'block',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Plot ID</label>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#1f2937'
                                    }}>{selectedRow.id}</p>
                                </div>
                                <div>
                                    <label style={{
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: '#0066cc',
                                        display: 'block',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Industry Name</label>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '14px',
                                        color: '#1f2937'
                                    }}>{selectedRow.name}</p>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                backgroundColor: '#f9fafb',
                                padding: '14px',
                                borderRadius: '8px'
                            }}>
                                <div>
                                    <label style={{
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: '#0066cc',
                                        display: 'block',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Built-up %</label>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: selectedRow.built > 80 ? '#dc2626' : '#1f2937'
                                    }}>{selectedRow.built.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <label style={{
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: '#0066cc',
                                        display: 'block',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Last Inspection</label>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '14px',
                                        color: '#1f2937'
                                    }}>{selectedRow.lastInspection}</p>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '16px',
                                backgroundColor: '#f9fafb',
                                padding: '14px',
                                borderRadius: '8px'
                            }}>
                                <div>
                                    <label style={{
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: '#0066cc',
                                        display: 'block',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Status</label>
                                    <p style={{
                                        margin: 0,
                                        display: 'inline-block',
                                        padding: '6px 12px',
                                        backgroundColor: getStatusColor(selectedRow.status),
                                        color: 'white',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>{selectedRow.status}</p>
                                </div>
                                <div>
                                    <label style={{
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: '#0066cc',
                                        display: 'block',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Severity</label>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: getSeverityColor(selectedRow.severity)
                                    }}>{selectedRow.severity}</p>
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: '#f9fafb',
                                padding: '14px',
                                borderRadius: '8px'
                            }}>
                                <label style={{
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    color: '#0066cc',
                                    display: 'block',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>Recommended Action</label>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: '#1f2937',
                                    lineHeight: '1.5'
                                }}>{selectedRow.action}</p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{
                            padding: '12px 20px',
                            borderTop: '2px solid #e5e7eb',
                            display: 'flex',
                            gap: '10px',
                            justifyContent: 'flex-end',
                            backgroundColor: '#f9fafb'
                        }}>
                            <button 
                                onClick={() => setSelectedRow(null)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '13px',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#d1d5db';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                                }}>
                                Close
                            </button>
                            <button 
                                onClick={() => {
                                    console.log('Send email for:', selectedRow.name);
                                    // Email functionality will be added here
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '13px',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#dc2626';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#ef4444';
                                }}>
                                📧 Send Legal Notice
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination Controls */}
            {tableData.length > 0 && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                }}>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: currentPage === 1 ? '#e5e7eb' : '#0066cc',
                            color: currentPage === 1 ? '#9ca3af' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        ← Previous
                    </button>

                    <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '200px',
                        textAlign: 'center'
                    }}>
                        <span style={{ color: '#0066cc', fontWeight: '700' }}>Page {currentPage}</span> of {totalPages}
                        <br/>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>({tableData.length} total records)</span>
                    </div>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: currentPage === totalPages ? '#e5e7eb' : '#0066cc',
                            color: currentPage === totalPages ? '#9ca3af' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};

export default MonitoringRecordsVisualization;
