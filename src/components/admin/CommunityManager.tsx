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
import { Users, Edit, Trash2, Plus, Calendar, MapPin, Clock } from "lucide-react";

interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  location: string;
  duration_minutes: number;
  max_participants: number;
  current_participants: number;
  is_premium_only: boolean;
  is_active: boolean;
  organizer_id: string;
  created_at: string;
}

export const CommunityManager = () => {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "webinar",
    event_date: "",
    location: "",
    duration_minutes: 120,
    max_participants: 100,
    is_premium_only: false,
    is_active: true
  });

  const eventTypes = [
    { value: "webinar", label: "Webinar" },
    { value: "workshop", label: "Workshop" },
    { value: "meetup", label: "Meetup" },
    { value: "conference", label: "Konferensi" },
    { value: "networking", label: "Networking" },
    { value: "competition", label: "Kompetisi" },
    { value: "training", label: "Pelatihan" },
    { value: "seminar", label: "Seminar" }
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat event: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const eventData = {
        ...formData,
        organizer_id: user.id,
        current_participants: 0
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('community_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast.success("Event berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from('community_events')
          .insert([eventData]);

        if (error) throw error;
        toast.success("Event berhasil ditambahkan!");
      }

      resetForm();
      loadEvents();
    } catch (error: any) {
      toast.error("Gagal menyimpan event: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus event ini?")) return;
    
    try {
      const { error } = await supabase
        .from('community_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Event berhasil dihapus!");
      loadEvents();
    } catch (error: any) {
      toast.error("Gagal menghapus event: " + error.message);
    }
  };

  const handleEdit = (event: CommunityEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      event_date: new Date(event.event_date).toISOString().slice(0, 16),
      location: event.location || "",
      duration_minutes: event.duration_minutes,
      max_participants: event.max_participants || 100,
      is_premium_only: event.is_premium_only,
      is_active: event.is_active
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      event_type: "webinar",
      event_date: "",
      location: "",
      duration_minutes: 120,
      max_participants: 100,
      is_premium_only: false,
      is_active: true
    });
    setShowAddForm(false);
  };

  const getEventTypeLabel = (type: string) => {
    const eventType = eventTypes.find(et => et.value === type);
    return eventType ? eventType.label : type;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isEventPast = (dateString: string) => {
    return new Date(dateString) < new Date();
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
          <h2 className="text-2xl font-bold">Kelola Event Komunitas</h2>
          <p className="text-muted-foreground">Tambah, edit, dan kelola semua event komunitas dan aktivitas</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Tambah Event Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Judul Event</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Masukkan judul event"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Jenis Event</label>
                  <Select value={formData.event_type} onValueChange={(value) => setFormData({...formData, event_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
                  placeholder="Deskripsi event"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tanggal & Waktu</label>
                  <Input
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Lokasi</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Online atau lokasi fisik"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Durasi (menit)</label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value) || 120})}
                    min="30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Maksimal Peserta</label>
                  <Input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value) || 100})}
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_premium_only}
                    onChange={(e) => setFormData({...formData, is_premium_only: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Khusus Member Premium</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-sm">Event Aktif</span>
                </label>
              </div>

              <div className="flex gap-4">
                <Button type="submit">
                  {editingEvent ? 'Perbarui Event' : 'Simpan Event'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className={`hover:shadow-lg transition-smooth group ${isEventPast(event.event_date) ? 'opacity-75' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  <Badge variant="outline">
                    {getEventTypeLabel(event.event_type)}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {event.is_premium_only && (
                    <Badge variant="secondary" className="text-xs">Premium</Badge>
                  )}
                  <Badge variant={event.is_active ? 'default' : 'secondary'} className="text-xs">
                    {event.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                  {isEventPast(event.event_date) && (
                    <Badge variant="outline" className="text-xs">Selesai</Badge>
                  )}
                </div>
              </div>
              <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateTime(event.event_date)}</span>
                </div>
                
                {event.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{event.duration_minutes} menit</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{event.current_participants}/{event.max_participants || '∞'}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleEdit(event)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum ada event komunitas</h3>
          <p className="text-muted-foreground">Mulai dengan menambahkan event komunitas pertama Anda</p>
        </div>
      )}
    </div>
  );
};