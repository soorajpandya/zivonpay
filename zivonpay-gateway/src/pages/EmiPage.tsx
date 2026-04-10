import { CreditCard, BarChart3, Shield, Users, Zap, Building2 } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-emi-bnpl.jpg";

const EmiPage = () => (
  <ProductPageLayout
    badge="EMI Solutions"
    title="Boost Sales with"
    titleHighlight="EMI Options"
    subtitle="Offer easy EMI options on credit cards, debit cards, and cardless EMI. Increase average order value and conversion."
    heroImage={heroImage}
    features={[
      { icon: CreditCard, title: "Card EMI", description: "EMI options on credit and debit cards from all major banks." },
      { icon: Users, title: "Cardless EMI", description: "EMI without credit cards through partnerships with leading NBFCs." },
      { icon: BarChart3, title: "No-cost EMI", description: "Offer no-cost EMI by subsidizing interest through brand partnerships." },
      { icon: Shield, title: "Bank Partnerships", description: "Pre-approved EMI offers from 15+ partner banks." },
      { icon: Zap, title: "Instant Approval", description: "Real-time EMI eligibility check during checkout." },
      { icon: Building2, title: "Custom Tenure", description: "Flexible tenure options from 3 to 24 months." },
    ]}
  />
);

export default EmiPage;