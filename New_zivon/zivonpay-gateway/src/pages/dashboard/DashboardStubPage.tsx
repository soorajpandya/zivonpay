import { LucideIcon } from "lucide-react";

interface DashboardStubPageProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

const DashboardStubPage = ({ title, subtitle, icon: Icon }: DashboardStubPageProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Icon className="h-8 w-8 text-primary" />
      </div>

      <div className="rounded-lg border border-border bg-card p-16 text-center">
        <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          The {title.toLowerCase()} feature is being built. Check back soon for updates.
        </p>
      </div>
    </div>
  );
};

export default DashboardStubPage;
