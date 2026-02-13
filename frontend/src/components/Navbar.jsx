import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'About Us', href: '#about' },
    { label: 'Investors', href: '#investors' },
    { label: 'Land Allotment', href: '#land' },
    { label: 'Online Services', href: '#services' },
    { label: 'Downloads', href: '#downloads' },
    { label: 'Contact Us', href: '#contact' }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-blue-900 text-white shadow-md h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center flex-1 gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-white hover:text-yellow-400 transition-colors duration-200 font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA Button */}
          <div className="hidden md:block">
            <Link
              to="/dashboard"
              className="bg-yellow-500 text-blue-900 font-bold px-6 py-2 rounded-lg shadow-lg hover:bg-yellow-400 hover:scale-105 transition-all duration-200"
            >
              Check Land Acquisition
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-yellow-400 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-blue-800 shadow-lg border-t border-blue-700">
            <div className="flex flex-col py-4 px-4 gap-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:text-yellow-400 transition-colors py-2 font-medium"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-yellow-500 text-blue-900 font-bold px-4 py-2 rounded-lg text-center hover:bg-yellow-400 transition-colors mt-2"
              >
                Check Land Acquisition
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
