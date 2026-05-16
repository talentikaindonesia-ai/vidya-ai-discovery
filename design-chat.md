# Talentika Dashboard PRD

_Started 2026-05-11 11:00 UTC_

---

## User

based on all asset information, create a talentika dashboard design PRD to implement in claude code

## Assistant

_[tool: list_files]_

_[tool: view_image]_

_[tool: view_image]_

_[tool: update_todos]_

_[tool: copy_files]_

_[tool: snip]_

_[tool: write_file]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Built **Talentika Dashboard PRD.html** — a single, scrollable design + implementation spec for Claude Code:

- **Cover** with brand promise (Discover. Develop. Grow.) and doc metadata
- **Personas, goals, success metrics** grounded in the brand mocks
- **Information architecture** for all 9 sidebar surfaces
- **Design tokens** — full Talentika color palette (#1D4ED8 / #FF6A00 / #FFC107 / #0B1D3A), Poppins + Inter type scale, spacing, radius, shadow tokens
- **Component inventory** with live mini-demos (button, search, stat, course row, opportunity card, calendar, sidebar item) and a full states/variants matrix
- **Screen-by-screen specs** referencing your mocks: Auth, 5-step Onboarding, Dashboard, Kursus Saya, Peluang, Community, plus a table for Tantangan/Progress/Pencapaian/Timeline/Profile/Pengaturan
- **Motion tokens**, **Next.js stack guidance**, **Tailwind config excerpt**, **a11y + i18n** rules
- **Acceptance criteria** checklist and a **suggested build order** for Claude Code

Open in print/PDF view to hand off as-is.

## User

Save this design as a PDF: Talentika Dashboard PRD.html

## Assistant

_[tool: snip]_

_[tool: read_file]_

_[tool: copy_files]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: show_html]_

_[tool: str_replace_edit]_

_[tool: open_for_print]_

Print tab opened with auto-print. If it didn't pop, open it manually: [Open print view →](https://019e16b2-0775-7b5d-b4c5-cf51b33f709f.claudeusercontent.com/v1/design/projects/019e16b2-0775-7b5d-b4c5-cf51b33f709f/serve/Talentika%20Dashboard%20PRD-print.html?t=6bb341a5d5b6bce79c29f3b22f8e72e2a784db9b68c7ca1468e748d50c3ed2cd.b3d6e0e6-e7e8-4258-9a83-650d60f4f439.a739332e-3a0c-4345-a27b-9a505602303d.1778500827&direct=1) — then choose **Save as PDF** in the print dialog.

## User

create all talentika dashboard workflow & simulation

## Assistant

_[tool: snip]_

_[tool: update_todos]_

I'll build a full interactive simulation — auth → onboarding → talent test → all 10 dashboard surfaces with realistic data, transitions, and state. Splitting into modular JSX files.

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: update_todos]_

_[tool: write_file]_

_[tool: snip]_

_[tool: update_todos]_

_[tool: list_files]_

_[tool: update_todos]_

_[tool: read_file]_

_[tool: snip]_

_[tool: read_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: grep]_

_[tool: snip]_

_[tool: grep]_

_[tool: snip]_

_[tool: update_todos]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Done — Talentika Dashboard with full workflow simulation is live. Use the **Workflow** button (bottom-left) to jump between Login → Onboarding → Talent Test → Dashboard → Kursus → Tantangan → Peluang → Progress → Pencapaian → Community → Timeline → Profile → Pengaturan.

## User

now update halaman depan talentika.id dari existing menjadi design yang baru

## Assistant

_[tool: update_todos]_

_[tool: copy_starter_component]_

I'll redesign the talentika.id landing page taking the best of your existing structure and elevating it with the new brand direction (bold headline split-color, 3D feature illustrations, stat strip, partner logos, mitra section with floating cards). Let me build it.

_[tool: write_file]_

_[tool: write_file]_

Now the landing page HTML with all sections:

_[tool: update_todos]_

_[tool: done]_

_[tool: fork_verifier_agent]_

**Talentika Landing Page** is live — a complete redesign rebuilt from your existing structure with the new brand direction:

