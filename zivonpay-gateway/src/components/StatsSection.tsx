import { motion } from "framer-motion";

const stats = [
  { value: "₹2L Cr+", label: "Processed Annually" },
  { value: "5L+", label: "Businesses Trust Us" },
  { value: "99.99%", label: "Uptime Guarantee" },
  { value: "<2s", label: "Average Settlement" },
];

const StatsSection = () => {
  return (
    <section className="relative border-y border-border/50 bg-card/50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-gradient text-3xl font-bold lg:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
