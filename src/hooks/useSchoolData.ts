/**
 * useSchoolData — typed fetch layer for the School Dashboard.
 * Wraps the 4 SECURITY DEFINER RPCs. Each RPC enforces, server-side, that the
 * caller is the school_admin who owns `schoolCode` — so a null/empty code, or a
 * non-admin caller, simply yields empty data instead of leaking other schools.
 *
 * RPCs: school_overview, school_students, school_riasec_distribution, school_activity
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ── Return shapes (mirror the SQL function signatures) ─────────────────── */
export interface SchoolOverview {
  active_students: number;
  new_students_month: number;
  courses_enrolled: number;
  study_hours: number;
  certificates: number;
  assessments_done: number;
  monthly_labels: string[];
  monthly_hours: number[];
}

export interface SchoolStudent {
  user_id: string;
  name: string;
  class_label: string | null;
  status: string;
  joined_at: string | null;
  courses: number;
  hours: number;
  certs: number;
  xp: number;
  level: number;
  streak: number;
  riasec_type: string | null;
  progress: number;
  completed: number;
  last_active: string | null;
}

export interface RiasecSlice {
  riasec_type: string;
  cnt: number;
  pct: number;
}

export interface MiSlice {
  mi_type: string;
  cnt: number;
  pct: number;
}

export interface SchoolActivity {
  name: string;
  action: string;
  item: string;
  ts: string;
}

export interface RiasecByClass {
  class_label: string;
  riasec_type: string;
  cnt: number;
}

export interface CareerRec {
  career: string;
  cnt: number;
}

export interface SchoolCourse {
  id: string;
  title: string;
  category: string;
  category_color: string;
  content_type: string;
  duration_minutes: number;
  rating: number;
  enrolled: number;
  completed: number;
}

export interface SchoolAnnouncement {
  id: string;
  title: string;
  body: string | null;
  target: string | null;
  priority: string;
  recipient_count: number;
  reads: number;
  created_at: string;
}

interface SchoolData {
  overview: SchoolOverview | null;
  students: SchoolStudent[];
  riasec: RiasecSlice[];
  mi: MiSlice[];
  riasecByClass: RiasecByClass[];
  careers: CareerRec[];
  courses: SchoolCourse[];
  announcements: SchoolAnnouncement[];
  activity: SchoolActivity[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// supabase typed client doesn't know these custom RPCs — cast through any
const rpc = (fn: string, args: Record<string, unknown>) =>
  (supabase.rpc as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)(fn, args);

export function useSchoolData(schoolCode: string | null): SchoolData {
  const [overview, setOverview] = useState<SchoolOverview | null>(null);
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [riasec, setRiasec] = useState<RiasecSlice[]>([]);
  const [mi, setMi] = useState<MiSlice[]>([]);
  const [riasecByClass, setRiasecByClass] = useState<RiasecByClass[]>([]);
  const [careers, setCareers] = useState<CareerRec[]>([]);
  const [courses, setCourses] = useState<SchoolCourse[]>([]);
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [activity, setActivity] = useState<SchoolActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolCode) {
      // No code yet (school pending verification) → render empty states, not an error
      setOverview(null);
      setStudents([]);
      setRiasec([]);
      setMi([]);
      setRiasecByClass([]);
      setCareers([]);
      setCourses([]);
      setAnnouncements([]);
      setActivity([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const [ov, st, ri, mid, rc, ca, co, an, ac] = await Promise.all([
      rpc("school_overview", { p_code: schoolCode }),
      rpc("school_students", { p_code: schoolCode }),
      rpc("school_riasec_distribution", { p_code: schoolCode }),
      rpc("school_mi_distribution", { p_code: schoolCode }),
      rpc("school_riasec_by_class", { p_code: schoolCode }),
      rpc("school_career_recommendations", { p_code: schoolCode }),
      rpc("school_courses", { p_code: schoolCode }),
      rpc("list_school_announcements", { p_code: schoolCode }),
      rpc("school_activity", { p_code: schoolCode, p_limit: 10 }),
    ]);

    const firstErr = ov.error || st.error || ri.error || mid.error || rc.error || ca.error || co.error || an.error || ac.error;
    if (firstErr) setError(firstErr.message);

    setOverview((ov.data as SchoolOverview) ?? null);
    setStudents((st.data as SchoolStudent[]) ?? []);
    setRiasec((ri.data as RiasecSlice[]) ?? []);
    setMi((mid.data as MiSlice[]) ?? []);
    setRiasecByClass((rc.data as RiasecByClass[]) ?? []);
    setCareers((ca.data as CareerRec[]) ?? []);
    setCourses((co.data as SchoolCourse[]) ?? []);
    setAnnouncements((an.data as SchoolAnnouncement[]) ?? []);
    setActivity((ac.data as SchoolActivity[]) ?? []);
    setLoading(false);
  }, [schoolCode]);

  useEffect(() => {
    load();
  }, [load]);

  return { overview, students, riasec, mi, riasecByClass, careers, courses, announcements, activity, loading, error, refetch: load };
}
