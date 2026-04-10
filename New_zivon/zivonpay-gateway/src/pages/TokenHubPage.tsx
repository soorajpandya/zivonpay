import { Lock, CreditCard, Shield, Zap, Repeat, Users } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-security.jpg";

const TokenHubPage = () => (
  <ProductPageLayout
    badge="Token Hub"
    title="Secure Card"
    titleHighlight="Tokenization"
    subtitle="RBI-compliant card tokenization solution. Store and manage tokenized cards for seamless repeat payments."
    heroImage={heroImage}
    features={[
      { icon: Lock, title: "RBI Compliant", description: "Fully compliant with RBI card-on-file tokenization guidelines." },
      { icon: CreditCard, title: "Multi-network Support", description: "Tokenize cards across Visa, Mastercard, RuPay, and Amex networks." },
      { icon: Shield, title: "Bank-grade Security", description: "Tokens stored with military-grade encryption and access controls." },
      { icon: Zap, title: "One-click Payments", description: "Enable frictionless repeat purchases with saved token references." },
      { icon: Repeat, title: "Token Lifecycle", description: "Manage token creation, renewal, and deletion automatically." },
      { icon: Users, title: "Customer Consent", description: "Built-in consent management for transparent tokenization." },
    ]}
  />
);

export default TokenHubPage;