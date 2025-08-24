import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, GraduationCap, Heart, ArrowRight, Sparkles } from "lucide-react";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    educationLevel: "",
    interests: [] as string[],
  });
  const navigate = useNavigate();

  const interestOptions = [
    { id: "science", label: "Sains & Teknologi", icon: "🔬" },
    { id: "creative", label: "Seni & Kreativitas", icon: "🎨" },
    { id: "leadership", label: "Kepemimpinan", icon: "👑" },
    { id: "communication", label: "Komunikasi", icon: "💬" },
    { id: "analytical", label: "Analitik & Data", icon: "📊" },
    { id: "business", label: "Bisnis & Wirausaha", icon: "💼" },
    { id: "social", label: "Sosial & Kemanusiaan", icon: "🤝" },
    { id: "sports", label: "Olahraga & Kesehatan", icon: "⚽" },
  ];

  const handleInterestToggle = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile with onboarding data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Save initial interests
      for (const interestId of formData.interests) {
        const { error } = await supabase
          .from('user_interests')
          .insert({
            user_id: user.id,
            category_id: interestId, // This should match actual category IDs
            is_primary: true,
            score: 80
          });
        
        if (error) console.error('Error saving interest:', error);
      }

      toast.success("Profil berhasil disimpan!");
      navigate("/assessment");
    } catch (error: any) {
      toast.error("Gagal menyimpan profil: " + error.message);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-floating border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-secondary rounded-full p-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            Discover Your Potential
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            Mari kenali potensi dirimu dalam 3 langkah mudah
          </p>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <User className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Ceritakan tentang dirimu</h3>
              </div>
              
              <div className="space-y-4">
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
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="Contoh: 17"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <GraduationCap className="w-16 h-16 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Jenjang Pendidikan</h3>
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
                    <SelectItem value="kuliah">Mahasiswa</SelectItem>
                    <SelectItem value="kerja">Sudah Bekerja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Heart className="w-16 h-16 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Minat Awal</h3>
                <p className="text-muted-foreground">Pilih bidang yang menarik untukmu (boleh lebih dari satu)</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {interestOptions.map((interest) => (
                  <div
                    key={interest.id}
                    className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.interests.includes(interest.id)
                        ? 'border-primary bg-primary-light/20 shadow-soft'
                        : 'border-border hover:border-primary/50 hover:bg-primary-light/10'
                    }`}
                    onClick={() => handleInterestToggle(interest.id)}
                  >
                    <span className="text-2xl">{interest.icon}</span>
                    <div className="flex-1">
                      <Checkbox
                        checked={formData.interests.includes(interest.id)}
                        onChange={() => handleInterestToggle(interest.id)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{interest.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-6">
            {/* Previous/Next buttons row */}
            <div className="flex justify-between gap-4">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Sebelumnya
                </Button>
              ) : (
                <div></div>
              )}
              
              <Button 
                onClick={() => navigate("/assessment")}
                className="bg-primary text-primary-foreground hover:shadow-floating"
              >
                Mulai Assessment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            {/* Back to home button */}
            <div className="flex justify-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-primary"
              >
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