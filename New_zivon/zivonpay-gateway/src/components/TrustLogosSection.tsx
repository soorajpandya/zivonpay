import { motion } from "framer-motion";
import { Shield, Award, BadgeCheck } from "lucide-react";

const paymentPartners = [
  "Visa", "Mastercard", "RuPay", "UPI", "Paytm", "PhonePe",
  "Google Pay", "Amazon Pay", "HDFC Bank", "ICICI Bank", "SBI", "Axis Bank",
];

const certifications = [
  { icon: Shield, label: "PCI DSS Level 1" },
  { icon: Award, label: "ISO 27001 Certified" },
  { icon: BadgeCheck, label: "RBI Authorized" },
];

const TrustLogosSection = () => {
  return (
    <section className="relative border-b border-border/30 py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 flex flex-wrap items-center justify-center gap-6"
        >
          {certifications.map((cert) => (
            <div
              key={cert.label}
              className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-medium text-primary"
            >
              <cert.icon size={16} />
              {cert.label}
            </div>
          ))}
        </motion.div>

        {/* Partner logos marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="mb-8 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Supported Payment Partners & Banks
          </p>
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-background to-transparent" />
            <div className="flex animate-marquee gap-8">
              {[...paymentPartners, ...paymentPartners].map((partner, i) => (
                <div
                  key={`${partner}-${i}`}
                  className="flex h-14 min-w-[140px] items-center justify-center rounded-lg border border-border/30 bg-card/50 px-6 text-sm font-semibold text-muted-foreground/70 transition-colors hover:border-primary/20 hover:text-foreground"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustLogosSection;
