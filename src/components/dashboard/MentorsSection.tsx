import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Clock, MessageCircle, Calendar, Users, Award } from "lucide-react";
import { toast } from "sonner";

interface Mentor {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar_url: string;
  expertise_areas: string[];
  experience_years: number;
  rating: number;
  total_sessions: number;
  hourly_rate: number;
  is_available: boolean;
}

interface BookingFormData {
  session_date: string;
  duration_minutes: number;
  notes: string;
}

export const MentorsSection = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    session_date: '',
    duration_minutes: 60,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('is_available', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setMentors(data || []);
    } catch (error) {
      console.error('Error loading mentors:', error);
      toast.error('Gagal memuat daftar mentor');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedMentor) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    if (!bookingForm.session_date) {
      toast.error('Pilih tanggal dan waktu sesi');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('mentor_bookings')
        .insert({
          user_id: user.id,
          mentor_id: selectedMentor.id,
          session_date: new Date(bookingForm.session_date).toISOString(),
          duration_minutes: bookingForm.duration_minutes,
          notes: bookingForm.notes
        });

      if (error) throw error;

      toast.success('Booking berhasil! Mentor akan segera menghubungi Anda.');
      setSelectedMentor(null);
      setBookingForm({
        session_date: '',
        duration_minutes: 60,
        notes: ''
      });
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error('Gagal membuat booking: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-3 bg-muted rounded w-24"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mentors.map((mentor) => (
          <Card key={mentor.id} className="hover:shadow-card transition-all duration-300 bg-card border-primary/10">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={mentor.avatar_url} alt={mentor.name} />
                  <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{mentor.name}</CardTitle>
                  <CardDescription className="font-medium">{mentor.title}</CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{mentor.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{mentor.total_sessions} sesi</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-muted-foreground line-clamp-2">{mentor.bio}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Award className="w-4 h-4" />
                  <span>{mentor.experience_years} tahun pengalaman</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{formatCurrency(mentor.hourly_rate)}/jam</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {mentor.expertise_areas.slice(0, 3).map((area, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {area}
                  </Badge>
                ))}
                {mentor.expertise_areas.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{mentor.expertise_areas.length - 3} lainnya
                  </Badge>
                )}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full"
                    onClick={() => setSelectedMentor(mentor)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Hubungi Mentor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Booking Sesi dengan {mentor.name}</DialogTitle>
                    <DialogDescription>
                      Isi form di bawah untuk menjadwalkan sesi mentoring
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tanggal & Waktu</label>
                      <Input
                        type="datetime-local"
                        value={bookingForm.session_date}
                        onChange={(e) => setBookingForm({...bookingForm, session_date: e.target.value})}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Durasi Sesi</label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={bookingForm.duration_minutes}
                        onChange={(e) => setBookingForm({...bookingForm, duration_minutes: parseInt(e.target.value)})}
                      >
                        <option value={30}>30 menit</option>
                        <option value={60}>1 jam</option>
                        <option value={90}>1.5 jam</option>
                        <option value={120}>2 jam</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Catatan (Opsional)</label>
                      <Textarea
                        placeholder="Jelaskan topik yang ingin dibahas..."
                        value={bookingForm.notes}
                        onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                      />
                    </div>
                    
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Biaya:</span>
                        <span className="font-bold text-lg">
                          {formatCurrency((mentor.hourly_rate * bookingForm.duration_minutes) / 60)}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleBooking}
                      disabled={isSubmitting}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'Memproses...' : 'Konfirmasi Booking'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {mentors.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belum ada mentor yang tersedia saat ini.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};