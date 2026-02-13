import React from 'react';

const MainContent = () => {
  const valueProps = [
    'Ease of Doing Business',
    'Rich Mineral Resources',
    'Skilled Workforce from NIT/IIT/IIM',
    'Strategically Located',
    'Robust Infrastructure',
    'Investor Friendly Policies'
  ];

  return (
    <section className="w-full py-12 md:py-16 px-6 sm:px-12 bg-white">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* LEFT COLUMN - Video Showcase */}
        <div className="bg-gray-100 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            Industrial Policy 2024-2030 Launch
          </h2>
          
          {/* Video Placeholder: 16:9 aspect ratio */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video shadow-md">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/jaFu38EZiIk"
              title="Industrial Policy 2024-2030 Launch"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>

        {/* RIGHT COLUMN - Value Propositions */}
        <div>
          {/* Heading with yellow left border */}
          <div className="flex items-center gap-4 mb-6 pb-2">
            <div className="w-1 h-8 bg-yellow-500"></div>
            <h2 className="text-2xl font-bold text-blue-900">Value Propositions</h2>
          </div>
          
          {/* Point-wise list with subtle styling */}
          <div className="space-y-3">
            {valueProps.map((prop, idx) => (
              <div
                key={idx}
                className="bg-blue-50 border-l-4 border-blue-600 p-3 pl-4 rounded-sm hover:bg-blue-100 transition-colors duration-200"
              >
                <span className="text-gray-800 font-medium text-base">{prop}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainContent;
