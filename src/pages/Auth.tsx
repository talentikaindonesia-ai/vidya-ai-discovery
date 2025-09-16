import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff, Chrome } from "lucide-react";
import { toast } from "sonner";
import talentikaLogo from "@/assets/talentika-logo.png";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState("individual");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  // Get redirect parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get('redirect');

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const destination = redirectTo === 'talentika-junior' ? '/talentika-junior' : '/dashboard';
        navigate(destination);
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const redirectUrl = redirectTo === 'talentika-junior' ? 
        `${window.location.origin}/talentika-junior` : 
        `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            account_type: accountType,
            organization_name: organizationName,
            organization_type: organizationType,
          }
        }
      });

      if (error) throw error;
      
      toast.success("Akun berhasil dibuat! Silakan login untuk melanjutkan.");
    } catch (error: any) {
      setError(error.message);
      toast.error("Gagal membuat akun: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Login berhasil!");
        const destination = redirectTo === 'talentika-junior' ? '/talentika-junior' : '/dashboard';
        navigate(destination);
      }
    } catch (error: any) {
      setError(error.message);
      toast.error("Login gagal: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const redirectUrl = redirectTo === 'talentika-junior' ? 
        `${window.location.origin}/talentika-junior` : 
        `${window.location.origin}/dashboard`;
        
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      toast.error("Gagal login dengan Google: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-floating border-0">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="mx-auto w-20 h-20 flex items-center justify-center">
            <img 
              src={talentikaLogo} 
              alt="Talentika Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Talentika
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Untuk melanjutkan ke Talentika - Masuk atau daftar untuk memulai perjalanan pembelajaran Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Masuk
                </Button>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Atau</div>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleGoogleSignIn} 
                    disabled={isLoading} 
                    className="w-full"
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    Masuk dengan Google
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Masukkan nama lengkap Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Tipe Akun</Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="school">Sekolah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {accountType === "school" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="organizationName">Nama Institusi</Label>
                      <Input
                        id="organizationName"
                        type="text"
                        placeholder="Nama sekolah/institusi"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizationType">Jenis Institusi</Label>
                      <Select value={organizationType} onValueChange={setOrganizationType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="school">Sekolah</SelectItem>
                          <SelectItem value="institution">Institusi</SelectItem>
                          <SelectItem value="company">Perusahaan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Daftar
                </Button>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">Atau</div>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleGoogleSignIn} 
                    disabled={isLoading} 
                    className="w-full"
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    Daftar dengan Google
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
          
          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;