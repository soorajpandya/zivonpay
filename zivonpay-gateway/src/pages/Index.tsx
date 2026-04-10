import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import DeveloperSection from "@/components/DeveloperSection";

import EnterpriseSection from "@/components/EnterpriseSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <DeveloperSection />
      
      <EnterpriseSection />
      <Footer />
    </div>
  );
};

export default Index;
