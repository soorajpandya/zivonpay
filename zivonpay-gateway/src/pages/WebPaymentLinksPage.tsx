import { Link2, Smartphone, Shield, Zap, BarChart3, Users } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-payment-gateway.jpg";

const WebPaymentLinksPage = () => (
  <ProductPageLayout
    badge="Payment Links"
    title="Collect Payments via"
    titleHighlight="Payment Links"
    subtitle="Create and share payment links via SMS, email, WhatsApp, or social media. No website or app needed."
    heroImage={heroImage}
    features={[
      { icon: Link2, title: "Instant Links", description: "Generate payment links in seconds and share across any channel." },
      { icon: Smartphone, title: "Mobile Optimized", description: "Payment pages auto-adapt to any device for seamless checkout." },
      { icon: Shield, title: "Secure Payments", description: "PCI-compliant payment pages with SSL encryption." },
      { icon: Zap, title: "Partial Payments", description: "Allow customers to make partial payments against a link." },
      { icon: BarChart3, title: "Link Analytics", description: "Track link opens, conversions, and payment status in real-time." },
      { icon: Users, title: "Bulk Links", description: "Create and send payment links in bulk via CSV upload." },
    ]}
  />
);

export default WebPaymentLinksPage;