// ============ MAIN SCREENS: Dashboard, Courses, Opportunities, Community ============

function PageHeader({ title, subtitle, right }){
  return (
    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",padding:"8px 0 24px",gap:20,flexWrap:"wrap"}}>
      <div>
        <h1 className="h-h1" style={{fontSize:30,marginBottom:6}}>{title}</h1>
        {subtitle && <p style={{color:"var(--gray-500)",margin:0}}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function StatCard({ icon, color, label, value, sub }){
  const Ico = I[icon];
  const tints = { blue:["var(--blue-50)","var(--blue-700)"], green:["var(--mint)","var(--green-dark)"], orange:["var(--orange-soft)","var(--orange)"], yellow:["var(--yellow-soft)","#A47000"], purple:["var(--lilac)","#5B21B6"], pink:["var(--pink-soft)","#B83280"] };
  const [bg,fg] = tints[color]||tints.blue;
  return (
    <div className="card lift" style={{display:"flex",gap:14,alignItems:"center",padding:18}}>
      <div style={{width:48,height:48,borderRadius:14,background:bg,color:fg,display:"grid",placeItems:"center",flex:"0 0 auto"}}><Ico size={22}/></div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,color:"var(--gray-500)",fontWeight:500}}>{label}</div>
        <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:26,color:"var(--ink)",lineHeight:1.15}}>{value}</div>
        {sub && <div style={{fontSize:11.5,color:"var(--gray-500)"}}>{sub}</div>}
      </div>
    </div>
  );
}

