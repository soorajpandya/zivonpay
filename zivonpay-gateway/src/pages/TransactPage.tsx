import { BarChart3, CreditCard, Shield, Zap, Globe2, Users } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-analytics.jpg";

const TransactPage = () => (
  <ProductPageLayout
    badge="Transact"
    title="Unified Transaction"
    titleHighlight="Management"
    subtitle="Manage all your transactions from a single dashboard. Track, reconcile, and optimize your payment operations."
    heroImage={heroImage}
    features={[
      { icon: BarChart3, title: "Real-time Dashboard", description: "Monitor transactions, success rates, and revenue in real-time." },
      { icon: CreditCard, title: "Multi-channel View", description: "See all payment channels — online, offline, and links — in one place." },
      { icon: Shield, title: "Auto Reconciliation", description: "Automated bank reconciliation with mismatch detection." },
      { icon: Zap, title: "Smart Alerts", description: "Get notified on payment failures, chargebacks, and anomalies." },
      { icon: Globe2, title: "Export & Reports", description: "Generate custom reports and export data in multiple formats." },
      { icon: Users, title: "Team Access", description: "Role-based access for finance, operations, and management teams." },
    ]}
  />
);

export default TransactPage;