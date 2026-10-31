/* Cookie-Banner (Opt-in): gtag.js lädt erst nach «Akzeptieren».
   Die gtag()-Befehle im <head> warten bis dahin im dataLayer.
   Wahl im localStorage, «Cookie-Einstellungen» in der Fusszeile öffnet den Banner wieder. */
(function () {
   var KEY = 'padelcamp-cookies';
   var GTAG_ID = 'AW-17246904153';

   function lies() {
      try {
         var v = localStorage.getItem(KEY);
         if (v) return v;
         /* Wahl aus dem alten (wirkungslosen) Banner übernehmen */
         var alt = localStorage.getItem('cookieConsent');
         return alt === 'accepted' ? 'ja' : alt === 'declined' ? 'nein' : null;
      } catch (e) { return null; }
   }
   function speichere(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

   var geladen = false;
   function ladeGtag() {
      if (geladen) return;
      geladen = true;
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GTAG_ID;
      document.head.appendChild(s);
   }

   var css = '' +
      '.pc-cookie{position:fixed;z-index:2000;left:24px;bottom:24px;max-width:420px;background:#fff;border:1px solid #e3ded5;' +
      'border-radius:16px;box-shadow:0 10px 30px rgba(26,42,54,.15);padding:20px 22px;font-family:var(--body-font,inherit);color:var(--black-color,#1A2A36);overflow:hidden}' +
      '.pc-cookie::before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:var(--primary-color,#bdec00)}' +
      '.pc-cookie h6{margin:0 0 6px;text-transform:uppercase;letter-spacing:.06em;font-size:13px;color:var(--dark-orange,#0667a6)}' +
      '.pc-cookie p{margin:0 0 14px;font-size:14px;line-height:1.5;color:var(--light-black-color,#4E4C49)}' +
      '.pc-cookie p a{text-decoration:underline;color:inherit}' +
      '.pc-cookie .pc-knoepfe{display:flex;gap:10px}' +
      '.pc-cookie button{flex:1;border-radius:50px;padding:10px 14px;font-family:"Montserrat",sans-serif;font-size:14px;font-weight:500;cursor:pointer;border:1px solid var(--dark-orange,#0667a6)}' +
      '.pc-cookie .pc-nein{background:transparent;color:var(--dark-orange,#0667a6)}' +
      '.pc-cookie .pc-ja{background:var(--dark-orange,#0667a6);color:#fff}' +
      '@media (max-width:575px){.pc-cookie{left:12px;right:auto;bottom:12px;width:calc(100vw - 24px);max-width:none;box-sizing:border-box}}';

   function zeige() {
      if (document.querySelector('.pc-cookie')) return;
      if (!document.getElementById('pc-cookie-css')) {
         var st = document.createElement('style');
         st.id = 'pc-cookie-css';
         st.textContent = css;
         document.head.appendChild(st);
      }
      var box = document.createElement('div');
      box.className = 'pc-cookie';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-label', 'Cookies');
      box.innerHTML = '<h6>Cookies</h6>' +
         '<p>Wir verwenden Cookies, um die Nutzung unserer Website auszuwerten und unser Angebot zu verbessern. Mehr in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>' +
         '<div class="pc-knoepfe"><button type="button" class="pc-nein">Ablehnen</button><button type="button" class="pc-ja">Akzeptieren</button></div>';
      box.querySelector('.pc-nein').onclick = function () { var vorher = lies(); speichere('nein'); box.remove(); if (vorher === 'ja') location.reload(); };
      box.querySelector('.pc-ja').onclick = function () { speichere('ja'); box.remove(); ladeGtag(); };
      document.body.appendChild(box);
   }

   function start() {
      var wahl = lies();
      if (wahl === 'ja') ladeGtag();
      else if (wahl !== 'nein') zeige();
      document.addEventListener('click', function (e) {
         var a = e.target.closest && e.target.closest('[data-cookie-einstellungen]');
         if (a) { e.preventDefault(); zeige(); }
      });
   }

   if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
   else start();
})();
