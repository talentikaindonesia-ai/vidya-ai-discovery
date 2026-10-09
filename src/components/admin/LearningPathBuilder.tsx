import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  Edit,
  Move,
  BookOpen,
  Users,
  Clock,
  Target,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import UnggahGambar from "./UnggahGambar";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  target_persona: string;
  estimated_duration_hours: number;
  is_active: boolean;
  cover_url: string | null;
  career_outlook: string | null;
  salary_range: string | null;
  related_certifications: string[] | null;
}

interface PathContent {
  id: string;
  path_id: string;
  content_id: string;
  order_index: number;
  is_required: boolean;
  learning_content: {
    title: string;
    content_type: string;
    duration_minutes: number;
    difficulty_level: string;
  };
}

// Student-side matching (my_learning_path RPC) keys off exactly these values —
// keep in sync with the RIASEC types used by the assessment.
const RIASEC_PERSONAS = [
  { value: "riasec:realistic", label: "Realistic — Praktisi & Teknisi" },
  { value: "riasec:investigative", label: "Investigative — Peneliti & Analis" },
  { value: "riasec:artistic", label: "Artistic — Kreator & Desainer" },
  { value: "riasec:social", label: "Social — Sosial & Komunikasi" },
  { value: "riasec:enterprising", label: "Enterprising — Wirausaha & Pemimpin" },
  { value: "riasec:conventional", label: "Conventional — Organisasi & Keuangan" },
];

const emptyForm = {
  name: "", description: "", difficulty_level: "beginner", target_persona: "", estimated_duration_hours: 0,
  cover_url: null as string | null,
  career_outlook: "", salary_range: "", related_certifications_text: "",
};

