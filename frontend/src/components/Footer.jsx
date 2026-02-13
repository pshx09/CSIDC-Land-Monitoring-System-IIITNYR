import React from 'react';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';

const Footer = () => {
  const importantLinks = [
    'Chief Minister Office',
    'Commerce & Industries Dept.',
    'Ease of Doing Business',
    'Invest India'
  ];

  const quickLinks = [
    'Tenders',
    'Circulars',
    'Photo Gallery',
    'Right to Services'
  ];

  return (
    <footer className="w-full bg-gray-800 text-gray-300">
      {/* Main Footer Content */}
      <div className="w-full px-6 sm:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* COLUMN 1 - Head Office */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Head Office</h3>
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <MapPin size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed">
                  Udyog Bhawan, Ring Road No. 1,<br />
                  Telibandha, Raipur,<br />
                  CG 492006
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <Phone size={20} className="text-yellow-500 flex-shrink-0" />
                <span className="text-sm">+91-771-2583818</span>
              </div>
              <div className="flex gap-3 items-center">
                <Mail size={20} className="text-yellow-500 flex-shrink-0" />
                <span className="text-sm">csidc.raipur@nic.in</span>
              </div>
              <div className="flex gap-3 items-center">
                <Globe size={20} className="text-yellow-500 flex-shrink-0" />
                <span className="text-sm">www.csidc.in</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2 - Important Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Important Links</h3>
            <ul className="space-y-3">
              {importantLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-400 transition-colors duration-200 text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 3 - Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-400 transition-colors duration-200 text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 4 - Visitor Counter */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Visitor Counter</h3>
            <div className="bg-gray-700 border-2 border-gray-600 p-6 rounded">
              <p className="text-gray-400 text-xs font-medium mb-3">Total Visitors</p>
              <p className="text-yellow-400 font-mono text-4xl font-bold">
                1,245,892
              </p>
              <p className="text-gray-500 text-xs mt-4">
                Last updated: Feb 13, 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="w-full border-t border-gray-700">
        <div className="px-6 sm:px-12 py-6">
          <p className="text-center text-gray-500 text-xs">
            © 2026 Chhattisgarh State Industrial Development Corporation. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
