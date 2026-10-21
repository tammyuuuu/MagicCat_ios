// Updates never reload a running draw or modify local user records.
(() => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  let requestedUpdate=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(requestedUpdate)location.reload();});
  function offerUpdate(registration){
    if(!registration.waiting||document.getElementById('pwaUpdateButton'))return;
    const button=document.createElement('button');button.id='pwaUpdateButton';button.type='button';button.textContent='新版已就绪 · 更新页面';
    button.style.cssText='position:fixed;bottom:calc(84px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:30000;max-width:90vw;padding:12px 18px;border:1px solid #c5a3dc;border-radius:24px;background:#28163d;color:#f5e8ff;font:14px/1.5 system-ui;box-shadow:0 4px 20px #0004;';
    button.onclick=()=>{if(!confirm('更新会重新打开页面，请先保存当前布置或尚未保存的内容。继续更新？'))return;const waiting=registration.waiting;requestedUpdate=true;button.disabled=true;button.textContent='正在更新…';if(!waiting){location.reload();return;}waiting.postMessage({type:'ACTIVATE_UPDATE'});};document.body.append(button);
  }
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
      offerUpdate(registration);
      registration.addEventListener('updatefound',()=>{const installing=registration.installing;installing?.addEventListener('statechange',()=>{if(installing.state==='installed')offerUpdate(registration);});});
      let lastUpdateCheck = Date.now();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          offerUpdate(registration);
          if (Date.now() - lastUpdateCheck < 300000) return;
          lastUpdateCheck = Date.now();
          registration.update().catch(() => {});
        }
      });
    } catch (error) { console.warn('离线支持暂时不可用', error); }
  });
})();
