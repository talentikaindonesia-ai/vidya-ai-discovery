import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Briefcase, Edit, Trash2, Plus, MapPin, Calendar, ExternalLink } from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  organizer: string;
  location: string;
  url: string;
  deadline: string;
  registration_start_date: string;
  registration_end_date: string;
  prize_info: string;
  requirements: string[];
  poster_url: string;
  source_website: string;
  is_active: boolean;
  is_manual: boolean;
  created_at: string;
}

export const OpportunitiesManager = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "SCHOLARSHIP",
    organizer: "",
    location: "",
    url: "",
    deadline: "",
    registration_start_date: "",
    registration_end_date: "",
    prize_info: "",
    requirements: [] as string[],
    poster_url: "",
    source_website: "",
    is_active: true,
    is_manual: true
  });

  const categories = [
    { value: "SCHOLARSHIP", label: "Beasiswa", color: "bg-blue-500" },
    { value: "JOB", label: "Lowongan Kerja", color: "bg-green-500" },
    { value: "INTERNSHIP", label: "Magang", color: "bg-purple-500" },
    { value: "COMPETITION", label: "Kompetisi", color: "bg-orange-500" },
    { value: "CONFERENCE", label: "Konferensi", color: "bg-pink-500" },
    { value: "WORKSHOP", label: "Workshop", color: "bg-indigo-500" },
    { value: "OTHER", label: "Lainnya", color: "bg-gray-500" }
  ];

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('scraped_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat peluang: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOpportunity) {
        const { error } = await supabase
          .from('scraped_content')
          .update(formData)
          .eq('id', editingOpportunity.id);

        if (error) throw error;
        toast.success("Peluang berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from('scraped_content')
          .insert([formData]);

        if (error) throw error;
        toast.success("Peluang berhasil ditambahkan!");
      }

      resetForm();
      loadOpportunities();
    } catch (error: any) {
      toast.error("Gagal menyimpan peluang: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus peluang ini?")) return;
    
    try {
      const { error } = await supabase
        .from('scraped_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Peluang berhasil dihapus!");
      loadOpportunities();
    } catch (error: any) {
      toast.error("Gagal menghapus peluang: " + error.message);
    }
  };

  const handleEdit = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
    setFormData({
      title: opportunity.title,
      description: opportunity.description || "",
      category: opportunity.category,
      organizer: opportunity.organizer || "",
      location: opportunity.location || "",
      url: opportunity.url,
      deadline: opportunity.deadline ? new Date(opportunity.deadline).toISOString().split('T')[0] : "",
      registration_start_date: opportunity.registration_start_date ? new Date(opportunity.registration_start_date).toISOString().split('T')[0] : "",
      registration_end_date: opportunity.registration_end_date ? new Date(opportunity.registration_end_date).toISOString().split('T')[0] : "",
      prize_info: opportunity.prize_info || "",
      requirements: opportunity.requirements || [],
      poster_url: opportunity.poster_url || "",
      source_website: opportunity.source_website,
      is_active: opportunity.is_active,
      is_manual: opportunity.is_manual
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingOpportunity(null);
    setFormData({
      title: "",
      description: "",
      category: "SCHOLARSHIP",
      organizer: "",
      location: "",
      url: "",
      deadline: "",
      registration_start_date: "",
      registration_end_date: "",
      prize_info: "",
      requirements: [],
      poster_url: "",
      source_website: "",
      is_active: true,
      is_manual: true
    });
    setShowAddForm(false);
  };

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || categories[categories.length - 1];
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
        <div>
          <h2 className="text-2xl font-bold">Kelola Peluang</h2>
          <p className="text-muted-foreground">Tambah, edit, dan kelola beasiswa, pekerjaan, kompetisi, dan peluang lainnya</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Peluang
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingOpportunity ? 'Edit Peluang' : 'Tambah Peluang Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Judul Peluang</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Masukkan judul peluang"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Kategori</label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
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
              </div>
              
              <div>
                <label className="text-sm font-medium">Deskripsi</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Deskripsi peluang"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Penyelenggara</label>
                  <Input
                    value={formData.organizer}
                    onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                    placeholder="Nama penyelenggara"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Lokasi</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Lokasi atau Online"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Mulai Pendaftaran</label>
                  <Input
                    type="date"
                    value={formData.registration_start_date}
                    onChange={(e) => setFormData({...formData, registration_start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tutup Pendaftaran</label>
                  <Input
                    type="date"
                    value={formData.registration_end_date}
                    onChange={(e) => setFormData({...formData, registration_end_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Deadline</label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">URL Peluang</label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Sumber Website</label>
                  <Input
                    value={formData.source_website}
                    onChange={(e) => setFormData({...formData, source_website: e.target.value})}
                    placeholder="nama-website.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Info Hadiah/Benefit</label>
                  <Textarea
                    value={formData.prize_info}
                    onChange={(e) => setFormData({...formData, prize_info: e.target.value})}
                    placeholder="Informasi hadiah atau benefit"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">URL Poster</label>
                  <Input
                    value={formData.poster_url}
                    onChange={(e) => setFormData({...formData, poster_url: e.target.value})}
                    placeholder="https://example.com/poster.jpg"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit">
                  {editingOpportunity ? 'Perbarui Peluang' : 'Simpan Peluang'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Opportunities Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opportunity) => {
          const categoryInfo = getCategoryInfo(opportunity.category);
          
          return (
            <Card key={opportunity.id} className="hover:shadow-lg transition-smooth group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-primary" />
                    <Badge 
                      className="text-white"
                      style={{ backgroundColor: categoryInfo.color }}
                    >
                      {categoryInfo.label}
                    </Badge>
                  </div>
                  <Badge variant={opportunity.is_active ? 'default' : 'secondary'}>
                    {opportunity.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-2">{opportunity.title}</CardTitle>
                <CardDescription>{opportunity.organizer}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{opportunity.description}</p>
                  
                  {opportunity.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{opportunity.location}</span>
                    </div>
                  )}
                  
                  {opportunity.deadline && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline: {new Date(opportunity.deadline).toLocaleDateString('id-ID')}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.open(opportunity.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Lihat
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(opportunity)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(opportunity.id)}
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

      {opportunities.length === 0 && (
        <div className="text-center py-8">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum ada peluang</h3>
          <p className="text-muted-foreground">Mulai dengan menambahkan peluang pertama Anda</p>
        </div>
      )}
    </div>
  );
};