import { motion } from "framer-motion";
import { ShieldCheck, Zap, Globe2 } from "lucide-react";
import securityImg from "@/assets/section-security-trust.jpg";
import settleImg from "@/assets/section-instant-settle.jpg";
import globalImg from "@/assets/section-global-network.jpg";

const highlights = [
  {
    icon: ShieldCheck,
    title: "Bank-Grade Security",
    description: "PCI DSS Level 1 certified with end-to-end encryption, tokenization, and AI-powered fraud detection keeping every transaction safe.",
    image: securityImg,
    alt: "Secure payment processing with encryption",
  },
  {
    icon: Zap,
    title: "Instant Settlements",
    description: "Get your money within minutes, not days. Real-time settlement processing so your business cash flow never stops.",
    image: settleImg,
    alt: "Instant settlement and fast money transfer",
  },
  {
    icon: Globe2,
    title: "Global Payment Network",
    description: "Accept payments from 100+ countries with automatic currency conversion and local payment method support worldwide.",
    image: globalImg,
    alt: "Global payment network across countries",
  },
];

const WhyZivonPaySection = () => {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Why ZivonPay</p>
          <h2 className="mt-3 text-3xl font-bold lg:text-5xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Built for{" "}
            <span className="text-gradient">trust & speed</span>
          </h2>
        </motion.div>

        <div className="space-y-20">
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`grid items-center gap-12 lg:grid-cols-2 ${i % 2 === 1 ? "lg:direction-rtl" : ""}`}
            >
              {/* Image - alternating sides */}
              <div className={`overflow-hidden rounded-2xl border border-border/50 ${i % 2 === 1 ? "lg:order-2" : ""}`} style={{ boxShadow: "var(--shadow-card)" }}>
                <img
                  src={item.image}
                  alt={item.alt}
                  className="h-72 w-full object-cover transition-transform duration-700 hover:scale-105 lg:h-80"
                />
              </div>

              {/* Content */}
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                  <item.icon size={28} />
                </div>
                <h3 className="mb-3 text-2xl font-bold lg:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {item.title}
                </h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyZivonPaySection;
