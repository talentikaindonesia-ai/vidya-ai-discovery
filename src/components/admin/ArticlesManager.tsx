import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye, Calendar, Clock, ExternalLink } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url?: string;
  category: string;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  reading_time_minutes: number;
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export const ArticlesManager = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [newTag, setNewTag] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featured_image_url: "",
    category: "karir",
    tags: [] as string[],
    is_published: false,
    is_featured: false,
    reading_time_minutes: 5,
    seo_title: "",
    seo_description: ""
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Gagal memuat artikel');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featured_image_url: "",
      category: "karir",
      tags: [],
      is_published: false,
      is_featured: false,
      reading_time_minutes: 5,
      seo_title: "",
      seo_description: ""
    });
    setEditingArticle(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.content) {
        toast.error('Judul dan konten harus diisi');
        return;
      }

      const articleData = {
        ...formData,
        published_at: formData.is_published && !editingArticle ? new Date().toISOString() : undefined
      };

      if (editingArticle) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', editingArticle.id);

        if (error) throw error;
        toast.success('Artikel berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([articleData]);

        if (error) throw error;
        toast.success('Artikel berhasil dibuat');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('Gagal menyimpan artikel');
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || "",
      featured_image_url: article.featured_image_url || "",
      category: article.category,
      tags: article.tags,
      is_published: article.is_published,
      is_featured: article.is_featured,
      reading_time_minutes: article.reading_time_minutes,
      seo_title: article.seo_title || "",
      seo_description: article.seo_description || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Artikel berhasil dihapus');
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Gagal menghapus artikel');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const generateSlug = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setFormData(prev => ({ ...prev, slug }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Kelola Artikel</CardTitle>
            <CardDescription>
              Buat, edit, dan kelola artikel untuk pengembangan karir
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Artikel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingArticle ? 'Edit Artikel' : 'Tambah Artikel Baru'}
                </DialogTitle>
                <DialogDescription>
                  Isi form di bawah untuk {editingArticle ? 'mengedit' : 'membuat'} artikel
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Konten</TabsTrigger>
                  <TabsTrigger value="settings">Pengaturan</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="title">Judul Artikel</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, title: e.target.value }));
                          if (!editingArticle) {
                            generateSlug(e.target.value);
                          }
                        }}
                        placeholder="Masukkan judul artikel..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="slug">Slug URL</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="artikel-slug-url"
                      />
                    </div>

                    <div>
                      <Label htmlFor="excerpt">Ringkasan</Label>
                      <Textarea
                        id="excerpt"
                        value={formData.excerpt}
                        onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                        placeholder="Ringkasan singkat artikel..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="content">Konten Artikel</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Tulis konten artikel dengan format Markdown..."
                        rows={15}
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Gunakan format Markdown untuk styling (# untuk heading, ** untuk bold, dll)
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="category">Kategori</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="karir">Karir</SelectItem>
                          <SelectItem value="skills">Skills</SelectItem>
                          <SelectItem value="leadership">Leadership</SelectItem>
                          <SelectItem value="productivity">Productivity</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="networking">Networking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="featured_image">URL Gambar Unggulan</Label>
                      <Input
                        id="featured_image"
                        value={formData.featured_image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, featured_image_url: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div>
                      <Label>Tags</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Tambah tag..."
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button type="button" onClick={addTag} size="sm">
                          Tambah
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="reading_time">Waktu Baca (menit)</Label>
                      <Input
                        id="reading_time"
                        type="number"
                        value={formData.reading_time_minutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, reading_time_minutes: parseInt(e.target.value) || 5 }))}
                        min="1"
                        max="60"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_published"
                        checked={formData.is_published}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                      />
                      <Label htmlFor="is_published">Publikasikan artikel</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                      />
                      <Label htmlFor="is_featured">Artikel unggulan</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="seo_title">SEO Title</Label>
                      <Input
                        id="seo_title"
                        value={formData.seo_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                        placeholder="Judul untuk SEO (max 60 karakter)"
                        maxLength={60}
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.seo_title.length}/60 karakter
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="seo_description">Meta Description</Label>
                      <Textarea
                        id="seo_description"
                        value={formData.seo_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                        placeholder="Deskripsi untuk SEO (max 160 karakter)"
                        maxLength={160}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.seo_description.length}/160 karakter
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSave}>
                  {editingArticle ? 'Update' : 'Buat'} Artikel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id} className={article.is_published ? 'border-green-200' : 'border-gray-200'}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {article.featured_image_url && (
                    <div className="flex-shrink-0">
                      <img 
                        src={article.featured_image_url} 
                        alt={article.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={article.is_published ? "default" : "secondary"}>
                        {article.is_published ? "Published" : "Draft"}
                      </Badge>
                      {article.is_featured && (
                        <Badge variant="outline">Featured</Badge>
                      )}
                      <Badge variant="outline">{article.category}</Badge>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">{article.title}</h3>
                    
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(article.created_at).toLocaleDateString('id-ID')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.reading_time_minutes} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.view_count} views
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 ml-4">
                    {article.is_published && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={`/articles/${article.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(article)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {articles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Belum ada artikel. Buat artikel pertama Anda!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};