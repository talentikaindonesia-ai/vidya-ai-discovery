// ============ APP SHELL: Sidebar + Topbar ============
const { useState, useEffect, useMemo, useRef, createContext, useContext } = React;

const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

const NAV_ITEMS = [
  { id:"dashboard", label:"Dashboard", icon:"Home" },
  { id:"courses", label:"Kursus Saya", icon:"Book" },
  { id:"challenges", label:"Tantangan", icon:"Trophy" },
  { id:"opportunities", label:"Peluang", icon:"Gift" },
  { id:"progress", label:"Progress", icon:"Trend" },
  { id:"achievements", label:"Pencapaian", icon:"Shield" },
  { id:"community", label:"Community", icon:"Users" },
  { id:"timeline", label:"Timeline", icon:"Clock" },
  { id:"profile", label:"Profile", icon:"User" },
  { id:"settings", label:"Pengaturan", icon:"Settings" },
];

function Sidebar({ route, setRoute, collapsed, setCollapsed }){
  return (
    <aside style={{
      width: collapsed ? 78 : 248,
      background:"var(--gray-0)", borderRight:"1px solid var(--gray-200)",
      display:"flex", flexDirection:"column", transition:"width .25s var(--ease-soft)",
      position:"sticky", top:0, height:"100vh", flexShrink:0,
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"22px 20px 16px"}}>
        {!collapsed ? (
          <span className="logo-text">Talentika<span className="star">✦</span></span>
        ) : (
          <I.Logo size={32}/>
        )}
        <button className="btn-icon" onClick={()=>setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          {collapsed ? <I.Chevron size={16}/> : <I.ChevronLeft size={16}/>}
        </button>
      </div>

      <nav style={{padding:"4px 12px",flex:1,overflowY:"auto"}}>
        {NAV_ITEMS.map(item=>{
          const active = route === item.id;
          const Ico = I[item.icon];
          return (
            <button key={item.id}
              onClick={()=>setRoute(item.id)}
              title={collapsed ? item.label : ""}
              style={{
                width:"100%", display:"flex", alignItems:"center",
                gap:14, padding: collapsed ? "12px" : "11px 14px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius:11, marginBottom:2,
                background: active ? "var(--blue-50)" : "transparent",
                color: active ? "var(--blue-700)" : "var(--gray-700)",
                border:"none", cursor:"pointer",
                fontFamily:"var(--display)", fontWeight: active ? 600 : 500, fontSize:14,
                position:"relative",
                transition:"background .15s var(--ease-snap)",
              }}
              onMouseEnter={e=>{if(!active) e.currentTarget.style.background="var(--gray-100)"}}
              onMouseLeave={e=>{if(!active) e.currentTarget.style.background="transparent"}}
            >
              {active && <span style={{position:"absolute",left:0,top:8,bottom:8,width:3,background:"var(--blue-600)",borderRadius:"0 3px 3px 0"}}/>}
              <Ico size={20}/>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div style={{padding:"12px 14px 18px"}}>
          <div style={{
            background:"linear-gradient(135deg, #E8F1FF, #FFEDE2)",
            borderRadius:14, padding:14, position:"relative", overflow:"hidden", marginBottom:10,
          }}>
            <I.Diamond size={20} style={{color:"var(--blue-600)"}}/>
            <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:14,color:"var(--ink)",marginTop:6}}>Upgrade ke Pro</div>
            <div style={{fontSize:12,color:"var(--gray-600)",margin:"4px 0 12px"}}>Akses fitur premium dan materi eksklusif.</div>
            <button className="btn btn-primary btn-sm btn-block">Upgrade Sekarang</button>
            <div style={{position:"absolute",right:-10,top:-10,opacity:.4,fontSize:48,color:"var(--blue-600)"}}>✦</div>
          </div>
          <button style={{
            width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
            background:"transparent", border:"1px solid var(--gray-200)", borderRadius:11,
            color:"var(--gray-700)", cursor:"pointer", fontFamily:"var(--sans)", fontSize:13,
          }}>
            <span style={{width:32,height:32,borderRadius:8,background:"var(--gray-100)",display:"grid",placeItems:"center",color:"var(--blue-600)"}}>
              <I.Question size={16}/>
            </span>
            <span style={{flex:1,textAlign:"left"}}>
              <div style={{fontWeight:600,color:"var(--ink)",fontSize:13}}>Butuh Bantuan?</div>
              <div style={{fontSize:11,color:"var(--gray-500)"}}>Kunjungi Pusat Bantuan</div>
            </span>
            <I.Chevron size={14}/>
          </button>
        </div>
      )}
    </aside>
  );
}

function Topbar({ search, setSearch, dark, setDark, onLogout }){
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header style={{
      display:"flex", alignItems:"center", gap:16, padding:"18px 28px",
      background:"var(--gray-50)", position:"sticky", top:0, zIndex:10,
      borderBottom:"1px solid transparent",
    }}>
      <div className="input" style={{flex:1, maxWidth:520, background:"#fff"}}>
        <I.Search size={18} style={{color:"var(--gray-500)"}}/>
        <input placeholder="Cari kursus, materi, atau topik…" value={search} onChange={e=>setSearch(e.target.value)} />
        <span className="kbd">Ctrl K</span>
      </div>
      <div style={{flex:1}}/>
      <button className="btn-icon" onClick={()=>setDark(!dark)} aria-label="Toggle theme">
        {dark ? <I.Sun size={18}/> : <I.Moon size={18}/>}
      </button>
      <button className="btn-icon" style={{position:"relative"}} aria-label="Notifications">
        <I.Bell size={18}/>
        <span style={{
          position:"absolute", top:4, right:4, background:"#EF4444", color:"#fff",
          fontSize:9, fontWeight:700, padding:"1px 4px", borderRadius:8, lineHeight:1.2,
        }}>12</span>
      </button>
      <div style={{position:"relative"}}>
        <button onClick={()=>setMenuOpen(!menuOpen)} style={{
          display:"flex",alignItems:"center",gap:10,background:"transparent",border:"none",cursor:"pointer",
          padding:"6px 10px",borderRadius:12,
        }}>
          <div className="avatar">{DATA.USER.initials}</div>
          <div style={{textAlign:"left"}}>
            <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:13.5,color:"var(--ink)"}}>{DATA.USER.firstName}</div>
            <div style={{fontSize:11,color:"var(--gray-500)"}}>{DATA.USER.plan}</div>
          </div>
          <I.ChevronDown size={14} style={{color:"var(--gray-500)"}}/>
        </button>
        {menuOpen && (
          <div style={{
            position:"absolute", right:0, top:54, background:"#fff", borderRadius:14,
            boxShadow:"var(--shadow-lg)", border:"1px solid var(--gray-200)", padding:8, minWidth:200, zIndex:20,
          }} className="page-in">
            <MenuItem icon="User" label="Profil saya"/>
            <MenuItem icon="Settings" label="Pengaturan"/>
            <MenuItem icon="Diamond" label="Upgrade ke Pro" accent/>
            <div style={{height:1,background:"var(--gray-150)",margin:"6px 4px"}}/>
            <MenuItem icon="ArrowDown" label="Keluar" onClick={onLogout}/>
          </div>
        )}
      </div>
    </header>
  );
}

