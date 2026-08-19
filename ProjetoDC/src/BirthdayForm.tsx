import { useState, useEffect, useRef, useMemo, type ChangeEvent, type FormEvent } from 'react';
import rccCrest from './assets/RCC.png';
import './style.css';

type TipoMensagem = 'texto' | 'imagem';
type NickStatus   = 'idle' | 'checking' | 'valid' | 'invalid';
type SendStatus   = 'idle' | 'sending' | 'success' | 'error';

interface HabboUser { name: string; }

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyNmov2V4_CqMVRPo9J3ai6gLNXnlRuyFTAth6JjDeJzl6EKFjwkQXYj9_ElEpxc4XY/exec';

function avatarFaceUrl(nick: string) {
  return `https://www.habbo.com.br/habbo-imaging/avatarimage?user=${encodeURIComponent(nick)}&action=std&direction=2&head_direction=3&gesture=sml&headonly=1&size=s`;
}

/* Partículas flutuantes no header */
function Particles() {
  const items = useMemo(() => (
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 1.5,
      dur: 5 + Math.random() * 8,
      delay: Math.random() * 6,
      opacity: 0.15 + Math.random() * 0.4,
    }))
  ), []);

  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', overflow: 'visible',
      }}
    >
      {items.map(p => (
        <circle key={p.id}
          cx={`${p.x}%`} cy={`${p.y}%`}
          r={p.size}
          fill="var(--cyan)"
          opacity={p.opacity}
        >
          <animateTransform attributeName="transform" type="translate"
            values={`0,0; ${(Math.random()-.5)*20},${-20 - Math.random()*30}; 0,0`}
            dur={`${p.dur}s`} begin={`${p.delay}s`}
            repeatCount="indefinite" calcMode="spline"
            keySplines="0.45 0 0.55 1; 0.45 0 0.55 1" />
          <animate attributeName="opacity"
            values={`${p.opacity};0;${p.opacity}`}
            dur={`${p.dur}s`} begin={`${p.delay}s`}
            repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

export default function BirthdayForm() {
  const [nick,       setNick]       = useState('');
  const [nickStatus, setNickStatus] = useState<NickStatus>('idle');
  const [habboUser,  setHabboUser]  = useState<HabboUser | null>(null);
  const [tipo,       setTipo]       = useState<TipoMensagem>('texto');
  const [mensagem,   setMensagem]   = useState('');
  const [imagemUrl,  setImagemUrl]  = useState('');
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const t = nick.trim();
    if (!t) { setNickStatus('idle'); setHabboUser(null); return; }
    setNickStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`https://www.habbo.com.br/api/public/users?name=${encodeURIComponent(t)}`);
        if (!r.ok) { setNickStatus('invalid'); setHabboUser(null); return; }
        const d = await r.json();
        setHabboUser({ name: d.name });
        setNickStatus('valid');
      } catch { setNickStatus('invalid'); setHabboUser(null); }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [nick]);

  const mensagemOk = tipo === 'texto' ? mensagem.trim().length > 0 : imagemUrl.trim().length > 0;
  const podeEnviar = nickStatus === 'valid' && mensagemOk && sendStatus !== 'sending';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!podeEnviar || !habboUser) return;
    setSendStatus('sending');
    const payload = {
      nick: habboUser.name, tipo,
      mensagem:  tipo === 'texto'  ? mensagem.trim()  : '',
      imagemUrl: tipo === 'imagem' ? imagemUrl.trim() : '',
      enviadoEm: new Date().toISOString(),
    };
    try {
      if (SCRIPT_URL) {
        const r = await fetch(SCRIPT_URL, {
          method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error();
      } else {
        await new Promise(res => setTimeout(res, 900));
      }
      setSendStatus('success');
    } catch { setSendStatus('error'); }
  }

  function handleReset() {
    setNick(''); setNickStatus('idle'); setHabboUser(null);
    setTipo('texto'); setMensagem(''); setImagemUrl(''); setSendStatus('idle');
  }

  if (sendStatus === 'success') {
    return (
      <div className="stage">
        <main className="page">
          <div className="card">
            <div className="success-check">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="subtitle">Mensagem enviada</p>
            <h1 className="title success-title">Obrigado!</h1>
            <p className="success-text">
              Sua mensagem de aniversário foi registrada com sucesso.
            </p>
            <button type="button" className="submit-btn" onClick={handleReset}>
              Enviar outra mensagem
            </button>
            <div className="footer">
              <p className="footer-org">Gabinete de Tecnologia e Inovação — GTI</p>
              <p className="footer-dev">desenvolvido por hiagocarlos</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="stage">
      <main className="page">

        {/* ─── Header com partículas ─── */}
        <header className="header" style={{ position: 'relative' }}>
          <Particles />

          <div className="crest-ring">
            <img className="crest" src={rccCrest} alt="Emblema RCC" />
          </div>

          <p className="eyebrow">◆</p>
          <h1 className="title">Evento de Aniversário</h1>
          <div className="title-flourish"><span>◆</span></div>
        </header>

        {/* ─── Formulário ─── */}
        <form className="card" noValidate onSubmit={handleSubmit}>

          {/* Nick */}
          <div className="field">
            <label htmlFor="nick">Nick no Habbo <span className="required">*</span></label>
            <input
              type="text" id="nick" autoComplete="off"
              placeholder="Seu nick no Habbo"
              value={nick}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNick(e.target.value)}
            />
            {nickStatus === 'checking' && (
              <div className="nick-status checking">
                <span className="spinner" /> Verificando nick...
              </div>
            )}
            {nickStatus === 'invalid' && (
              <div className="nick-status invalid">Nick não encontrado no Habbo Hotel</div>
            )}
            {nickStatus === 'valid' && habboUser && (
              <div className="nick-status valid">
                <span className="status-left">
                  <img className="avatar-face" src={avatarFaceUrl(habboUser.name)}
                    alt={`Avatar de ${habboUser.name}`} />
                  Nick verificado
                </span>
                <span className="status-nick">{habboUser.name}</span>
              </div>
            )}
          </div>

          <div className="seal-divider" role="separator" />

          {/* Tipo */}
          <div className="field">
            <label>Tipo de mensagem</label>
            <div className="toggle-group" role="tablist">
              {(['texto', 'imagem'] as TipoMensagem[]).map(t => (
                <button key={t} type="button"
                  className={`toggle-btn ${tipo === t ? 'active' : ''}`}
                  role="tab" aria-selected={tipo === t}
                  onClick={() => setTipo(t)}
                >
                  {t === 'texto' ? 'Texto' : 'Imagem'}
                </button>
              ))}
            </div>
          </div>

          {tipo === 'texto' && (
            <div className="field">
              <label htmlFor="mensagem">Mensagem de parabéns <span className="required">*</span></label>
              <textarea
                id="mensagem" maxLength={500}
                placeholder="Escreva sua mensagem de aniversário"
                value={mensagem}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMensagem(e.target.value)}
              />
              <div className="char-count">{mensagem.length} / 500</div>
            </div>
          )}

          {tipo === 'imagem' && (
            <div className="field">
              <label htmlFor="imagem-url">Link da imagem <span className="required">*</span></label>
              <input
                type="url" id="imagem-url"
                placeholder="https://i.imgur.com/..."
                value={imagemUrl}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setImagemUrl(e.target.value)}
              />
              <p className="hint">Hospede no Imgur, PostImages ou similar e cole o link direto.</p>
            </div>
          )}

          <div className="seal-divider" role="separator" />

          <button type="submit" className="submit-btn" disabled={!podeEnviar}>
            {sendStatus === 'sending'
              ? <span className="btn-loading"><span className="spinner" /> Enviando...</span>
              : 'Enviar Mensagem'}
          </button>

          {sendStatus === 'error' && (
            <div className="form-feedback error">
              Não foi possível enviar agora. Tenta de novo em instantes.
            </div>
          )}

          <p className="required-note">
            <span className="required">*</span> Campos obrigatórios &nbsp;·&nbsp; Envios são privados
          </p>

          <div className="footer">
            <p className="footer-org">Gabinete de Tecnologia e Inovação — GTI</p>
            <p className="footer-dev">desenvolvido por hiagocarlos</p>
          </div>
        </form>

      </main>
    </div>
  );
}
