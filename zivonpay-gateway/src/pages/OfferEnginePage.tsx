import { Gift, BarChart3, Shield, Users, Zap, CreditCard } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-payment-gateway.jpg";

const OfferEnginePage = () => (
  <ProductPageLayout
    badge="Offer Engine"
    title="Drive Sales with Smart"
    titleHighlight="Offers & Discounts"
    subtitle="Create and manage payment-linked offers. Boost conversions with bank offers, cashbacks, and instant discounts."
    heroImage={heroImage}
    features={[
      { icon: Gift, title: "Bank Offers", description: "Configure instant discounts and cashbacks with partner bank cards." },
      { icon: BarChart3, title: "Offer Analytics", description: "Track offer redemption, ROI, and impact on conversion rates." },
      { icon: Shield, title: "Fraud Prevention", description: "Prevent offer abuse with smart validation and usage limits." },
      { icon: Users, title: "Targeted Offers", description: "Create offers for specific customer segments or payment modes." },
      { icon: Zap, title: "Real-time Validation", description: "Validate offer eligibility instantly during checkout." },
      { icon: CreditCard, title: "Multi-mode Offers", description: "Create offers across cards, UPI, wallets, and net banking." },
    ]}
  />
);

export default OfferEnginePage;