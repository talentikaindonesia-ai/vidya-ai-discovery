// ============ AUTH + ONBOARDING + TALENT TEST ============

function AuthScreen({ onAuth }){
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("dafa@talentika.id");
  const [pass, setPass] = useState("••••••••");
  const [showPass, setShowPass] = useState(false);

  return (
    <div style={{minHeight:"100vh",display:"grid",gridTemplateColumns:"1fr 1fr",background:"linear-gradient(135deg,#F1F5FB,#E8F1FF)"}}>
      {/* Left visual panel */}
      <div style={{padding:"56px 64px",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:48}}>
            <span className="logo-text" style={{fontSize:32}}>Talentika<span className="star" style={{fontSize:18}}>✦</span></span>
          </div>
          <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:14,marginBottom:14}}>
            <span style={{color:"var(--blue-600)"}}>Discover.</span> <span style={{color:"var(--orange)"}}>Develop.</span> <span style={{color:"#A47000"}}>Grow.</span>
          </div>
          <h1 className="h-display" style={{fontSize:46,maxWidth:"14ch"}}>Mulai perjalanan terbaikmu bersama <span style={{color:"var(--blue-600)"}}>Talentika</span><span style={{color:"var(--yellow)",fontSize:32}}>✦</span></h1>
          <p style={{maxWidth:"42ch",color:"var(--gray-600)",fontSize:15,marginTop:20}}>
            Bergabunglah dengan ribuan talenta muda dan mentor hebat untuk belajar, berkembang, dan berdampak bagi Indonesia.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:32,maxWidth:380}}>
            <ValueProp icon="Book" color="blue" title="Akses Pembelajaran Berkualitas" desc="Kursus, mentoring, dan resources terbaik untuk mengembangkan potensimu."/>
            <ValueProp icon="Users" color="orange" title="Komunitas Positif & Inspiratif" desc="Bertemu dengan teman, mentor, dan komunitas yang sejalan dengan minatmu."/>
            <ValueProp icon="Trend" color="green" title="Bangun Masa Depanmu" desc="Tingkatkan skill, raih peluang, dan wujudkan impianmu bersama Talentika."/>
          </div>
        </div>
        {/* Decorative blobs + sparkles */}
        <svg style={{position:"absolute",right:-40,top:120,opacity:.5}} width="220" height="220" viewBox="0 0 220 220"><circle cx="110" cy="110" r="100" fill="#D6E4FF"/></svg>
        <svg className="sparkle" style={{top:80,right:120}} width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/></svg>
        <svg className="sparkle" style={{top:280,right:240,color:"var(--blue-500)"}} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7z"/></svg>
      </div>

      {/* Right form */}
      <div style={{padding:"56px 64px",display:"flex",alignItems:"center"}}>
        <div style={{background:"#fff",borderRadius:24,padding:42,width:"100%",maxWidth:560,boxShadow:"var(--shadow-lg)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:"1px solid var(--gray-200)",marginBottom:28}}>
            <TabBtn label="Masuk" icon="User" active={tab==="login"} onClick={()=>setTab("login")}/>
            <TabBtn label="Daftar Akun" icon="Plus" active={tab==="register"} onClick={()=>setTab("register")}/>
          </div>
          {tab === "login" ? (
            <div>
              <h2 className="h-h1" style={{marginBottom:6}}>Selamat datang kembali! <span className="wave">👋</span></h2>
              <p style={{color:"var(--gray-500)",marginBottom:24}}>Masuk untuk melanjutkan perjalanan belajarmu di Talentika.</p>

              <Label>Email atau Nomor Handphone</Label>
              <div className="input" style={{marginBottom:18}}>
                <I.Mail size={18} style={{color:"var(--gray-400)"}}/>
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Masukkan email atau nomor handphone"/>
              </div>

              <Label>Kata Sandi</Label>
              <div className="input" style={{marginBottom:8}}>
                <I.Lock size={18} style={{color:"var(--gray-400)"}}/>
                <input type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="Masukkan kata sandi"/>
                <button className="btn-icon" onClick={()=>setShowPass(!showPass)} type="button" style={{padding:0}}>
                  <I.Eye size={16}/>
                </button>
              </div>
              <div style={{textAlign:"right",marginBottom:20}}>
                <a style={{color:"var(--blue-600)",fontSize:13,fontWeight:600}}>Lupa kata sandi?</a>
              </div>

              <button className="btn btn-primary btn-lg btn-block" onClick={onAuth}>
                Masuk <I.Arrow size={16}/>
              </button>

              <div style={{textAlign:"center",margin:"22px 0 16px",color:"var(--gray-400)",fontSize:12.5,position:"relative"}}>
                <span style={{background:"#fff",padding:"0 12px",position:"relative",zIndex:1}}>atau masuk dengan</span>
                <span style={{position:"absolute",left:0,right:0,top:"50%",height:1,background:"var(--gray-200)"}}/>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <OAuthBtn label="Google" emoji="G" color="#EA4335"/>
                <OAuthBtn label="Apple" emoji=""/>
                <OAuthBtn label="Facebook" emoji="f" color="#1877F2"/>
              </div>

              <div style={{textAlign:"center",marginTop:24,fontSize:13,color:"var(--gray-600)"}}>
                Belum punya akun? <a onClick={()=>setTab("register")} style={{color:"var(--blue-600)",fontWeight:600,cursor:"pointer"}}>Daftar sekarang</a>
              </div>
              <div style={{textAlign:"center",fontSize:11,color:"var(--gray-500)",marginTop:14,lineHeight:1.6}}>
                <I.Shield size={12} style={{verticalAlign:-2,color:"var(--blue-600)"}}/> Keamanan data Anda adalah prioritas kami.<br/>
                Dengan masuk, Anda menyetujui <a style={{color:"var(--blue-600)"}}>Syarat & Ketentuan</a> dan <a style={{color:"var(--blue-600)"}}>Kebijakan Privasi</a> Talentika.
              </div>
            </div>
          ) : (
            <div>
              <h2 className="h-h1" style={{marginBottom:6}}>Bergabung sekarang ✨</h2>
              <p style={{color:"var(--gray-500)",marginBottom:24}}>Buat akun gratis dan mulai temukan potensi terbaikmu.</p>
              <Label>Nama Lengkap</Label>
              <div className="input" style={{marginBottom:14}}><I.User size={18} style={{color:"var(--gray-400)"}}/><input placeholder="Nama lengkapmu" defaultValue="Muhammad Dafa"/></div>
              <Label>Email</Label>
              <div className="input" style={{marginBottom:14}}><I.Mail size={18} style={{color:"var(--gray-400)"}}/><input placeholder="email@kamu.com"/></div>
              <Label>Kata Sandi</Label>
              <div className="input" style={{marginBottom:20}}><I.Lock size={18} style={{color:"var(--gray-400)"}}/><input type="password" placeholder="Minimal 8 karakter"/></div>
              <button className="btn btn-primary btn-lg btn-block" onClick={onAuth}>Daftar Akun <I.Arrow size={16}/></button>
              <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"var(--gray-600)"}}>
                Sudah punya akun? <a onClick={()=>setTab("login")} style={{color:"var(--blue-600)",fontWeight:600,cursor:"pointer"}}>Masuk di sini</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Label = ({children}) => <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:13,color:"var(--ink)",marginBottom:8}}>{children}</div>;

