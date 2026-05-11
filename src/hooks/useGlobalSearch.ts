import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: "article" | "opportunity" | "learning";
  url: string;           // external URL for opportunities
  path?: string;         // internal route for articles / learning
  category?: string;
  tags?: string[];
}

const DEBOUNCE_MS = 300;

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const q = query.trim();
        const like = `%${q}%`;

        // Run three searches in parallel
        const [{ data: articles }, { data: opps }, { data: learning }] = await Promise.all([
          supabase
            .from("articles")
            .select("id, title, excerpt, category, slug")
            .eq("is_published", true)
            .or(`title.ilike.${like},excerpt.ilike.${like}`)
            .limit(4),

          supabase
            .from("scraped_content")
            .select("id, title, description, category, url, tags")
            .eq("is_active", true)
            .or(`title.ilike.${like},description.ilike.${like}`)
            .limit(4),

          supabase
            .from("learning_content")
            .select("id, title, description, content_type")
            .eq("is_active", true)
            .or(`title.ilike.${like},description.ilike.${like}`)
            .limit(3),
        ]);

        const mapped: SearchResult[] = [
          ...(articles || []).map((a) => ({
            id: a.id,
            title: a.title,
            description: a.excerpt ?? undefined,
            type: "article" as const,
            url: "",
            path: `/articles/${a.slug}`,
            category: a.category ?? undefined,
          })),
          ...(opps || []).map((o) => ({
            id: o.id,
            title: o.title,
            description: o.description ?? undefined,
            type: "opportunity" as const,
            url: o.url,
            category: o.category,
            tags: o.tags ?? undefined,
          })),
          ...(learning || []).map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description ?? undefined,
            type: "learning" as const,
            url: "",
            path: `/learning/content/${l.id}`,
            category: l.content_type,
          })),
        ];

        setResults(mapped);
      } catch (err) {
        console.error("Global search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { results, loading };
}
