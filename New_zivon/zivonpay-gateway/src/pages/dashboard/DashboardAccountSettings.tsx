import { useState, useEffect } from "react";
import { CreditCard, Monitor, Briefcase, DollarSign, FileText, Bell, ShoppingCart, Edit, Settings as SettingsIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";


const SettingsCard = ({ icon: Icon, title, items }: { icon: React.ElementType; title: string; items: string[] }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-md bg-secondary">
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </div>
    <div className="divide-y divide-border">
      {items.map((item) => (
        <button key={item} className="w-full text-left py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors px-1">
          {item}
        </button>
      ))}
    </div>
  </div>
);

const DashboardAccountSettings = () => {
  const [twoStep, setTwoStep] = useState(true);
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    business_name: string;
    merchant_id: string;
    phone: string;
    email: string;
    gst_number: string;
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("email", user.email)
        .single();
      if (data) {
        setProfile({
          business_name: data.legal_business_name || data.customer_facing_business_name || "",
          merchant_id: data.id || "",
          phone: data.phone || "",
          email: data.email || user.email || "",
          gst_number: "",
        });
      } else {
        setProfile({
          business_name: "",
          merchant_id: "",
          phone: "",
          email: user.email || "",
          gst_number: "",
        });
      }
    };
    fetchProfile();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Account & Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account details and preferences</p>
          </div>
          <SettingsIcon className="h-8 w-8 text-primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-md bg-secondary flex items-center justify-center">
                <SettingsIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-primary font-medium">{profile?.business_name || "Your Business"}</div>
                <div className="text-xs text-muted-foreground">Owner</div>
                <div className="mt-4 text-xs text-muted-foreground">Merchant ID</div>
                <div className="mt-1 text-sm font-medium text-foreground">{profile?.merchant_id || "Not configured"}</div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="text-xs text-muted-foreground">Phone number</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{profile?.phone || "Not configured"}</span>
                  <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                    <Edit className="h-3 w-3" /> Edit
                  </button>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Login email</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{profile?.email || "Not configured"}</span>
                  <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                    <Edit className="h-3 w-3" /> Edit
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Password</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">•••••••••••</span>
                  <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                    <Edit className="h-3 w-3" /> Edit
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">2-step verification</div>
                  <div className="text-sm text-muted-foreground">Secure your account with a one-time verification code.</div>
                </div>
                <Switch checked={twoStep} onCheckedChange={setTwoStep} />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground">Account and product settings</h3>
              <a href="/developer-guide" className="text-sm text-muted-foreground hover:text-foreground">
                Documentation ↗
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsCard icon={CreditCard} title="Payment methods" items={["Cards", "UPI/QR", "Netbanking", "EMI", "Wallet", "Pay Later", "International payments"]} />
              <SettingsCard icon={Monitor} title="Website and app settings" items={["Business policy details", "Business website detail", "API keys", "Webhooks", "Applications"]} />
              <SettingsCard icon={Briefcase} title="Business settings" items={["Account details", "Business details", "GST details", "Customer support details", "Activation details", "Manage team", "Support tickets"]} />
              <SettingsCard icon={DollarSign} title="Payments and refunds" items={["Balances", "Credits", "Reminders", "Transaction limits", "Fee bearer", "Capture and refund settings"]} />
              <SettingsCard icon={FileText} title="Bank accounts and settlements" items={["Bank account details", "Settlement details"]} />
              <SettingsCard icon={Bell} title="Notification settings" items={["Email", "SMS", "WhatsApp"]} />
              <SettingsCard icon={ShoppingCart} title="Checkout settings" items={["Checkout Styling", "Checkout Features", "Payment Configuration"]} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAccountSettings;