function TabBtn({ label, icon, active, onClick }){
  const Ico = I[icon];
  return (
    <button onClick={onClick} style={{
      padding:"14px 0", border:"none", background:"transparent",
      display:"flex",alignItems:"center",justifyContent:"center",gap:8,
      fontFamily:"var(--display)",fontWeight:600,fontSize:14,
      color: active ? "var(--blue-700)" : "var(--gray-500)",
      borderBottom: active ? "2px solid var(--blue-600)" : "2px solid transparent",
      marginBottom:-1, cursor:"pointer",
    }}>
      <Ico size={16}/> {label}
    </button>
  );
}

function ValueProp({ icon, color, title, desc }){
  const Ico = I[icon];
  const tints = { blue:"var(--blue-50)", orange:"var(--orange-soft)", green:"var(--mint)" };
  const accents = { blue:"var(--blue-600)", orange:"var(--orange)", green:"var(--green-dark)" };
  return (
    <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
      <div style={{width:42,height:42,borderRadius:11,background:tints[color],color:accents[color],display:"grid",placeItems:"center",flex:"0 0 auto"}}>
        <Ico size={20}/>
      </div>
      <div>
        <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:14.5,color:"var(--ink)"}}>{title}</div>
        <div style={{fontSize:12.5,color:"var(--gray-600)",marginTop:2,lineHeight:1.5}}>{desc}</div>
      </div>
    </div>
  );
}

