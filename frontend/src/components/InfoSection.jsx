import React from 'react';
import { ShoppingCart, FileText, ChevronRight } from 'lucide-react';

const InfoSection = () => {
  const newsItems = [
    { title: 'Launch of New Industrial Policy 2024-30', titleHi: 'नई औद्योगिक नीति 2024-30 का शुभारंभ' },
    { title: 'Inviting Application for Land Allotment in Naya Raipur', titleHi: 'नया रायपुर में भूमि आबंटन के लिए आवेदन आमंत्रित' },
    { title: 'Notice regarding lease rent submission', titleHi: 'पट्टा किराया जमा करने संबंधी नोटिस' },
    { title: 'Tender Notification for Road Construction in Industrial Area', titleHi: 'औद्योगिक क्षेत्र में सड़क निर्माण के लिए निविदा नोटिफिकेशन' }
  ];

  return (
    <section className="w-full py-12 md:py-16 px-6 sm:px-12 bg-gray-50">
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* INFORMATION ENABLERS - Left Column */}
          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-6 pb-3 border-b-2 border-blue-900">
              Information Enablers
            </h2>
            <div className="space-y-4">
              {/* e-Marketing Card */}
              <div className="bg-white p-5 rounded shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">e-Marketing</h3>
                    <p className="text-sm text-gray-600">Promoting local products</p>
                  </div>
                </div>
              </div>

              {/* RTI Card */}
              <div className="bg-white p-5 rounded shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">RTI</h3>
                    <p className="text-sm text-gray-600">Right to Information</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NEWS & UPDATES - Right 2 Columns */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-blue-900">
              <h2 className="text-2xl font-bold text-blue-900">News & Updates</h2>
              <a href="#" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                View All →
              </a>
            </div>
            <div className="space-y-4">
              {newsItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded shadow-sm hover:shadow-md hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 group-hover:text-blue-900 transition-colors text-base">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {item.titleHi}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className="text-blue-600 flex-shrink-0 group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InfoSection;
