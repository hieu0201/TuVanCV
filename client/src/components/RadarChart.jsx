import React from 'react';

/**
 * Biểu đồ Radar đa giác SVG hiển thị 5 chỉ số năng lực của ứng viên
 */
export default function RadarChart({ metrics }) {
  // Mặc định các chỉ số
  const data = [
    { key: 'technicalProficiency', label: 'Kỹ Thuật Chuyên Môn', value: metrics?.technicalProficiency || 85 },
    { key: 'domainKnowledge', label: 'Hiểu Biết Nghiệp Vụ', value: metrics?.domainKnowledge || 80 },
    { key: 'problemSolving', label: 'Tư Duy Giải Quyết Vấn Đề', value: metrics?.problemSolving || 88 },
    { key: 'adaptability', label: 'Thích Ứng & Học Hỏi', value: metrics?.adaptability || 82 },
    { key: 'communication', label: 'Giao Tiếp & Đồng Đội', value: metrics?.communication || 78 },
  ];

  const size = 300;
  const center = size / 2;
  const radius = 105;
  const numPoints = data.length;

  // Tính tọa độ trên vòng tròn
  const getCoordinates = (index, valuePercent) => {
    const angle = (Math.PI * 2 / numPoints) * index - Math.PI / 2;
    const r = (valuePercent / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Các vòng tròn/đa giác nền (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [25, 50, 75, 100];

  const polygonPoints = data.map((d, i) => {
    const { x, y } = getCoordinates(i, d.value);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative">
        <svg width={size} height={size} className="overflow-visible">
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.15" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Vòng đa giác lưới nền */}
          {gridLevels.map((level) => {
            const points = data.map((_, i) => {
              const { x, y } = getCoordinates(i, level);
              return `${x},${y}`;
            }).join(' ');
            return (
              <polygon
                key={level}
                points={points}
                fill={level === 100 ? "#f8fafc" : "transparent"}
                stroke="#e2e8f0"
                strokeWidth="1.2"
                strokeDasharray={level === 100 ? "0" : "3,3"}
              />
            );
          })}

          {/* Các tia trục từ tâm ra đỉnh */}
          {data.map((d, i) => {
            const { x, y } = getCoordinates(i, 100);
            return (
              <line
                key={d.key}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#cbd5e1"
                strokeWidth="1.2"
              />
            );
          })}

          {/* Vùng đa giác thể hiện năng lực ứng viên */}
          <polygon
            points={polygonPoints}
            fill="url(#radarGradient)"
            stroke="#2563eb"
            strokeWidth="2.5"
            className="transition-all duration-700 ease-out"
          />

          {/* Các điểm nút (Nodes) */}
          {data.map((d, i) => {
            const { x, y } = getCoordinates(i, d.value);
            return (
              <g key={`point-${i}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="4.5"
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-700 ease-out"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="#3b82f6"
                  opacity="0.2"
                  className="animate-pulse"
                />
              </g>
            );
          })}

          {/* Nhãn văn bản xung quanh */}
          {data.map((d, i) => {
            const { x, y } = getCoordinates(i, 128);
            return (
              <text
                key={`label-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#334155"
                fontSize="10.5"
                fontWeight="600"
                className="font-sans"
              >
                {d.label} ({d.value}%)
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
