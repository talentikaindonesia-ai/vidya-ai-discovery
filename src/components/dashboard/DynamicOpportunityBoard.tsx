import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Zap, TrendingUp, Clock, Globe, Users } from "lucide-react";
import { PersonalizedFeed } from "./PersonalizedFeed";
import { toast } from "sonner";

interface DynamicOpportunityBoardProps {
  userAssessment?: any;
  userInterests?: string[];
  subscriptionInfo?: any;
}

export const DynamicOpportunityBoard = ({ 
  userAssessment, 
  userInterests = [], 
  subscriptionInfo 
}: DynamicOpportunityBoardProps) => {
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  const [contentStats, setContentStats] = useState({
    total: 0,
    today: 0,
    trending: 0
  });

  useEffect(() => {
    loadContentStats();
    loadLastUpdateTime();
  }, []);

  const loadContentStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [totalRes, todayRes] = await Promise.all([
        supabase
          .from('scraped_content')
          .select('id', { count: 'exact' })
          .eq('is_active', true),
        supabase
          .from('scraped_content')
          .select('id', { count: 'exact' })
          .eq('is_active', true)
          .gte('created_at', today)
      ]);

      setContentStats({
        total: totalRes.count || 0,
        today: todayRes.count || 0,
        trending: Math.floor((totalRes.count || 0) * 0.1) // Assume 10% are trending
      });
    } catch (error) {
      console.error('Error loading content stats:', error);
    }
  };

  const loadLastUpdateTime = async () => {
    try {
      const { data } = await supabase
        .from('scraped_content')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setLastUpdateTime(new Date(data[0].created_at).toLocaleString('id-ID'));
      }
    } catch (error) {
      console.error('Error loading last update time:', error);
    }
  };

  const handleManualScraping = async () => {
    setIsScrapingActive(true);
    try {
      const categories = ['SCHOLARSHIP', 'JOB', 'COMPETITION'];
      let totalScraped = 0;

      for (const category of categories) {
        const { data, error } = await supabase.functions.invoke('web-scraper', {
          body: { category }
        });

        if (error) throw error;
        totalScraped += data.data?.length || 0;
      }

      toast.success(`Berhasil mengumpulkan ${totalScraped} peluang baru!`);
      loadContentStats();
      loadLastUpdateTime();
      
      // Refresh the page content
      window.location.reload();
    } catch (error: any) {
      toast.error("Gagal mengumpulkan data: " + error.message);
    } finally {
      setIsScrapingActive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Total Peluang</p>
                <p className="text-2xl font-bold">{contentStats.total}</p>
              </div>
              <Globe className="w-8 h-8 text-white/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-secondary text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Hari Ini</p>
                <p className="text-2xl font-bold">{contentStats.today}</p>
              </div>
              <Clock className="w-8 h-8 text-white/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Trending</p>
                <p className="text-2xl font-bold">{contentStats.trending}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-white/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Update Terakhir</p>
                <p className="text-sm font-medium">{lastUpdateTime || 'Belum ada'}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualScraping}
                disabled={isScrapingActive}
                className="gap-2"
              >
                {isScrapingActive ? (
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Content - Unified View */}
      <div className="space-y-6">
        {/* Personalized Section */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Rekomendasi Personal untuk Anda
            </CardTitle>
            <CardDescription>
              Peluang yang dipersonalisasi berdasarkan hasil assessment dan minat Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PersonalizedFeed 
              userInterests={userInterests}
              assessmentData={userAssessment}
              limit={subscriptionInfo?.subscription_status === 'active' ? 12 : 6}
            />
          </CardContent>
        </Card>

        {/* All Opportunities Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Semua Peluang Terkini
            </CardTitle>
            <CardDescription>
              Semua peluang dari berbagai sumber terpercaya, diperbarui secara real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PersonalizedFeed 
              userInterests={[]}
              assessmentData={null}
              limit={subscriptionInfo?.subscription_status === 'active' ? 50 : 12}
            />
          </CardContent>
        </Card>
      </div>

      {/* Trust Indicators */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Sumber Terpercaya</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Data dikumpulkan dari 20+ situs resmi pemerintah dan institusi pendidikan terkemuka
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline">Kemendikbud</Badge>
              <Badge variant="outline">LPDP</Badge>
              <Badge variant="outline">DAAD</Badge>
              <Badge variant="outline">Fulbright</Badge>
              <Badge variant="outline">+16 lainnya</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};