function OAuthBtn({ label, emoji, color }){
  return (
    <button className="btn btn-secondary" style={{padding:"10px",justifyContent:"center",gap:8}}>
      <span style={{
        width:18,height:18,borderRadius:"50%",
        background: color || "#000", color:"#fff", display:"grid",placeItems:"center",
        fontSize:11,fontWeight:700,
      }}>{emoji}</span>
      {label}
    </button>
  );
}

// ============ ONBOARDING ============
const ONBOARD_STEPS = [
  { title:"Kenali dirimu lebih dalam", desc:"Ikuti Talent Test yang dirancang secara ilmiah untuk memahami bakat, minat, dan kepribadianmu.", color:"blue", emoji:"👋", illustrator:"Wave"},
  { title:"Dapatkan insight karier yang tepat", desc:"Terima rekomendasi jurusan, karier, dan peluang yang sesuai dengan potensi unikmu.", color:"yellow", emoji:"💡", illustrator:"Insight"},
  { title:"Bangun roadmap pengembangan diri", desc:"Dapatkan langkah-langkah terarah untuk mengembangkan skill dan mencapai tujuanmu.", color:"orange", emoji:"🏔️", illustrator:"Mountain"},
  { title:"Bergabung dengan komunitas positif", desc:"Terhubung dengan ribuan pemuda inspiratif dan temukan peluang tak terbatas bersama Talentika.", color:"green", emoji:"🙌", illustrator:"Group"},
  { title:"Siap untuk masa depanmu?", desc:"Yuk, mulai perjalananmu sekarang dan wujudkan masa depan terbaikmu bersama Talentika.", color:"blue", emoji:"🚀", illustrator:"Rocket"},
];

