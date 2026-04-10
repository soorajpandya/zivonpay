import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Phone, User, MessageSquare, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface FormErrors {
  name?: string;
  phone?: string;
  message?: string;
}

const ContactSalesPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (values: typeof form): FormErrors => {
    const errs: FormErrors = {};
    if (!values.name.trim()) errs.name = "Full name is required";
    else if (values.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    else if (values.name.trim().length > 100) errs.name = "Name must be less than 100 characters";

    if (!values.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\+?[0-9]{7,15}$/.test(values.phone.replace(/[\s-]/g, "")))
      errs.phone = "Enter a valid phone number (7–15 digits)";

    if (!values.message.trim()) errs.message = "Message is required";
    else if (values.message.trim().length < 10) errs.message = "Message must be at least 10 characters";
    else if (values.message.trim().length > 1000) errs.message = "Message must be less than 1000 characters";

    return errs;
  };

  const isValid = Object.keys(validate(form)).length === 0;

  const handleChange = (field: string, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) {
      setErrors(validate(next));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(form));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setTouched({ name: true, phone: true, message: true });
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);

    // Simulate API call — replace with real backend integration
    await new Promise((r) => setTimeout(r, 1200));

    setIsSubmitting(false);
    setSubmitted(true);
    toast({
      title: "Request submitted!",
      description: "Our sales team will call you shortly.",
    });
  };

  const handleReset = () => {
    setForm({ name: "", phone: "", message: "" });
    setErrors({});
    setTouched({});
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative pt-28 pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            {/* Back link */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </motion.div>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 border border-primary/20">
                Talk to Sales
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Let's Grow Your Business <span className="text-primary">Together</span>
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Fill in your details and our sales team will get back to you within 2 hours. We'd love to understand your payment needs.
              </p>
            </motion.div>

            {/* Form / Success */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border/50 rounded-2xl p-6 md:p-10 shadow-lg"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Thank You!</h2>
                  <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                    Our sales team will call you shortly. We typically respond within 2 hours during business hours.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={handleReset} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                      Submit Another Request
                    </Button>
                    <Button asChild>
                      <Link to="/">Back to Home</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                      <User className="w-4 h-4 text-muted-foreground" /> Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      onBlur={() => handleBlur("name")}
                      className={`bg-secondary/30 border-border/50 h-12 ${touched.name && errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      maxLength={100}
                    />
                    {touched.name && errors.name && (
                      <p className="text-xs text-destructive mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="w-4 h-4 text-muted-foreground" /> Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={form.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9+\s-]/g, "");
                        handleChange("phone", val);
                      }}
                      onBlur={() => handleBlur("phone")}
                      className={`bg-secondary/30 border-border/50 h-12 ${touched.phone && errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      maxLength={20}
                    />
                    {touched.phone && errors.phone && (
                      <p className="text-xs text-destructive mt-1">{errors.phone}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" /> Message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your business and payment requirements..."
                      value={form.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      onBlur={() => handleBlur("message")}
                      rows={5}
                      className={`bg-secondary/30 border-border/50 resize-none ${touched.message && errors.message ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center">
                      {touched.message && errors.message ? (
                        <p className="text-xs text-destructive">{errors.message}</p>
                      ) : (
                        <span />
                      )}
                      <span className="text-xs text-muted-foreground">{form.message.length}/1000</span>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2 font-semibold text-base h-12"
                    disabled={!isValid || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Request <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By submitting, you agree to our{" "}
                    <Link to="/privacy-policy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    . We'll never share your information.
                  </p>
                </form>
              )}
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center"
            >
              {[
                { label: "Response Time", value: "< 2 Hours" },
                { label: "Businesses Served", value: "5,00,000+" },
                { label: "Support", value: "24/7 Available" },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-card/50 border border-border/30">
                  <div className="text-lg font-bold text-primary">{item.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactSalesPage;
