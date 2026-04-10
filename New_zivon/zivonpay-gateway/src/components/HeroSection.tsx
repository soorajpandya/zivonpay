import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import dashboardImg from "@/assets/hero-dashboard-mockup.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-x-hidden pt-24" style={{ background: "var(--gradient-hero)" }}>
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      {/* Glow orb */}
      <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            Trusted by 5,00,000+ Businesses across India
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Accept Payments{" "}
            <span className="text-gradient">Seamlessly</span>
            <br />
            Grow Fearlessly
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            ZivonPay is India's most reliable payment gateway. Accept payments via UPI, cards, net banking, wallets and more with 99.99% uptime and instant settlements.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Button size="lg" className="gap-2 bg-primary px-8 text-primary-foreground shadow-lg hover:bg-primary/90" style={{ boxShadow: "var(--shadow-glow)" }} asChild>
              <Link to="/login">
                Start Accepting Payments
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border px-8 text-foreground hover:bg-secondary" asChild>
              <Link to="/contact-sales">Contact Sales</Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-primary" />
              PCI DSS Certified
            </div>
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              Instant Settlement
            </div>
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              100+ Payment Modes
            </div>
          </motion.div>

          {/* Dashboard image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-20 w-full max-w-5xl"
          >
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-2 shadow-2xl" style={{ boxShadow: "var(--shadow-card)" }}>
              <img
                src={dashboardImg}
                alt="ZivonPay Payment Analytics Dashboard"
                className="w-full rounded-lg object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
