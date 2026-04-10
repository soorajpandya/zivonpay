import { useState, useEffect } from "react";
import {
  LinkIcon,
  Plus,
  Copy,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
  IndianRupee,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface PaymentLinkItem {
  id: string;
  amount: number;
  currency: string;
  accept_partial: boolean;
  first_min_partial_amount: number | null;
  status: string;
  description: string | null;
  reference_id: string | null;
  short_url: string | null;
  customer: Record<string, any> | null;
  expire_by: number | null;
  upi_link: boolean;
  notes: Record<string, any> | null;
  callback_url: string | null;
  callback_method: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    amount / 100
  );

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const generateShortId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

const DashboardPaymentLinks = () => {
  const { toast } = useToast();
  const [links, setLinks] = useState<PaymentLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create form state
  const [formData, setFormData] = useState({
    fixed_amount: true,
    amount: "",
    description: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    accept_partial: false,
    first_min_partial_amount: "",
    expire_days: "7",
    reference_id: "",
    upi_link: false,
    bank: "",
  });

  useEffect(() => {
    fetchLinks();

    const channel = supabase
      .channel("payment_links_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_links" },
        () => fetchLinks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fixed_amount && (!formData.amount || Number(formData.amount) <= 0)) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const shortId = generateShortId();
      const shortUrl = `https://zvpay.in/i/${shortId}`;

      const expireDays = parseInt(formData.expire_days) || 7;
      const expireBy = Math.floor(Date.now() / 1000) + expireDays * 86400;

      const customer: Record<string, any> | null =
        formData.customer_name || formData.customer_email || formData.customer_phone
          ? {
              name: formData.customer_name || null,
              email: formData.customer_email || null,
              contact: formData.customer_phone || null,
            }
          : null;

      const insertData: any = {
        amount: formData.fixed_amount ? Math.round(Number(formData.amount) * 100) : 0,
        currency: "INR",
        accept_partial: formData.accept_partial,
        first_min_partial_amount: formData.accept_partial && formData.first_min_partial_amount
          ? Math.round(Number(formData.first_min_partial_amount) * 100)
          : null,
        description: formData.description || null,
        reference_id: formData.reference_id || null,
        short_url: shortUrl,
        customer,
        expire_by: expireBy,
        upi_link: formData.upi_link,
        status: "created",
        notes: { fixed_amount: formData.fixed_amount, bank: formData.bank || null },
        callback_url: null,
        callback_method: null,
      };

      const { error } = await supabase.from("payment_links").insert([insertData] as any);
      if (error) throw error;

      toast({
        title: "Payment Link Created!",
        description: "Your payment link has been generated successfully.",
      });
      setShowCreateModal(false);
      setFormData({
        fixed_amount: true,
        amount: "",
        description: "",
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        accept_partial: false,
        first_min_partial_amount: "",
        expire_days: "7",
        reference_id: "",
        upi_link: false,
        bank: "",
      });
      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment link",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (link: PaymentLinkItem) => {
    const url = link.short_url || `https://zvpay.in/i/${link.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    toast({ title: "Copied!", description: "Payment link copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancelLink = async (linkId: string) => {
    try {
      const { error } = await (supabase
        .from("payment_links") as any)
        .update({ status: "cancelled" })
        .eq("id", linkId);

      if (error) throw error;
      toast({ title: "Link Cancelled", description: "The payment link has been cancelled." });
      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel payment link",
        variant: "destructive",
      });
    }
  };

  const handleSimulatePayment = async (link: PaymentLinkItem) => {
    try {
      const bankId = link.notes && typeof link.notes === 'object' ? (link.notes as any).bank : null;
      const bankMap: Record<string, string> = {
        jio: 'Jio Payments Bank',
        nsdl: 'NSDL Payments Bank',
        fino: 'Fino Payments Bank',
      };
      // Insert a payment
      const { error: paymentError } = await supabase.from("payments").insert([
        {
          amount: link.amount,
          currency: "INR",
          status: "captured",
          method: link.upi_link ? "upi" : "link",
          bank: bankId ? bankMap[bankId] || null : null,
          notes: {
            payment_link_id: link.id,
            simulated: true,
          },
        },
      ] as any);
      if (paymentError) throw paymentError;

      // Mark link as paid
      const { error: linkError } = await (supabase
        .from("payment_links") as any)
        .update({ status: "paid" })
        .eq("id", link.id);
      if (linkError) throw linkError;

      toast({
        title: "Payment Simulated",
        description: `${formatAmount(link.amount)} payment received for link "${link.description || link.id}".`,
      });
      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to simulate payment",
        variant: "destructive",
      });
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "created":
        return "default";
      case "paid":
        return "default";
      case "partially_paid":
        return "secondary";
      case "expired":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "created":
        return "Active";
      case "paid":
        return "Paid";
      case "partially_paid":
        return "Partial";
      case "expired":
        return "Expired";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);
  const paginatedLinks = links.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeLinks = links.filter((l) => l.status === "created");
  const paidLinks = links.filter((l) => l.status === "paid");
  const totalCollected = paidLinks.reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Links</h1>
          <p className="text-muted-foreground mt-1">
            Create and share payment links to collect payments instantly
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Payment Link
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{links.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLinks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Links</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidLinks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <Badge variant="outline">Amount</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalCollected)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Links Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Your Payment Links</h3>
          <p className="text-sm text-muted-foreground">
            View and manage all your payment links
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-12">
            <LinkIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No payment links yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first payment link to start collecting payments
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Payment Link
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLinks.map((link) => {
                  const isExpired =
                    link.expire_by &&
                    link.expire_by < Math.floor(Date.now() / 1000) &&
                    link.status === "created";
                  const displayStatus = isExpired ? "expired" : link.status;

                  return (
                    <TableRow key={link.id} className="hover:bg-accent/50">
                      <TableCell>
                        <p className="font-medium text-sm">
                          {link.description || "No description"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                          {link.id}
                        </p>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const bankId = link.notes && typeof link.notes === 'object' ? (link.notes as any).bank : null;
                          const bankMap: Record<string, { name: string; logo: string }> = {
                            jio: { name: 'Jio Payments Bank', logo: '/logos/jio.jpg' },
                            nsdl: { name: 'NSDL Payments Bank', logo: '/logos/nsdl.png' },
                            fino: { name: 'Fino Payments Bank', logo: '/logos/fino.png' },
                          };
                          const bank = bankId ? bankMap[bankId] : null;
                          return bank ? (
                            <div className="flex items-center gap-1.5">
                              <img src={bank.logo} alt={bank.name} className="h-5 w-5 rounded object-cover" />
                              <span className="text-xs">{bank.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        {link.amount > 0 ? (
                          <>
                            {formatAmount(link.amount)}
                            {link.accept_partial && (
                              <p className="text-xs text-muted-foreground font-normal">
                                Partial OK
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground font-normal">Any amount</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {link.customer ? (
                          <div>
                            <p className="text-sm">
                              {(link.customer as any).name || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(link.customer as any).email ||
                                (link.customer as any).contact ||
                                ""}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {link.upi_link ? "UPI" : "Standard"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusColor(displayStatus) as any}
                          className={`text-xs ${
                            displayStatus === "paid"
                              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                              : ""
                          }`}
                        >
                          {statusLabel(displayStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {link.expire_by
                          ? new Date(link.expire_by * 1000).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(link.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyLink(link)}
                          >
                            {copiedId === link.id ? (
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="mr-1 h-3.5 w-3.5" />
                            )}
                            {copiedId === link.id ? "Copied" : "Copy"}
                          </Button>
                          {link.status === "created" && !isExpired && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                                onClick={() => handleSimulatePayment(link)}
                              >
                                <Send className="mr-1 h-3.5 w-3.5" /> Simulate
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelLink(link.id)}
                              >
                                <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, links.length)} of{" "}
                  {links.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-9"
                      >
                        {page}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Payment Link Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Payment Link</DialogTitle>
            <DialogDescription>
              Generate a shareable link to collect payments from anyone
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLink} className="space-y-4">
            {/* Bank Selection */}
            <div className="space-y-2">
              <Label>Select Bank *</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'jio', name: 'Jio Payments Bank', logo: '/logos/jio.jpg' },
                  { id: 'nsdl', name: 'NSDL Payments Bank', logo: '/logos/nsdl.png' },
                  { id: 'fino', name: 'Fino Payments Bank', logo: '/logos/fino.png' },
                ].map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, bank: bank.id })}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-all ${
                      formData.bank === bank.id
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border bg-secondary/50 hover:border-muted-foreground'
                    }`}
                  >
                    <img src={bank.logo} alt={bank.name} className="h-7 w-7 rounded object-cover" />
                    <span className="text-[11px] font-medium text-foreground text-center leading-tight">{bank.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fixed Amount Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="fixed_amount"
                checked={formData.fixed_amount}
                onChange={(e) =>
                  setFormData({ ...formData, fixed_amount: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="fixed_amount">Fixed Amount</Label>
              <span className="text-xs text-muted-foreground">
                {formData.fixed_amount
                  ? "Customer pays the exact amount"
                  : "Customer enters any amount"}
              </span>
            </div>

            {/* Amount (only when fixed) */}
            {formData.fixed_amount && (
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  min="1"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="e.g., Invoice #1234, Monthly subscription"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            {/* Customer Info */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Customer Details (Optional)</Label>
              <div className="grid grid-cols-1 gap-2">
                <Input
                  placeholder="Customer Name"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_email: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Phone"
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_phone: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Link Type */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="upi_link"
                checked={formData.upi_link}
                onChange={(e) =>
                  setFormData({ ...formData, upi_link: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="upi_link">UPI Payment Link</Label>
            </div>

            {/* Accept Partial */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="accept_partial"
                checked={formData.accept_partial}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accept_partial: e.target.checked,
                  })
                }
                className="rounded"
              />
              <Label htmlFor="accept_partial">Accept Partial Payments</Label>
            </div>

            {formData.accept_partial && (
              <div className="space-y-2">
                <Label htmlFor="min_partial">Minimum Partial Amount (₹)</Label>
                <Input
                  id="min_partial"
                  type="number"
                  placeholder="100"
                  value={formData.first_min_partial_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      first_min_partial_amount: e.target.value,
                    })
                  }
                />
              </div>
            )}

            {/* Expiry */}
            <div className="space-y-2">
              <Label htmlFor="expire_days">Link Expiry</Label>
              <Select
                value={formData.expire_days}
                onValueChange={(value) =>
                  setFormData({ ...formData, expire_days: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="15">15 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference ID */}
            <div className="space-y-2">
              <Label htmlFor="reference_id">Reference ID (Optional)</Label>
              <Input
                id="reference_id"
                placeholder="e.g., INV-2026-001"
                value={formData.reference_id}
                onChange={(e) =>
                  setFormData({ ...formData, reference_id: e.target.value })
                }
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={creating || !formData.bank}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Create Link
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPaymentLinks;
