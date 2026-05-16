// ============ EXTRA SCREENS: Tantangan, Progress, Pencapaian, Timeline, Profile, Pengaturan ============

// ----- TANTANGAN -----
function ChallengesScreen(){
  const [tab, setTab] = useState("active");
  const [joined, setJoined] = useState({1:true,2:true});
  const list = DATA.CHALLENGES.filter(c=>tab==="active"?joined[c.id]:!joined[c.id]);
  return (
    <div style={{paddingTop:8}}>
      <PageHeader
        title="Tantangan"
        subtitle="Ikuti tantangan harian dan mingguan untuk membangun kebiasaan belajar."
      />
      <div className="grid-3" style={{marginBottom:24}}>
        <StatCard icon="Trophy" color="orange" label="Tantangan Aktif" value={Object.values(joined).filter(Boolean).length} sub="Sedang berjalan"/>
        <StatCard icon="Star" color="yellow" label="Streak Terbaik" value="7 hari" sub="Pertahankan!"/>
        <StatCard icon="Shield" color="purple" label="Badge dari Tantangan" value="4" sub="Total badge"/>
      </div>

      <div className="tabs" style={{marginBottom:18}}>
        <button className={tab==="active"?"active":""} onClick={()=>setTab("active")}>Aktif <span className="count">{Object.values(joined).filter(Boolean).length}</span></button>
        <button className={tab==="explore"?"active":""} onClick={()=>setTab("explore")}>Jelajahi <span className="count">{DATA.CHALLENGES.length-Object.values(joined).filter(Boolean).length}</span></button>
      </div>

      <div className="grid-2">
        {list.map(c=>{
          const isJ = joined[c.id];
          return (
            <div key={c.id} className="card lift" style={{padding:0,overflow:"hidden"}}>
              <div className={`cat-bg-${c.color}`} style={{height:96,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <I.Trophy size={42} style={{color:"#fff",opacity:.9}}/>
                <span className="sparkle" style={{top:14,right:18,fontSize:14,color:"#fff",opacity:.9}}>✦</span>
                <span className="sparkle" style={{bottom:14,left:24,fontSize:10,color:"#fff",opacity:.7}}>✦</span>
                <span className="pill" style={{position:"absolute",top:12,left:12,background:"rgba(255,255,255,.95)"}}>{c.days} hari</span>
              </div>
              <div style={{padding:22}}>
                <h3 className="h-h2" style={{fontSize:17,marginBottom:6}}>{c.name}</h3>
                <p style={{fontSize:13,color:"var(--gray-600)",margin:"0 0 14px",lineHeight:1.5}}>{c.desc}</p>
                {isJ && (
                  <div style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12}}>
                      <span style={{color:"var(--gray-500)"}}>Progress harimu</span>
                      <span style={{fontFamily:"var(--display)",fontWeight:700,color:"var(--blue-700)"}}>{c.progress}%</span>
                    </div>
                    <div className="progress"><i style={{width:`${c.progress}%`}}/></div>
                  </div>
                )}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"var(--gray-500)",marginBottom:14}}>
                  <span><I.Users size={12} style={{verticalAlign:-2}}/> {c.joined.toLocaleString("id-ID")} peserta</span>
                  <span style={{display:"flex",alignItems:"center",gap:4,color:"var(--orange)"}}><I.Star size={12} fill="currentColor"/> {c.reward}</span>
                </div>
                <button
                  onClick={()=>setJoined({...joined,[c.id]:!isJ})}
                  className={isJ?"btn btn-secondary btn-block":"btn btn-primary btn-block"}
                >{isJ ? <><I.Check size={14}/> Sedang Diikuti</> : <>Ikuti Tantangan <I.Arrow size={14}/></>}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----- PROGRESS -----
function ProgressScreen(){
  const maxH = Math.max(...DATA.WEEK_HOURS.map(d=>d.h));
  return (
    <div style={{paddingTop:8}}>
      <PageHeader title="Progress" subtitle="Pantau perjalanan belajarmu dari waktu ke waktu."/>
      <div className="grid-4" style={{marginBottom:24}}>
        <StatCard icon="Clock" color="green" label="Jam Belajar Total" value="84,2" sub="Sejak April 2026"/>
        <StatCard icon="Activity" color="blue" label="Hari Aktif" value="42" sub="Konsisten!"/>
        <StatCard icon="Trend" color="orange" label="Streak Saat Ini" value="7 hari" sub="Lanjutkan terus"/>
        <StatCard icon="Star" color="yellow" label="XP Total" value="3.450" sub="+120 minggu ini"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        <div className="card" style={{padding:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 className="h-h2">Jam Belajar Mingguan</h3>
            <Dropdown value="Minggu ini" onChange={()=>{}} options={["Minggu ini","Minggu lalu","30 hari terakhir"]}/>
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:14,height:200,padding:"0 6px"}}>
            {DATA.WEEK_HOURS.map(d=>(
              <div key={d.d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <div style={{
                  width:"100%", borderRadius:"10px 10px 4px 4px",
                  height:`${(d.h/maxH)*160}px`,
                  background: d.h>3.5 ? "linear-gradient(180deg,#3B82F6,#1D4ED8)" : "linear-gradient(180deg,#BFDBFE,#93C5FD)",
                  position:"relative",
                  transition:"height .5s var(--ease-lift)",
                }}>
                  <span style={{position:"absolute",top:-22,left:"50%",transform:"translateX(-50%)",fontSize:11,fontFamily:"var(--display)",fontWeight:700,color:"var(--blue-700)"}}>{d.h}j</span>
                </div>
                <span style={{fontSize:12,color:"var(--gray-500)",fontWeight:500}}>{d.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{padding:24}}>
          <h3 className="h-h2" style={{marginBottom:16}}>Peta Keterampilan</h3>
          <SkillRadar data={DATA.SKILL_RADAR}/>
        </div>
      </div>

      <div className="card">
        <h3 className="h-h2" style={{marginBottom:14}}>Progress per Kursus</h3>
        {DATA.COURSES.map(c=>(
          <div key={c.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderTop:"1px solid var(--gray-150)"}}>
            <CourseThumb course={c} sm/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:14}}>{c.name}</div>
              <div style={{fontSize:12,color:"var(--gray-500)"}}>{c.cat}</div>
            </div>
            <div style={{flex:2,maxWidth:400}}>
              <div className="progress"><i style={{width:`${c.progress}%`}}/></div>
            </div>
            <span style={{fontFamily:"var(--display)",fontWeight:700,color:"var(--blue-700)",width:48,textAlign:"right"}}>{c.progress}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillRadar({ data }){
  const cx = 150, cy = 140, R = 110;
  const points = data.map((s,i)=>{
    const a = (i/data.length)*Math.PI*2 - Math.PI/2;
    const r = R*(s.value/100);
    return [cx+Math.cos(a)*r, cy+Math.sin(a)*r];
  });
  const labels = data.map((s,i)=>{
    const a = (i/data.length)*Math.PI*2 - Math.PI/2;
    return { x: cx+Math.cos(a)*(R+22), y: cy+Math.sin(a)*(R+22), label: s.skill };
  });
  return (
    <svg width="100%" height="280" viewBox="0 0 300 280">
      {[0.25,0.5,0.75,1].map(s=>(
        <polygon key={s} points={data.map((_,i)=>{
          const a=(i/data.length)*Math.PI*2 - Math.PI/2;
          return [cx+Math.cos(a)*R*s, cy+Math.sin(a)*R*s].join(",");
        }).join(" ")} fill="none" stroke="#E5E7EB" strokeWidth="1"/>
      ))}
      {data.map((_,i)=>{
        const a=(i/data.length)*Math.PI*2 - Math.PI/2;
        return <line key={i} x1={cx} y1={cy} x2={cx+Math.cos(a)*R} y2={cy+Math.sin(a)*R} stroke="#E5E7EB" strokeWidth="1"/>;
      })}
      <polygon points={points.map(p=>p.join(",")).join(" ")} fill="rgba(29,78,216,.2)" stroke="#1D4ED8" strokeWidth="2"/>
      {points.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#1D4ED8"/>)}
      {labels.map((l,i)=>(
        <text key={i} x={l.x} y={l.y} fontSize="12" fontFamily="Poppins" fontWeight="600" fill="#374151" textAnchor="middle" alignmentBaseline="middle">{l.label}</text>
      ))}
    </svg>
  );
}

// ----- PENCAPAIAN -----
function AchievementsScreen(){
  const earned = DATA.BADGES.filter(b=>b.earned);
  const locked = DATA.BADGES.filter(b=>!b.earned);
  return (
    <div style={{paddingTop:8}}>
      <PageHeader title="Pencapaian" subtitle="Kumpulkan badge dengan menyelesaikan kursus, tantangan, dan misi."/>
      <div className="card card-elevated" style={{background:"linear-gradient(135deg,#FFF8E1,#FFEDE2)",padding:28,marginBottom:20,position:"relative",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <div style={{position:"relative"}}>
            <BadgeIcon icon="Trophy" color="yellow" size={86}/>
            <span className="sparkle" style={{top:-6,right:-6,fontSize:18,color:"var(--yellow)"}}>✦</span>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontFamily:"var(--mono)",letterSpacing:".15em",textTransform:"uppercase",color:"var(--orange)",fontWeight:700,marginBottom:6}}>Koleksimu Sejauh Ini</div>
            <h2 className="h-h1" style={{fontSize:30,marginBottom:6}}>{earned.length} dari {DATA.BADGES.length} badge</h2>
            <p style={{color:"var(--gray-600)",margin:0}}>Kamu sedang dalam jalur yang luar biasa. Selesaikan {locked.length} tantangan lagi untuk membuka semua badge.</p>
          </div>
        </div>
      </div>

      <h3 className="h-h2" style={{margin:"24px 0 12px"}}>Sudah Diraih</h3>
      <div className="grid-4">
        {earned.map((b,i)=>(
          <div key={i} className="card lift" style={{textAlign:"center",padding:20,position:"relative"}}>
            <BadgeIcon icon={b.icon} color={b.color} size={68}/>
            <h4 style={{fontFamily:"var(--display)",fontSize:14,marginTop:10,marginBottom:4}}>{b.name}</h4>
            <p style={{fontSize:11.5,color:"var(--gray-500)",margin:"0 0 8px",lineHeight:1.4}}>{b.desc}</p>
            <span className="pill pill-green"><I.Check size={11}/> {b.when}</span>
          </div>
        ))}
      </div>

      <h3 className="h-h2" style={{margin:"32px 0 12px"}}>Belum Terbuka</h3>
      <div className="grid-4">
        {locked.map((b,i)=>(
          <div key={i} className="card" style={{textAlign:"center",padding:20,position:"relative",opacity:.95}}>
            <BadgeIcon icon={b.icon} color={b.color} size={68} locked/>
            <h4 style={{fontFamily:"var(--display)",fontSize:14,marginTop:10,marginBottom:4,color:"var(--gray-600)"}}>{b.name}</h4>
            <p style={{fontSize:11.5,color:"var(--gray-500)",margin:"0 0 8px",lineHeight:1.4}}>{b.desc}</p>
            <span className="pill pill-gray"><I.Lock size={11}/> Terkunci</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- TIMELINE -----
function TimelineScreen(){
  return (
    <div style={{paddingTop:8}}>
      <PageHeader title="Timeline" subtitle="Riwayat aktivitas, pencapaian, dan pengingat penting." right={<Dropdown value="Semua aktivitas" onChange={()=>{}} options={["Semua aktivitas","Belajar","Pencapaian","Komunitas"]}/>}/>
      <div className="card" style={{padding:"28px 32px",maxWidth:780}}>
        {DATA.TIMELINE_EVENTS.map((group,gi)=>(
          <div key={gi} style={{marginBottom:gi<DATA.TIMELINE_EVENTS.length-1?28:0}}>
            <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:13,color:"var(--gray-500)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:14}}>{group.date}</div>
            <div style={{position:"relative",paddingLeft:32}}>
              <div style={{position:"absolute",left:15,top:8,bottom:8,width:2,background:"var(--gray-200)"}}/>
              {group.items.map((it,ii)=>{
                const Ico = I[it.icon];
                const tints = { blue:["var(--blue-50)","var(--blue-700)"], green:["var(--mint)","var(--green-dark)"], orange:["var(--orange-soft)","var(--orange)"], yellow:["var(--yellow-soft)","#A47000"], purple:["var(--lilac)","#5B21B6"] };
                const [bg,fg] = tints[it.color]||tints.blue;
                return (
                  <div key={ii} style={{display:"flex",gap:14,paddingBottom:18,position:"relative"}}>
                    <div style={{
                      position:"absolute",left:-32,width:32,height:32,borderRadius:"50%",
                      background:bg,color:fg,display:"grid",placeItems:"center",
                      border:"3px solid #fff",
                    }}><Ico size={14}/></div>
                    <div>
                      <div style={{fontSize:11.5,color:"var(--gray-500)",fontFamily:"var(--mono)"}}>{it.time}</div>
                      <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:14.5,color:"var(--ink)",margin:"2px 0"}}>{it.title}</div>
                      <div style={{fontSize:13,color:"var(--gray-600)"}}>{it.meta}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- PROFILE -----
function ProfileScreen(){
  return (
    <div style={{paddingTop:8}}>
      <PageHeader title="Profile" subtitle="Identitas, minat, dan progress publikmu di Talentika."/>
      <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:20}}>
        <div className="card" style={{padding:24,textAlign:"center"}}>
          <div className="avatar avatar-xl" style={{margin:"0 auto 14px",fontSize:30,background:"linear-gradient(135deg,#1D4ED8,#3B82F6)"}}>{DATA.USER.initials}</div>
          <h3 className="h-h2" style={{fontSize:20}}>{DATA.USER.name}</h3>
          <p style={{color:"var(--gray-500)",fontSize:13,marginBottom:14}}>{DATA.USER.email}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginBottom:16}}>
            <span className="pill pill-orange">Artistic</span>
            <span className="pill pill-orange">Creator</span>
            <span className="pill">Design</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,padding:"14px 0",borderTop:"1px solid var(--gray-150)",borderBottom:"1px solid var(--gray-150)"}}>
            <Stat n="12" l="Badge"/>
            <Stat n="5" l="Kursus"/>
            <Stat n="3" l="Sertifikat"/>
          </div>
          <button className="btn btn-secondary btn-block" style={{marginTop:16}}><I.Pen size={14}/> Edit Profil</button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div className="card">
            <h3 className="h-h2" style={{marginBottom:12}}>Tentang Saya</h3>
            <p style={{color:"var(--gray-700)",lineHeight:1.6,margin:0}}>
              Pelajar SMA yang antusias mengeksplorasi dunia desain, ilustrasi, dan inovasi. Suka membuat sesuatu yang baru dan bermanfaat bagi orang sekitar. Saat ini fokus mengasah skill UI/UX dan public speaking.
            </p>
          </div>
          <div className="card">
            <h3 className="h-h2" style={{marginBottom:12}}>Minat & Tujuan</h3>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {["UI/UX Design","Ilustrasi Digital","Public Speaking","Startup","Beasiswa S2 Luar Negeri","AI for Creators","Social Impact"].map(t=>(
                <span key={t} className="pill">{t}</span>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="h-h2" style={{marginBottom:12}}>Riwayat Pembelajaran</h3>
            {DATA.COURSES.slice(0,3).map(c=>(
              <div key={c.id} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderTop:"1px solid var(--gray-150)"}}>
                <CourseThumb course={c} sm/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:14}}>{c.name}</div>
                  <div style={{fontSize:12,color:"var(--gray-500)"}}>{c.cat} · {c.progress}% selesai</div>
                </div>
                <span className="pill">{c.progress===100?"Selesai":"Berjalan"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
const Stat = ({n,l}) => (
  <div>
    <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:20,color:"var(--ink)"}}>{n}</div>
    <div style={{fontSize:11,color:"var(--gray-500)"}}>{l}</div>
  </div>
);

// ----- PENGATURAN -----
function SettingsScreen(){
  const [section, setSection] = useState("account");
  const [notif, setNotif] = useState({course:true,community:true,marketing:false,email:true,push:true});
  const [lang, setLang] = useState("Bahasa Indonesia");
  const [theme, setTheme] = useState("Sistem");

  return (
    <div style={{paddingTop:8}}>
      <PageHeader title="Pengaturan" subtitle="Kelola akun, notifikasi, dan preferensi tampilanmu."/>
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:20}}>
        <div className="card" style={{padding:8}}>
          {[
            ["account","Akun","User"],
            ["security","Keamanan","Lock"],
            ["notifications","Notifikasi","Bell"],
            ["appearance","Tampilan","Sun"],
            ["language","Bahasa","Globe"],
            ["billing","Tagihan","Diamond"],
          ].map(([id,label,icon])=>{
            const Ico = I[icon]||I.User;
            const active = section===id;
            return (
              <button key={id} onClick={()=>setSection(id)} style={{
                width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                border:"none",background: active?"var(--blue-50)":"transparent",borderRadius:10,
                color: active?"var(--blue-700)":"var(--gray-700)",fontWeight: active?600:500,
                fontFamily:"var(--display)",fontSize:13.5,cursor:"pointer",marginBottom:2,
              }}><Ico size={16}/> {label}</button>
            );
          })}
        </div>

        <div className="card" style={{padding:32}}>
          {section==="account" && (
            <div>
              <h3 className="h-h2" style={{marginBottom:18}}>Informasi Akun</h3>
              <Field label="Nama Lengkap" value={DATA.USER.name}/>
              <Field label="Email" value={DATA.USER.email}/>
              <Field label="Nomor Handphone" value="+62 812 3456 7890"/>
              <Field label="Tanggal Lahir" value="14 Februari 2007"/>
              <div style={{display:"flex",gap:10,marginTop:18}}>
                <button className="btn btn-primary">Simpan Perubahan</button>
                <button className="btn btn-secondary">Batalkan</button>
              </div>
            </div>
          )}
          {section==="notifications" && (
            <div>
              <h3 className="h-h2" style={{marginBottom:18}}>Notifikasi</h3>
              <Toggle label="Pengingat Kursus" desc="Reminder harian agar konsisten belajar." v={notif.course} onChange={v=>setNotif({...notif,course:v})}/>
              <Toggle label="Aktivitas Komunitas" desc="Diskusi & balasan dari komunitas yang kamu ikuti." v={notif.community} onChange={v=>setNotif({...notif,community:v})}/>
              <Toggle label="Email Marketing" desc="Tips, peluang, dan promosi terkurasi." v={notif.marketing} onChange={v=>setNotif({...notif,marketing:v})}/>
              <div style={{margin:"18px 0 10px",fontSize:12,fontFamily:"var(--display)",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--gray-500)"}}>Channel</div>
              <Toggle label="Email" v={notif.email} onChange={v=>setNotif({...notif,email:v})}/>
              <Toggle label="Push Notification" v={notif.push} onChange={v=>setNotif({...notif,push:v})}/>
            </div>
          )}
          {section==="appearance" && (
            <div>
              <h3 className="h-h2" style={{marginBottom:18}}>Tampilan</h3>
              <div style={{marginBottom:18,fontSize:13,color:"var(--gray-600)"}}>Pilih tema yang nyaman untuk matamu.</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {["Terang","Gelap","Sistem"].map(t=>(
                  <button key={t} onClick={()=>setTheme(t)} style={{
                    padding:18,borderRadius:14,border: theme===t?"2px solid var(--blue-600)":"1.5px solid var(--gray-200)",
                    background: theme===t?"var(--blue-50)":"#fff",cursor:"pointer",
                    fontFamily:"var(--display)",fontWeight:600,
                  }}>
                    {t==="Terang"?<I.Sun size={22}/>:t==="Gelap"?<I.Moon size={22}/>:<I.Settings size={22}/>}
                    <div style={{marginTop:6}}>{t}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {section==="language" && (
            <div>
              <h3 className="h-h2" style={{marginBottom:18}}>Bahasa</h3>
              {["Bahasa Indonesia","English","日本語"].map(l=>(
                <div key={l} onClick={()=>setLang(l)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",border:"1px solid var(--gray-200)",borderRadius:12,marginBottom:8,cursor:"pointer",background: lang===l?"var(--blue-50)":"#fff"}}>
                  <span style={{fontFamily:"var(--display)",fontWeight:600}}>{l}</span>
                  {lang===l && <I.Check size={16} style={{color:"var(--blue-600)"}}/>}
                </div>
              ))}
            </div>
          )}
          {section==="security" && (
            <div>
              <h3 className="h-h2" style={{marginBottom:18}}>Keamanan</h3>
              <Field label="Kata Sandi" value="••••••••" actionLabel="Ubah"/>
              <Toggle label="Autentikasi 2 Faktor" desc="Tambahkan lapisan keamanan ekstra." v={true} onChange={()=>{}}/>
              <Toggle label="Login Alert" desc="Beritahu saya jika ada login dari perangkat baru." v={true} onChange={()=>{}}/>
            </div>
          )}
          {section==="billing" && (
            <div>
              <h3 className="h-h2" style={{marginBottom:18}}>Tagihan & Membership</h3>
              <div style={{padding:20,background:"linear-gradient(135deg,#E8F1FF,#FFEDE2)",borderRadius:16,marginBottom:18}}>
                <div style={{fontSize:12,fontFamily:"var(--mono)",letterSpacing:".15em",textTransform:"uppercase",color:"var(--orange)",fontWeight:700,marginBottom:6}}>Status Saat Ini</div>
                <div style={{fontFamily:"var(--display)",fontWeight:700,fontSize:22}}>Talentika Free</div>
                <p style={{fontSize:13,color:"var(--gray-600)",margin:"4px 0 14px"}}>Upgrade ke Pro untuk fitur premium dan materi eksklusif.</p>
                <button className="btn btn-primary"><I.Diamond size={14}/> Upgrade ke Pro</button>
              </div>
              <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:13,color:"var(--gray-500)",marginBottom:8}}>Riwayat Pembayaran</div>
              <div style={{color:"var(--gray-500)",fontSize:13,padding:24,textAlign:"center",border:"1px dashed var(--gray-200)",borderRadius:12}}>Belum ada transaksi.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, actionLabel }){
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:12,fontFamily:"var(--display)",fontWeight:600,color:"var(--gray-600)",marginBottom:6}}>{label}</div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div className="input" style={{flex:1}}>
          <input value={value} readOnly/>
        </div>
        {actionLabel && <button className="btn btn-secondary btn-sm">{actionLabel}</button>}
      </div>
    </div>
  );
}

function Toggle({ label, desc, v, onChange }){
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid var(--gray-150)"}}>
      <div>
        <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:14}}>{label}</div>
        {desc && <div style={{fontSize:12,color:"var(--gray-500)",marginTop:2}}>{desc}</div>}
      </div>
      <button onClick={()=>onChange(!v)} style={{
        width:42,height:24,borderRadius:99,border:"none",cursor:"pointer",
        background: v?"var(--blue-600)":"var(--gray-300)",position:"relative",transition:"background .2s",
      }}>
        <span style={{
          position:"absolute",top:3,left: v?21:3,width:18,height:18,borderRadius:"50%",
          background:"#fff",transition:"left .2s var(--ease-snap)",boxShadow:"var(--shadow-sm)",
        }}/>
      </button>
    </div>
  );
}

window.ChallengesScreen = ChallengesScreen;
window.ProgressScreen = ProgressScreen;
window.AchievementsScreen = AchievementsScreen;
window.TimelineScreen = TimelineScreen;
window.ProfileScreen = ProfileScreen;
window.SettingsScreen = SettingsScreen;
