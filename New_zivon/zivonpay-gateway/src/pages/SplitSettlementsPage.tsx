import { Split, BarChart3, Shield, Users, Zap, Building2 } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-settlements.jpg";

const SplitSettlementsPage = () => (
  <ProductPageLayout
    badge="Split Settlements"
    title="Split Payments"
    titleHighlight="Effortlessly"
    subtitle="Automatically split payment proceeds between multiple parties — perfect for marketplaces, aggregators, and platforms."
    heroImage={heroImage}
    features={[
      { icon: Split, title: "Multi-party Splits", description: "Split a single payment across multiple beneficiaries automatically." },
      { icon: BarChart3, title: "Commission Management", description: "Define and track platform commissions with transparent reporting." },
      { icon: Shield, title: "Compliance Ready", description: "Fully compliant with RBI marketplace payment guidelines." },
      { icon: Users, title: "Vendor Management", description: "Onboard and manage vendors with KYC verification built-in." },
      { icon: Zap, title: "Real-time Splits", description: "Settlements split and credited in real-time to all parties." },
      { icon: Building2, title: "Flexible Rules", description: "Configure percentage-based or fixed-amount split rules." },
    ]}
  />
);

export default SplitSettlementsPage;