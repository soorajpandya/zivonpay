import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ecommerceImg from "@/assets/industry-ecommerce.jpg";
import educationImg from "@/assets/industry-education.jpg";
import saasImg from "@/assets/industry-saas.jpg";
import healthcareImg from "@/assets/industry-healthcare.jpg";

const industries = [
  {
    title: "E-Commerce",
    description: "Boost checkout conversions with 100+ payment modes, COD, and instant refunds.",
    image: ecommerceImg,
    stat: "₹50,000 Cr+",
    statLabel: "GMV processed",
    link: "/payment-gateway",
  },
  {
    title: "Education",
    description: "Collect fees, manage subscriptions, and automate recurring tuition payments.",
    image: educationImg,
    stat: "10,000+",
    statLabel: "Institutions",
    link: "/recurring-payments",
  },
  {
    title: "SaaS & Software",
    description: "Subscription billing, usage-based pricing, and international payment acceptance.",
    image: saasImg,
    stat: "99.99%",
    statLabel: "Uptime SLA",
    link: "/recurring-payments",
  },
  {
    title: "Healthcare",
    description: "Secure patient payments, insurance reconciliation, and EMI options for treatments.",
    image: healthcareImg,
    stat: "5,000+",
    statLabel: "Clinics onboarded",
    link: "/emi",
  },
];

const IndustriesSection = () => {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Industries</p>
          <h2 className="mt-3 text-3xl font-bold lg:text-5xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Powering every{" "}
            <span className="text-gradient">industry</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Tailored payment solutions for every business vertical — from startups to enterprise.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {industries.map((ind, i) => (
            <motion.div
              key={ind.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:-translate-y-1"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={ind.image}
                  alt={ind.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                {/* Stat overlay */}
                <div className="absolute bottom-3 left-4">
                  <p className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {ind.stat}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{ind.statLabel}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="mb-2 text-lg font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {ind.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {ind.description}
                </p>
                <Link
                  to={ind.link}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Learn more <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IndustriesSection;
