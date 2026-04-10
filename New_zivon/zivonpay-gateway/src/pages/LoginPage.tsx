import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import zivonpayLogo from "@/assets/zivonpay-logo.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <img src={zivonpayLogo} alt="ZivonPay" className="h-10 w-auto brightness-0 invert" />
          <span className="text-xl font-bold text-primary-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            ZivonPay
          </span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-primary-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Welcome back
          </h2>
          <p className="mt-3 text-primary-foreground/70">
            Access your dashboard, manage transactions, and monitor your payment infrastructure in real time.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/50">© {new Date().getFullYear()} ZivonPay. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="mb-8 lg:hidden flex items-center gap-2">
            <img src={zivonpayLogo} alt="ZivonPay" className="h-10 w-auto" />
            <span className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              ZivonPay
            </span>
          </div>

          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your credentials to access the dashboard
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/contact-sales" className="font-medium text-primary hover:underline">
              Contact Sales
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