export const LearningPathBuilder = () => {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [stats, setStats] = useState<Map<string, { enrolled: number; completed: number }>>(new Map());
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [pathContents, setPathContents] = useState<PathContent[]>([]);
  const [availableContent, setAvailableContent] = useState<{ id: string; title: string; content_type: string; duration_minutes: number; difficulty_level: string }[]>([]);
  const [showForm, setShowForm] = useState<null | "create" | "edit">(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [delPath, setDelPath] = useState<LearningPath | null>(null);

  const [pathForm, setPathForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [pathsRes, contentRes, statsRes] = await Promise.all([
      supabase.from("learning_paths").select("*").order("created_at", { ascending: false }),
      supabase.from("learning_content").select("id, title, content_type, duration_minutes, difficulty_level").eq("is_active", true).order("title"),
      (supabase.rpc as any)("admin_learning_path_stats"),
    ]);
    if (pathsRes.error) toast.error("Gagal memuat data: " + pathsRes.error.message);
    setPaths(pathsRes.data || []);
    setAvailableContent(contentRes.data || []);
    if (Array.isArray(statsRes.data)) {
      setStats(new Map(statsRes.data.map((s: any) => [s.path_id, s])));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadPathContents = async (pathId: string) => {
    const { data, error } = await supabase
      .from("learning_path_contents")
      .select(`*, learning_content ( title, content_type, duration_minutes, difficulty_level )`)
      .eq("path_id", pathId)
      .order("order_index");
    if (error) { toast.error("Gagal memuat konten path: " + error.message); return; }
    setPathContents((data as unknown as PathContent[]) || []);
  };

  const openCreate = () => { setPathForm(emptyForm); setShowForm("create"); };
  const openEdit = (path: LearningPath) => {
    setPathForm({
      name: path.name, description: path.description ?? "",
      difficulty_level: path.difficulty_level, target_persona: path.target_persona,
      estimated_duration_hours: path.estimated_duration_hours ?? 0,
      cover_url: path.cover_url ?? null,
      career_outlook: path.career_outlook ?? "",
      salary_range: path.salary_range ?? "",
      related_certifications_text: (path.related_certifications ?? []).join(", "),
    });
    setSelectedPath(path);
    setShowForm("edit");
  };

  const savePath = async () => {
    if (!pathForm.name.trim()) { toast.error("Nama jalur wajib diisi"); return; }
    if (!pathForm.target_persona) { toast.error("Target persona (tipe RIASEC) wajib dipilih"); return; }
    setSaving(true);
    try {
      const { related_certifications_text, ...rest } = pathForm;
      const payload = {
        ...rest,
        career_outlook: pathForm.career_outlook.trim() || null,
        salary_range: pathForm.salary_range.trim() || null,
        related_certifications: related_certifications_text.split(",").map(s => s.trim()).filter(Boolean),
      };
      if (showForm === "edit" && selectedPath) {
        const { error } = await supabase.from("learning_paths").update(payload).eq("id", selectedPath.id);
        if (error) throw error;
        toast.success("Jalur belajar diperbarui!");
      } else {
        const { error } = await supabase.from("learning_paths").insert([payload]);
        if (error) throw error;
        toast.success("Jalur belajar dibuat!");
      }
      setShowForm(null);
      loadData();
    } catch (e: any) {
      toast.error("Gagal menyimpan: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (path: LearningPath) => {
    const { error } = await supabase.from("learning_paths").update({ is_active: !path.is_active }).eq("id", path.id);
    if (error) { toast.error(error.message); return; }
    setPaths(prev => prev.map(p => p.id === path.id ? { ...p, is_active: !p.is_active } : p));
  };

  const confirmDeletePath = async () => {
    if (!delPath) return;
    try {
      // Detach contents first — FK is ON DELETE RESTRICT by design (safety net elsewhere)
      await supabase.from("learning_path_contents").delete().eq("path_id", delPath.id);
      const { error } = await supabase.from("learning_paths").delete().eq("id", delPath.id);
      if (error) throw error;
      toast.success("Jalur belajar dihapus");
      if (selectedPath?.id === delPath.id) { setSelectedPath(null); setPathContents([]); }
      setDelPath(null);
      loadData();
    } catch (e: any) {
      toast.error("Gagal menghapus: " + e.message);
    }
  };

  const handleSelectPath = (path: LearningPath) => {
    setSelectedPath(path);
    loadPathContents(path.id);
  };

  const handleAddContentToPath = async (contentId: string) => {
    if (!selectedPath) return;
    const { error } = await supabase.from("learning_path_contents").insert([{
      path_id: selectedPath.id, content_id: contentId, order_index: pathContents.length, is_required: true,
    }]);
    if (error) { toast.error("Gagal menambah konten: " + error.message); return; }
    toast.success("Konten ditambahkan ke path!");
    loadPathContents(selectedPath.id);
  };

  const handleRemoveContentFromPath = async (id: string) => {
    const { error } = await supabase.from("learning_path_contents").delete().eq("id", id);
    if (error) { toast.error("Gagal menghapus: " + error.message); return; }
    toast.success("Konten dihapus dari path!");
    if (selectedPath) loadPathContents(selectedPath.id);
  };

  const toggleRequired = async (pc: PathContent) => {
    const next = !pc.is_required;
    setPathContents(prev => prev.map(x => x.id === pc.id ? { ...x, is_required: next } : x));
    const { error } = await supabase.from("learning_path_contents").update({ is_required: next }).eq("id", pc.id);
    if (error) {
      toast.error("Gagal mengubah status wajib: " + error.message);
      setPathContents(prev => prev.map(x => x.id === pc.id ? { ...x, is_required: !next } : x));
    }
  };

  const handleReorderContent = async (result: DropResult) => {
    if (!result.destination || !selectedPath) return;
    const items = Array.from(pathContents);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setPathContents(items);

    try {
      await Promise.all(items.map((item, index) =>
        supabase.from("learning_path_contents").update({ order_index: index }).eq("id", item.id)
      ));
      toast.success("Urutan konten diperbarui!");
    } catch (e: any) {
      toast.error("Gagal mengubah urutan: " + e.message);
      loadPathContents(selectedPath.id);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner": return "bg-secondary text-secondary-foreground";
      case "intermediate": return "bg-accent text-accent-foreground";
      case "advanced": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const personaLabel = (v: string) => RIASEC_PERSONAS.find(p => p.value === v)?.label ?? v;

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Jalur Belajar (Course)</h2>
          <p className="text-sm text-muted-foreground mt-1">Kelompokkan konten menjadi jalur belajar berurutan, dicocokkan otomatis dengan tipe RIASEC siswa.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Buat Jalur Belajar
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{showForm === "edit" ? "Edit Jalur Belajar" : "Buat Jalur Belajar Baru"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nama Jalur *</label>
                <Input value={pathForm.name} onChange={e => setPathForm({ ...pathForm, name: e.target.value })} placeholder="Contoh: Jalur Data Science" />
              </div>
              <div>
                <label className="text-sm font-medium">Target Tipe RIASEC *</label>
                <Select value={pathForm.target_persona} onValueChange={v => setPathForm({ ...pathForm, target_persona: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih tipe RIASEC" /></SelectTrigger>
                  <SelectContent>
                    {RIASEC_PERSONAS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Deskripsi</label>
              <Textarea value={pathForm.description} onChange={e => setPathForm({ ...pathForm, description: e.target.value })} placeholder="Jelaskan tujuan dan manfaat jalur belajar ini" />
            </div>

            <div>
              <label className="text-sm font-medium">Gambar sampul</label>
              <div style={{ maxWidth: 420, marginTop: 6 }}>
                <UnggahGambar value={pathForm.cover_url} onChange={url => setPathForm({ ...pathForm, cover_url: url })}
                  folder="jalur" rasio="16 / 9" saran="1600 × 900 px" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Level Kesulitan</label>
                <Select value={pathForm.difficulty_level} onValueChange={v => setPathForm({ ...pathForm, difficulty_level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Pemula</SelectItem>
                    <SelectItem value="intermediate">Menengah</SelectItem>
                    <SelectItem value="advanced">Lanjutan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Estimasi Durasi (jam)</label>
                <Input type="number" value={pathForm.estimated_duration_hours} onChange={e => setPathForm({ ...pathForm, estimated_duration_hours: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold">Prospek Karier</p>
                <p className="text-xs text-muted-foreground">Isi hanya dengan data yang benar-benar kamu riset (BPS, Kemnaker, survei gaji, lembaga sertifikasi resmi). Kosongkan kalau belum yakin — kolom kosong tidak akan ditampilkan ke siswa, lebih baik daripada menampilkan angka karangan.</p>
              </div>
              <div>
                <label className="text-sm font-medium">Potensi karier (paragraf)</label>
                <Textarea value={pathForm.career_outlook} onChange={e => setPathForm({ ...pathForm, career_outlook: e.target.value })}
                  placeholder="Contoh: Lulusan jalur ini bisa berkarier sebagai Data Analyst, Research Associate, atau Business Intelligence Analyst di perusahaan teknologi, riset, maupun sektor publik." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Kisaran pendapatan</label>
                  <Input value={pathForm.salary_range} onChange={e => setPathForm({ ...pathForm, salary_range: e.target.value })}
                    placeholder="Contoh: Rp 6–18 juta/bulan (junior–senior)" />
                </div>
                <div>
                  <label className="text-sm font-medium">Sertifikasi terkait (pisahkan koma)</label>
                  <Input value={pathForm.related_certifications_text} onChange={e => setPathForm({ ...pathForm, related_certifications_text: e.target.value })}
                    placeholder="Contoh: Google Data Analytics, BNSP Analis Data" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={savePath} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {showForm === "edit" ? "Simpan Perubahan" : "Buat Jalur"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(null)}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Learning Paths List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Jalur Belajar ({paths.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paths.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Belum ada jalur belajar. Buat yang pertama!</p>
                )}
                {paths.map(path => {
                  const st = stats.get(path.id);
                  return (
                    <div
                      key={path.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedPath?.id === path.id ? "bg-primary/10 border-primary" : "hover:bg-muted/50"} ${!path.is_active ? "opacity-60" : ""}`}
                      onClick={() => handleSelectPath(path)}
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h4 className="font-medium line-clamp-1">{path.name}</h4>
                        <Badge className={getDifficultyColor(path.difficulty_level)} variant="secondary">{path.difficulty_level}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{path.description}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mb-2">
                        <div className="flex items-center gap-1"><Users className="w-3 h-3" />{personaLabel(path.target_persona)}</div>
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{path.estimated_duration_hours}h</div>
                      </div>
                      {st && (st.enrolled > 0) && (
                        <div className="flex items-center gap-1 text-xs font-medium text-primary mb-2">
                          <CheckCircle2 className="w-3 h-3" /> {st.enrolled} siswa · {st.completed} selesai
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1" onClick={e => e.stopPropagation()}>
                        <Switch checked={path.is_active} onCheckedChange={() => toggleActive(path)} />
                        <span className="text-xs text-muted-foreground">{path.is_active ? "Aktif" : "Nonaktif"}</span>
                        <Button size="sm" variant="ghost" className="h-7 px-2 ml-auto" onClick={() => openEdit(path)}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => setDelPath(path)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Path Contents */}
        <div className="lg:col-span-2">
          {selectedPath ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" />{selectedPath.name}</CardTitle>
                  <CardDescription>{selectedPath.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <Badge className={getDifficultyColor(selectedPath.difficulty_level)}>{selectedPath.difficulty_level}</Badge>
                    <div className="flex items-center gap-1"><Users className="w-4 h-4" />{personaLabel(selectedPath.target_persona)}</div>
                    <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{selectedPath.estimated_duration_hours} jam</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Tambah Konten ke Jalur</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-2 max-h-40 overflow-y-auto">
                    {availableContent.filter(c => !pathContents.some(pc => pc.content_id === c.id)).map(content => (
                      <div key={content.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{content.title}</h4>
                          <p className="text-xs text-muted-foreground">{content.content_type} • {content.duration_minutes}m • {content.difficulty_level}</p>
                        </div>
                        <Button size="sm" onClick={() => handleAddContentToPath(content.id)}><Plus className="w-4 h-4" /></Button>
                      </div>
                    ))}
                    {availableContent.filter(c => !pathContents.some(pc => pc.content_id === c.id)).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-3">Semua konten aktif sudah masuk jalur ini.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Konten dalam Jalur ({pathContents.length})</CardTitle></CardHeader>
                <CardContent>
                  {pathContents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Belum ada konten. Tambahkan dari daftar di atas.</p>
                  ) : (
                    <DragDropContext onDragEnd={handleReorderContent}>
                      <Droppable droppableId="path-contents">
                        {provided => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {pathContents.map((content, index) => (
                              <Draggable key={content.id} draggableId={content.id} index={index}>
                                {provided => (
                                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                    className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium flex-shrink-0">{index + 1}</div>
                                    <Move className="w-4 h-4 text-muted-foreground cursor-grab flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium truncate">{content.learning_content.title}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {content.learning_content.content_type} • {content.learning_content.duration_minutes}m • {content.learning_content.difficulty_level}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <Switch checked={content.is_required} onCheckedChange={() => toggleRequired(content)} />
                                      <span className="text-xs text-muted-foreground">Wajib</span>
                                    </div>
                                    <Button size="sm" variant="destructive" onClick={() => handleRemoveContentFromPath(content.id)}><Trash2 className="w-4 h-4" /></Button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Pilih jalur belajar untuk mengelola konten</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {delPath && (
        <div onClick={() => setDelPath(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 16, padding: 24, maxWidth: 400, width: "100%" }}>
            <p style={{ fontSize: 14, color: "#0F172A", marginBottom: 18 }}>
              Hapus jalur belajar <b>{delPath.name}</b>? Semua konten dalam jalur ini akan ikut dilepas. Progres siswa pada konten individual tidak terhapus.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setDelPath(null)}>Batal</Button>
              <Button variant="destructive" onClick={confirmDeletePath}>Hapus</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
