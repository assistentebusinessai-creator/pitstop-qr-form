import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// cognome/modello/anno/km rimangono nello stato ma non vengono mostrati
// → Supabase riceve sempre tutti i campi, nessuna colonna si rompe
const EMPTY = { nome:"", cognome:"", telefono:"", marca:"", modello:"", anno:"", km:"", targa:"", problema:"" };

function fmt(ts) {
  return new Date(ts).toLocaleString("it-IT", {
    day:"2-digit", month:"2-digit", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #ffff;
    --surface: #1c1c1c;
    --border: #2e2e2e;
    --accent: #e8431a;
    --text: #f2ede6;
    --muted: #7a7a7a;
    --green: #43e88a;
  }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
  .app { max-width: 480px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }

  /* NAV */
  .nav {
    position: sticky; top: 0; z-index: 20;
    background: var(--surface);
    border-bottom: 3px solid var(--accent);
    display: flex; align-items: stretch;
  }
  .nav-brand {
    padding: 12px 16px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 3px;
    color: var(--accent);
    border-right: 1px solid var(--border);
    display: flex; align-items: center; gap: 8px;
  }
  .nav-tabs { display: flex; flex: 1; }
  .nav-tab {
    flex: 1; background: transparent; border: none;
    color: var(--muted); font-family: 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 600; letter-spacing: 1px;
    text-transform: uppercase; cursor: pointer;
    padding: 14px 4px; border-bottom: 3px solid transparent;
    margin-bottom: -3px; transition: all .2s;
  }
  .nav-tab.active { color: var(--text); border-bottom-color: var(--accent); }
  .badge {
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--accent); color: #fff;
    width: 18px; height: 18px; border-radius: 50%;
    font-size: 10px; font-weight: 700; margin-left: 4px;
  }

  /* QR */
  .qr-page { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 24px; gap: 28px; }
  .qr-frame {
    background: #fff; border-radius: 20px;
    padding: 24px 24px 18px;
    box-shadow: 0 0 80px rgba(232,67,26,.3);
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .qr-frame img { width: 240px; height: 240px; border-radius: 6px; }
  .qr-brand { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #111; letter-spacing: 3px; }
  .qr-hint-box {
    background: var(--surface); border: 1px solid var(--border);
    border-left: 4px solid var(--accent);
    border-radius: 10px; padding: 18px 20px;
    font-size: 14px; line-height: 1.7; color: var(--muted);
    max-width: 340px;
  }
  .qr-hint-box strong { color: var(--text); display: block; margin-bottom: 4px; font-size: 15px; }
  .step { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; }
  .step:last-child { margin-bottom: 0; }
  .step-num {
    background: var(--accent); color: #fff; border-radius: 50%;
    min-width: 22px; height: 22px; display: flex; align-items: center;
    justify-content: center; font-size: 11px; font-weight: 700; margin-top: 1px;
  }

  /* FORM */
  .form-page { flex: 1; padding: 20px 20px 40px; overflow-y: auto; }
  .page-title { font-family: 'Bebas Neue', sans-serif; font-size: 30px; color: var(--accent); letter-spacing: 2px; }
  .page-sub { font-size: 12px; color: var(--muted); margin-top: 2px; margin-bottom: 22px; }
  .section-head {
    font-size: 10px; text-transform: uppercase; letter-spacing: 2px;
    color: var(--accent); font-weight: 700; margin: 20px 0 12px;
    display: flex; align-items: center; gap: 10px;
  }
  .section-head::after { content:''; flex:1; height:1px; background: var(--border); }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .field { margin-bottom: 12px; }
  .field label { font-size: 11px; color: var(--muted); font-weight: 600; letter-spacing: .5px; display: block; margin-bottom: 6px; }
  .field input, .field select, .field textarea {
    width: 100%; background: #242424;
    border: 1.5px solid #3a3a3a; border-radius: 12px;
    color: #ffffff; padding: 16px 16px;
    font-family: 'DM Sans', sans-serif; font-size: 15px;
    outline: none; transition: border-color .18s; background .18s; -webkit-appearance: none;
  }
  .field input::placeholder, .field textarea::placeholder { color: #8f8f8f; }
  .field input:focus, .field select:focus, .field textarea:focus { border-color: var(--accent); }
  .field.err input, .field.err select, .field.err textarea { border-color: #e53935; }
  .errmsg { font-size: 11px; color: #e53935; margin-top: 4px; }
  .field textarea { resize: none; height: 96px; }
  select option { background: #1c1c1c; }
  .submit-btn {
    margin-top: 28px; width: 100%;
    background: var(--accent); color: #fff; border: none;
    border-radius: 12px; padding: 17px;
    font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 2px;
    cursor: pointer; transition: opacity .2s;
  }
  .submit-btn:hover { opacity: .88; }
  .submit-btn:active { transform: scale(.98); }

  /* SUCCESS */
  .success-page { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 36px 24px; gap: 20px; }
  .success-icon { font-size: 72px; animation: pop .4s ease; }
  @keyframes pop { 0%{transform:scale(0)} 70%{transform:scale(1.1)} 100%{transform:scale(1)} }
  .success-title { font-family: 'Bebas Neue', sans-serif; font-size: 34px; letter-spacing: 2px; color: var(--green); }
  .success-sub { font-size: 13px; color: var(--muted); text-align: center; }
  .recap-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 20px; width: 100%;
  }
  .recap-row { display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--border); }
  .recap-row:last-child { border-bottom: none; }
  .rk { font-size: 11px; color: var(--muted); font-weight: 600; min-width: 80px; }
  .rv { font-size: 14px; color: var(--text); text-align: right; font-weight: 500; flex: 1; }
  .problema-val { font-style: italic; font-size: 13px; }
  .btn-nuovo {
    width: 100%; background: transparent; border: 2px solid var(--accent);
    color: var(--accent); border-radius: 12px; padding: 15px;
    font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 2px;
    cursor: pointer; transition: all .2s;
  }
  .btn-nuovo:hover { background: var(--accent); color: #fff; }

  /* BOZZE */
  .history-page { flex: 1; padding: 20px; overflow-y: auto; }
  .history-empty { text-align: center; padding: 64px 20px; color: var(--muted); }
  .history-empty .ei { font-size: 52px; margin-bottom: 12px; }
  .card {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 12px; padding: 16px; margin-bottom: 12px;
    cursor: pointer; transition: border-color .2s;
  }
  .card:hover, .card.open { border-color: var(--accent); }
  .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .card-name { font-size: 16px; font-weight: 600; }
  .card-car { font-size: 13px; color: var(--muted); margin-top: 2px; }
  .card-date { font-size: 11px; color: var(--muted); }
  .draft-badge {
    display: inline-block; background: rgba(232,67,26,.15); color: var(--accent);
    font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 20px;
    border: 1px solid rgba(232,67,26,.3); margin-top: 6px; letter-spacing: .5px;
  }
  .card-detail { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
  .drow { display: flex; gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
  .drow:last-of-type { border-bottom: none; }
  .dk { color: var(--muted); font-size: 11px; font-weight: 600; min-width: 90px; }
  .dv { color: var(--text); font-weight: 500; }
  .problema-box {
    background: #0d0d0d; border-left: 3px solid var(--accent);
    border-radius: 8px; padding: 10px 14px; margin-top: 10px;
    font-size: 13px; color: var(--text); line-height: 1.6;
  }
  .del-btn {
    margin-top: 12px; background: transparent; border: 1px solid #e53935;
    color: #e53935; border-radius: 8px; padding: 8px 16px;
    font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all .2s;
  }
  .del-btn:hover { background: #e53935; color: #fff; }
`;

export default function App() {
  const [tab, setTab] = useState("form");
  const [screen, setScreen] = useState("form");
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [subs, setSubs] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [qrSrc, setQrSrc] = useState("");
  const [showExit, setShowExit] = useState(false);

  useEffect(() => {
    const url = window.location.href.split("?")[0];
    setQrSrc(`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(url)}&color=111111&bgcolor=ffffff&margin=14`);
    loadSubs();
  }, []);

  async function loadSubs() {
    try {
      const res = await window.storage.list("req:", true);
      if (!res?.keys?.length) { setSubs([]); return; }
      const items = await Promise.all(res.keys.map(async k => {
        try { const r = await window.storage.get(k, true); return r ? JSON.parse(r.value) : null; }
        catch { return null; }
      }));
      setSubs(items.filter(Boolean).sort((a, b) => b.ts - a.ts));
    } catch { setSubs([]); }
  }

  function field(k, v) { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); }

  // ── VALIDAZIONE SEMPLIFICATA (solo i 5 campi visibili) ───────────────────
  function validate() {
    const e = {};
    if (!form.nome.trim())     e.nome     = "Obbligatorio";
    if (!form.telefono.trim()) e.telefono = "Obbligatorio";
    if (!form.marca.trim())    e.marca    = "Obbligatorio";
    if (!form.targa.trim())    e.targa    = "Obbligatorio";
    if (!form.problema.trim()) e.problema = "Descrivi il problema";
    setErrors(e);
    return !Object.keys(e).length;
  }

  // ── SAVE: identico all'originale, Supabase non cambia ────────────────────
  async function save() {
    if (!validate()) return;
    const ts = Date.now();
    const entry = { ...form, ts, id: `req:${ts}` };
    try {
      const { error } = await supabase
        .from("preventivi_bozze")
        .insert([{
          nome:     form.nome,
          cognome:  form.cognome,   // stringa vuota, colonna intatta
          telefono: form.telefono,
          marca:    form.marca,
          modello:  form.modello,   // stringa vuota
          anno:     form.anno,      // stringa vuota
          km:       form.km,        // stringa vuota
          targa:    form.targa,
          problema: form.problema,
        }]);
      if (error) { console.error(error); return; }
    } catch (err) { console.error(err); return; }
    setLastSaved(entry);
    setScreen("success");
    loadSubs();
  }

  async function del(id, e) {
    e.stopPropagation();
    try { await window.storage.delete(id, true); } catch {}
    setSubs(s => s.filter(x => x.id !== id));
    if (expanded === id) setExpanded(null);
  }

  // ── VIEWS ─────────────────────────────────────────────────────────────────
  const QrPage = () => (
    <div className="qr-page">
      <div className="qr-frame">
        {qrSrc && <img src={qrSrc} alt="QR" />}
        <div className="qr-brand">🔧 OFFICINA PREVENTIVI</div>
      </div>
      <div className="qr-hint-box">
        <strong>Come funziona</strong>
        <div className="step"><div className="step-num">1</div><div>Inquadra il QR con il tuo telefono</div></div>
        <div className="step"><div className="step-num">2</div><div>Si apre il form — compila i dati mentre parli col cliente</div></div>
        <div className="step"><div className="step-num">3</div><div>Premi <strong style={{color:"var(--accent)"}}>Salva bozza</strong> — i dati restano in archivio</div></div>
        <div className="step"><div className="step-num">4</div><div>Vai su <strong style={{color:"var(--text)"}}>Bozze</strong> e copia i dati nella tua app preventivi</div></div>
      </div>
    </div>
  );

  const FormPage = () => screen === "success" && lastSaved ? (
    <div className="success-page">
      <div className="success-icon">✅</div>
      <div className="success-title">BOZZA SALVATA</div>
      <div className="success-sub">I dati sono pronti nella sezione Bozze</div>
      <div className="recap-card">
        <div className="recap-row"><span className="rk">Cliente</span><span className="rv">{lastSaved.nome}</span></div>
        <div className="recap-row"><span className="rk">Telefono</span><span className="rv">{lastSaved.telefono}</span></div>
        <div className="recap-row"><span className="rk">Veicolo</span><span className="rv">{lastSaved.marca} · {lastSaved.targa}</span></div>
        <div className="recap-row"><span className="rk">Problema</span><span className="rv problema-val">{lastSaved.problema}</span></div>
      </div>
      <button className="btn-nuovo" onClick={() => { setForm({...EMPTY}); setErrors({}); setScreen("form"); }}>
        + NUOVO CLIENTE
      </button>
    </div>
  ) : (
    <div className="form-page">
      <div className="page-title">NUOVO CLIENTE</div>
      <div className="page-sub">Compila mentre parli — ci vogliono 30 secondi</div>

      {/* ── NOME ── */}
      <div className="section-head">👤 Anagrafica</div>
      <div className={`field${errors.nome ? " err" : ""}`}>
        <label>NOME</label>
        <input type="text" placeholder="Mario Rossi" value={form.nome} onChange={e => field("nome", e.target.value)} />
        {errors.nome && <div className="errmsg">{errors.nome}</div>}
      </div>

      <div className={`field${errors.telefono ? " err" : ""}`}>
        <label>TELEFONO</label>
        <input type="tel" placeholder="333 123 4567" value={form.telefono} onChange={e => field("telefono", e.target.value)} />
        {errors.telefono && <div className="errmsg">{errors.telefono}</div>}
      </div>

      {/* ── VEICOLO + TARGA ── */}
      <div className="section-head">🚗 Veicolo</div>
      <div className="grid2">
        <div className={`field${errors.marca ? " err" : ""}`}>
          <label>VEICOLO</label>
          <input
            type="text"
            placeholder="Es: Fiat Panda"
            value={form.marca}
            onChange={e => field("marca", e.target.value)}
          />
          {errors.marca && <div className="errmsg">{errors.marca}</div>}
        </div>
        <div className={`field${errors.targa ? " err" : ""}`}>
          <label>TARGA</label>
          <input
            type="text"
            placeholder="AA123BB"
            value={form.targa}
            onChange={e => field("targa", e.target.value.toUpperCase())}
            maxLength={7}
            style={{textTransform:"uppercase", letterSpacing:2}}
          />
          {errors.targa && <div className="errmsg">{errors.targa}</div>}
        </div>
      </div>

      {/* ── PROBLEMA ── */}
      <div className="section-head">🔩 Problema</div>
      <div className={`field${errors.problema ? " err" : ""}`}>
        <label>DESCRIZIONE</label>
        <textarea
          placeholder="Es: freni che cigolano, spia motore accesa, tagliando, revisione…"
          value={form.problema}
          onChange={e => field("problema", e.target.value)}
        />
        {errors.problema && <div className="errmsg">{errors.problema}</div>}
      </div>

      <button className="submit-btn" onClick={save}>SALVA BOZZA PREVENTIVO →</button>
    </div>
  );

  const HistoryPage = () => (
    <div className="history-page">
      <div className="page-title">BOZZE SALVATE</div>
      <div className="page-sub" style={{marginBottom:20}}>{subs.length} richieste in archivio</div>
      {subs.length === 0 ? (
        <div className="history-empty">
          <div className="ei">📋</div>
          <div>Nessuna bozza ancora.</div>
          <div style={{fontSize:12, marginTop:4}}>Vai su Form e compila il primo cliente.</div>
        </div>
      ) : subs.map(s => (
        <div key={s.id} className={`card${expanded === s.id ? " open" : ""}`} onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
          <div className="card-top">
            <div>
              <div className="card-name">{s.nome}</div>
              <div className="card-car">🚗 {s.marca} · {s.targa}</div>
              <div className="draft-badge">BOZZA</div>
            </div>
            <div className="card-date">{fmt(s.ts)}</div>
          </div>
          {expanded === s.id && (
            <div className="card-detail">
              <div className="drow"><span className="dk">Telefono</span><span className="dv">{s.telefono}</span></div>
              <div className="drow"><span className="dk">Veicolo</span><span className="dv">{s.marca}</span></div>
              <div className="drow"><span className="dk">Targa</span><span className="dv">{s.targa}</span></div>
              <div className="problema-box">{s.problema}</div>
              <button className="del-btn" onClick={e => del(s.id, e)}>🗑 Elimina</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <nav className="nav">
          <div className="nav-brand">
            🔧 DS84
            <button
              style={{
                position: "absolute", right: 16, top: 12,
                background: "transparent", border: "none",
                color: "white", fontSize: "22px", cursor: "pointer"
              }}
              onClick={() => setShowExit(true)}
            >
              ✕
            </button>
          </div>
          <div className="nav-tabs">
            {[["form","Form"]].map(([k,l]) => (
              <button key={k} className={`nav-tab${tab===k?" active":""}`}
                onClick={() => { setTab(k); if(k==="history") loadSubs(); }}>
                {l}{k==="history" && subs.length > 0 && <span className="badge">{subs.length}</span>}
              </button>
            ))}
          </div>
        </nav>
        {tab === "qr"      && <QrPage />}
        {tab === "form"    && FormPage()}
        {tab === "history" && <HistoryPage />}
      </div>

      {showExit && (
        <div style={{
          position:"fixed", top:0, left:0, width:"100%", height:"100%",
          background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center",
          justifyContent:"center", zIndex:999, padding:20
        }}>
          <div style={{
            background:"#ffffff", padding:"26px 22px", borderRadius:18,
            textAlign:"center", width:"100%", maxWidth:340,
            boxShadow:"0 18px 40px rgba(0,0,0,0.35)"
          }}>
            <h3 style={{margin:"0 0 10px", color:"#111", fontSize:22, fontWeight:800}}>
              Vuoi uscire dal form?
            </h3>
            <p style={{margin:"0 0 24px", color:"#555", fontSize:15, lineHeight:1.4}}>
              Se continui tutti i dati inseriti verranno persi.
            </p>
            <div style={{display:"flex", gap:12, justifyContent:"center"}}>
              <button
                onClick={() => setShowExit(false)}
                style={{
                  flex:1, padding:"12px 14px", borderRadius:12,
                  border:"1px solid #ccc", background:"#f3f3f3",
                  color:"#111", fontSize:16, fontWeight:700
                }}
              >
                Continua modifica
              </button>
              <button
                onClick={() => {
                  if (window.matchMedia('(display-mode: standalone)').matches) {
                    setForm({ ...EMPTY });
                    setShowExit(false);
                    window.scrollTo(0, 0);
                  } else {
                    window.history.back();
                  }
                }}
                style={{
                  flex:1, padding:"12px 14px", borderRadius:12,
                  border:"none", background:"#e53935",
                  color:"#fff", fontSize:16, fontWeight:800
                }}
              >
                Annulla dati
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
