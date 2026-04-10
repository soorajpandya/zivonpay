import { CreditCard, Clock, Shield, Users, Zap, BarChart3 } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImg from "@/assets/bnpl-hero.jpg";
import flexImg from "@/assets/bnpl-flexibility.jpg";
import growthImg from "@/assets/bnpl-growth.jpg";

const BuyNowPayLaterPage = () => (
  <ProductPageLayout
    badge="Buy Now Pay Later"
    title="Offer"
    titleHighlight="Buy Now Pay Later"
    subtitle="Increase conversions by letting customers pay later. Integrated with leading BNPL providers across India."
    heroImage={heroImg}
    sectionImages={[flexImg, growthImg]}
    features={[
      { icon: CreditCard, title: "Multiple Providers", description: "Integrated with Simpl, LazyPay, ZestMoney, and more BNPL providers." },
      { icon: Clock, title: "Pay Later Options", description: "Pay in 15 days, pay in 3 installments, or custom payment plans." },
      { icon: Shield, title: "Zero Risk", description: "ZivonPay bears the credit risk. You get paid instantly on every transaction." },
      { icon: Users, title: "Wider Reach", description: "Attract customers who prefer flexible payment options." },
      { icon: Zap, title: "Instant Approval", description: "Real-time credit check and approval during checkout flow." },
      { icon: BarChart3, title: "Conversion Boost", description: "Merchants see 20-30% increase in conversion with BNPL options." },
    ]}
  />
);

export default BuyNowPayLaterPage;
