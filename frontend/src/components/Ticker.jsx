import React from 'react';

const Ticker = () => {
  return (
    <div className="w-full bg-gradient-to-r from-red-600 to-white overflow-hidden py-4 shadow-md">
      <div className="flex">
        <div className="animate-marquee whitespace-nowrap flex gap-12">
          <span className="text-white font-bold text-lg px-6">
            Industrial Development Policy 2024-30 Launched! • Power Surplus State • Ease of Doing Business
          </span>
          <span className="text-white font-bold text-lg px-6">
            Industrial Development Policy 2024-30 Launched! • Power Surplus State • Ease of Doing Business
          </span>
          <span className="text-white font-bold text-lg px-6">
            Industrial Development Policy 2024-30 Launched! • Power Surplus State • Ease of Doing Business
          </span>
        </div>
      </div>
    </div>
  );
};

export default Ticker;
