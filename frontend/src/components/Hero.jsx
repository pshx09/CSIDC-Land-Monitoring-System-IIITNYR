import React from 'react';

const Hero = () => {
  return (
    <section
      className="w-full relative bg-cover bg-center flex items-center justify-center overflow-hidden"
      style={{
        height: '500px',
        backgroundImage: 'url("https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark Overlay - 50% black opacity */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4">
          Power Surplus State
        </h1>
        <p className="text-xl md:text-2xl text-white font-medium drop-shadow-lg">
          with tariffs lower than National Average
        </p>
      </div>
    </section>
  );
};

export default Hero;
