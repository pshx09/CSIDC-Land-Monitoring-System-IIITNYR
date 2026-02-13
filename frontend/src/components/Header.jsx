import React from 'react';
import csidcLogo from '../images/CSIDClogo.jpeg';
import vishnuDeoSai from '../images/Shri-Vishnu-Deo-Sai.webp';
import lakhanLalDewangan from '../images/Shri_Lakhan_Lal_Dewangan-e1744784449713.webp';
import rajeevAgrawal from '../images/Shri-Rajeev-Agrawal-1.webp';
import cgLogo from '../images/cg_logo.webp';
import anniversaryLogo from '../images/75Y.webp';

const Header = () => {
  return (
    <header className="w-full bg-white shadow-sm border-b-2 border-gray-200">
      <div className="w-full px-6 sm:px-12 py-8">
        {/* Main flex container */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* LEFT SECTION: Logo & Title */}
          <div className="flex items-center gap-6 flex-shrink-0">
            {/* CSIDC Logo */}
            <img 
              src={csidcLogo} 
              alt="CSIDC Logo" 
              className="w-16 h-16 object-contain flex-shrink-0"
            />
            
            {/* Organization Title */}
            <div className="flex flex-col">
              <h1 className="text-gray-800 font-bold text-base leading-snug">
                Chhattisgarh State Industrial<br />Development Corporation
              </h1>
              <p className="text-gray-500 text-xs mt-1">(A Govt. of Chhattisgarh Undertaking)</p>
            </div>
          </div>

          {/* CENTER SECTION: Official Portraits (3 cards) */}
          <div className="flex gap-6 justify-center flex-wrap">
            {[
              { name: 'Shri Vishnu Deo Sai', title: 'Hon\'ble Chief Minister', image: vishnuDeoSai },
              { name: 'Shri Lakhan Lal Dewangan', title: 'Hon\'ble Minister', image: lakhanLalDewangan },
              { name: 'Shri Rajeev Agrawal', title: 'Chairman', image: rajeevAgrawal }
            ].map((official, idx) => (
              <div key={idx} className="flex flex-col items-center">
                {/* Portrait Image: 16x20 (w-16 h-20) */}
                <div className="w-16 h-20 bg-gray-200 rounded-md flex items-center justify-center mb-2 border border-gray-300 overflow-hidden">
                  <img 
                    src={official.image} 
                    alt={official.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Name: 10px bold */}
                <p className="text-gray-800 font-bold text-center leading-tight" style={{ fontSize: '10px' }}>
                  {official.name}
                </p>
                {/* Title: 9px gray */}
                <p className="text-gray-600 text-center mt-0.5" style={{ fontSize: '9px' }}>
                  {official.title}
                </p>
              </div>
            ))}
          </div>

          {/* RIGHT SECTION: Official Seals (2 circular badges) */}
          <div className="flex gap-6 flex-shrink-0">
            {/* CG Govt Logo */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-600 flex-shrink-0 overflow-hidden p-1">
              <img 
                src={cgLogo} 
                alt="CG Government"
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* 75Y Anniversary Logo */}
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center border-2 border-yellow-500 flex-shrink-0 overflow-hidden p-1">
              <img 
                src={anniversaryLogo} 
                alt="75 Years"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
