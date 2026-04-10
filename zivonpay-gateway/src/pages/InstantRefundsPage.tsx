import { Zap, Clock, Shield, BarChart3, Users, CreditCard } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-settlements.jpg";

const InstantRefundsPage = () => (
  <ProductPageLayout
    badge="Instant Refunds"
    title="Delight Customers with"
    titleHighlight="Instant Refunds"
    subtitle="Process refunds in real-time. Improve customer satisfaction and reduce support tickets with instant refund processing."
    heroImage={heroImage}
    features={[
      { icon: Zap, title: "Real-time Processing", description: "Refunds credited to customer accounts within seconds, not days." },
      { icon: Clock, title: "Automated Refunds", description: "Set up rules for automatic refund processing based on conditions." },
      { icon: Shield, title: "Fraud Prevention", description: "Smart refund fraud detection prevents unauthorized refund requests." },
      { icon: BarChart3, title: "Refund Analytics", description: "Track refund rates, reasons, and trends with detailed dashboards." },
      { icon: Users, title: "Customer Satisfaction", description: "Boost CSAT scores with lightning-fast refund experiences." },
      { icon: CreditCard, title: "Source Refunds", description: "Refund to original payment source automatically." },
    ]}
  />
);

export default InstantRefundsPage;