import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CalendarIcon, Clock, User, Video, MessageSquare, Star, Award, Briefcase } from "lucide-react";
import { format, addDays, isAfter } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Mentor {
  id: string;
  name: string;
  title: string;
  bio?: string;
  avatar_url?: string;
  expertise_areas: string[];
  experience_years: number;
  rating: number;
  total_sessions: number;
  hourly_rate: number;
  is_available: boolean;
}

interface MentorshipSession {
  id: string;
  mentor_id: string;
  session_type: string;
  session_date: string;
  duration_minutes: number;
  status: string;
  notes?: string;
  mentors?: Mentor;
}

interface MentorshipBookingProps {
  userId: string;
  userPlan: 'individual' | 'premium';
}

export const MentorshipBooking = ({ userId, userPlan }: MentorshipBookingProps) => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [sessionType, setSessionType] = useState<string>('consultation');
  const [notes, setNotes] = useState('');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMentors();
    loadUserSessions();
  }, [userId]);

  const loadMentors = async () => {
    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .eq('is_available', true)
      .order('rating', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat daftar mentor",
        variant: "destructive",
      });
      return;
    }

    setMentors(data || []);
    setLoading(false);
  };

  const loadUserSessions = async () => {
    const { data, error } = await supabase
      .from('mentorship_sessions')
      .select(`
        *,
        mentors (*)
      `)
      .eq('user_id', userId)
      .order('session_date', { ascending: false });

    if (error) {
      toast({
        title: "Error", 
        description: "Gagal memuat sesi mentorship",
        variant: "destructive",
      });
      return;
    }

    setSessions(data || []);
  };

  const handleBookSession = async () => {
    if (!selectedMentor || !selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua data booking",
        variant: "destructive",
      });
      return;
    }

    // Check plan limits
    if (userPlan === 'individual') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyConsultations = sessions.filter(session => {
        const sessionDate = new Date(session.session_date);
        return sessionDate.getMonth() === currentMonth && 
               sessionDate.getFullYear() === currentYear &&
               session.status !== 'cancelled';
      });

      if (monthlyConsultations.length >= 1) {
        toast({
          title: "Limit Tercapai",
          description: "Paket Individual hanya dapat 1 konsultasi per bulan. Upgrade ke Premium untuk konsultasi unlimited.",
          variant: "destructive",
        });
        return;
      }
    }

    const sessionDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    sessionDateTime.setHours(parseInt(hours), parseInt(minutes));

    const { error } = await supabase
      .from('mentorship_sessions')
      .insert({
        user_id: userId,
        mentor_id: selectedMentor.id,
        session_type: sessionType,
        session_date: sessionDateTime.toISOString(),
        duration_minutes: sessionType === 'consultation' ? 60 : 90,
        status: 'scheduled',
        notes: notes
      });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal melakukan booking",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil!",
      description: "Sesi mentorship berhasil dibooking",
    });

    resetBookingForm();
    loadUserSessions();
  };

  const resetBookingForm = () => {
    setSelectedMentor(null);
    setSelectedDate(undefined);
    setSelectedTime('');
    setSessionType('consultation');
    setNotes('');
    setIsBookingOpen(false);
  };

  const getAvailableTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const getSessionStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      scheduled: { variant: "default", text: "Terjadwal" },
      completed: { variant: "secondary", text: "Selesai" },
      cancelled: { variant: "destructive", text: "Dibatalkan" }
    };
    
    return (
      <Badge variant={variants[status]?.variant || "default"}>
        {variants[status]?.text || status}
      </Badge>
    );
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
      {/* Header & Plan Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Konsultasi & Mentorship</h2>
          <p className="text-muted-foreground">
            Bimbingan dari mentor berpengalaman untuk mengembangkan karir
          </p>
        </div>
        <Card className="p-4 bg-muted/50">
          <div className="text-sm">
            <span className="font-medium">Paket {userPlan === 'individual' ? 'Individual' : 'Premium'}:</span>
            <p className="text-muted-foreground">
              {userPlan === 'individual' ? '1x konsultasi/bulan' : 'Konsultasi unlimited'}
            </p>
          </div>
        </Card>
      </div>

      {/* My Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Sesi Saya
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada sesi yang dibooking
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{session.mentors?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.session_date), 'PPP p', { locale: idLocale })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.session_type === 'consultation' ? 'Konsultasi' : 'Mentorship'} ({session.duration_minutes} menit)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getSessionStatusBadge(session.status)}
                    {session.status === 'scheduled' && isAfter(new Date(session.session_date), new Date()) && (
                      <Button size="sm" className="mt-2" variant="outline">
                        <Video className="w-4 h-4 mr-2" />
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Mentors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Mentor Tersedia
            </CardTitle>
            <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
              <DialogTrigger asChild>
                <Button>Book Sesi</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Book Sesi Mentorship</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Select Mentor */}
                  <div>
                    <label className="text-sm font-medium">Pilih Mentor</label>
                    <Select value={selectedMentor?.id} onValueChange={(value) => {
                      const mentor = mentors.find(m => m.id === value);
                      setSelectedMentor(mentor || null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih mentor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mentors.map((mentor) => (
                          <SelectItem key={mentor.id} value={mentor.id}>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium">{mentor.name}</div>
                                <div className="text-sm text-muted-foreground">{mentor.title}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Session Type */}
                  <div>
                    <label className="text-sm font-medium">Jenis Sesi</label>
                    <Select value={sessionType} onValueChange={setSessionType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">Konsultasi (60 menit)</SelectItem>
                        {userPlan === 'premium' && (
                          <SelectItem value="mentorship">Mentorship Intensif (90 menit)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Date */}
                  <div>
                    <label className="text-sm font-medium">Tanggal</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", 
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP", { locale: idLocale }) : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date() || date < addDays(new Date(), 1)}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Select Time */}
                  <div>
                    <label className="text-sm font-medium">Waktu</label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih waktu..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableTimeSlots().map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-medium">Catatan (Opsional)</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Jelaskan topik atau hal yang ingin didiskusikan..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleBookSession} className="flex-1">
                      Book Sekarang
                    </Button>
                    <Button variant="outline" onClick={resetBookingForm}>
                      Batal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{mentor.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{mentor.title}</p>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{mentor.rating}</span>
                      <span className="text-xs text-muted-foreground">
                        ({mentor.total_sessions} sesi)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {mentor.expertise_areas.slice(0, 2).map((area, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{mentor.experience_years} tahun pengalaman</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};