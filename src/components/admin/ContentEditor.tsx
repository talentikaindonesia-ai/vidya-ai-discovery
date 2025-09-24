import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Upload, 
  X,
  Plus,
  FileText,
  Video,
  Image,
  Music,
  File,
  Eye,
  Save,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

interface MediaFile {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface LearningContent {
  id?: string;
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
  media_files?: MediaFile[];
}

export const ContentEditor = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState<LearningContent>({
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
    priority_score: 0
  });

  useEffect(() => {
    loadCategories();
    if (contentId && contentId !== 'new') {
      loadContent();
    }
  }, [contentId]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat kategori: " + error.message);
    }
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('learning_content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error) throw error;

      setFormData({
        id: data.id,
        title: data.title,
        description: data.description || "",
        content_type: data.content_type,
        content_url: data.content_url || "",
        thumbnail_url: data.thumbnail_url || "",
        duration_minutes: data.duration_minutes,
        difficulty_level: data.difficulty_level,
        target_personas: data.target_personas || [],
        category_id: data.category_id || "",
        tags: data.tags || [],
        external_source: data.external_source || "",
        is_featured: data.is_featured,
        is_premium: data.is_premium,
        priority_score: data.priority_score
      });

      // Load associated media files if any
      // This would require a separate media_files table
      
    } catch (error: any) {
      toast.error("Gagal memuat konten: " + error.message);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!formData.title.trim()) {
        toast.error("Judul konten harus diisi");
        return;
      }

      const dataToSubmit = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (contentId && contentId !== 'new') {
        // Update existing content
        const { error } = await supabase
          .from('learning_content')
          .update(dataToSubmit)
          .eq('id', contentId);

        if (error) throw error;
        toast.success("Konten berhasil diperbarui!");
      } else {
        // Create new content
        const { data, error } = await supabase
          .from('learning_content')
          .insert([{
            ...dataToSubmit,
            created_at: new Date().toISOString(),
            created_by: (await supabase.auth.getUser()).data.user?.id
          }])
          .select()
          .single();

        if (error) throw error;
        toast.success("Konten berhasil dibuat!");
        navigate(`/admin/content/edit/${data.id}`);
      }
    } catch (error: any) {
      toast.error("Gagal menyimpan konten: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contentId || contentId === 'new') return;
    
    if (!confirm("Yakin ingin menghapus konten ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('learning_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;
      toast.success("Konten berhasil dihapus!");
      navigate('/admin');
    } catch (error: any) {
      toast.error("Gagal menghapus konten: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleMediaUpload = async (files: FileList | null) => {
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Upload to Supabase Storage
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `content-media/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('content-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('content-media')
          .getPublicUrl(filePath);

        const newMediaFile: MediaFile = {
          id: Date.now().toString() + i,
          name: file.name,
          type: file.type,
          url: urlData.publicUrl,
          size: file.size
        };

        setMediaFiles(prev => [...prev, newMediaFile]);
        toast.success(`${file.name} berhasil diupload!`);
      } catch (error: any) {
        toast.error(`Gagal upload ${file.name}: ${error.message}`);
      }
    }
  };

  const removeMediaFile = async (mediaFile: MediaFile) => {
    try {
      // Remove from storage
      const filePath = mediaFile.url.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('content-media')
          .remove([`content-media/${filePath}`]);
      }
      
      setMediaFiles(prev => prev.filter(file => file.id !== mediaFile.id));
      toast.success("File berhasil dihapus");
    } catch (error: any) {
      toast.error("Gagal menghapus file: " + error.message);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Admin
            </Button>
            <h1 className="text-2xl font-bold">
              {contentId === 'new' ? 'Tambah Konten Baru' : 'Edit Konten'}
            </h1>
          </div>
          
          <div className="flex gap-2">
            {contentId !== 'new' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/learning/content/${contentId}`)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </>
            )}
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>

        {/* Content Editor */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
            <TabsTrigger value="media">Media & Konten</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar Konten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Judul Konten</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Masukkan judul konten"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Jenis Konten</label>
                    <Select 
                      value={formData.content_type} 
                      onValueChange={(value) => setFormData({...formData, content_type: value})}
                    >
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
                        <SelectItem value="assignment">Tugas</SelectItem>
                        <SelectItem value="audio">Audio/Podcast</SelectItem>
                        <SelectItem value="animation">Animasi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Kategori</label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => setFormData({...formData, category_id: value})}
                    >
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
                    <label className="text-sm font-medium">Level Kesulitan</label>
                    <Select 
                      value={formData.difficulty_level} 
                      onValueChange={(value) => setFormData({...formData, difficulty_level: value})}
                    >
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

                <div>
                  <label className="text-sm font-medium">Deskripsi</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Deskripsi konten pembelajaran"
                    rows={4}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Tambah tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-destructive hover:text-white"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="mt-6">
            <div className="space-y-6">
              {/* Main Content URL */}
              <Card>
                <CardHeader>
                  <CardTitle>Konten Utama</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              {/* Media Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Media Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Upload File Media</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag & drop files atau klik untuk memilih
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Mendukung: Video (MP4, AVI), Audio (MP3, WAV), Gambar (JPG, PNG), PDF, dan lainnya
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="*/*"
                      onChange={(e) => handleMediaUpload(e.target.files)}
                      className="hidden"
                      id="media-upload"
                    />
                    <Button variant="outline" onClick={() => document.getElementById('media-upload')?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Pilih File
                    </Button>
                  </div>

                  {/* Media Files List */}
                  {mediaFiles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">File yang diupload:</h4>
                      <div className="space-y-2">
                        {mediaFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {getFileIcon(file.type)}
                              <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {file.type} • {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(file.url, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removeMediaFile(file)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Konten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Featured Content</label>
                        <p className="text-xs text-muted-foreground">Tampilkan di halaman utama</p>
                      </div>
                      <Switch
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData({...formData, is_featured: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Premium Content</label>
                        <p className="text-xs text-muted-foreground">Hanya untuk member premium</p>
                      </div>
                      <Switch
                        checked={formData.is_premium}
                        onCheckedChange={(checked) => setFormData({...formData, is_premium: checked})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Priority Score</label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Skor prioritas untuk pengurutan (0-100)
                    </p>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.priority_score}
                      onChange={(e) => setFormData({...formData, priority_score: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">External Source</label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Sumber eksternal (jika ada)
                  </p>
                  <Input
                    value={formData.external_source}
                    onChange={(e) => setFormData({...formData, external_source: e.target.value})}
                    placeholder="Nama sumber atau platform eksternal"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview Konten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    {formData.thumbnail_url ? (
                      <img 
                        src={formData.thumbnail_url} 
                        alt={formData.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-2" />
                        <p>No thumbnail preview</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">{formData.title || 'Judul Konten'}</h3>
                    <p className="text-muted-foreground mt-2">
                      {formData.description || 'Deskripsi konten akan ditampilkan di sini'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{formData.content_type}</Badge>
                    <Badge>{formData.difficulty_level}</Badge>
                    <Badge variant="secondary">{formData.duration_minutes} menit</Badge>
                    {formData.is_featured && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
                    {formData.is_premium && <Badge className="bg-purple-100 text-purple-800">Premium</Badge>}
                  </div>

                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};