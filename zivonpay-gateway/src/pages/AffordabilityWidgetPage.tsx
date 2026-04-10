import { CreditCard, BarChart3, Users, Zap, Shield, Clock } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-emi-bnpl.jpg";

const AffordabilityWidgetPage = () => (
  <ProductPageLayout
    badge="Affordability Widget"
    title="Show EMI Options"
    titleHighlight="Before Checkout"
    subtitle="Display EMI and BNPL options on product pages to increase customer confidence and drive higher conversions."
    heroImage={heroImage}
    features={[
      { icon: CreditCard, title: "Product Page Widget", description: "Show monthly EMI amount directly on product and cart pages." },
      { icon: BarChart3, title: "Conversion Uplift", description: "Merchants see 15-25% increase in conversion with affordability widgets." },
      { icon: Users, title: "Personalized Offers", description: "Show relevant EMI options based on customer eligibility." },
      { icon: Zap, title: "Easy Integration", description: "Add the widget with just 2 lines of JavaScript code." },
      { icon: Shield, title: "Bank-verified Rates", description: "Always show accurate, bank-verified EMI interest rates." },
      { icon: Clock, title: "Real-time Rates", description: "EMI calculations update in real-time based on latest bank rates." },
    ]}
  />
);

export default AffordabilityWidgetPage;