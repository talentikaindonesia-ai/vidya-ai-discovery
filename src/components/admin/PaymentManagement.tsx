import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, Eye, Download, Ticket, DollarSign, Users, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { auditAdminAction, useAuditLog, checkAdminRole } from "@/lib/security-audit";

export const PaymentManagement = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  // Audit log for payment management access
  useAuditLog('ADMIN_PAYMENT_MANAGEMENT_ACCESS', 'payment_management');

  useEffect(() => {
    checkAdminRole().then(isAdminUser => {
      setIsAdmin(isAdminUser);
      if (isAdminUser) {
        loadData();
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access payment management",
          variant: "destructive",
        });
      }
    });
  }, []);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    await Promise.all([
      loadPlans(),
      loadVouchers(),
      loadTransactions(),
      loadAnalytics()
    ]);
    setLoading(false);
  };

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_packages')
      .select('*')
      .order('price_monthly');

    if (data) setPlans(data);
  };

  const loadVouchers = async () => {
    const { data, error } = await supabase
      .from('voucher_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setVouchers(data);
  };

  const loadTransactions = async () => {
    try {
      // Admins can view all transactions, but this access should be logged
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          profiles!inner(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }

      // Log admin access for audit purposes
      console.log(`Admin ${(await supabase.auth.getUser()).data.user?.email} accessed payment transactions at ${new Date().toISOString()}`);
      
      if (data) setTransactions(data);
    } catch (error) {
      console.error('Error in loadTransactions:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Use secure analytics function instead of direct table access
      const { data: analyticsData, error } = await supabase
        .rpc('get_payment_analytics');

      if (error) throw error;

      const analytics = analyticsData?.[0] || {
        total_revenue: 0,
        transaction_count: 0,
        avg_transaction_amount: 0,
        successful_transactions: 0
      };
      
      const { data: activeSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('status', 'active');

      setAnalytics({
        totalRevenue: Number(analytics.total_revenue || 0),
        monthlyRevenue: Number(analytics.total_revenue || 0), // Will be calculated separately for current month
        activeSubscriptions: activeSubscriptions?.length || 0,
        totalTransactions: Number(analytics.transaction_count || 0),
      });

      // Get current month revenue separately
      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      const { data: monthlyAnalytics, error: monthlyError } = await supabase
        .rpc('get_payment_analytics', {
          start_date: thisMonth.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        });

      if (!monthlyError && monthlyAnalytics?.[0]) {
        setAnalytics(prev => ({
          ...prev,
          monthlyRevenue: Number(monthlyAnalytics[0].total_revenue || 0)
        }));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const savePlan = async (planData: any) => {
    const { error } = planData.id
      ? await supabase.from('subscription_packages').update(planData).eq('id', planData.id)
      : await supabase.from('subscription_packages').insert(planData);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan paket",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: `Paket berhasil ${planData.id ? 'diperbarui' : 'ditambahkan'}`,
    });

    setEditingPlan(null);
    loadPlans();
  };

  const saveVoucher = async (voucherData: any) => {
    const { error } = voucherData.id
      ? await supabase.from('voucher_codes').update(voucherData).eq('id', voucherData.id)
      : await supabase.from('voucher_codes').insert(voucherData);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan voucher",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: `Voucher berhasil ${voucherData.id ? 'diperbarui' : 'ditambahkan'}`,
    });

    setEditingVoucher(null);
    loadVouchers();
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase
      .from('subscription_packages')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus paket",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Paket berhasil dinonaktifkan",
    });

    loadPlans();
  };

  const deleteVoucher = async (id: string) => {
    const { error } = await supabase
      .from('voucher_codes')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus voucher",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Voucher berhasil dinonaktifkan",
    });

    loadVouchers();
  };

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue Bulan Ini</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.monthlyRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscriber Aktif</p>
                <p className="text-2xl font-bold">{analytics.activeSubscriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
                <p className="text-2xl font-bold">{analytics.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Paket Berlangganan</TabsTrigger>
          <TabsTrigger value="vouchers">Voucher</TabsTrigger>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kelola Paket Berlangganan</CardTitle>
                  <CardDescription>Tambah, edit, atau hapus paket berlangganan</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingPlan({})}>
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Paket
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingPlan?.id ? 'Edit Paket' : 'Tambah Paket Baru'}
                      </DialogTitle>
                    </DialogHeader>
                    <PlanForm 
                      plan={editingPlan} 
                      onSave={savePlan} 
                      onCancel={() => setEditingPlan(null)} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(plan.price_monthly)}/bulan • {formatCurrency(plan.price_yearly)}/tahun
                      </p>
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingPlan(plan)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vouchers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kelola Voucher</CardTitle>
                  <CardDescription>Buat dan kelola kode voucher diskon</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingVoucher({})}>
                      <Plus className="w-4 h-4 mr-2" />
                      Buat Voucher
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingVoucher?.id ? 'Edit Voucher' : 'Buat Voucher Baru'}
                      </DialogTitle>
                    </DialogHeader>
                    <VoucherForm 
                      voucher={editingVoucher} 
                      onSave={saveVoucher} 
                      onCancel={() => setEditingVoucher(null)} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Diskon</TableHead>
                    <TableHead>Penggunaan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-mono">{voucher.code}</TableCell>
                      <TableCell>{voucher.name}</TableCell>
                      <TableCell>
                        {voucher.discount_type === 'percentage' 
                          ? `${voucher.discount_value}%` 
                          : formatCurrency(voucher.discount_value)
                        }
                      </TableCell>
                      <TableCell>
                        {voucher.current_uses}/{voucher.max_uses || '∞'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={voucher.is_active ? 'default' : 'secondary'}>
                          {voucher.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingVoucher(voucher)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteVoucher(voucher.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
              <CardDescription>Daftar semua transaksi pembayaran</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono">{transaction.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.profiles?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{transaction.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' :
                          'destructive'
                        }>
                          {transaction.status === 'completed' ? 'Berhasil' :
                           transaction.status === 'pending' ? 'Pending' : 'Gagal'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Plan Form Component
const PlanForm = ({ plan, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    type: plan?.type || 'premium_individual',
    price_monthly: plan?.price_monthly || 0,
    price_yearly: plan?.price_yearly || 0,
    features: plan?.features || [],
    max_users: plan?.max_users || 1,
    max_courses: plan?.max_courses || -1,
    max_opportunities: plan?.max_opportunities || -1,
    is_active: plan?.is_active ?? true,
  });

  const [featureInput, setFeatureInput] = useState('');

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: plan?.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nama Paket</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Tipe</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="premium_individual">Premium Individual</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="school">School</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price_monthly">Harga Bulanan (IDR)</Label>
          <Input
            id="price_monthly"
            type="number"
            value={formData.price_monthly}
            onChange={(e) => setFormData(prev => ({ ...prev, price_monthly: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="price_yearly">Harga Tahunan (IDR)</Label>
          <Input
            id="price_yearly"
            type="number"
            value={formData.price_yearly}
            onChange={(e) => setFormData(prev => ({ ...prev, price_yearly: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div>
        <Label>Fitur</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            placeholder="Tambah fitur..."
          />
          <Button type="button" onClick={addFeature}>Tambah</Button>
        </div>
        <div className="space-y-2">
          {formData.features.map((feature: string, index: number) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
              <span>{feature}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">
          Simpan
        </Button>
      </div>
    </form>
  );
};

// Voucher Form Component
const VoucherForm = ({ voucher, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    code: voucher?.code || '',
    name: voucher?.name || '',
    description: voucher?.description || '',
    discount_type: voucher?.discount_type || 'percentage',
    discount_value: voucher?.discount_value || 0,
    max_uses: voucher?.max_uses || null,
    min_purchase_amount: voucher?.min_purchase_amount || 0,
    valid_from: voucher?.valid_from ? new Date(voucher.valid_from).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    valid_until: voucher?.valid_until ? new Date(voucher.valid_until).toISOString().split('T')[0] : '',
    is_active: voucher?.is_active ?? true,
  });

  const generateCode = () => {
    const code = 'VOUCHER' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      ...formData, 
      id: voucher?.id,
      valid_from: new Date(formData.valid_from).toISOString(),
      valid_until: new Date(formData.valid_until).toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">Kode Voucher</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              required
            />
            <Button type="button" onClick={generateCode}>Generate</Button>
          </div>
        </div>
        <div>
          <Label htmlFor="name">Nama Voucher</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discount_type">Tipe Diskon</Label>
          <Select value={formData.discount_type} onValueChange={(value) => setFormData(prev => ({ ...prev, discount_type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Persentase</SelectItem>
              <SelectItem value="fixed_amount">Jumlah Tetap</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="discount_value">
            Nilai Diskon {formData.discount_type === 'percentage' ? '(%)' : '(IDR)'}
          </Label>
          <Input
            id="discount_value"
            type="number"
            value={formData.discount_value}
            onChange={(e) => setFormData(prev => ({ ...prev, discount_value: parseInt(e.target.value) || 0 }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="valid_from">Berlaku Dari</Label>
          <Input
            id="valid_from"
            type="date"
            value={formData.valid_from}
            onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="valid_until">Berlaku Sampai</Label>
          <Input
            id="valid_until"
            type="date"
            value={formData.valid_until}
            onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">
          Simpan
        </Button>
      </div>
    </form>
  );
};