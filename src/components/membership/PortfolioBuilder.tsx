import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, ExternalLink, Award, FolderOpen, Briefcase, FileText, QrCode, Share2 } from "lucide-react";

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  item_type: string;
  file_url?: string;
  external_url?: string;
  tags: string[];
  is_featured: boolean;
  is_public: boolean;
  created_at: string;
}

interface PortfolioBuilderProps {
  userId: string;
}

export const PortfolioBuilder = ({ userId }: PortfolioBuilderProps) => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    item_type: 'project',
    external_url: '',
    tags: '',
    is_featured: false,
    is_public: true
  });

  useEffect(() => {
    loadPortfolioItems();
  }, [userId]);

  const loadPortfolioItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat portfolio items",
        variant: "destructive",
      });
      return;
    }

    setPortfolioItems(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      ...formData,
      user_id: userId,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    let result;
    if (editingItem) {
      result = await supabase
        .from('portfolio_items')
        .update(itemData)
        .eq('id', editingItem.id);
    } else {
      result = await supabase
        .from('portfolio_items')
        .insert(itemData);
    }

    if (result.error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan item portfolio",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil!",
      description: `Item portfolio ${editingItem ? 'diperbarui' : 'ditambahkan'}`,
    });

    resetForm();
    loadPortfolioItems();
  };

  const handleDelete = async (itemId: string) => {
    const { error } = await supabase
      .from('portfolio_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus item",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil!",
      description: "Item portfolio dihapus",
    });

    loadPortfolioItems();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      item_type: 'project',
      external_url: '',
      tags: '',
      is_featured: false,
      is_public: true
    });
    setEditingItem(null);
    setIsAddingNew(false);
  };

  const startEdit = (item: PortfolioItem) => {
    setFormData({
      title: item.title,
      description: item.description,
      item_type: item.item_type,
      external_url: item.external_url || '',
      tags: item.tags.join(', '),
      is_featured: item.is_featured,
      is_public: item.is_public
    });
    setEditingItem(item);
    setIsAddingNew(true);
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return <FolderOpen className="w-4 h-4" />;
      case 'certificate': return <Award className="w-4 h-4" />;
      case 'achievement': return <Award className="w-4 h-4" />;
      case 'work_sample': return <Briefcase className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const generatePortfolioUrl = () => {
    return `${window.location.origin}/portfolio/${userId}`;
  };

  const sharePortfolio = async () => {
    const url = generatePortfolioUrl();
    if (navigator.share) {
      await navigator.share({
        title: 'Portfolio Saya - Talentika',
        text: 'Lihat portfolio dan pencapaian saya di Talentika',
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Disalin!",
        description: "Link portfolio telah disalin ke clipboard",
      });
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Builder</h2>
          <p className="text-muted-foreground">
            Buat portfolio digital untuk beasiswa, magang, dan peluang karir
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sharePortfolio}>
            <Share2 className="w-4 h-4 mr-2" />
            Bagikan Portfolio
          </Button>
          <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddingNew(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Item Portfolio' : 'Tambah Item Portfolio'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Judul</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Contoh: Project Website E-commerce"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Jenis Item</label>
                  <Select
                    value={formData.item_type}
                    onValueChange={(value) => setFormData({...formData, item_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="certificate">Sertifikat</SelectItem>
                      <SelectItem value="achievement">Prestasi</SelectItem>
                      <SelectItem value="work_sample">Contoh Karya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Deskripsi</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Jelaskan detail tentang item ini..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Link External (Opsional)</label>
                  <Input
                    value={formData.external_url}
                    onChange={(e) => setFormData({...formData, external_url: e.target.value})}
                    placeholder="https://github.com/username/project"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Tags (pisahkan dengan koma)</label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="React, JavaScript, Web Development"
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    />
                    <span className="text-sm">Item Unggulan</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                    />
                    <span className="text-sm">Publik</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingItem ? 'Update' : 'Tambah'} Item
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Portfolio Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolioItems.map((item) => (
          <Card key={item.id} className={`relative ${item.is_featured ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getItemTypeIcon(item.item_type)}
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {item.is_featured && (
                <Badge className="w-fit bg-primary/10 text-primary">Unggulan</Badge>
              )}
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3 line-clamp-2">
                {item.description}
              </CardDescription>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {item.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{item.tags.length - 3}
                  </Badge>
                )}
              </div>

              {item.external_url && (
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline text-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  Lihat Detail
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {portfolioItems.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-xl font-semibold mb-2">Portfolio Masih Kosong</h3>
          <p className="text-muted-foreground mb-4">
            Mulai buat portfolio digital untuk menunjukkan kemampuan dan pencapaianmu
          </p>
          <Button onClick={() => setIsAddingNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Item Pertama
          </Button>
        </Card>
      )}

      {/* Portfolio Stats */}
      {portfolioItems.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Statistik Portfolio</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{portfolioItems.length}</div>
              <div className="text-sm text-muted-foreground">Total Item</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {portfolioItems.filter(item => item.is_featured).length}
              </div>
              <div className="text-sm text-muted-foreground">Item Unggulan</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {portfolioItems.filter(item => item.is_public).length}
              </div>
              <div className="text-sm text-muted-foreground">Item Publik</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {new Set(portfolioItems.flatMap(item => item.tags)).size}
              </div>
              <div className="text-sm text-muted-foreground">Skill Tags</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};