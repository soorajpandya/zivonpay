import { useState, useEffect } from "react";
import { QrCode, Plus, Download, CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

interface QRCodeItem {
  id: string;
  type: string;
  name: string;
  usage: 'single_use' | 'multiple_use';
  payment_amount: number | null;
  payments_amount_received: number;
  payments_count_received: number;
  status: 'active' | 'closed';
  created_at: number;
  image_url: string;
  description: string;
  fixed_amount: boolean;
  customer_id: string | null;
  close_by: number | null;
  notes: Record<string, any> | null;
}

const DashboardQRCodes = () => {
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingQR, setViewingQR] = useState<QRCodeItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Create form state
  const [formData, setFormData] = useState({
    name: '',
    usage: 'multiple_use' as 'single_use' | 'multiple_use',
    fixed_amount: false,
    payment_amount: '',
    description: '',
    bank: '',
  });

  useEffect(() => {
    fetchQRCodes();

    // Real-time subscription so scan state updates live
    const channel = supabase
      .channel('qr_codes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'qr_codes' },
        () => {
          fetchQRCodes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQRCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQrCodes((data || []).map((row: any) => ({
        ...row,
        created_at: new Date(row.created_at).getTime() / 1000,
        image_url: row.image_url || '',
        description: row.description || '',
        payments_amount_received: row.payments_amount_received || 0,
        payments_count_received: row.payments_count_received || 0,
      })));
    } catch (error: any) {
      setQrCodes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const insertData: any = {
        type: 'upi_qr',
        name: formData.name,
        usage: formData.usage,
        description: formData.description,
        fixed_amount: formData.fixed_amount,
        status: 'active',
        notes: { bank: formData.bank },
      };

      if (formData.fixed_amount && formData.payment_amount) {
        insertData.payment_amount = Number(formData.payment_amount) * 100;
      }

      const { error } = await supabase.from('qr_codes').insert([insertData]);
      if (error) throw error;

      toast({
        title: 'QR Code Created!',
        description: 'Your QR code has been generated successfully.',
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        usage: 'multiple_use',
        fixed_amount: false,
        payment_amount: '',
        description: '',
        bank: '',
      });
      fetchQRCodes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create QR code',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCloseQR = async (qrId: string) => {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ status: 'closed' })
        .eq('id', qrId);

      if (error) throw error;

      toast({
        title: 'QR Code Closed',
        description: 'The QR code has been closed successfully.',
      });
      fetchQRCodes();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to close QR code',
        variant: 'destructive',
      });
    }
  };

  const handleSimulatePayment = async (qr: QRCodeItem) => {
    try {
      const paymentAmount = qr.fixed_amount && qr.payment_amount ? qr.payment_amount : 10000;
      const bankId = qr.notes && typeof qr.notes === 'object' ? (qr.notes as any).bank : null;
      const bankMap: Record<string, string> = {
        jio: 'Jio Payments Bank',
        nsdl: 'NSDL Payments Bank',
        fino: 'Fino Payments Bank',
      };

      // Insert into payments table
      const { error: paymentError } = await supabase.from('payments').insert([{
        amount: paymentAmount,
        currency: 'INR',
        status: 'captured',
        method: 'upi',
        bank: bankId ? bankMap[bankId] || null : null,
        notes: { qr_code_id: qr.id, qr_name: qr.name, simulated: true },
      }]);

      if (paymentError) throw paymentError;

      // Update QR code received amounts
      const { error: qrError } = await supabase
        .from('qr_codes')
        .update({
          payments_count_received: qr.payments_count_received + 1,
          payments_amount_received: qr.payments_amount_received + paymentAmount,
        })
        .eq('id', qr.id);

      if (qrError) throw qrError;

      toast({
        title: 'Payment Simulated',
        description: `₹${(paymentAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} payment added to "${qr.name}". Check Transactions page.`,
      });
      fetchQRCodes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to simulate payment',
        variant: 'destructive',
      });
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">QR Codes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage UPI QR codes for payments
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create QR Code
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qrCodes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active QR Codes</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {qrCodes.filter((qr) => qr.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <Badge variant="outline">Amount</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(
                qrCodes.reduce((sum, qr) => sum + qr.payments_amount_received, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Codes Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Your QR Codes</h3>
          <p className="text-sm text-muted-foreground">View and manage all your generated QR codes</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="text-center py-12">
            <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No QR codes yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first QR code to start accepting payments
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create QR Code
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>QR</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrCodes
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map((qr) => {
                    const bankId = qr.notes && typeof qr.notes === 'object' ? (qr.notes as any).bank : null;
                    const bankMap: Record<string, { name: string; logo: string }> = {
                      jio: { name: 'Jio Payments Bank', logo: '/logos/jio.jpg' },
                      nsdl: { name: 'NSDL Payments Bank', logo: '/logos/nsdl.png' },
                      fino: { name: 'Fino Payments Bank', logo: '/logos/fino.png' },
                    };
                    const bank = bankId ? bankMap[bankId] : null;
                    return (
                      <TableRow key={qr.id} className="hover:bg-accent/50">
                        <TableCell>
                          <div className="w-10 h-10 bg-white p-1 rounded flex items-center justify-center">
                            <QRCodeSVG
                              value={`upi://pay?pn=${encodeURIComponent(qr.name || 'ZivonPay')}&am=${qr.fixed_amount && qr.payment_amount ? (qr.payment_amount / 100).toFixed(2) : '0'}&cu=INR&tn=${encodeURIComponent(qr.id)}`}
                              size={32}
                              level="M"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{qr.name}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">{qr.id}</p>
                        </TableCell>
                        <TableCell>
                          {bank ? (
                            <div className="flex items-center gap-1.5">
                              <img src={bank.logo} alt={bank.name} className="h-5 w-5 rounded object-cover" />
                              <span className="text-xs">{bank.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {qr.usage === 'multiple_use' ? 'Multiple' : 'Single'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={qr.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {qr.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {qr.fixed_amount && qr.payment_amount ? formatAmount(qr.payment_amount) : '—'}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold">{formatAmount(qr.payments_amount_received)}</p>
                          <p className="text-xs text-muted-foreground">{qr.payments_count_received} payments</p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(qr.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => setViewingQR(qr)}>
                              <Download className="mr-1 h-3.5 w-3.5" /> View
                            </Button>
                            {qr.status === 'active' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                                  onClick={() => handleSimulatePayment(qr)}
                                >
                                  <Zap className="mr-1 h-3.5 w-3.5" /> Simulate Payment
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleCloseQR(qr.id)}>
                                  <XCircle className="mr-1 h-3.5 w-3.5" /> Close
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
            {qrCodes.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, qrCodes.length)} of {qrCodes.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.ceil(qrCodes.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                    <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)} className="w-9">
                      {page}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={currentPage === Math.ceil(qrCodes.length / ITEMS_PER_PAGE)} onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create QR Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New QR Code</DialogTitle>
            <DialogDescription>
              Generate a UPI QR code for accepting payments
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateQR} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="name">QR Code Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Store Counter 1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage">Usage Type *</Label>
              <Select
                value={formData.usage}
                onValueChange={(value: 'single_use' | 'multiple_use') =>
                  setFormData({ ...formData, usage: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_use">Multiple Use</SelectItem>
                  <SelectItem value="single_use">Single Use</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
            </div>

            {formData.fixed_amount && (
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  value={formData.payment_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_amount: e.target.value })
                  }
                  required={formData.fixed_amount}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Description for internal use"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

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
                  'Create QR Code'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View QR Modal */}
      <Dialog open={!!viewingQR} onOpenChange={() => setViewingQR(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{viewingQR?.name}</DialogTitle>
            <DialogDescription>QR Code Details</DialogDescription>
          </DialogHeader>
          {viewingQR && (
            <div className="space-y-4">
              <div className="flex justify-center bg-white p-4 rounded-lg">
                {viewingQR.image_url ? (
                  <img
                    src={viewingQR.image_url}
                    alt={viewingQR.name}
                    className="w-full max-w-[300px]"
                  />
                ) : (
                  <QRCodeCanvas
                    id="qr-canvas"
                    value={`upi://pay?pn=${encodeURIComponent(viewingQR.name || 'ZivonPay')}&am=${viewingQR.fixed_amount && viewingQR.payment_amount ? (viewingQR.payment_amount / 100).toFixed(2) : '0'}&cu=INR&tn=${encodeURIComponent(viewingQR.id)}`}
                    size={280}
                    level="M"
                    includeMargin
                  />
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono">{viewingQR.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={viewingQR.status === 'active' ? 'default' : 'secondary'}>
                    {viewingQR.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usage:</span>
                  <span>{viewingQR.usage === 'multiple_use' ? 'Multiple Use' : 'Single Use'}</span>
                </div>
                {viewingQR.fixed_amount && viewingQR.payment_amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold">
                      {formatAmount(viewingQR.payment_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Received:</span>
                  <span className="font-semibold">
                    {formatAmount(viewingQR.payments_amount_received)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payments:</span>
                  <span>{viewingQR.payments_count_received}</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement | null;
                  if (canvas) {
                    const url = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${viewingQR.name}.png`;
                    link.click();
                  } else if (viewingQR.image_url) {
                    const link = document.createElement('a');
                    link.href = viewingQR.image_url;
                    link.download = `${viewingQR.name}.png`;
                    link.click();
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardQRCodes;
