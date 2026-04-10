import { BarChart3, CreditCard, Shield, Zap, Users, Clock } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-analytics.jpg";

const ExcelPaymentPluginPage = () => (
  <ProductPageLayout
    badge="Excel Payment Plugin"
    title="Collect Payments from"
    titleHighlight="Excel"
    subtitle="Send payment links directly from Microsoft Excel. Perfect for businesses managing invoices and collections in spreadsheets."
    heroImage={heroImage}
    features={[
      { icon: BarChart3, title: "Excel Integration", description: "Install our Excel plugin and send payment links from your spreadsheet." },
      { icon: CreditCard, title: "Bulk Collections", description: "Send payment requests to hundreds of customers at once." },
      { icon: Shield, title: "Auto-reconciliation", description: "Payment status updates automatically in your Excel sheet." },
      { icon: Zap, title: "No Code Required", description: "Simple plugin installation — no technical knowledge needed." },
      { icon: Users, title: "Customer Import", description: "Import customer details from your existing Excel data." },
      { icon: Clock, title: "Reminders", description: "Automated payment reminders for pending collections." },
    ]}
  />
);

export default ExcelPaymentPluginPage;