import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Users, 
  Trophy, 
  Briefcase,
  ArrowLeft,
  Globe,
  Play,
  Download
} from "lucide-react";
import { LearningContentManager } from "@/components/dashboard/LearningContentManager";
import { ManualOpportunityManager } from "@/components/dashboard/ManualOpportunityManager";
import { LearningPathBuilder } from "@/components/admin/LearningPathBuilder";
import { PaymentManagement } from "@/components/admin/PaymentManagement";
import { QuizManager } from "@/components/admin/QuizManager";

// Web Scraping Admin Component
const WebScrapingAdmin = () => {
  const [scrapedContent, setScrapedContent] = useState<any[]>([]);
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("SCHOLARSHIP");

  const loadScrapedContent = async () => {
    try {
      const { data, error } = await supabase
        .from('scraped_content')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setScrapedContent(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat konten: " + error.message);
    }
  };

  const handleStartScraping = async () => {
    setIsScrapingActive(true);
    try {
      const { data, error } = await supabase.functions.invoke('web-scraper', {
        body: { category: selectedCategory }
      });

      if (error) throw error;

      toast.success(`Berhasil scraping ${data.data?.length || 0} konten baru!`);
      loadScrapedContent();
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

  useEffect(() => {
    loadScrapedContent();
  }, []);

  return (
    <div className="space-y-6">
      {/* Scraping Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Web Scraping Indonesia
          </CardTitle>
          <CardDescription>
            Scraping otomatis website Indonesia untuk konten beasiswa, pekerjaan, dan kompetisi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Kategori</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHOLARSHIP">Beasiswa</SelectItem>
                  <SelectItem value="JOB">Pekerjaan & Magang</SelectItem>
                  <SelectItem value="COMPETITION">Kompetisi & Lomba</SelectItem>
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

      {/* Scraped Content List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scrapedContent.map((content) => (
          <Card key={content.id} className="hover:shadow-lg transition-smooth">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge variant={content.content_type === 'scholarship' ? 'default' : content.content_type === 'job' ? 'secondary' : 'destructive'}>
                  {content.content_type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {content.source_website}
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">{content.title}</CardTitle>
              <CardDescription className="line-clamp-2">{content.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {content.location && (
                  <p className="text-sm text-muted-foreground">📍 {content.location}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {content.tags?.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
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
        ))}
      </div>
    </div>
  );
};

const Admin = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState("courses");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    difficulty_level: "beginner",
    duration_hours: 0,
    price: 0,
    thumbnail_url: "",
    is_featured: false
  });

  useEffect(() => {
    checkAdminAccess();
    loadData();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    // In a real app, you'd check for admin role here
  };

  const loadData = async () => {
    try {
      const [coursesRes, categoriesRes] = await Promise.all([
        supabase.from('courses').select('*, interest_categories(name)'),
        supabase.from('interest_categories').select('*')
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setCourses(coursesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error: any) {
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async () => {
    try {
      const { error } = await supabase
        .from('courses')
        .insert([formData]);

      if (error) throw error;

      toast.success("Kursus berhasil ditambahkan!");
      setShowAddForm(false);
      setFormData({
        title: "",
        description: "",
        category_id: "",
        difficulty_level: "beginner",
        duration_hours: 0,
        price: 0,
        thumbnail_url: "",
        is_featured: false
      });
      loadData();
    } catch (error: any) {
      toast.error("Gagal menambah kursus: " + error.message);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kursus ini?")) return;
    
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Kursus berhasil dihapus!");
      loadData();
    } catch (error: any) {
      toast.error("Gagal menghapus kursus: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Admin CMS</h1>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Konten
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="courses">Kursus</TabsTrigger>
            <TabsTrigger value="learning">Learning Hub</TabsTrigger>
            <TabsTrigger value="paths">Learning Paths</TabsTrigger>
            <TabsTrigger value="quizzes">Quiz Explorer</TabsTrigger>
            <TabsTrigger value="opportunities">Peluang</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="scraping">Web Scraping</TabsTrigger>
            <TabsTrigger value="community">Komunitas</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-6">
            <div className="grid gap-6">
              {/* Add Course Form */}
              {showAddForm && activeTab === "courses" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tambah Kursus Baru</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Judul Kursus</label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="Masukkan judul kursus"
                        />
                      </div>
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
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Deskripsi</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Deskripsi kursus"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Level</label>
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
                        <label className="text-sm font-medium">Durasi (jam)</label>
                        <Input
                          type="number"
                          value={formData.duration_hours}
                          onChange={(e) => setFormData({...formData, duration_hours: parseInt(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Harga (Rp)</label>
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">URL Thumbnail</label>
                      <Input
                        value={formData.thumbnail_url}
                        onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button onClick={handleAddCourse}>Simpan Kursus</Button>
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>Batal</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Courses List */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <BookOpen className="w-8 h-8 text-primary" />
                        <div className="flex gap-2">
                          <Badge variant={course.difficulty_level === 'beginner' ? 'default' : course.difficulty_level === 'intermediate' ? 'secondary' : 'destructive'}>
                            {course.difficulty_level === 'beginner' ? 'Pemula' : course.difficulty_level === 'intermediate' ? 'Menengah' : 'Lanjutan'}
                          </Badge>
                          {course.is_featured && <Badge variant="outline">Unggulan</Badge>}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>{course.interest_categories?.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                        <div className="flex justify-between items-center text-sm">
                          <span>{course.duration_hours} jam</span>
                          <span className="font-semibold">Rp {course.price?.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="learning" className="mt-6">
            <LearningContentManager />
          </TabsContent>

          <TabsContent value="paths" className="mt-6">
            <LearningPathBuilder />
          </TabsContent>

          <TabsContent value="quizzes" className="mt-6">
            <QuizManager />
          </TabsContent>

          <TabsContent value="challenges" className="mt-6">
            <div className="space-y-6">
              {/* Add Challenge Form */}
              {showAddForm && activeTab === "challenges" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tambah Tantangan Baru</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Judul Tantangan</label>
                        <Input placeholder="Masukkan judul tantangan" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Kategori</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="data-science">Data Science</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="programming">Programming</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Deskripsi</label>
                      <Textarea placeholder="Deskripsi tantangan" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Level</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Pemula</SelectItem>
                            <SelectItem value="intermediate">Menengah</SelectItem>
                            <SelectItem value="advanced">Lanjutan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Deadline</label>
                        <Input type="date" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Hadiah (Rp)</label>
                        <Input type="number" placeholder="5000000" />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button>Simpan Tantangan</Button>
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>Batal</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Challenges Preview */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="hover:shadow-lg transition-smooth">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Trophy className="w-8 h-8 text-primary" />
                      <Badge className="bg-green-100 text-green-800">Aktif</Badge>
                    </div>
                    <CardTitle className="text-lg">Data Science Hackathon</CardTitle>
                    <CardDescription>Kategori: Data Science</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Analisis dataset e-commerce untuk prediksi penjualan</p>
                      <div className="flex justify-between items-center text-sm">
                        <span>156 peserta</span>
                        <span className="font-semibold">Rp 10,000,000</span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="opportunities" className="mt-6">
            <ManualOpportunityManager />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentManagement />
          </TabsContent>

          <TabsContent value="scraping" className="mt-6">
            <WebScrapingAdmin />
          </TabsContent>

          <TabsContent value="community" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Manajemen Komunitas
                </CardTitle>
                <CardDescription>
                  Kelola forum diskusi dan grup belajar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Fitur ini akan segera hadir...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;