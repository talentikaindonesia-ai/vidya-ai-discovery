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
  ArrowLeft
} from "lucide-react";

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses">Kursus</TabsTrigger>
            <TabsTrigger value="challenges">Tantangan</TabsTrigger>
            <TabsTrigger value="opportunities">Peluang</TabsTrigger>
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
            <div className="space-y-6">
              {/* Add Opportunity Form */}
              {showAddForm && activeTab === "opportunities" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Tambah Peluang Baru</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Judul Peluang</label>
                        <Input placeholder="Masukkan judul peluang" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Perusahaan/Institusi</label>
                        <Input placeholder="Nama perusahaan" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Tipe</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="internship">Magang</SelectItem>
                            <SelectItem value="scholarship">Beasiswa</SelectItem>
                            <SelectItem value="job">Pekerjaan</SelectItem>
                            <SelectItem value="competition">Kompetisi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Lokasi</label>
                        <Input placeholder="Jakarta" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Deadline</label>
                        <Input type="date" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Deskripsi</label>
                      <Textarea placeholder="Deskripsi peluang" />
                    </div>
                    <div className="flex gap-4">
                      <Button>Simpan Peluang</Button>
                      <Button variant="outline" onClick={() => setShowAddForm(false)}>Batal</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Opportunities Preview */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="hover:shadow-lg transition-smooth">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Briefcase className="w-8 h-8 text-primary" />
                      <Badge className="bg-blue-100 text-blue-800">Magang</Badge>
                    </div>
                    <CardTitle className="text-lg">Software Engineer Intern</CardTitle>
                    <CardDescription>TechCorp Indonesia • Jakarta</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Bergabung dengan tim engineering untuk mengembangkan aplikasi</p>
                      <div className="flex justify-between items-center text-sm">
                        <span>15 hari lagi</span>
                        <span className="font-semibold">Rp 2-3 juta/bulan</span>
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