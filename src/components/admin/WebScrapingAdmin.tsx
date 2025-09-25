import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe, Play, Trash2, Download, Calendar, MapPin } from "lucide-react";

export const WebScrapingAdmin = () => {
  const [scrapedContent, setScrapedContent] = useState<any[]>([]);
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("SCHOLARSHIP");
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: "SCHOLARSHIP", label: "Beasiswa", color: "bg-blue-500" },
    { value: "JOB", label: "Pekerjaan & Magang", color: "bg-green-500" },
    { value: "COMPETITION", label: "Kompetisi & Lomba", color: "bg-orange-500" },
    { value: "CONFERENCE", label: "Konferensi & Event", color: "bg-purple-500" }
  ];

  useEffect(() => {
    loadScrapedContent();
  }, []);

  const loadScrapedContent = async () => {
    try {
      const { data, error } = await supabase
        .from('scraped_content')
        .select('*')
        .eq('is_manual', false) // Only show auto-scraped content
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setScrapedContent(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat konten: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartScraping = async () => {
    setIsScrapingActive(true);
    try {
      const { data, error } = await supabase.functions.invoke('web-scraper', {
        body: { category: selectedCategory }
      });

      if (error) throw error;

      toast.success(`Berhasil scraping ${data.data?.length || 0} konten baru untuk kategori ${selectedCategory}!`);
      await loadScrapedContent();
    } catch (error: any) {
      toast.error("Gagal scraping: " + error.message);
    } finally {
      setIsScrapingActive(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm("Yakin ingin menghapus konten ini?")) return;
    
    try {
      const { error } = await supabase
        .from('scraped_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Konten berhasil dihapus!");
      loadScrapedContent();
    } catch (error: any) {
      toast.error("Gagal menghapus konten: " + error.message);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('scraped_content')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Konten berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}!`);
      loadScrapedContent();
    } catch (error: any) {
      toast.error("Gagal mengubah status: " + error.message);
    }
  };

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Web Scraping Indonesia</h2>
        <p className="text-muted-foreground">
          Kelola scraping otomatis website Indonesia untuk konten beasiswa, pekerjaan, dan kompetisi
        </p>
      </div>

      {/* Scraping Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Kontrol Scraping
          </CardTitle>
          <CardDescription>
            Jalankan scraping otomatis untuk kategori tertentu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Kategori Scraping</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleStartScraping} 
              disabled={isScrapingActive}
              className="flex items-center gap-2"
            >
              {isScrapingActive ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Scraping...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Mulai Scraping
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {categories.map((category) => {
          const count = scrapedContent.filter(item => item.category === category.value).length;
          return (
            <Card key={category.value}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <p className="text-sm font-medium">{category.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Scraped Content List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scrapedContent.map((content) => {
          const categoryInfo = getCategoryInfo(content.category);
          
          return (
            <Card key={content.id} className="hover:shadow-lg transition-smooth group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      className="text-white text-xs"
                      style={{ backgroundColor: categoryInfo.color }}
                    >
                      {categoryInfo.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {content.source_website}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleActive(content.id, content.is_active)}
                    className={content.is_active ? 'text-green-600' : 'text-gray-400'}
                  >
                    {content.is_active ? 'Aktif' : 'Nonaktif'}
                  </Button>
                </div>
                <CardTitle className="text-lg line-clamp-2">{content.title}</CardTitle>
                <CardDescription className="line-clamp-2">{content.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {content.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{content.location}</span>
                    </div>
                  )}
                  
                  {content.deadline && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline: {formatDate(content.deadline)}</span>
                    </div>
                  )}
                  
                  {content.tags && content.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {content.tags.slice(0, 3).map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {content.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{content.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.open(content.url, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Lihat
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDeleteContent(content.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {scrapedContent.length === 0 && (
        <div className="text-center py-8">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum ada konten hasil scraping</h3>
          <p className="text-muted-foreground">Mulai dengan menjalankan scraping untuk kategori tertentu</p>
        </div>
      )}
    </div>
  );
};