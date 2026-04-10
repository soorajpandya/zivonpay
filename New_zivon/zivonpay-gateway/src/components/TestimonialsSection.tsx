import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ankit Verma",
    role: "CTO, ShopEase",
    quote: "ZivonPay transformed our checkout experience. Our payment success rate jumped from 72% to 96% within the first month. The integration was seamless.",
    rating: 5,
    initials: "AV",
    metric: "96% success rate",
  },
  {
    name: "Priya Mehta",
    role: "Founder, EduLearn",
    quote: "The recurring payments feature handles our 50,000+ student subscriptions flawlessly. Instant settlements mean we never worry about cash flow.",
    rating: 5,
    initials: "PM",
    metric: "50K+ subscriptions",
  },
  {
    name: "Rajesh Kumar",
    role: "VP Finance, TravelNow",
    quote: "International payments were a nightmare before ZivonPay. Now we accept payments from 40+ countries with automatic FX conversion. Game changer.",
    rating: 5,
    initials: "RK",
    metric: "40+ countries",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="relative py-24">
      <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Testimonials</p>
          <h2 className="mt-3 text-3xl font-bold lg:text-5xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Loved by{" "}
            <span className="text-gradient">businesses</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Hear from the businesses that trust ZivonPay to power their payments every day.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {/* Quote icon */}
              <Quote size={40} className="absolute -right-2 -top-2 text-primary/5" />

              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} className="fill-primary text-primary" />
                ))}
              </div>

              {/* Quote text */}
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                "{t.quote}"
              </p>

              {/* Metric badge */}
              <div className="mb-6 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {t.metric}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 border-t border-border/30 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
