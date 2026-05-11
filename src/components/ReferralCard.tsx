import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, Gift, Users, Zap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ReferralCardProps {
  compact?: boolean; // compact mode for dashboard widgets
}

const ReferralCard = ({ compact = false }: ReferralCardProps) => {
  const [referralData, setReferralData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadOrCreateReferralCode();
  }, []);

  const generateCode = (userId: string) => {
    // Deterministic, readable code: TLK- + 6 uppercase alphanum chars from userId
    const cleaned = userId.replace(/-/g, "").toUpperCase();
    return `TLK-${cleaned.slice(0, 6)}`;
  };

  const loadOrCreateReferralCode = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Try to fetch existing code first
      const { data: existing } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (existing) {
        setReferralData(existing);
        return;
      }

      // Generate and insert a new code
      const code = generateCode(user.id);
      const { data: created, error } = await supabase
        .from("referral_codes")
        .insert({ user_id: user.id, code, commission_rate: 10, is_active: true })
        .select()
        .single();

      if (!error && created) setReferralData(created);
    } catch (err) {
      console.error("ReferralCard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const referralUrl = referralData
    ? `${window.location.origin}/auth?ref=${referralData.code}`
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link referral berhasil disalin!");
    } catch {
      toast.error("Gagal menyalin link");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Bergabung di Talentika!",
        text: "Temukan potensi terbaikmu bersama Talentika — platform discovery karir & beasiswa terbaik untuk pelajar Indonesia. Daftar via link ini dan kita sama-sama dapat bonus! 🎁",
        url: referralUrl,
      });
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return <div className="h-40 rounded-lg bg-muted animate-pulse" />;
  }

  if (compact) {
    return (
      <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 to-card">
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-secondary" />
            <span className="font-semibold text-sm">Program Referral</span>
            <Badge variant="outline" className="ml-auto text-[10px]">
              {referralData?.total_referrals || 0} teman
            </Badge>
          </div>
          <div className="flex gap-2">
            <code className="flex-1 px-2 py-1.5 bg-muted rounded text-xs font-mono text-muted-foreground truncate">
              {referralUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="shrink-0 h-7 px-2"
            >
              {copied ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleShare}
              className="shrink-0 h-7 px-2 bg-secondary hover:bg-secondary/90"
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            🎁 Kamu &amp; temanmu masing-masing dapat{" "}
            <strong className="text-primary">+100 XP</strong> saat mereka daftar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-secondary/30 bg-gradient-to-br from-card to-secondary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="w-5 h-5 text-secondary" />
          Program Referral Talentika
        </CardTitle>
        <CardDescription>
          Ajak temanmu dan dapatkan bonus XP bersama-sama!
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center p-3 rounded-lg bg-secondary/10 border border-secondary/20">
            <Users className="w-5 h-5 text-secondary mb-1" />
            <span className="text-2xl font-bold">
              {referralData?.total_referrals ?? 0}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              Teman Bergabung
            </span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Zap className="w-5 h-5 text-primary mb-1" />
            <span className="text-2xl font-bold">
              +{(referralData?.total_referrals ?? 0) * 100}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              XP Bonus Earned
            </span>
          </div>
        </div>

        {/* Code display */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Kode Referralmu
          </p>
          <div className="flex items-center justify-center p-3 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/30">
            <span className="font-mono text-xl font-bold tracking-widest text-foreground">
              {referralData?.code}
            </span>
          </div>
        </div>

        {/* Link + copy */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Link Referral
          </p>
          <div className="flex gap-2 items-center">
            <code className="flex-1 text-xs px-3 py-2 bg-muted rounded-lg font-mono text-muted-foreground truncate border border-muted-foreground/20">
              {referralUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="shrink-0 gap-1.5"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Disalin!" : "Salin"}
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleCopy}
          >
            <Copy className="w-4 h-4" />
            Salin Link
          </Button>
          <Button
            className="flex-1 gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
            Bagikan
          </Button>
        </div>

        {/* Info box */}
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 space-y-1.5">
          <p className="text-xs font-semibold text-primary">Cara kerja:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              Bagikan link/kode ke temanmu
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              Temanmu daftar menggunakan kodemu
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              Kamu &amp; temanmu masing-masing dapat{" "}
              <strong>+100 XP</strong>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
