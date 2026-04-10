import { Globe2, CreditCard, Shield, Zap, BarChart3, Users } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-payment-gateway.jpg";

const PaymentWebsitePage = () => (
  <ProductPageLayout
    badge="Payment Website"
    title="Accept Payments on Your"
    titleHighlight="Website"
    subtitle="Integrate ZivonPay's payment gateway on your website with just a few lines of code. Support all payment modes."
    heroImage={heroImage}
    features={[
      { icon: Globe2, title: "Website Integration", description: "Add payments to any website with our drop-in checkout widget." },
      { icon: CreditCard, title: "All Payment Modes", description: "UPI, cards, net banking, wallets, EMI — everything in one place." },
      { icon: Shield, title: "Secure Checkout", description: "PCI-compliant hosted checkout with SSL encryption." },
      { icon: Zap, title: "5-Minute Setup", description: "Get started with our no-code payment page in minutes." },
      { icon: BarChart3, title: "Conversion Tracking", description: "Track checkout abandonment and optimize conversion rates." },
      { icon: Users, title: "Custom Branding", description: "White-label checkout page with your brand colors and logo." },
    ]}
  />
);

export default PaymentWebsitePage;