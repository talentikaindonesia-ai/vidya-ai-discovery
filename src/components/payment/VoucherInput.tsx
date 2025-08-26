import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Ticket, X, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface VoucherInputProps {
  onVoucherApplied: (voucher: any, discountAmount: number) => void;
  selectedPlan: any;
  billingCycle: "monthly" | "yearly";
}

export const VoucherInput = ({ onVoucherApplied, selectedPlan, billingCycle }: VoucherInputProps) => {
  const [voucherCode, setVoucherCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const { toast } = useToast();

  const validateVoucher = async () => {
    if (!voucherCode.trim()) {
      toast({
        title: "Error",
        description: "Masukkan kode voucher",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: voucher, error } = await supabase
        .from('voucher_codes')
        .select('*')
        .eq('code', voucherCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !voucher) {
        throw new Error('Kode voucher tidak valid atau tidak ditemukan');
      }

      // Check if voucher is still valid
      const now = new Date();
      const validFrom = new Date(voucher.valid_from);
      const validUntil = new Date(voucher.valid_until);

      if (now < validFrom || now > validUntil) {
        throw new Error('Kode voucher sudah kadaluarsa');
      }

      // Check usage limit
      if (voucher.max_uses && voucher.current_uses >= voucher.max_uses) {
        throw new Error('Kode voucher sudah mencapai batas penggunaan');
      }

      // Check if user already used this voucher
      const { data: existingUsage } = await supabase
        .from('voucher_usage')
        .select('id')
        .eq('voucher_id', voucher.id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (existingUsage && existingUsage.length > 0) {
        throw new Error('Anda sudah menggunakan kode voucher ini');
      }

      // Calculate discount
      let discountAmount = 0;
      if (selectedPlan) {
        const planPrice = billingCycle === "monthly" ? selectedPlan.price_monthly : selectedPlan.price_yearly;
        
        if (voucher.discount_type === 'percentage') {
          discountAmount = Math.floor((planPrice * voucher.discount_value) / 100);
        } else {
          discountAmount = Math.min(voucher.discount_value, planPrice);
        }

        // Check minimum purchase amount
        if (voucher.min_purchase_amount && planPrice < voucher.min_purchase_amount) {
          throw new Error(`Minimum pembelian ${formatCurrency(voucher.min_purchase_amount)} untuk menggunakan voucher ini`);
        }
      }

      setAppliedVoucher(voucher);
      setDiscount(discountAmount);
      onVoucherApplied(voucher, discountAmount);

      toast({
        title: "Voucher Berhasil Diterapkan!",
        description: `Diskon ${voucher.discount_type === 'percentage' ? voucher.discount_value + '%' : formatCurrency(voucher.discount_value)} telah diterapkan`,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setDiscount(0);
    setVoucherCode("");
    onVoucherApplied(null, 0);
    
    toast({
      title: "Voucher Dihapus",
      description: "Kode voucher telah dihapus",
    });
  };

  if (appliedVoucher) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-primary">Voucher Diterapkan</p>
                <p className="text-sm text-muted-foreground">
                  {appliedVoucher.name} • Diskon {formatCurrency(discount)}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={removeVoucher}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Ticket className="w-5 h-5 text-primary" />
          <p className="font-medium">Punya Kode Voucher?</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Masukkan kode voucher"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            className="flex-1"
          />
          <Button 
            onClick={validateVoucher}
            disabled={loading || !voucherCode.trim()}
            className="px-6"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Terapkan"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Masukkan kode voucher untuk mendapatkan diskon spesial
        </p>
      </CardContent>
    </Card>
  );
};