import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, CreditCard, TrendingUp, Settings } from "lucide-react";
import zivonpayLogo from "@/assets/zivonpay-logo.png";

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={zivonpayLogo} alt="ZivonPay" className="h-8 w-auto" />
              <span className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                ZivonPay
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Manage your payments and transactions.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹0.00</div>
              <p className="text-xs text-muted-foreground">No transactions yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Total transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">No data available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active APIs</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">API keys active</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with ZivonPay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Button variant="outline" className="h-auto flex-col items-start p-4">
                <span className="font-semibold mb-1">Create Payment Link</span>
                <span className="text-xs text-muted-foreground">Generate a quick payment link</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col items-start p-4">
                <span className="font-semibold mb-1">View Transactions</span>
                <span className="text-xs text-muted-foreground">Monitor all transactions</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col items-start p-4">
                <span className="font-semibold mb-1">API Documentation</span>
                <span className="text-xs text-muted-foreground">Integrate with your app</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">User ID</span>
                <span className="text-sm font-mono text-xs">{user?.id}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Account Status</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
