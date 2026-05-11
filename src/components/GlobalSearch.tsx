/**
 * GlobalSearch — full-screen command palette (Ctrl+K / ⌘K)
 *
 * Also used inline: the DashboardHeader search bar opens this dialog
 * when the user starts typing or presses Ctrl+K.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Briefcase, BookOpen, ExternalLink } from "lucide-react";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_META: Record<SearchResult["type"], { label: string; icon: React.ReactNode; color: string }> = {
  article:     { label: "Artikel",    icon: <FileText className="w-4 h-4" />,   color: "bg-blue-100 text-blue-700" },
  opportunity: { label: "Peluang",    icon: <Briefcase className="w-4 h-4" />,  color: "bg-green-100 text-green-700" },
  learning:    { label: "Pembelajaran", icon: <BookOpen className="w-4 h-4" />, color: "bg-purple-100 text-purple-700" },
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const { results, loading } = useGlobalSearch(query);
  const navigate = useNavigate();

  // Keyboard shortcut: Ctrl+K / ⌘K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onOpenChange(false);
      setQuery("");
      if (result.path) {
        navigate(result.path);
      } else if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    },
    [navigate, onOpenChange]
  );

  // Group results by type
  const groups = (["article", "opportunity", "learning"] as const)
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Cari artikel, peluang, atau materi... (min. 2 karakter)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Mencari...
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <CommandEmpty>
            Tidak ada hasil untuk &ldquo;{query}&rdquo;
          </CommandEmpty>
        )}

        {!loading && query.length < 2 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Ketik minimal 2 karakter untuk mulai mencari
          </div>
        )}

        {groups.map((group, i) => {
          const meta = TYPE_META[group.type];
          return (
            <div key={group.type}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={meta.label}>
                {group.items.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={`${result.type}-${result.id}-${result.title}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-start gap-3 py-2.5 cursor-pointer"
                  >
                    {/* Icon */}
                    <div className={`shrink-0 mt-0.5 p-1.5 rounded-md ${meta.color}`}>
                      {meta.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm line-clamp-1">
                          {result.title}
                        </span>
                        {result.category && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                            {result.category}
                          </Badge>
                        )}
                      </div>
                      {result.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {result.description}
                        </p>
                      )}
                    </div>

                    {/* External link icon for opportunities */}
                    {result.type === "opportunity" && result.url && (
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-1" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>

      {/* Shortcut hint */}
      <div className="flex items-center justify-between px-4 py-2 border-t text-[11px] text-muted-foreground">
        <span>
          <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">↑↓</kbd>{" "}
          navigasi &nbsp;
          <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">↵</kbd>{" "}
          buka &nbsp;
          <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Esc</kbd>{" "}
          tutup
        </span>
        <span>
          <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl K</kbd>{" "}
          buka kapan saja
        </span>
      </div>
    </CommandDialog>
  );
}
