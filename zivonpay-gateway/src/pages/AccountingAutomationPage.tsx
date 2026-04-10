import { BarChart3, CreditCard, Shield, Zap, Building2, Clock } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-analytics.jpg";

const AccountingAutomationPage = () => (
  <ProductPageLayout
    badge="Accounting Automation"
    title="Automate Your"
    titleHighlight="Accounting"
    subtitle="Automatically sync payment data with your accounting software. Eliminate manual reconciliation and save hours."
    heroImage={heroImage}
    features={[
      { icon: BarChart3, title: "Auto Bookkeeping", description: "Automatically record every transaction in your accounting software." },
      { icon: CreditCard, title: "Payment Matching", description: "Smart matching of payments to invoices with AI-powered reconciliation." },
      { icon: Shield, title: "GST Compliant", description: "Auto-generate GST-compliant invoices and tax reports." },
      { icon: Zap, title: "Tally Integration", description: "Direct integration with Tally, Zoho Books, QuickBooks, and more." },
      { icon: Building2, title: "Multi-entity", description: "Handle accounting for multiple business entities automatically." },
      { icon: Clock, title: "Real-time Sync", description: "Payment data synced to your books in real-time, not batch." },
    ]}
  />
);

export default AccountingAutomationPage;