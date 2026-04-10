import { motion } from "framer-motion";
import { CreditCard, Smartphone, Building2, Repeat, ShieldCheck, BarChart3, Globe2, Clock } from "lucide-react";
import ecosystemImg from "@/assets/section-ecosystem.jpg";


const features = [
  {
    icon: CreditCard,
    title: "All Payment Modes",
    description: "Accept UPI, credit/debit cards, net banking, wallets, EMI and BNPL — all in one integration.",
  },
  {
    icon: Smartphone,
    title: "UPI AutoPay",
    description: "Set up recurring payments through UPI mandate with seamless customer experience.",
  },
  {
    icon: Building2,
    title: "Payment Gateway",
    description: "Robust payment gateway with intelligent routing for highest success rates.",
  },
  {
    icon: Repeat,
    title: "Subscriptions",
    description: "Manage recurring billing with automated retry logic and dunning management.",
  },
  {
    icon: ShieldCheck,
    title: "Fraud Protection",
    description: "AI-powered fraud detection with real-time risk scoring and rule-based engine.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Real-time insights into payment performance, conversion rates and revenue trends.",
  },
  {
    icon: Globe2,
    title: "International Payments",
    description: "Accept payments from 100+ countries with automatic currency conversion.",
  },
  {
    icon: Clock,
    title: "Instant Settlement",
    description: "Get your money within minutes. No more waiting for T+2 settlement cycles.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-medium uppercase tracking-wider text-primary">Products</p>
            <h2 className="mt-3 text-3xl font-bold lg:text-5xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Everything you need to{" "}
              <span className="text-gradient">collect payments</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              From startups to enterprise — ZivonPay powers payments for businesses of every size with a complete suite of payment products.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="hidden lg:block overflow-hidden rounded-2xl border border-border/50 shadow-2xl"
          >
            <img 
              src={ecosystemImg} 
              alt="Payment Ecosystem" 
              className="w-full h-auto object-cover"
            />
          </motion.div>
        </div>


        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:bg-card/80"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary/20">
                <feature.icon size={22} />
              </div>
              <h3 className="mb-2 font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