- **Bold hero** with split-color headline ("Temukan **Potensimu**, Raih **Masa Depanmu!**"), blob backgrounds, floating paper plane, sparkles, and a drag-and-drop photo slot for your hero image + floating info card with key value props
- **Stat strip** combining the DISCOVER / DEVELOP / GROW / OPPORTUNITIES pillars with 100K+ / 500+ / 200+ live metrics
- **Partner logos** row with Kampus Merdeka, BINUS, UI, Telkom, ACE Class wordmarks
- **Fitur Unggulan** — 6 numbered cards with custom 3D-style SVG illustrations (brain, compass, target, chat+people, bar chart, trophy+controller) + soft trust strip below
- **Cara Kerja** — 4-step process with dashed connector line and color-coded step badges
- **Testimoni** — new section with 3 testimonial cards
- **Harga** — Individual & Premium pricing with the featured card lifted and accented yellow
- **Bergabung Mitra** — split layout with WhatsApp CTA, floating Sekolah/Brand/Komunitas cards orbiting a center glow + 4-up trust strip
- **Dark footer** with brand, quick links, services, contact, socials
- **Reveal-on-scroll** animations + smooth section nav

Drop your hero photos by dragging into the placeholder slots — they persist on reload.Landing page is ready. Drop your hero and team photos into the image slots, and you can iterate from there — let me know if you want different copy, additional sections, or a mobile-first variant.

## User

Verifier agent check completed

## Assistant

The verifier hit a transient upstream error rather than a real issue with the page — and `done` already confirmed the page loads clean with no console errors. You're good to go.

## User

kenapa foto di hero banner nya kecil

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

Found it — the `<image-slot>` web component has a fixed default size of 240×160px baked into its shadow DOM (`:host { width:240px; height:160px }`), and my `.hero-photo` only set `inset:0` which doesn't override an explicit width/height on a positioned element. Adding `width:100%; height:100%` fixes it.

Fixed. The hero and mitra image slots now fill their containers properly (the web component had a hard-coded 240×160 default size that needed an explicit `width/height: 100%` override).

## User

design & create Talentika for School Page all featured

## Assistant

_[tool: update_todos]_

_[tool: write_file]_

I'll build a comprehensive **Talentika for School** B2B landing page with all the sections shown in your references. Let me plan and execute.

_[tool: write_file]_

## User

continue

## Assistant

## Assistant

## User

continue

## Assistant

## User

continue

## Assistant

## User

continue

## Assistant

_[tool: update_todos]_

_[tool: done]_

_[tool: fork_verifier_agent]_

**Talentika for School** is live with every section from your brand deck:

- **Hero** — bold split-color headline, photo slot, trust card ("Dipercaya oleh Ribuan Sekolah"), 4-up mini feature row (Pembelajaran · Mentoring · Tracking · Karakter)
- **Manfaat band** — overlapping blue gradient card with 4 quick benefits
- **Brand Positioning + Kami Berbeda** — light card with positioning statement + dark navy card with 5 differentiators
- **Target Audience** — 3 cards (Sekolah, Guru, Siswa) with gradient icons
- **Value Proposition** — 4 cards (Kenali · Kembangkan · Pantau · Kolaborasi) + dark stats bar (500+ sekolah, 120K+ siswa, 95% akurasi, 4.9★)
- **Satu Platform, Banyak Solusi** — feature list paired with a fully-rendered school admin dashboard mockup (sidebar, stat cards, line chart, donut, activity feed)
- **Program Unggulan** — 4 cards (Talent Development, Kompetisi, Pelatihan Guru, Kolaborasi Sekolah)
- **Benefits + Testimoni** — checklist with icons + photo slot with floating quote from Kepala Sekolah + mini benefits row
- **FAQ** — 6 expandable questions (jenjang, biaya, implementasi, keamanan, kurikulum, akses orang tua)
- **CTA Rocket** — dark navy + yellow accent, custom rocket SVG, WhatsApp CTA + demo button
- **Footer** — adapted for school (school@talentika.id contact, related products)

Drop your school hero photo and kepala sekolah photo into the image slots — they'll persist on reload.

## User

add talentika for school on nav bar

## Assistant

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: grep]_

Added. "Talentika for School" now appears in the nav (in the blue pill style, linking to the school page) alongside "Talentika Junior" (now styled in orange so they're visually distinct).

