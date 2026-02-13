import Header from '../components/Header';
import Ticker from '../components/Ticker';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import MainContent from '../components/MainContent';
import InfoSection from '../components/InfoSection';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="w-full min-h-screen bg-white font-sans">
      <Header />
      <Ticker />
      <Navbar />
      <Hero />
      <MainContent />
      <InfoSection />
      <Footer />
    </div>
  );
};

export default HomePage;
