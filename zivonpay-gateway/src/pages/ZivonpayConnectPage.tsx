import { Users, Building2, Shield, Zap, BarChart3, Globe2 } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-payment-gateway.jpg";

const ZivonpayConnectPage = () => (
  <ProductPageLayout
    badge="ZivonPay Connect"
    title="Unified Payment"
    titleHighlight="Platform"
    subtitle="A single integration point for all your payment needs. Connect your ecosystem with ZivonPay's unified API platform."
    heroImage={heroImage}
    features={[
      { icon: Users, title: "Single Integration", description: "One API to access all ZivonPay payment products and services." },
      { icon: Building2, title: "Multi-entity Support", description: "Manage payments for multiple business entities from one account." },
      { icon: Shield, title: "Enterprise Security", description: "Role-based access control and audit logging for compliance." },
      { icon: Zap, title: "API-first Design", description: "RESTful APIs with comprehensive SDKs and webhook support." },
      { icon: BarChart3, title: "Unified Reporting", description: "Consolidated reporting across all payment channels and entities." },
      { icon: Globe2, title: "Cross-border Ready", description: "Seamlessly handle domestic and international payments." },
    ]}
  />
);

export default ZivonpayConnectPage;