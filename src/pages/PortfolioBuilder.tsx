import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Award, Briefcase, Plus, Edit3, Share2, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  badge_icon: string;
  earned_at: string;
  type: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  project_url?: string;
  created_at: string;
}

const PortfolioBuilder = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    project_url: ""
  });
  const [showAddProject, setShowAddProject] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      setProfile(profileData);

      // Load achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

      // Mock projects data (you can create a projects table later)
      setProjects([
        {
          id: "1",
          title: "Website Portfolio Pribadi",
          description: "Membuat website portfolio menggunakan React dan Tailwind CSS untuk menampilkan karya-karya saya.",
          image_url: "/placeholder.svg",
          project_url: "https://example.com",
          created_at: new Date().toISOString()
        },
        {
          id: "2", 
          title: "Aplikasi To-Do List",
          description: "Aplikasi manajemen tugas sederhana dengan fitur tambah, edit, dan hapus tugas.",
          created_at: new Date().toISOString()
        }
      ]);

    } catch (error: any) {
      toast.error("Gagal memuat data portfolio: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success("Profil berhasil diperbarui!");
      setEditingProfile(false);
    } catch (error: any) {
      toast.error("Gagal memperbarui profil: " + error.message);
    }
  };

  const handleAddProject = () => {
    if (!newProject.title || !newProject.description) {
      toast.error("Judul dan deskripsi project harus diisi!");
      return;
    }

    const project: Project = {
      id: Date.now().toString(),
      title: newProject.title,
      description: newProject.description,
      project_url: newProject.project_url,
      created_at: new Date().toISOString()
    };

    setProjects(prev => [project, ...prev]);
    setNewProject({ title: "", description: "", project_url: "" });
    setShowAddProject(false);
    toast.success("Project berhasil ditambahkan!");
  };

  const sharePortfolio = () => {
    const url = `${window.location.origin}/portfolio/${profile?.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link portfolio berhasil disalin!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Portfolio Builder
            </h1>
            <p className="text-xl text-muted-foreground">
              Bangun identitas digital profesional sejak dini
            </p>
          </div>

          {/* Profile Section */}
          <Card className="shadow-card mb-8">
            <CardHeader className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <User className="w-16 h-16 text-white" />
                </div>
                <Button 
                  size="sm" 
                  className="absolute bottom-0 right-0 rounded-full"
                  onClick={() => setEditingProfile(true)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
              
              {editingProfile ? (
                <div className="space-y-4 max-w-sm mx-auto">
                  <div>
                    <Label htmlFor="fullName">Nama Lengkap</Label>
                    <Input
                      id="fullName"
                      value={profile?.full_name || ""}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateProfile} size="sm">
                      Simpan
                    </Button>
                    <Button variant="outline" onClick={() => setEditingProfile(false)} size="sm">
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-2xl">{profile?.full_name || "Nama Pengguna"}</CardTitle>
                  <p className="text-muted-foreground">{profile?.email}</p>
                  <div className="flex justify-center gap-2 mt-4">
                    <Button onClick={sharePortfolio} variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Bagikan
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download CV
                    </Button>
                  </div>
                </>
              )}
            </CardHeader>
          </Card>

          {/* Main Content */}
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projects">
                <Briefcase className="w-4 h-4 mr-2" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="achievements">
                <Award className="w-4 h-4 mr-2" />
                Achievements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Projects & Karya</h2>
                <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Project Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="projectTitle">Judul Project</Label>
                        <Input
                          id="projectTitle"
                          value={newProject.title}
                          onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Contoh: Website E-commerce"
                        />
                      </div>
                      <div>
                        <Label htmlFor="projectDesc">Deskripsi</Label>
                        <Textarea
                          id="projectDesc"
                          value={newProject.description}
                          onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Ceritakan tentang project ini..."
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="projectUrl">Link Project (Opsional)</Label>
                        <Input
                          id="projectUrl"
                          value={newProject.project_url}
                          onChange={(e) => setNewProject(prev => ({ ...prev, project_url: e.target.value }))}
                          placeholder="https://github.com/username/project"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddProject} className="bg-gradient-primary">
                          Tambah Project
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddProject(false)}>
                          Batal
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="shadow-card hover:shadow-floating transition-all">
                    {project.image_url && (
                      <div className="aspect-video bg-gradient-soft rounded-t-lg overflow-hidden">
                        <img 
                          src={project.image_url} 
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {project.title}
                        {project.project_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{project.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString('id-ID')}
                        </span>
                        <Button size="sm" variant="outline">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {projects.length === 0 && (
                  <Card className="md:col-span-2 text-center py-12">
                    <CardContent>
                      <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Belum Ada Project</h3>
                      <p className="text-muted-foreground mb-4">
                        Mulai tambahkan project pertama Anda untuk membangun portfolio
                      </p>
                      <Button onClick={() => setShowAddProject(true)} className="bg-gradient-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Project Pertama
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
              <h2 className="text-2xl font-semibold mb-6">Achievements & Badges</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className="shadow-card hover:shadow-floating transition-all">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">{achievement.badge_icon}</div>
                      <h3 className="font-semibold mb-2">{achievement.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {achievement.description}
                      </p>
                      <Badge variant="outline">
                        {new Date(achievement.earned_at).toLocaleDateString('id-ID')}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}

                {achievements.length === 0 && (
                  <Card className="md:col-span-2 lg:col-span-3 text-center py-12">
                    <CardContent>
                      <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Belum Ada Achievement</h3>
                      <p className="text-muted-foreground">
                        Selesaikan kursus dan challenge untuk mendapatkan badges pertama Anda
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PortfolioBuilder;