function OnboardingScreen({ onDone }){
  const [step, setStep] = useState(0);
  const s = ONBOARD_STEPS[step];
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#F1F5FB,#FFFFFF)",position:"relative",overflow:"hidden"}}>
      {/* Decorative wavy bottom */}
      <svg style={{position:"absolute",bottom:0,left:0,width:"100%"}} viewBox="0 0 1440 200" preserveAspectRatio="none" height="200">
        <path d="M0 120 C 240 60, 480 180, 720 100 S 1200 40, 1440 120 L 1440 200 L 0 200 Z" fill="#D6E4FF" opacity=".5"/>
        <path d="M0 150 C 240 100, 480 200, 720 140 S 1200 80, 1440 160 L 1440 200 L 0 200 Z" fill="#1D4ED8" opacity=".15"/>
      </svg>

      <div style={{position:"absolute",top:32,right:40,zIndex:5}}>
        <button className="btn btn-ghost" onClick={onDone}>Lewati <I.Chevron size={14}/></button>
      </div>
      <div style={{position:"absolute",top:32,left:48}}>
        <span className="logo-text" style={{fontSize:28}}>Talentika<span className="star" style={{fontSize:16}}>✦</span></span>
        <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:12,marginTop:2}}>
          <span style={{color:"var(--blue-600)"}}>Discover.</span> <span style={{color:"var(--orange)"}}>Develop.</span> <span style={{color:"#A47000"}}>Grow.</span>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"120px 40px 60px",position:"relative",zIndex:2}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <h1 className="h-display" style={{fontSize:38}}>Selamat datang di Talentika! <span className="wave">👋</span></h1>
          <p style={{color:"var(--gray-600)",fontSize:16,marginTop:8}}>Ikuti langkah berikut untuk mulai perjalananmu menemukan potensi terbaik.</p>
        </div>

        {/* Carousel of 5 cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:18}}>
          {ONBOARD_STEPS.map((card,i)=>(
            <div key={i} onClick={()=>setStep(i)} style={{
              background:"#fff", border: i===step ? "2px solid var(--blue-600)" : "1px solid var(--gray-200)",
              borderRadius:22, padding:"24px 18px", cursor:"pointer", position:"relative",
              boxShadow: i===step ? "var(--shadow-lg)" : "var(--shadow-sm)",
              transform: i===step ? "translateY(-6px)" : "none",
              transition:"all .3s var(--ease-lift)",
            }}>
              <div style={{
                width:32,height:32,borderRadius:"50%",background:"var(--blue-600)",color:"#fff",
                display:"grid",placeItems:"center",fontFamily:"var(--display)",fontWeight:700,fontSize:14,marginBottom:14,
              }}>{i+1}</div>
              <div style={{
                aspectRatio:"1/1",background:"linear-gradient(135deg,#E8F1FF,#fff)",borderRadius:18,
                display:"grid",placeItems:"center",fontSize:64,marginBottom:14,position:"relative",overflow:"hidden",
              }}>
                {card.emoji}
                <span className="sparkle" style={{top:8,right:10,fontSize:12,color:"var(--yellow)"}}>✦</span>
              </div>
              <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:15,color:"var(--ink)",lineHeight:1.3,marginBottom:8}}>{card.title}</div>
              <div style={{fontSize:12,color:"var(--gray-600)",lineHeight:1.5}}>{card.desc}</div>
              <div style={{display:"flex",justifyContent:"center",gap:5,marginTop:14}}>
                {[0,1,2,3,4].map(d=><span key={d} style={{
                  width: d===i ? 16 : 6, height:6, borderRadius:99,
                  background: d===i ? "var(--blue-600)" : "var(--gray-200)",
                  transition:"all .25s",
                }}/>)}
              </div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:40}}>
          {step > 0 && <button className="btn btn-secondary" onClick={()=>setStep(step-1)}><I.ChevronLeft size={14}/> Sebelumnya</button>}
          {step < ONBOARD_STEPS.length-1 ? (
            <button className="btn btn-primary btn-lg" onClick={()=>setStep(step+1)}>Selanjutnya <I.Arrow size={16}/></button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={onDone}>Mulai Talent Test <I.Rocket size={16}/></button>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24,marginTop:48,maxWidth:900,marginLeft:"auto",marginRight:"auto"}}>
          <TrustItem icon="Shield" title="Aman & Terpercaya" desc="Data pribadimu aman bersama kami."/>
          <TrustItem icon="Lock" title="Privasi Terjaga" desc="Kami tidak akan membagikan data kamu ke pihak manapun."/>
          <TrustItem icon="Brain" title="Berdasarkan Sains" desc="Metode ilmiah dan psikometri yang valid & terpercaya."/>
        </div>
      </div>
    </div>
  );
}
function TrustItem({ icon, title, desc }){
  const Ico = I[icon];
  return (
    <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
      <div style={{width:36,height:36,borderRadius:10,background:"var(--yellow-soft)",color:"#A47000",display:"grid",placeItems:"center"}}><Ico size={18}/></div>
      <div>
        <div style={{fontFamily:"var(--display)",fontWeight:600,fontSize:13.5}}>{title}</div>
        <div style={{fontSize:12,color:"var(--gray-600)",marginTop:2}}>{desc}</div>
      </div>
    </div>
  );
}

// ============ TALENT TEST ============
function TalentTest({ onDone }){
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const Q = DATA.TALENT_QUESTIONS;
  if(step >= Q.length){
    // Result reveal
    return <TalentResult onDone={onDone}/>;
  }
  const q = Q[step];
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#F1F5FB,#fff)",padding:"60px 24px"}}>
      <div style={{maxWidth:680,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <span className="logo-text" style={{fontSize:22}}>Talentika<span className="star" style={{fontSize:12}}>✦</span></span>
          <div style={{flex:1}}/>
          <span className="pill">Talent Test</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <div className="progress" style={{flex:1}}><i style={{width:`${((step+1)/Q.length)*100}%`}}/></div>
          <span style={{fontFamily:"var(--display)",fontWeight:600,fontSize:13,color:"var(--blue-700)"}}>{step+1} / {Q.length}</span>
        </div>
        <div className="card card-elevated" style={{padding:36,marginTop:24}}>
          <div style={{fontSize:12,fontFamily:"var(--mono)",color:"var(--gray-500)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:12}}>Pertanyaan {step+1}</div>
          <h2 className="h-h1" style={{marginBottom:24,fontSize:22}}>{q.q}</h2>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {q.opts.map((opt,i)=>(
              <button key={i} onClick={()=>{ setAnswers([...answers,i]); setStep(step+1); }} style={{
                textAlign:"left",padding:"14px 18px",background:"#fff",border:"1.5px solid var(--gray-200)",
                borderRadius:14,cursor:"pointer",fontSize:14,color:"var(--ink)",
                display:"flex",alignItems:"center",gap:12,
                transition:"all .15s var(--ease-snap)",
              }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--blue-500)";e.currentTarget.style.background="var(--blue-50)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--gray-200)";e.currentTarget.style.background="#fff"}}
              >
                <span style={{width:26,height:26,borderRadius:"50%",border:"1.5px solid var(--gray-300)",display:"grid",placeItems:"center",fontSize:11,fontWeight:700,color:"var(--gray-500)",fontFamily:"var(--mono)"}}>{String.fromCharCode(65+i)}</span>
                <span style={{flex:1}}>{opt}</span>
                <I.Arrow size={14} style={{color:"var(--gray-400)"}}/>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TalentResult({ onDone }){
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#F1F5FB,#fff)",padding:"60px 24px",display:"grid",placeItems:"center"}}>
      <div className="card card-elevated page-in" style={{padding:42,maxWidth:560,textAlign:"center",position:"relative",overflow:"hidden"}}>
        <span className="sparkle" style={{top:20,left:30,fontSize:18,color:"var(--yellow)"}}>✦</span>
        <span className="sparkle" style={{top:60,right:40,fontSize:14,color:"var(--blue-500)"}}>✦</span>
        <div style={{fontSize:13,fontFamily:"var(--mono)",color:"var(--blue-600)",letterSpacing:".15em",textTransform:"uppercase",fontWeight:600,marginBottom:10}}>Hasil Talent Test</div>
        <div className="avatar avatar-xl" style={{background:"radial-gradient(circle at 30% 30%, #F0E8FF, #7C3AED)",margin:"0 auto 18px"}}>👨‍🎨</div>
        <h2 className="h-h1" style={{fontSize:28}}>Artistic (Creator)</h2>
        <p style={{color:"var(--gray-600)",marginTop:6,maxWidth:"34ch",marginInline:"auto"}}>Kreatif, ekspresif, dan suka menciptakan sesuatu yang baru.</p>
        <div style={{marginTop:24,display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
          <span className="pill pill-orange">Seni</span>
          <span className="pill pill-orange">Design</span>
          <span className="pill pill-orange">Media</span>
          <span className="pill pill-orange">Kreatif</span>
        </div>
        <button className="btn btn-primary btn-lg" style={{marginTop:30}} onClick={onDone}>Lihat Dashboard <I.Arrow size={16}/></button>
      </div>
    </div>
  );
}

window.AuthScreen = AuthScreen;
window.OnboardingScreen = OnboardingScreen;
window.TalentTest = TalentTest;
