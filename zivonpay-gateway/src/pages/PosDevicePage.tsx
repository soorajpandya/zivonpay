import { Smartphone, CreditCard, Shield, Zap, BarChart3, Users } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-payment-gateway.jpg";

const PosDevicePage = () => (
  <ProductPageLayout
    badge="POS Device"
    title="Smart"
    titleHighlight="POS Solutions"
    subtitle="Accept card, UPI, and contactless payments at your store with ZivonPay's smart POS devices."
    heroImage={heroImage}
    features={[
      { icon: Smartphone, title: "Android POS", description: "Smart Android-based POS terminals with touchscreen and receipt printer." },
      { icon: CreditCard, title: "Multi-payment", description: "Accept cards, UPI, QR, contactless (NFC), and wallet payments." },
      { icon: Shield, title: "EMV Certified", description: "Chip-and-PIN certified terminals meeting global security standards." },
      { icon: Zap, title: "Fast Processing", description: "Sub-second transaction processing for quick customer checkout." },
      { icon: BarChart3, title: "Inventory Integration", description: "Connect with your billing software and inventory management." },
      { icon: Users, title: "Multi-store Support", description: "Manage POS devices across multiple store locations." },
    ]}
  />
);

export default PosDevicePage;