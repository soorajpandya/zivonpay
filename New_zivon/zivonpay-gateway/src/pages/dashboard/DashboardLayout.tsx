import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Home, CreditCard, Landmark, Send, FileText, LinkIcon, Layout,
  ExternalLink, Smartphone, Receipt, QrCode, Repeat, Users, Tag,
  Code, Settings as SettingsIcon, Menu, X, ChevronDown, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import zivonpayLogo from "@/assets/zivonpay-logo.png";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
  collapsible?: boolean;
}

const sidebarSections: SidebarSection[] = [
  {
    items: [
      { id: "home", label: "Home", icon: <Home className="h-4 w-4" />, path: "/dashboard" },
      { id: "transactions", label: "Transactions", icon: <CreditCard className="h-4 w-4" />, path: "/dashboard/transactions" },
      { id: "settlements", label: "Settlements", icon: <Landmark className="h-4 w-4" />, path: "/dashboard/settlements" },
      { id: "payouts", label: "Payouts", icon: <Send className="h-4 w-4" />, path: "/dashboard/payouts" },
      { id: "reports", label: "Reports", icon: <FileText className="h-4 w-4" />, path: "/dashboard/reports" },
    ],
  },
  {
    title: "Payment Products",
    collapsible: true,
    items: [
      { id: "payment-links", label: "Payment Links", icon: <LinkIcon className="h-4 w-4" />, path: "/dashboard/payment-links" },
      // { id: "payment-pages", label: "Payment Pages", icon: <Layout className="h-4 w-4" />, path: "/dashboard/payment-pages" },
      // { id: "zivonpay-me", label: "ZivonPay.me Link", icon: <ExternalLink className="h-4 w-4" />, path: "/dashboard/zivonpay-me" },
      // { id: "pos", label: "POS", icon: <Smartphone className="h-4 w-4" />, path: "/dashboard/pos" },
      // { id: "invoices", label: "Invoices", icon: <Receipt className="h-4 w-4" />, path: "/dashboard/invoices" },
      // { id: "payment-button", label: "Payment Button", icon: <CreditCard className="h-4 w-4" />, path: "/dashboard/payment-button" },
      { id: "qr-codes", label: "QR Codes", icon: <QrCode className="h-4 w-4" />, path: "/dashboard/qr-codes" },
      // { id: "subscriptions", label: "Subscriptions", icon: <Repeat className="h-4 w-4" />, path: "/dashboard/subscriptions" },
    ],
  },
  // {
  //   title: "Customer Products",
  //   collapsible: true,
  //   items: [
  //     { id: "customers", label: "Customers", icon: <Users className="h-4 w-4" />, path: "/dashboard/customers" },
  //     { id: "offers", label: "Offers", icon: <Tag className="h-4 w-4" />, path: "/dashboard/offers" },
  //     { id: "developers", label: "Developers", icon: <Code className="h-4 w-4" />, path: "/dashboard/developers" },
  //   ],
  // },
  {
    title: "Settings",
    items: [
      { id: "account-settings", label: "Account & Settings", icon: <SettingsIcon className="h-4 w-4" />, path: "/dashboard/account-settings" },
    ],
  },
];

const getActivePageFromPath = (pathname: string): string => {
  // Match exact /dashboard to "home"
  if (pathname === "/dashboard" || pathname === "/dashboard/") return "home";
  const segment = pathname.replace("/dashboard/", "");
  return segment;
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = getActivePageFromPath(location.pathname);

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
        <img src={zivonpayLogo} alt="ZivonPay" className="h-8 w-auto" />
        <span className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          ZivonPay
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {sidebarSections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <button
                onClick={() => section.collapsible && toggleSection(section.title!)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                {section.title}
                {section.collapsible && (
                  collapsedSections[section.title] ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
            {!(section.title && collapsedSections[section.title]) && (
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      activePage === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Test Mode</span>
          <Switch checked={testMode} onCheckedChange={setTestMode} />
        </div>
        {testMode && (
          <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-2">
            <p className="text-[10px] text-yellow-400">Test mode is active. No real transactions will be processed.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-card">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-64 h-full bg-card border-r border-border">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Payments</span>
            <span className="text-sm text-muted-foreground">|</span>
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Partners</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">ZP</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
