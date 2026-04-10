import { motion } from "framer-motion";
import { Building2, Headphones, Lock, Gauge, ArrowRight, TrendingUp, Users, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import collaborationImg from "@/assets/section-collaboration.jpg";
import integrationImg from "@/assets/section-integration.jpg";

const benefits = [
  { icon: Building2, title: "Custom Solutions", desc: "Tailor-made payment solutions for your unique business needs." },
  { icon: Headphones, title: "24/7 Support", desc: "Dedicated account manager and round-the-clock technical support." },
  { icon: Lock, title: "Bank-Grade Security", desc: "PCI DSS Level 1 compliance with end-to-end encryption." },
  { icon: Gauge, title: "99.99% Uptime SLA", desc: "Enterprise-grade infrastructure with guaranteed availability." },
];

const scaleStats = [
  { value: "10M+", label: "Peak TPS", icon: TrendingUp },
  { value: "500+", label: "Enterprise Clients", icon: Users },
  { value: "99.99%", label: "Uptime", icon: Server },
];

const EnterpriseSection = () => {
  return (
    <section id="enterprise" className="relative overflow-hidden border-t border-border/50 py-28">
      {/* Background scale pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute -right-40 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-primary/5 blur-[150px]" />
      <div className="absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-primary/3 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Enterprise</p>
          <h2 className="mt-3 text-4xl font-bold lg:text-6xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Built for{" "}
            <span className="text-gradient">scale</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Trusted by India's largest enterprises. Handle millions of transactions daily with zero downtime.
          </p>
        </motion.div>

        {/* Live scale stats ticker */}
        <div className="mt-16 grid grid-cols-3 gap-4">
          {scaleStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-6 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <stat.icon size={24} className="mx-auto mb-3 text-primary" />
                <p className="text-gradient text-3xl font-bold lg:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Animated throughput bar visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 overflow-hidden rounded-2xl border border-border/50 bg-card p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live Transaction Throughput</p>
              <p className="mt-1 text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                12,847 <span className="text-sm font-normal text-muted-foreground">txn/sec</span>
              </p>
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Live
            </div>
          </div>
          <div className="flex items-end gap-1">
            {Array.from({ length: 40 }).map((_, i) => {
              const h = 20 + Math.sin(i * 0.5) * 30 + Math.random() * 25;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}px` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.02, duration: 0.4 }}
                  className="flex-1 rounded-t-sm"
                  style={{
                    background: `linear-gradient(to top, hsl(var(--primary) / 0.15), hsl(var(--primary) / ${h / 100 * 0.6}))`,
                  }}
                />
              );
            })}
          </div>
        </motion.div>

        {/* Benefit cards */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary/20">
                <b.icon size={22} />
              </div>
              <h4 className="font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{b.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Visual row */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl border border-border/50"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <img src={collaborationImg} alt="Enterprise collaboration" className="h-56 w-full object-cover lg:h-64" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl border border-border/50"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <img src={integrationImg} alt="Enterprise integration" className="h-56 w-full object-cover lg:h-64" />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Button className="gap-2 bg-primary px-10 text-primary-foreground shadow-lg hover:bg-primary/90" size="lg" style={{ boxShadow: "var(--shadow-glow)" }} asChild>
            <Link to="/contact-sales">Talk to Sales <ArrowRight size={18} /></Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default EnterpriseSection;