function MenuItem({ icon, label, accent, onClick }){
  const Ico = I[icon];
  return (
    <button onClick={onClick} style={{
      width:"100%", display:"flex", alignItems:"center", gap:10, padding:"8px 10px",
      border:"none", background:"transparent", borderRadius:8, cursor:"pointer",
      color: accent ? "var(--orange)" : "var(--gray-700)", fontFamily:"var(--sans)", fontSize:13.5,
    }}
    onMouseEnter={e=>e.currentTarget.style.background="var(--gray-100)"}
    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
    >
      <Ico size={16}/> {label}
    </button>
  );
}

function AppShell({ route, setRoute, children, onLogout }){
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(false);
  useEffect(()=>{
    document.body.classList.toggle("dark", dark);
  },[dark]);
  return (
    <div style={{display:"flex",minHeight:"100vh",background:"var(--gray-50)"}}>
      <Sidebar route={route} setRoute={setRoute} collapsed={collapsed} setCollapsed={setCollapsed}/>
      <main style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
        <Topbar search={search} setSearch={setSearch} dark={dark} setDark={setDark} onLogout={onLogout}/>
        <div key={route} className="page-in" style={{padding:"0 32px 60px",flex:1}}>
          {children}
        </div>
      </main>
    </div>
  );
}

window.AppShell = AppShell;
window.AppContext = AppContext;
window.useApp = useApp;
window.NAV_ITEMS = NAV_ITEMS;
