import React from 'react';

const PieChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
        return (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
                No data available
            </div>
        );
    }

    let currentAngle = -90; // Start from top
    const segments = data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const angle = (item.value / total) * 360;
        const endAngle = currentAngle + angle;
        const midAngle = currentAngle + angle / 2;

        // Calculate path for pie slice
        const startX = 100 + 80 * Math.cos((Math.PI * currentAngle) / 180);
        const startY = 100 + 80 * Math.sin((Math.PI * currentAngle) / 180);
        const endX = 100 + 80 * Math.cos((Math.PI * endAngle) / 180);
        const endY = 100 + 80 * Math.sin((Math.PI * endAngle) / 180);

        // Calculate label position (outside the pie)
        const labelStartRadius = 82; // Just outside the pie
        const labelEndRadius = 110; // Where the label sits
        const lineStartX = 100 + labelStartRadius * Math.cos((Math.PI * midAngle) / 180);
        const lineStartY = 100 + labelStartRadius * Math.sin((Math.PI * midAngle) / 180);
        const lineEndX = 100 + labelEndRadius * Math.cos((Math.PI * midAngle) / 180);
        const lineEndY = 100 + labelEndRadius * Math.sin((Math.PI * midAngle) / 180);

        // Text anchor based on which side of the chart
        const textAnchor = midAngle > -90 && midAngle < 90 ? 'start' : 'end';

        const largeArcFlag = angle > 180 ? 1 : 0;

        const pathData = [
            `M 100 100`,
            `L ${startX} ${startY}`,
            `A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `Z`
        ].join(' ');

        const segment = {
            path: pathData,
            color: item.color,
            percentage: percentage.toFixed(1),
            label: item.label,
            value: item.value,
            lineStartX,
            lineStartY,
            lineEndX,
            lineEndY,
            textAnchor
        };

        currentAngle = endAngle;
        return segment;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1
            }}>
                <svg
                    viewBox="0 0 240 240"
                    style={{
                        width: '100%',
                        maxWidth: '240px',
                        height: 'auto'
                    }}
                >
                    <g transform="translate(20, 20)">
                        {segments.map((segment, index) => (
                            <g key={index}>
                                <path
                                    d={segment.path}
                                    fill={segment.color}
                                    stroke="white"
                                    strokeWidth="2"
                                    style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.opacity = '0.8';
                                        e.target.style.filter = 'brightness(1.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.opacity = '1';
                                        e.target.style.filter = 'brightness(1)';
                                    }}
                                >
                                    <title>{`${segment.label}: ${segment.value} (${segment.percentage}%)`}</title>
                                </path>
                            </g>
                        ))}

                        {/* Center circle for donut chart effect */}
                        <circle
                            cx="100"
                            cy="100"
                            r="45"
                            fill="white"
                        />

                        {/* Total in center */}
                        <text
                            x="100"
                            y="95"
                            textAnchor="middle"
                            style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                fill: 'var(--text-primary)'
                            }}
                        >
                            {total}
                        </text>
                        <text
                            x="100"
                            y="110"
                            textAnchor="middle"
                            style={{
                                fontSize: '10px',
                                fill: 'var(--text-secondary)'
                            }}
                        >
                            Total Plots
                        </text>
                    </g>
                </svg>
            </div>
            <h3 style={{
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: '8px 0 0 0',
                textAlign: 'center'
            }}>
                Status Distribution
            </h3>
            
            {/* Legend below chart */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px',
                marginTop: '8px',
                fontSize: '10px',
                width: '100%',
                paddingTop: '6px',
                borderTop: '1px solid #e5e7eb'
            }}>
                {segments.map((segment, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: segment.color,
                            borderRadius: '2px',
                            flexShrink: 0
                        }}></div>
                        <span style={{
                            color: 'var(--text-primary)',
                            fontWeight: '500',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {segment.label}: {segment.percentage}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PieChart;
