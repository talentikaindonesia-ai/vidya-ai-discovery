import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  ExternalLink,
  Calendar,
  MapPin,
  Users,
  Trophy,
  FileText,
  Globe
} from "lucide-react";
import { toast } from "sonner";

interface ManualOpportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  poster_url: string;
  url: string;
  source_website: string;
  location: string;
  organizer: string;
  registration_start_date: string;
  registration_end_date: string;
  deadline: string;
  requirements: string[];
  tags: string[];
  contact_info: any;
  prize_info: string;
  is_active: boolean;
  is_manual: boolean;
  created_at: string;
}

export const ManualOpportunityManager = () => {
  const [opportunities, setOpportunities] = useState<ManualOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<ManualOpportunity | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    content_type: "scholarship",
    poster_url: "",
    url: "",
    source_website: "",
    location: "",
    organizer: "",
    registration_start_date: "",
    registration_end_date: "",
    deadline: "",
    requirements: [] as string[],
    tags: [] as string[],
    contact_info: {
      email: "",
      phone: "",
      website: ""
    },
    prize_info: "",
    is_active: true
  });

  const [newRequirement, setNewRequirement] = useState("");
  const [newTag, setNewTag] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('scraped_content')
        .select('*')
        .eq('is_manual', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat peluang: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `posters/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('opportunity-posters')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('opportunity-posters')
        .getPublicUrl(filePath);

      setFormData({ ...formData, poster_url: publicUrl });
      toast.success("Poster berhasil diupload!");
    } catch (error: any) {
      toast.error("Gagal upload poster: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitOpportunity = async () => {
    try {
      const opportunityData = {
        ...formData,
        is_manual: true,
        category: formData.category.toLowerCase(),
        // Handle empty date strings by converting them to null
        registration_start_date: formData.registration_start_date || null,
        registration_end_date: formData.registration_end_date || null,
        deadline: formData.deadline || null
      };

      if (editingOpportunity) {
        // Update existing opportunity
        const { error } = await supabase
          .from('scraped_content')
          .update(opportunityData)
          .eq('id', editingOpportunity.id);

        if (error) throw error;
        toast.success("Peluang berhasil diperbarui!");
      } else {
        // Add new opportunity
        const { error } = await supabase
          .from('scraped_content')
          .insert([opportunityData]);

        if (error) throw error;
        toast.success("Peluang berhasil ditambahkan!");
      }

      resetForm();
      loadOpportunities();
    } catch (error: any) {
      toast.error("Gagal menyimpan peluang: " + error.message);
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
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

  const handleEditOpportunity = (opportunity: ManualOpportunity) => {
    setEditingOpportunity(opportunity);
    setFormData({
      title: opportunity.title,
      description: opportunity.description || "",
      category: opportunity.category,
      content_type: opportunity.content_type,
      poster_url: opportunity.poster_url || "",
      url: opportunity.url || "",
      source_website: opportunity.source_website || "",
      location: opportunity.location || "",
      organizer: opportunity.organizer || "",
      registration_start_date: opportunity.registration_start_date ? 
        new Date(opportunity.registration_start_date).toISOString().slice(0, 16) : "",
      registration_end_date: opportunity.registration_end_date ? 
        new Date(opportunity.registration_end_date).toISOString().slice(0, 16) : "",
      deadline: opportunity.deadline ? 
        new Date(opportunity.deadline).toISOString().slice(0, 16) : "",
      requirements: opportunity.requirements || [],
      tags: opportunity.tags || [],
      contact_info: opportunity.contact_info || { email: "", phone: "", website: "" },
      prize_info: opportunity.prize_info || "",
      is_active: opportunity.is_active
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingOpportunity(null);
    setShowAddForm(false);
    setSelectedImage(null);
    setFormData({
      title: "",
      description: "",
      category: "",
      content_type: "scholarship",
      poster_url: "",
      url: "",
      source_website: "",
      location: "",
      organizer: "",
      registration_start_date: "",
      registration_end_date: "",
      deadline: "",
      requirements: [],
      tags: [],
      contact_info: { email: "", phone: "", website: "" },
      prize_info: "",
      is_active: true
    });
  };

  const addRequirement = () => {
    if (newRequirement && !formData.requirements.includes(newRequirement)) {
      setFormData({ ...formData, requirements: [...formData.requirements, newRequirement] });
      setNewRequirement("");
    }
  };

  const removeRequirement = (requirement: string) => {
    setFormData({ 
      ...formData, 
      requirements: formData.requirements.filter(r => r !== requirement) 
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

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'scholarship': return <Trophy className="w-4 h-4" />;
      case 'job': return <Users className="w-4 h-4" />;
      case 'competition': return <Trophy className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
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
        <div>
          <h2 className="text-2xl font-bold">Kelola Peluang Manual</h2>
          <p className="text-muted-foreground">Tambah dan kelola peluang secara manual dengan informasi lengkap</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Peluang
        </Button>
      </div>

      {/* Add/Edit Opportunity Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingOpportunity ? 'Edit Peluang' : 'Tambah Peluang Baru'}</CardTitle>
            <CardDescription>Lengkapi informasi peluang dengan detail yang akurat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Judul Peluang *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Contoh: Beasiswa S1 Universitas Indonesia 2024"
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scholarship">Beasiswa</SelectItem>
                    <SelectItem value="job">Pekerjaan & Magang</SelectItem>
                    <SelectItem value="competition">Kompetisi & Lomba</SelectItem>
                    <SelectItem value="conference">Konferensi & Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Deskripsi *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Jelaskan secara detail tentang peluang ini..."
                rows={4}
              />
            </div>

            {/* Poster Upload */}
            <div>
              <Label>Poster Peluang</Label>
              <div className="mt-2 space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedImage(file);
                        handleImageUpload(file);
                      }
                    }}
                    disabled={uploading}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={uploading}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
                {formData.poster_url && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <img 
                      src={formData.poster_url} 
                      alt="Poster preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Organization & Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organizer">Penyelenggara *</Label>
                <Input
                  id="organizer"
                  value={formData.organizer}
                  onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                  placeholder="Contoh: Universitas Indonesia"
                />
              </div>
              <div>
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Contoh: Jakarta, Indonesia"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="reg-start">Tanggal Buka Pendaftaran</Label>
                <Input
                  id="reg-start"
                  type="datetime-local"
                  value={formData.registration_start_date}
                  onChange={(e) => setFormData({...formData, registration_start_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="reg-end">Tanggal Tutup Pendaftaran</Label>
                <Input
                  id="reg-end"
                  type="datetime-local"
                  value={formData.registration_end_date}
                  onChange={(e) => setFormData({...formData, registration_end_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="deadline">Deadline Final</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                />
              </div>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="url">Link Website Resmi *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  placeholder="https://website-resmi.com"
                />
              </div>
              <div>
                <Label htmlFor="source">Sumber Website</Label>
                <Input
                  id="source"
                  value={formData.source_website}
                  onChange={(e) => setFormData({...formData, source_website: e.target.value})}
                  placeholder="Contoh: ui.ac.id"
                />
              </div>
            </div>

            {/* Requirements */}
            <div>
              <Label>Persyaratan</Label>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="Tambah persyaratan"
                    onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                  />
                  <Button type="button" onClick={addRequirement}>Tambah</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.requirements.map((req, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer" 
                      onClick={() => removeRequirement(req)}
                    >
                      {req} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
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
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <Label>Informasi Kontak</Label>
              <div className="mt-2 grid grid-cols-3 gap-4">
                <Input
                  placeholder="Email"
                  value={formData.contact_info.email}
                  onChange={(e) => setFormData({
                    ...formData, 
                    contact_info: { ...formData.contact_info, email: e.target.value }
                  })}
                />
                <Input
                  placeholder="Nomor Telepon"
                  value={formData.contact_info.phone}
                  onChange={(e) => setFormData({
                    ...formData, 
                    contact_info: { ...formData.contact_info, phone: e.target.value }
                  })}
                />
                <Input
                  placeholder="Website"
                  value={formData.contact_info.website}
                  onChange={(e) => setFormData({
                    ...formData, 
                    contact_info: { ...formData.contact_info, website: e.target.value }
                  })}
                />
              </div>
            </div>

            {/* Prize Information */}
            <div>
              <Label htmlFor="prize">Informasi Hadiah/Benefit</Label>
              <Textarea
                id="prize"
                value={formData.prize_info}
                onChange={(e) => setFormData({...formData, prize_info: e.target.value})}
                placeholder="Jelaskan hadiah, benefit, atau keuntungan yang didapat..."
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label>Aktif (Tampilkan di halaman peluang)</Label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button onClick={handleSubmitOpportunity}>
                {editingOpportunity ? 'Update' : 'Simpan'} Peluang
              </Button>
              <Button variant="outline" onClick={resetForm}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opportunities List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opportunity) => (
          <Card key={opportunity.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="gap-1">
                    {getCategoryIcon(opportunity.category)}
                    {opportunity.category}
                  </Badge>
                  <Badge variant={opportunity.is_active ? "default" : "secondary"}>
                    {opportunity.is_active ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
                <Badge variant="outline" className="gap-1">
                  <FileText className="w-3 h-3" />
                  Manual
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">{opportunity.title}</CardTitle>
              <CardDescription className="line-clamp-2">{opportunity.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {opportunity.poster_url && (
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={opportunity.poster_url} 
                      alt={opportunity.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="space-y-2 text-sm">
                  {opportunity.organizer && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{opportunity.organizer}</span>
                    </div>
                  )}
                  
                  {opportunity.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{opportunity.location}</span>
                    </div>
                  )}
                  
                  {opportunity.deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Deadline: {new Date(opportunity.deadline).toLocaleDateString('id-ID')}</span>
                    </div>
                  )}
                </div>

                {opportunity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {opportunity.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 gap-1"
                    onClick={() => handleEditOpportunity(opportunity)}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  {opportunity.url && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.open(opportunity.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDeleteOpportunity(opportunity.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {opportunities.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Peluang Manual</h3>
            <p className="text-muted-foreground mb-4">
              Mulai tambahkan peluang secara manual untuk memberikan informasi yang lengkap dan akurat kepada pengguna.
            </p>
            <Button onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Tambah Peluang Pertama
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};