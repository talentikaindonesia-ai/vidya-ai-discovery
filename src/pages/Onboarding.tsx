import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, GraduationCap, Heart, ArrowRight, Sparkles, Brain, Briefcase, BookOpen, Trophy, CheckCircle2 } from "lucide-react";

const TOTAL_STEPS = 4;

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    educationLevel: "",
    interests: [] as string[],
  });
  const navigate = useNavigate();

  const interestOptions = [
    { id: "science",      label: "Sains & Teknologi",    icon: "🔬" },
    { id: "creative",     label: "Seni & Kreativitas",   icon: "🎨" },
    { id: "leadership",   label: "Kepemimpinan",         icon: "👑" },
    { id: "communication",label: "Komunikasi",           icon: "💬" },
    { id: "analytical",   label: "Analitik & Data",      icon: "📊" },
    { id: "business",     label: "Bisnis & Wirausaha",   icon: "💼" },
    { id: "social",       label: "Sosial & Kemanusiaan", icon: "🤝" },
    { id: "sports",       label: "Olahraga & Kesehatan", icon: "⚽" },
  ];

  const handleInterestToggle = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId],
    }));
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save profile — including educationLevel which was missing before
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          // Store education level in metadata via raw update
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Save education level as a user metadata field
      await supabase.auth.updateUser({
        data: {
          education_level: formData.educationLevel,
          age: formData.age,
        }
      });

      // Map interest slugs to DB categories
      const { data: categories } = await supabase
        .from('interest_categories')
        .select('id, name');

      for (const interestId of formData.interests) {
        const match = categories?.find(
          c => c.name?.toLowerCase().replace(/\s+/g, '-') === interestId || c.id === interestId
        );
        if (!match) continue;

        await supabase
          .from('user_interests')
          .upsert({
            user_id: user.id,
            category_id: match.id,
            is_primary: true,
            score: 80,
          }, { onConflict: 'user_id,category_id' });
      }

      toast.success("Profil berhasil disimpan! Mari mulai assessment 🎉");
      navigate("/assessment");
    } catch (error: any) {
      toast.error("Gagal menyimpan profil: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  const stepLabels = ["Profil", "Pendidikan", "Minat", "Mulai"];

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-floating border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="bg-secondary rounded-full p-3">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Discover Your Potential
          </CardTitle>
          <p className="text-muted-foreground">
            Langkah {step} dari {TOTAL_STEPS}
          </p>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mt-3 mb-1">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i + 1 < step ? 'bg-green-500 text-white' :
                  i + 1 === step ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-[10px] text-muted-foreground hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>

        <CardContent className="space-y-6">

          {/* ── Step 1: Nama & Usia ─────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <User className="w-14 h-14 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-semibold">Ceritakan tentang dirimu</h3>
                <p className="text-sm text-muted-foreground">Kami akan menyesuaikan pengalaman untukmu</p>
              </div>
              <div>
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Masukkan nama lengkap"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="age">Usia</Label>
                <Input
                  id="age"
                  type="number"
                  min="10"
                  max="60"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Contoh: 17"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Pendidikan ──────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <GraduationCap className="w-14 h-14 text-secondary mx-auto mb-3" />
                <h3 className="text-xl font-semibold">Jenjang Pendidikan</h3>
                <p className="text-sm text-muted-foreground">Ini membantu kami merekomendasikan peluang yang tepat</p>
              </div>
              <div>
                <Label>Jenjang Pendidikan Saat Ini</Label>
                <Select value={formData.educationLevel} onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, educationLevel: value }))
                }>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih jenjang pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smp">SMP / Sederajat</SelectItem>
                    <SelectItem value="sma">SMA / Sederajat</SelectItem>
                    <SelectItem value="kuliah">Mahasiswa (S1/D3/D4)</SelectItem>
                    <SelectItem value="s2">Mahasiswa S2/S3</SelectItem>
                    <SelectItem value="kerja">Sudah Bekerja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Education-level tips */}
              {formData.educationLevel && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-sm text-muted-foreground">
                  {formData.educationLevel === 'smp' && '🎓 Kami akan fokuskan ke kompetisi pelajar dan program pengembangan diri.'}
                  {formData.educationLevel === 'sma' && '🎓 Kami akan tampilkan beasiswa S1, olimpiade, dan program magang awal.'}
                  {formData.educationLevel === 'kuliah' && '🎓 Kami akan prioritaskan beasiswa S2, magang korporat, dan kompetisi mahasiswa.'}
                  {formData.educationLevel === 's2' && '🎓 Kami akan fokuskan ke beasiswa doktoral, fellowship riset, dan konferensi ilmiah.'}
                  {formData.educationLevel === 'kerja' && '🎓 Kami akan tampilkan fellowship profesional, short course, dan networking events.'}
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Minat ───────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Heart className="w-14 h-14 text-accent mx-auto mb-3" />
                <h3 className="text-xl font-semibold">Apa minatmu?</h3>
                <p className="text-sm text-muted-foreground">Pilih bidang yang menarik (boleh lebih dari satu)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {interestOptions.map((interest) => (
                  <div
                    key={interest.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.interests.includes(interest.id)
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
                    onClick={() => handleInterestToggle(interest.id)}
                  >
                    <span className="text-xl">{interest.icon}</span>
                    <div className="flex-1">
                      <Checkbox
                        checked={formData.interests.includes(interest.id)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{interest.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              {formData.interests.length > 0 && (
                <p className="text-center text-xs text-primary font-medium">
                  ✓ {formData.interests.length} minat dipilih
                </p>
              )}
            </div>
          )}

          {/* ── Step 4: What's Next ─────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">
                  Hei, {formData.fullName.split(' ')[0]}! Profilmu sudah siap 🎉
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Ini yang akan kamu dapatkan setelah ini:
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Tes Kepribadian RIASEC</p>
                    <p className="text-xs text-muted-foreground">8 pertanyaan untuk temukan tipe kepribadian & karir terbaik untukmu (~3 menit)</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">Langkah 1</Badge>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Peluang yang Dipersonalisasi</p>
                    <p className="text-xs text-muted-foreground">Beasiswa, magang & kompetisi yang sesuai tipe kepribadian dan jenjang pendidikanmu</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">Langkah 2</Badge>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Learning Path Khusus</p>
                    <p className="text-xs text-muted-foreground">Konten pembelajaran yang disesuaikan dengan minat dan tujuan karirmu</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">Langkah 3</Badge>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                  <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Gamifikasi & Pencapaian</p>
                    <p className="text-xs text-muted-foreground">Kumpulkan XP, naik level, dan raih badge setiap kali kamu belajar dan berkembang</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">Bonus</Badge>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ──────────────────────────── */}
          <div className="space-y-3 pt-4">
            <div className="flex justify-between gap-4">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="min-h-[44px]">
                  Sebelumnya
                </Button>
              ) : (
                <div />
              )}

              <Button
                onClick={handleNext}
                disabled={
                  saving ||
                  (step === 1 && (!formData.fullName.trim() || !formData.age.trim())) ||
                  (step === 2 && !formData.educationLevel) ||
                  (step === 3 && formData.interests.length === 0)
                }
                className="bg-primary text-primary-foreground hover:shadow-floating min-h-[44px] px-6"
              >
                {saving ? 'Menyimpan...' :
                 step === 4 ? 'Mulai Assessment →' :
                 step === 3 ? 'Lanjut' :
                 'Lanjut'}
                {!saving && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>

            <div className="flex justify-center">
              <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-primary text-sm">
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
