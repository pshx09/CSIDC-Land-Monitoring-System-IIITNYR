import React, { useState, useEffect } from 'react';
import { Skeleton } from 'antd';
import Header from '../components/Header';
import Ticker from '../components/Ticker';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import MainContent from '../components/MainContent';
import InfoSection from '../components/InfoSection';
import Footer from '../components/Footer';

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full min-h-screen bg-white font-sans">
      {isLoading ? (
        <>
          <Skeleton active paragraph={{ rows: 2 }} style={{ padding: '20px' }} />
          <Skeleton active paragraph={{ rows: 3 }} style={{ padding: '20px', marginTop: '20px' }} />
          <Skeleton active paragraph={{ rows: 4 }} style={{ padding: '20px', marginTop: '20px' }} />
          <Skeleton active paragraph={{ rows: 5 }} style={{ padding: '20px', marginTop: '20px' }} />
          <Skeleton active paragraph={{ rows: 3 }} style={{ padding: '20px', marginTop: '20px' }} />
        </>
      ) : (
        <>
          <Header />
          <Ticker />
          <Navbar />
          <Hero />
          <MainContent />
          <InfoSection />
          <Footer />
        </>
      )}
    </div>
  );
};

export default HomePage;
