import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const plans = [
  {
    name: "Starter",
    price: "1.99%",
    description: "Perfect for small businesses and startups",
    features: ["UPI, Cards, Net Banking", "Standard checkout", "Email support", "Basic analytics", "T+1 settlements"],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "1.49%",
    description: "For growing businesses needing more",
    features: ["Everything in Starter", "Custom checkout", "Priority support", "Advanced analytics", "Instant settlements", "Subscription billing", "Fraud protection"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large-scale operations",
    features: ["Everything in Growth", "Dedicated account manager", "Custom integrations", "SLA guarantee", "Volume discounts", "White-label checkout"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold lg:text-6xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Simple, <span className="text-gradient">transparent</span> pricing
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mx-auto mt-4 max-w-xl text-muted-foreground">
            No hidden fees. No setup charges. Pay only for successful transactions.
          </motion.p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`relative rounded-xl border p-8 ${plan.highlighted ? "border-primary/50 bg-card" : "border-border/50 bg-card/50"}`}
                style={{ boxShadow: plan.highlighted ? "var(--shadow-glow)" : "var(--shadow-card)" }}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{plan.price}</span>
                  {plan.price !== "Custom" && <span className="ml-1 text-sm text-muted-foreground">per transaction</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                      <Check size={16} className="mt-0.5 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className={`mt-8 w-full ${plan.highlighted ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`} size="lg" asChild>
                  <Link to="/login">{plan.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Need a custom plan?</h2>
          <p className="mt-4 text-muted-foreground">We offer volume-based pricing for enterprise businesses.</p>
          <Button size="lg" className="mt-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link to="/contact-sales">Contact Sales <ArrowRight size={18} /></Link>
          </Button>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default PricingPage;
