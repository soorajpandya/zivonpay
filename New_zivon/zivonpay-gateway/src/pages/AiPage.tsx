import { Zap, Shield, BarChart3, Globe2, CreditCard, Users } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-ai.jpg";

const AiPage = () => (
  <ProductPageLayout
    badge="AI-Powered Payments"
    title="Smarter Payments with"
    titleHighlight="AI & ML"
    subtitle="Leverage artificial intelligence to improve payment success rates, detect fraud, and optimize customer experience."
    heroImage={heroImage}
    features={[
      { icon: Zap, title: "Smart Routing", description: "AI selects the optimal payment route for maximum success rate." },
      { icon: Shield, title: "Fraud Detection", description: "Real-time ML models detect and prevent fraudulent transactions." },
      { icon: BarChart3, title: "Predictive Analytics", description: "Predict payment trends and customer behavior with AI insights." },
      { icon: Globe2, title: "Dynamic Pricing", description: "AI-optimized pricing for payment plans and offers." },
      { icon: CreditCard, title: "Smart Retry", description: "Intelligent retry logic that recovers failed payments automatically." },
      { icon: Users, title: "Personalization", description: "Show the most relevant payment modes to each customer." },
    ]}
  />
);

export default AiPage;