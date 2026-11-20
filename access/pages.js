export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function page(title, body) {
 return `<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · RatelSlop Games</title>
 <style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;background:#11120f;color:#f7f4eb;font:16px/1.5 system-ui}main{width:min(100%,510px);background:#1d2118;border:1px solid #3c4633;padding:clamp(24px,5vw,42px);border-radius:18px}strong,a{color:#d8ea85}h1{line-height:1.15}h2{margin-top:34px;font-size:21px}label{display:block;margin-bottom:8px}input,button{font:inherit;padding:12px;border:1px solid #667450;border-radius:8px}input{width:100%;background:#11150f}button{margin-top:12px;background:#d8ea85;color:#19220e;font-weight:700;cursor:pointer}button+button{margin-left:8px;background:#3b302b;color:#ffe9df}.status,small{color:#d1d8c1}</style>
 <main><strong>RatelSlop Games</strong><h1>${escape(title)}</h1>${body}</main></html>`;
}

export function gate(message = '') {
 return page('Toegang tot de gamehub',`
 ${message ? '<p role="status" class="status">'+escape(message)+'</p>' : ''}
 <form method="post" action="/access/login"><label for="code">Toegangscode</label><input id="code" name="code" required maxlength="40" autocomplete="one-time-code"><button>Open de gamehub</button></form>
 <h2>Vraag toegang aan</h2><p>Na goedkeuring krijg je een code die één maand geldig is.</p>
 <form method="post" action="/access/request"><label for="email">E-mailadres</label><input id="email" name="email" type="email" required maxlength="254" autocomplete="email"><button>Toegang aanvragen</button></form>
 <p><small>Je e-mailadres wordt gedeeld met de twee beheerders om je aanvraag te beoordelen. <a href="/privacy">Privacyverklaring</a>.</small></p>`);
}