// ----- DASHBOARD -----
function DashboardScreen({ setRoute }){
  const greeting = (()=>{const h=new Date().getHours();if(h<11)return"Pagi";if(h<15)return"Siang";if(h<18)return"Sore";return"Malam"})();
  return (
    <div style={{paddingTop:8,display:"grid",gridTemplateColumns:"1fr 380px",gap:20}}>
      <div style={{display:"flex",flexDirection:"column",gap:20,minWidth:0}}>
        {/* Hero greeting */}
        <div style={{
          borderRadius:20, background:"linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #1E3A8A 100%)",
          color:"#fff", padding:"28px 32px", position:"relative", overflow:"hidden", minHeight:140,
          display:"flex", alignItems:"center",
        }}>
          <div style={{flex:1,zIndex:1}}>
            <h2 className="h-h1" style={{color:"#fff",fontSize:26,marginBottom:6}}>Selamat {greeting}, {DATA.USER.firstName}! <span className="wave">👋</span></h2>
            <p style={{color:"rgba(255,255,255,.85)",margin:0,fontSize:14.5}}>Mari lanjutkan perjalanan pembelajaran Anda hari ini.</p>
          </div>
          {/* Decorative right illustration */}
          <svg width="240" height="140" viewBox="0 0 240 140" style={{position:"absolute",right:0,top:0,opacity:.9}}>
            <path d="M0 90 C 60 60, 120 110, 200 80 L 240 90 L 240 140 L 0 140 Z" fill="rgba(255,255,255,.12)"/>
            <circle cx="190" cy="55" r="22" fill="#FFC107" opacity=".7"/>
            <text x="160" y="100" fontSize="56">🙋‍♂️</text>
          </svg>
          <span className="sparkle" style={{top:20,right:60,fontSize:16,color:"var(--yellow)"}}>✦</span>
          <span className="sparkle" style={{top:60,right:140,fontSize:10,color:"#fff",opacity:.6}}>✦</span>
        </div>

        {/* Talent test result */}
        <div className="card card-elevated" style={{padding:28}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
            <I.Brain size={20} style={{color:"var(--blue-600)"}}/>
            <h3 className="h-h2">Hasil Assessment Anda</h3>
          </div>
          <div style={{textAlign:"center"}}>
            <div className="avatar avatar-xl" style={{background:"radial-gradient(circle at 30% 30%, #F0E8FF, #7C3AED)",margin:"0 auto 12px",fontSize:36}}>👨‍🎨</div>
            <h3 className="h-h2" style={{fontSize:22}}>Artistic (Creator)</h3>
            <p style={{color:"var(--gray-500)",margin:"4px 0 0",fontSize:13}}>Kreatif, ekspresif, dan suka menciptakan sesuatu yang baru</p>
          </div>

          <div style={{margin:"20px 0 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,fontWeight:600,color:"var(--ink)"}}>Tingkat Kesesuaian</span>
            <span style={{fontFamily:"var(--display)",fontWeight:700,color:"var(--blue-700)"}}>31%</span>
          </div>
          <div className="progress"><i style={{width:"31%"}}/></div>

          <div style={{textAlign:"center",margin:"20px 0 10px"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,fontFamily:"var(--display)",fontWeight:600,fontSize:13}}>
              <I.Target size={14} style={{color:"var(--orange)"}}/> Rekomendasi Karier
            </div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
            <span className="pill pill-orange">Seni</span>
            <span className="pill pill-orange">Design</span>
            <span className="pill pill-orange">Media</span>
            <span className="pill pill-orange">Kreatif</span>
          </div>

          <div style={{textAlign:"center",margin:"22px 0 10px"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,fontFamily:"var(--display)",fontWeight:600,fontSize:13}}>
              <I.Trophy size={14} style={{color:"var(--blue-600)"}}/> Area Bakat Utama
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,maxWidth:280,margin:"0 auto"}}>
            <BakatRow icon="Paint" label="Artistic (Creator)"/>
            <BakatRow icon="Heart" label="Social (Helper)"/>
            <BakatRow icon="Briefcase" label="Enterprising (Persuader)"/>
          </div>
          <div style={{textAlign:"center",fontSize:12,color:"var(--gray-500)",marginTop:18}}>Tes dilakukan pada 11 Mei 2026</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
            <button className="btn btn-secondary"><I.Activity size={14}/> Tes Ulang</button>
            <button className="btn btn-primary" onClick={()=>setRoute("courses")}>Lihat Kursus</button>
          </div>
        </div>

        {/* Activity */}
        <div className="card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <h3 className="h-h2">Aktivitas Terbaru</h3>
            <a style={{color:"var(--blue-600)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Lihat Semua</a>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
            {DATA.ACTIVITY.slice(0,4).map((a,i)=><ActivityItem key={i} {...a}/>)}
          </div>
        </div>
      </div>

      {/* Right rail */}
      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        <div className="card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><I.Trend size={18} style={{color:"var(--blue-600)"}}/><h3 className="h-h2">Ringkasan Progress</h3></div>
            <a style={{color:"var(--blue-600)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Lihat Semua</a>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <MiniStat icon="Book" color="blue" label="Kursus Aktif" value="5" sub="Lanjutkan belajar!"/>
            <MiniStat icon="Clock" color="green" label="Jam Belajar" value="23,5" sub="Jam"/>
            <MiniStat icon="Trophy" color="purple" label="Tantangan Aktif" value="2" sub="Ikuti tantangan"/>
            <MiniStat icon="Star" color="yellow" label="Pencapaian" value="12" sub="Badge diraih"/>
          </div>
        </div>

        <div className="card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><I.Book size={18} style={{color:"var(--blue-600)"}}/><h3 className="h-h2">Kursus Anda</h3></div>
            <a onClick={()=>setRoute("courses")} style={{color:"var(--blue-600)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Lihat Semua</a>
          </div>
          {DATA.COURSES.slice(0,3).map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid var(--gray-150)"}}>
              <CourseThumb course={c} sm/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:13,color:"var(--ink)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                <div style={{fontSize:11,color:"var(--gray-500)"}}>{c.cat}</div>
              </div>
              <div style={{width:90}}>
                <div className="progress"><i style={{width:`${c.progress}%`}}/></div>
                <div style={{fontSize:11,fontFamily:"var(--display)",fontWeight:700,color:"var(--blue-700)",textAlign:"right",marginTop:3}}>{c.progress}%</div>
              </div>
              <button className="btn-icon"><I.Chevron size={14}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BakatRow({ icon, label }){
  const Ico = I[icon];
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,fontSize:13,color:"var(--gray-700)"}}>
      <Ico size={16} style={{color:"var(--gray-500)"}}/> {label}
    </div>
  );
}

function MiniStat({ icon, color, label, value, sub }){
  const Ico = I[icon];
  const tints = { blue:["var(--blue-50)","var(--blue-700)"], green:["var(--mint)","var(--green-dark)"], orange:["var(--orange-soft)","var(--orange)"], yellow:["var(--yellow-soft)","#A47000"], purple:["var(--lilac)","#5B21B6"], pink:["var(--pink-soft)","#B83280"] };
  const [bg,fg] = tints[color]||tints.blue;
  return (
    <div style={{background:"var(--gray-50)",border:"1px solid var(--gray-200)",borderRadius:14,padding:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:11.5,color:"var(--gray-500)",fontWeight:500}}>{label}</div>
        <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:24,color:"var(--ink)"}}>{value}</div>
        <div style={{fontSize:10.5,color:"var(--gray-500)"}}>{sub}</div>
      </div>
      <div style={{width:38,height:38,borderRadius:11,background:bg,color:fg,display:"grid",placeItems:"center"}}><Ico size={18}/></div>
    </div>
  );
}

function ActivityItem({ icon, color, title, subject, time }){
  const Ico = I[icon];
  const tints = { blue:["var(--blue-50)","var(--blue-700)"], green:["var(--mint)","var(--green-dark)"], orange:["var(--orange-soft)","var(--orange)"], yellow:["var(--yellow-soft)","#A47000"], purple:["var(--lilac)","#5B21B6"], pink:["var(--pink-soft)","#B83280"] };
  const [bg,fg] = tints[color]||tints.blue;
  return (
    <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
      <div style={{width:34,height:34,borderRadius:10,background:bg,color:fg,display:"grid",placeItems:"center",flex:"0 0 auto"}}><Ico size={16}/></div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:11,color:"var(--gray-500)"}}>{title}</div>
        <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:13,color:"var(--ink)",lineHeight:1.3}}>{subject}</div>
        <div style={{fontSize:11,color:"var(--gray-500)",marginTop:2}}>{time}</div>
      </div>
    </div>
  );
}

function CourseThumb({ course, sm }){
  const Ico = I[course.icon];
  const grads = {
    blue:"linear-gradient(135deg,#DBEAFE,#93C5FD)",
    yellow:"linear-gradient(135deg,#FEF3C7,#FDE68A)",
    pink:"linear-gradient(135deg,#FCE7F3,#FBCFE8)",
    green:"linear-gradient(135deg,#D1FAE5,#A7F3D0)",
    purple:"linear-gradient(135deg,#EDE9FE,#C4B5FD)",
  };
  const colors = { blue:"#1D4ED8", yellow:"#A47000", pink:"#BE185D", green:"#0F7A3E", purple:"#6D28D9" };
  return (
    <div style={{
      width: sm ? 38 : 60, height: sm ? 38 : 60, borderRadius: sm ? 10 : 14,
      background: grads[course.color]||grads.blue, color: colors[course.color]||colors.blue,
      display:"grid",placeItems:"center",flex:"0 0 auto",
    }}>
      <Ico size={sm ? 18 : 26}/>
    </div>
  );
}

// ----- KURSUS SAYA -----
function CoursesScreen(){
  const [filter, setFilter] = useState("Semua Status");
  return (
    <div style={{paddingTop:8}}>
      <PageHeader
        title="Kursus Saya"
        subtitle="Kelola dan lanjutkan pembelajaranmu untuk mencapai tujuan terbaik."
        right={<Dropdown value={filter} onChange={setFilter} options={["Semua Status","Sedang Berjalan","Selesai","Belum Dimulai"]}/>}
      />
      <div className="grid-4" style={{marginBottom:20}}>
        <StatCard icon="Book" color="blue" label="Kursus Aktif" value="5" sub="Lanjutkan belajar!"/>
        <StatCard icon="Clock" color="green" label="Jam Belajar" value="23,5" sub="Jam"/>
        <StatCard icon="Activity" color="yellow" label="Progress Rata-rata" value="58%" sub="Semangat!"/>
        <StatCard icon="Shield" color="purple" label="Sertifikat" value="3" sub="Sertifikat diperoleh"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:20}}>
        <div className="card" style={{padding:0,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 22px 12px"}}>
            <h3 className="h-h2">Kursus Aktif</h3>
            <a style={{color:"var(--blue-600)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Lihat Semua</a>
          </div>
          {DATA.COURSES.map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:16,padding:"18px 22px",borderTop:"1px solid var(--gray-150)"}}>
              <CourseThumb course={c}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:15,color:"var(--ink)"}}>{c.name}</div>
                <div style={{fontSize:12.5,color:"var(--gray-500)"}}>{c.cat} · {c.modules} Modul</div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
                  <div className="progress" style={{flex:1,maxWidth:300}}><i style={{width:`${c.progress}%`}}/></div>
                  <span style={{fontFamily:"var(--display)",fontWeight:700,color:"var(--blue-700)",fontSize:13}}>{c.progress}%</span>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm">Lanjutkan</button>
              <button className="btn-icon"><I.Dots size={16}/></button>
            </div>
          ))}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 22px",borderTop:"1px solid var(--gray-150)"}}>
            <span style={{fontSize:12.5,color:"var(--gray-500)"}}>Menampilkan 1 – 5 dari 5 kursus</span>
            <div style={{display:"flex",gap:6}}>
              <button className="btn-icon"><I.ChevronLeft size={14}/></button>
              <button className="btn btn-sm btn-primary" style={{padding:"4px 12px"}}>1</button>
              <button className="btn-icon"><I.Chevron size={14}/></button>
            </div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div className="card">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <h3 className="h-h2"><span style={{color:"var(--gray-500)",fontWeight:600}}>Kalender</span> Belajar</h3>
            </div>
            <MiniCalendar/>
          </div>
          <div className="card">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <h3 className="h-h2">Rekomendasi <span style={{color:"var(--gray-500)",fontWeight:600}}>Untukmu</span></h3>
              <a style={{color:"var(--blue-600)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Lihat Semua</a>
            </div>
            {DATA.RECOMMENDATIONS.map(r=>(
              <div key={r.id} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderTop:"1px solid var(--gray-150)"}}>
                <CourseThumb course={r} sm/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:13.5,color:"var(--ink)",lineHeight:1.25}}>{r.name}</div>
                  <div style={{fontSize:11.5,color:"var(--gray-500)",marginTop:2}}>{r.cat}</div>
                  <div style={{fontSize:11.5,marginTop:4,display:"flex",alignItems:"center",gap:4,color:"var(--gray-700)"}}>
                    <I.Star size={12} style={{color:"var(--yellow)",fill:"var(--yellow)"}}/> {r.rating} <span style={{color:"var(--gray-400)"}}>({r.ratings})</span>
                  </div>
                </div>
                <button className="btn-icon"><I.Bookmark size={14}/></button>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <h3 className="h-h2">Pencapaian <span style={{color:"var(--gray-500)",fontWeight:600}}>Terbaru</span></h3>
              <a style={{color:"var(--blue-600)",fontSize:13,fontWeight:600,cursor:"pointer"}}>Lihat Semua</a>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"6px 0",position:"relative"}}>
              <BadgeIcon icon="Star" color="green" size={48}/>
              <div>
                <div style={{fontFamily:"var(--display)",fontWeight:700,color:"var(--ink)"}}>Consistent Learner</div>
                <div style={{fontSize:12,color:"var(--gray-500)"}}>Belajar selama 7 hari berturut-turut</div>
                <div style={{fontSize:11.5,color:"var(--gray-400)",marginTop:2}}>Diperoleh 2 hari lalu</div>
              </div>
              <span className="sparkle" style={{top:0,right:0,fontSize:14,color:"var(--yellow)"}}>✦</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dropdown({ value, onChange, options }){
  const [open, setOpen] = useState(false);
  return (
    <div style={{position:"relative"}}>
      <button className="btn btn-secondary" onClick={()=>setOpen(!open)}>
        {value} <I.ChevronDown size={14}/>
      </button>
      {open && (
        <div className="page-in" style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:"#fff",borderRadius:12,boxShadow:"var(--shadow-lg)",border:"1px solid var(--gray-200)",minWidth:200,padding:6,zIndex:30}}>
          {options.map(o=>(
            <div key={o} onClick={()=>{onChange(o);setOpen(false)}} style={{
              padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:13.5,
              color: o===value ? "var(--blue-700)" : "var(--gray-700)",
              background: o===value ? "var(--blue-50)" : "transparent",
              fontWeight: o===value ? 600 : 500,
            }}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniCalendar(){
  const today = 11;
  const scheduled = new Set([6,14,18,21]);
  const days = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,padding:"0 4px"}}>
        <button className="btn-icon"><I.ChevronLeft size={14}/></button>
        <div style={{fontFamily:"var(--display)",fontWeight:600}}>Mei 2026</div>
        <button className="btn-icon"><I.Chevron size={14}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,fontSize:11,color:"var(--gray-500)",textAlign:"center",marginBottom:6}}>
        {days.map(d=><div key={d}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {[null,null,null,null,1,2,3,...Array.from({length:28},(_,i)=>i+4)].map((d,i)=>{
          if(!d) return <div key={i}/>;
          const isToday = d===today;
          const isSch = scheduled.has(d);
          return (
            <div key={i} style={{
              aspectRatio:"1/1",display:"grid",placeItems:"center",borderRadius:"50%",
              fontSize:12.5,fontFamily:"var(--display)",fontWeight:isToday||isSch?700:500,
              background: isToday ? "var(--blue-600)" : (isSch ? "var(--blue-50)" : "transparent"),
              color: isToday ? "#fff" : (isSch ? "var(--blue-700)" : "var(--gray-700)"),
              cursor:"pointer",
            }}>{d}</div>
          );
        })}
      </div>
    </div>
  );
}

function BadgeIcon({ icon, color, size=56, locked }){
  const Ico = I[icon];
  const tints = { blue:["#DBEAFE","#1D4ED8"], green:["#D1FAE5","#0F7A3E"], orange:["#FFEDE2","#FF6A00"], yellow:["#FFF6E0","#A47000"], purple:["#EDE9FE","#6D28D9"], pink:["#FCE7F3","#BE185D"] };
  const [bg,fg] = tints[color]||tints.blue;
  return (
    <div style={{
      width:size,height:size,
      background: locked ? "#F5F7FA" : `radial-gradient(circle at 30% 30%, ${bg}, ${fg})`,
      clipPath:"polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)",
      display:"grid",placeItems:"center", color: locked ? "var(--gray-400)" : "#fff",
      filter: locked ? "grayscale(.8)" : "none", opacity: locked ? .55 : 1,
      flex:"0 0 auto",
    }}>
      <Ico size={size*0.4}/>
    </div>
  );
}

// ----- OPPORTUNITIES -----
function OpportunitiesScreen(){
  const [tab, setTab] = useState("Semua");
  const [saved, setSaved] = useState(()=>{
    const s = {}; DATA.OPPORTUNITIES.forEach(o=>s[o.id]=o.saved); return s;
  });
  const cats = ["Semua","Beasiswa","Kompetisi","Magang","Lowongan Kerja","Konferensi"];
  const counts = useMemo(()=>{
    const c = { Semua: DATA.OPPORTUNITIES.length };
    DATA.OPPORTUNITIES.forEach(o=>c[o.type]=(c[o.type]||0)+1);
    return c;
  },[]);
  const filtered = tab==="Semua" ? DATA.OPPORTUNITIES : DATA.OPPORTUNITIES.filter(o=>o.type===tab);
  const [focusId, setFocusId] = useState(2);

  return (
    <div style={{paddingTop:8}}>
      <div style={{textAlign:"center",padding:"16px 0 12px",position:"relative"}}>
        <h1 className="h-h1" style={{display:"inline-flex",alignItems:"center",gap:10,fontSize:32}}>
          <I.Gift size={28} style={{color:"var(--blue-600)"}}/> Opportunity for <span style={{color:"var(--blue-600)"}}>You</span>
        </h1>
        <p style={{color:"var(--gray-500)",margin:"6px auto 0",maxWidth:"60ch"}}>Beasiswa, kompetisi, dan magang terbaik — diprioritaskan untuk Indonesia & Asia Tenggara</p>
        <div style={{position:"absolute",top:-10,right:40,fontSize:42,opacity:.7}}>🎓</div>
        <div style={{position:"absolute",top:10,right:120,fontSize:32,opacity:.7}}>🏆</div>
        <div style={{position:"absolute",top:40,right:200,fontSize:24,opacity:.5}}>💼</div>
      </div>

      <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
        <div className="tabs">
          {cats.map(c=>(
            <button key={c} className={c===tab?"active":""} onClick={()=>setTab(c)}>
              {c} <span className="count">{counts[c]||0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid-3">
        {filtered.map(o=>{
          const cat = o.type.split(" ")[0];
          const focused = o.id===focusId;
          return (
            <div key={o.id} className="card lift" onClick={()=>setFocusId(o.id)} style={{
              padding:0,overflow:"hidden",cursor:"pointer",
              border: focused ? "2px solid var(--blue-600)" : "1px solid var(--gray-200)",
            }}>
              <div className="cat-bg-blue" style={{padding:"14px 16px",color:"#fff",position:"relative",height:104,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <span className="pill pill-blue-solid" style={{background:"#fff",color:"var(--blue-700)"}}>{o.type}</span>
                  <button onClick={(e)=>{e.stopPropagation();setSaved({...saved,[o.id]:!saved[o.id]})}} className="btn-icon" style={{color: saved[o.id] ? "var(--yellow)" : "#fff",background:"transparent"}}>
                    <I.Bookmark size={18} fill={saved[o.id] ? "var(--yellow)" : "none"} stroke={saved[o.id] ? "var(--yellow)" : "#fff"}/>
                  </button>
                </div>
                <div style={{textAlign:"center"}}>
                  <I.Shield size={28} style={{opacity:.8,marginBottom:4}}/>
                  <div style={{fontSize:12,opacity:.95,fontFamily:"var(--display)",fontWeight:500}}>{o.source}</div>
                </div>
              </div>
              <div style={{padding:"14px 16px"}}>
                <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:14.5,color: focused ? "var(--blue-700)" : "var(--ink)",lineHeight:1.3,minHeight:38,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{o.title}</div>
                <div style={{fontSize:12,color:"var(--gray-500)",margin:"8px 0",display:"flex",alignItems:"center",gap:4}}>
                  <I.MapPin size={12}/> {o.loc}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                  {o.tags.map(t=><span key={t} className="pill pill-gray" style={{textTransform:"capitalize"}}>{t}</span>)}
                </div>
                <button className={focused?"btn btn-primary btn-sm btn-block":"btn btn-secondary btn-sm btn-block"}>
                  Lihat Detail <I.Chevron size={12}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"24px 4px"}}>
        <span style={{fontSize:13,color:"var(--gray-500)"}}>Menampilkan 1 – {filtered.length} dari {filtered.length} peluang</span>
        <div style={{display:"flex",gap:6}}>
          <button className="btn-icon"><I.ChevronLeft size={14}/></button>
          <button className="btn btn-sm btn-primary" style={{padding:"4px 12px"}}>1</button>
          <button className="btn btn-sm btn-secondary" style={{padding:"4px 12px"}}>2</button>
          <button className="btn-icon"><I.Chevron size={14}/></button>
        </div>
      </div>
    </div>
  );
}

// ----- COMMUNITY -----
function CommunityScreen(){
  const [joined, setJoined] = useState(()=>{const s={};DATA.COMMUNITIES.forEach(c=>s[c.id]=c.joined);return s});
  const [page, setPage] = useState(0);
  const visible = DATA.COMMUNITIES.slice(page*3, page*3+3);

  return (
    <div style={{paddingTop:8}}>
      <div style={{textAlign:"center",padding:"16px 0 20px",position:"relative"}}>
        <span className="sparkle" style={{top:0,left:120,fontSize:14,color:"var(--blue-500)"}}>✦</span>
        <span className="sparkle" style={{top:30,right:160,fontSize:18,color:"var(--yellow)"}}>✦</span>
        <h1 className="h-h1" style={{display:"inline-flex",alignItems:"center",gap:10,fontSize:32}}>
          <I.Users size={28} style={{color:"var(--blue-600)"}}/> Community for <span style={{color:"var(--blue-600)"}}>You</span>
        </h1>
        <p style={{color:"var(--gray-500)",margin:"6px auto 0"}}>Bergabung dengan komunitas yang sesuai minat dan kepribadianmu</p>
        <I.ChatBubble size={28} style={{position:"absolute",top:0,right:40,color:"var(--blue-300)",opacity:.7}}/>
        <I.Heart size={20} style={{position:"absolute",top:50,right:90,color:"var(--orange)",opacity:.6}}/>
      </div>

      <div className="grid-3">
        {visible.map(c=>{
          const catTints = { Technology:"pill", Design:"pill-orange", Social:"pill-green", Marketing:"pill-lilac", Seni:"pill-pink", "Pengembangan Diri":"pill-yellow" };
          const isJoined = joined[c.id];
          return (
            <div key={c.id} className="card lift" style={{padding:24}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                <span className={`pill ${catTints[c.cat]||"pill"}`}><I.Users size={12}/> {c.cat}</span>
                {c.rec && <span className="pill pill-lilac">Rekomendasi</span>}
              </div>
              <h3 className="h-h2" style={{fontSize:18,marginBottom:8}}>{c.name}</h3>
              <p style={{color:"var(--gray-600)",fontSize:13,marginBottom:16,lineHeight:1.5}}>{c.desc}</p>
              <div style={{display:"flex",gap:16,marginBottom:14,fontSize:13,color:"var(--gray-600)"}}>
                <span style={{display:"flex",alignItems:"center",gap:6}}><I.Users size={14}/> {c.members} peserta</span>
                <span style={{display:"flex",alignItems:"center",gap:6}}><I.ChatBubble size={14}/> {c.discussions} diskusi</span>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                {c.tags.map(t=><span key={t} className={`pill ${catTints[c.cat]||"pill"}`}>{t}</span>)}
                <span className="pill pill-gray">+1</span>
              </div>
              <button
                onClick={()=>setJoined({...joined,[c.id]:!isJoined})}
                className={isJoined ? "btn btn-primary btn-block" : "btn btn-secondary btn-block"}
              >
                {isJoined ? <><I.Check size={14}/> Bergabung</> : "Bergabung"}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{display:"flex",justifyContent:"center",gap:6,margin:"22px 0 6px"}}>
        {[0,1].map(p=>(
          <button key={p} onClick={()=>setPage(p)} style={{
            width: p===page?22:8, height:8, borderRadius:99, border:"none",
            background: p===page?"var(--blue-600)":"var(--gray-300)", cursor:"pointer",transition:"all .25s",
          }}/>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"center",marginTop:16}}>
        <button className="btn btn-primary btn-lg"><I.Users size={16}/> Explore All Communities <I.Arrow size={16}/></button>
      </div>

      <div style={{
        marginTop:28,borderRadius:20,padding:"30px 36px",
        background:"linear-gradient(135deg,#E8F1FF,#FFEDE2)",
        display:"flex",alignItems:"center",gap:20,position:"relative",overflow:"hidden",
      }}>
        <I.Briefcase size={80} style={{color:"var(--blue-600)",opacity:.85}}/>
        <div style={{flex:1,textAlign:"center"}}>
          <h3 className="h-h1" style={{fontSize:22}}>Siap Mengembangkan Karir?</h3>
          <p style={{color:"var(--gray-600)",marginTop:4,marginBottom:16,maxWidth:"60ch",marginInline:"auto"}}>Bergabung dengan sistem membership Talentika untuk akses penuh ke fitur assessment, mentorship, dan networking profesional.</p>
          <button className="btn btn-primary">Akses Membership Dashboard <I.Arrow size={14}/></button>
        </div>
        <span className="sparkle" style={{top:20,right:60,fontSize:16,color:"var(--yellow)"}}>✦</span>
        <span className="sparkle" style={{top:60,right:140,fontSize:12,color:"var(--blue-500)"}}>✦</span>
      </div>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
window.CoursesScreen = CoursesScreen;
window.OpportunitiesScreen = OpportunitiesScreen;
window.CommunityScreen = CommunityScreen;
window.PageHeader = PageHeader;
window.StatCard = StatCard;
window.BadgeIcon = BadgeIcon;
window.MiniStat = MiniStat;
window.CourseThumb = CourseThumb;
