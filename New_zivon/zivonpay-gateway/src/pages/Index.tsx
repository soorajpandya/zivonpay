import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import TrustLogosSection from "@/components/TrustLogosSection";
import FeaturesSection from "@/components/FeaturesSection";
import WhyZivonPaySection from "@/components/WhyZivonPaySection";
import IndustriesSection from "@/components/IndustriesSection";
import DeveloperSection from "@/components/DeveloperSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import EnterpriseSection from "@/components/EnterpriseSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <TrustLogosSection />
      <FeaturesSection />
      <WhyZivonPaySection />
      <IndustriesSection />
      <DeveloperSection />
      <TestimonialsSection />
      <EnterpriseSection />
      <Footer />
    </div>
  );
};

export default Index;
