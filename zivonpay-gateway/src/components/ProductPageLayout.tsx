import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import sectionCollaboration from "@/assets/section-collaboration.jpg";
import sectionIntegration from "@/assets/section-integration.jpg";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ProductPageLayoutProps {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  features: Feature[];
  ctaText?: string;
  heroImage?: string;
  sectionImages?: string[];
}

const ProductPageLayout = ({ badge, title, titleHighlight, subtitle, features, ctaText = "Get Started", heroImage, sectionImages }: ProductPageLayoutProps) => {
  // Split features into two groups for alternating image-text sections
  const topFeatures = features.slice(0, 3);
  const bottomFeatures = features.slice(3, 6);

  // Use provided section images or defaults
  const img1 = sectionImages?.[0] || heroImage || sectionIntegration;
  const img2 = sectionImages?.[1] || sectionCollaboration;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                {badge}
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {title} <span className="text-gradient">{titleHighlight}</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="mt-6 text-lg text-muted-foreground">
                {subtitle}
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Button size="lg" className="gap-2 bg-primary px-8 text-primary-foreground hover:bg-primary/90" style={{ boxShadow: "var(--shadow-glow)" }}>
                  {ctaText} <ArrowRight size={18} />
                </Button>
                <Button size="lg" variant="outline" className="border-border px-8 text-foreground hover:bg-secondary" asChild>
                  <Link to="/contact-sales">Contact Sales</Link>
                </Button>
              </motion.div>
            </div>

            {heroImage && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="hidden lg:block"
              >
                <div className="overflow-hidden rounded-xl border border-border/30 shadow-2xl" style={{ boxShadow: "var(--shadow-card)" }}>
                  <img src={heroImage} alt={titleHighlight} className="h-auto w-full object-cover" />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* First Feature Section — Image Left, Content Right */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="overflow-hidden rounded-xl border border-border/30" style={{ boxShadow: "var(--shadow-card)" }}>
                <img src={img1} alt={`${titleHighlight} features`} className="h-auto w-full object-cover" />
              </div>
            </motion.div>

            <div className="space-y-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Key <span className="text-gradient">Features</span>
              </motion.h2>
              {topFeatures.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 rounded-lg border border-border/50 bg-card p-4 transition-all hover:border-primary/30"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Second Feature Section — Content Left, Image Right */}
      {bottomFeatures.length > 0 && (
        <section className="border-t border-border/50 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="order-2 lg:order-1 space-y-6">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Why Choose <span className="text-gradient">ZivonPay</span>
                </motion.h2>
                {bottomFeatures.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 rounded-lg border border-border/50 bg-card p-4 transition-all hover:border-primary/30"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <feature.icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="order-1 lg:order-2"
              >
                <div className="overflow-hidden rounded-xl border border-border/30" style={{ boxShadow: "var(--shadow-card)" }}>
                  <img src={img2} alt={`Why choose ${titleHighlight}`} className="h-auto w-full object-cover" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="border-t border-border/50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Ready to get started with <span className="text-gradient">ZivonPay</span>?
          </h2>
          <p className="mt-4 text-muted-foreground">Join 5,00,000+ businesses already using ZivonPay to grow their revenue.</p>
          <Button size="lg" className="mt-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link to="/login">Start Now <ArrowRight size={18} /></Link>
          </Button>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ProductPageLayout;