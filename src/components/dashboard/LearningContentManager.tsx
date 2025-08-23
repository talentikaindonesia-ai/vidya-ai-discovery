import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Eye, 
  BarChart3,
  Users,
  BookOpen,
  Video,
  FileText,
  Brain,
  Star,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface LearningCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
}

interface LearningContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  thumbnail_url: string;
  duration_minutes: number;
  difficulty_level: string;
  target_personas: string[];
  category_id: string;
  tags: string[];
  external_source: string;
  is_featured: boolean;
  is_premium: boolean;
  priority_score: number;
  total_enrollments: number;
  average_rating: number;
  is_active: boolean;
  learning_categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

export const LearningContentManager = () => {
  const [categories, setCategories] = useState<LearningCategory[]>([]);
  const [content, setContent] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContent, setEditingContent] = useState<LearningContent | null>(null);
  const [activeTab, setActiveTab] = useState("content");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_type: "course",
    content_url: "",
    thumbnail_url: "",
    duration_minutes: 0,
    difficulty_level: "beginner",
    target_personas: [] as string[],
    category_id: "",
    tags: [] as string[],
    external_source: "",
    is_featured: false,
    is_premium: false,
    priority_score: 0,
    jenjang: "SMP",
    media_files: [] as string[]
  });

  const [newTag, setNewTag] = useState("");
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    icon: "BookOpen",
    color: "#3B82F6"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, contentRes] = await Promise.all([
        supabase.from('learning_categories').select('*').order('name'),
        supabase.from('learning_content').select(`
          *,
          learning_categories (
            name,
            icon,
            color
          )
        `).order('created_at', { ascending: false })
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (contentRes.error) throw contentRes.error;

      setCategories(categoriesRes.data || []);
      setContent(contentRes.data || []);
    } catch (error: any) {
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      const { error } = await supabase
        .from('learning_categories')
        .insert([categoryForm]);

      if (error) throw error;

      toast.success("Kategori berhasil ditambahkan!");
      setCategoryForm({ name: "", description: "", icon: "BookOpen", color: "#3B82F6" });
      loadData();
    } catch (error: any) {
      toast.error("Gagal menambah kategori: " + error.message);
    }
  };

  const handleSubmitContent = async () => {
    try {
      if (editingContent) {
        // Update existing content
        const { error } = await supabase
          .from('learning_content')
          .update(formData)
          .eq('id', editingContent.id);

        if (error) throw error;
        toast.success("Konten berhasil diperbarui!");
      } else {
        // Add new content
        const { error } = await supabase
          .from('learning_content')
          .insert([formData]);

        if (error) throw error;
        toast.success("Konten berhasil ditambahkan!");
      }

      resetForm();
      loadData();
    } catch (error: any) {
      toast.error("Gagal menyimpan konten: " + error.message);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm("Yakin ingin menghapus konten ini?")) return;
    
    try {
      const { error } = await supabase
        .from('learning_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Konten berhasil dihapus!");
      loadData();
    } catch (error: any) {
      toast.error("Gagal menghapus konten: " + error.message);
    }
  };

  const handleEditContent = (content: LearningContent) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      description: content.description || "",
      content_type: content.content_type,
      content_url: content.content_url || "",
      thumbnail_url: content.thumbnail_url || "",
      duration_minutes: content.duration_minutes,
      difficulty_level: content.difficulty_level,
      target_personas: content.target_personas,
      category_id: content.category_id || "",
      tags: content.tags,
      external_source: content.external_source || "",
      is_featured: content.is_featured,
      is_premium: content.is_premium,
      priority_score: content.priority_score,
      jenjang: "SMP",
      media_files: []
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingContent(null);
    setShowAddForm(false);
    setFormData({
      title: "",
      description: "",
      content_type: "course",
      content_url: "",
      thumbnail_url: "",
      duration_minutes: 0,
      difficulty_level: "beginner",
      target_personas: [],
      category_id: "",
      tags: [],
      external_source: "",
      is_featured: false,
      is_premium: false,
      priority_score: 0,
      jenjang: "SMP",
      media_files: []
    });
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      case 'module': return <Brain className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'quiz': return <Brain className="w-4 h-4" />;
      case 'assignment': return <Edit className="w-4 h-4" />;
      case 'audio': return <Video className="w-4 h-4" />;
      case 'animation': return <Star className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Management</h2>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Konten
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Konten Pembelajaran</TabsTrigger>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          {/* Add/Edit Content Form */}
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingContent ? 'Edit Konten' : 'Tambah Konten Baru'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Judul</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Judul konten"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Jenis Konten</label>
                    <Select value={formData.content_type} onValueChange={(value) => setFormData({...formData, content_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="course">Kursus</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="article">Artikel</SelectItem>
                        <SelectItem value="module">Modul Interaktif</SelectItem>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="assignment">Tugas Interaktif</SelectItem>
                        <SelectItem value="audio">Audio/Podcast</SelectItem>
                        <SelectItem value="animation">Animasi/Simulasi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Deskripsi</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Deskripsi konten"
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Kategori</label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Jenjang</label>
                    <Select value={formData.jenjang} onValueChange={(value) => setFormData({...formData, jenjang: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SMP">SMP</SelectItem>
                        <SelectItem value="SMA">SMA</SelectItem>
                        <SelectItem value="Umum">Umum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Level Kesulitan</label>
                    <Select value={formData.difficulty_level} onValueChange={(value) => setFormData({...formData, difficulty_level: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Pemula</SelectItem>
                        <SelectItem value="intermediate">Menengah</SelectItem>
                        <SelectItem value="advanced">Lanjutan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Durasi (menit)</label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">URL Konten</label>
                    <Input
                      value={formData.content_url}
                      onChange={(e) => setFormData({...formData, content_url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">URL Thumbnail</label>
                    <Input
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* File Upload Section */}
                <div>
                  <label className="text-sm font-medium">Upload Multimedia</label>
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag & drop file multimedia atau klik untuk upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mendukung: PDF, Video (MP4), Audio (MP3), Gambar (JPG, PNG), Animasi
                    </p>
                    <Button variant="outline" className="mt-2">
                      <Upload className="w-4 h-4 mr-2" />
                      Pilih File
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Tambah tag"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button type="button" onClick={addTag}>Tambah</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({...formData, is_featured: checked})}
                    />
                    <label className="text-sm">Featured</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_premium}
                      onCheckedChange={(checked) => setFormData({...formData, is_premium: checked})}
                    />
                    <label className="text-sm">Premium</label>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority Score</label>
                    <Input
                      type="number"
                      value={formData.priority_score}
                      onChange={(e) => setFormData({...formData, priority_score: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleSubmitContent}>
                    {editingContent ? 'Update' : 'Simpan'} Konten
                  </Button>
                  <Button variant="outline" onClick={resetForm}>Batal</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {content.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary" className="gap-1">
                        {getContentIcon(item.content_type)}
                        {item.content_type}
                      </Badge>
                      {item.is_featured && (
                        <Badge variant="default" className="gap-1">
                          <Star className="w-3 h-3" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <Badge 
                      style={{ backgroundColor: item.learning_categories?.color || '#3B82F6' }}
                      className="text-white"
                    >
                      {item.learning_categories?.name}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.duration_minutes}m</span>
                      <span>Rating: {item.average_rating.toFixed(1)}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEditContent(item)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      {item.content_url && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => window.open(item.content_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDeleteContent(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          {/* Add Category Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tambah Kategori Baru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nama Kategori</label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    placeholder="Nama kategori"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Warna</label>
                  <Input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Deskripsi</label>
                <Textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  placeholder="Deskripsi kategori"
                />
              </div>
              <Button onClick={handleAddCategory}>Tambah Kategori</Button>
            </CardContent>
          </Card>

          {/* Categories List */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Konten</p>
                    <p className="text-2xl font-bold">{content.length}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Kategori</p>
                    <p className="text-2xl font-bold">{categories.length}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Konten Featured</p>
                    <p className="text-2xl font-bold">{content.filter(c => c.is_featured).length}</p>
                  </div>
                  <Star className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Avg Rating</p>
                    <p className="text-2xl font-bold">
                      {(content.reduce((sum, c) => sum + c.average_rating, 0) / content.length || 0).toFixed(1)}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};