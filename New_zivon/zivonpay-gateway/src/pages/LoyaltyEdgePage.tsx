import { Heart, Users, BarChart3, Gift, Zap, Shield } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-payment-gateway.jpg";

const LoyaltyEdgePage = () => (
  <ProductPageLayout
    badge="Loyalty Edge"
    title="Build Customer"
    titleHighlight="Loyalty"
    subtitle="Reward your customers with points, cashbacks, and exclusive perks. Drive repeat purchases and lifetime value."
    heroImage={heroImage}
    features={[
      { icon: Heart, title: "Points System", description: "Flexible points earning and redemption with customizable rules." },
      { icon: Users, title: "Customer Segmentation", description: "Create tiered loyalty programs based on customer behavior." },
      { icon: BarChart3, title: "Loyalty Analytics", description: "Track loyalty program performance and customer engagement." },
      { icon: Gift, title: "Reward Catalog", description: "Offer cashbacks, vouchers, and exclusive rewards to loyal customers." },
      { icon: Zap, title: "Instant Rewards", description: "Real-time reward crediting at the point of payment." },
      { icon: Shield, title: "Fraud Protection", description: "Prevent loyalty fraud with smart detection algorithms." },
    ]}
  />
);

export default LoyaltyEdgePage;