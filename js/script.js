(function(){
"use strict";

/* ---------- touch detection ---------- */
var isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
if(isTouch){ document.documentElement.classList.add("touch"); }
/* Phones keep the side nav as a passive scroll indicator; tablets (wider
   touch screens) get the full nav back, opened by tapping a tick directly. */
var isTabletTouch = isTouch && window.innerWidth > 640;

/* ---------- footer year ---------- */
var yearEl = document.getElementById("year");
if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

/* ---------- build side nav from sections ---------- */
var sections = Array.prototype.slice.call(document.querySelectorAll("main > section[data-num], #hero"));
var track = document.getElementById("side-nav-track");
var sideNav = document.getElementById("side-nav");
var navItems = [];

sections.forEach(function(sec){
  var num = sec.getAttribute("data-num");
  var title = sec.getAttribute("data-title");
  if(!num || !title) return;

  var item = document.createElement("div");
  item.className = "nav-item";
  item.setAttribute("data-target", sec.id);

  var line = document.createElement("span");
  line.className = "nav-line";

  var text = document.createElement("span");
  text.className = "nav-text";
  text.innerHTML = '<span class="nav-num">' + num + '</span><span class="nav-title">' + title + '</span>';

  item.appendChild(line);
  item.appendChild(text);
  track.appendChild(item);

  if(!isTouch || isTabletTouch){
    item.addEventListener("click", function(){
      if(isTabletTouch){
        navItems.forEach(function(n){ n.el.classList.toggle("peek", n.el === item); });
        sideNav.classList.add("hovering");
      }
      sec.scrollIntoView({behavior:"smooth", block:"start"});
    });
  }

  navItems.push({el:item, line:line, section:sec});
});

/* ---------- side nav: reveal the title whose own line the mouse is nearest to (desktop only) ---------- */
var NAV_HIT_RADIUS = 17; /* px — mouse must be within this radius of a tick's own center to reveal it */

if(!isTouch && sideNav){
  sideNav.addEventListener("mouseleave", function(){
    sideNav.classList.remove("hovering");
    navItems.forEach(function(n){ n.el.classList.remove("peek"); });
  });
  sideNav.addEventListener("mousemove", function(e){
    var closest = null, closestDist = Infinity;
    navItems.forEach(function(n){
      var r = n.line.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var dx = e.clientX - cx;
      var dy = e.clientY - cy;
      var d = Math.sqrt(dx * dx + dy * dy);
      if(d < closestDist){ closestDist = d; closest = n; }
    });
    if(closest && closestDist <= NAV_HIT_RADIUS){
      sideNav.classList.add("hovering");
      navItems.forEach(function(n){ n.el.classList.toggle("peek", n === closest); });
    } else {
      sideNav.classList.remove("hovering");
      navItems.forEach(function(n){ n.el.classList.remove("peek"); });
    }
  });
}

/* On phones the side nav stays a passive scroll indicator only (no titles,
   no tap navigation — see the CSS touch+max-width:640px rules). On tablets
   it behaves like desktop's, just opened by tapping a tick instead of
   hovering (handled in the click listener above). The active tick always
   travels up/down with scroll via activeObserver below. */

/* ---------- active section highlight ---------- */
var activeObserver = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    var match = navItems.find(function(n){ return n.section === entry.target; });
    if(!match) return;
    if(entry.isIntersecting){
      navItems.forEach(function(n){ n.el.classList.remove("active"); });
      match.el.classList.add("active");
    }
  });
}, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

sections.forEach(function(sec){ activeObserver.observe(sec); });

/* ---------- scroll reveal ---------- */
var revealObserver = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if(entry.isIntersecting){
      entry.target.classList.add("in-view");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

document.querySelectorAll(".reveal").forEach(function(el){ revealObserver.observe(el); });

/* ---------- language toggle (FR / EN) ---------- */
var i18nEls = Array.prototype.slice.call(document.querySelectorAll("[data-en]"));
i18nEls.forEach(function(el){ el.dataset.fr = el.innerHTML; });

var heroSub = document.querySelector(".hero-sub");

function wrapWords(el){
  if(!el) return;
  var words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(function(w){ return '<span class="hover-word">' + w + '</span>'; }).join(" ");
}

var langToggle = document.getElementById("lang-toggle");

function applyLang(lang){
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("data-lang", lang);
  i18nEls.forEach(function(el){
    el.innerHTML = lang === "en" ? el.dataset.en : el.dataset.fr;
  });
  navItems.forEach(function(n){
    var t = n.el.querySelector(".nav-title");
    if(!t) return;
    t.textContent = lang === "en" ? (n.section.dataset.titleEn || n.section.dataset.title) : n.section.dataset.title;
  });
  wrapWords(heroSub);
  try{ localStorage.setItem("lamina-lang", lang); }catch(e){}
}

var savedLang = "fr";
try{ savedLang = localStorage.getItem("lamina-lang") || "fr"; }catch(e){}
applyLang(savedLang);

if(langToggle){
  langToggle.addEventListener("click", function(){
    var current = document.documentElement.getAttribute("data-lang") || "fr";
    applyLang(current === "fr" ? "en" : "fr");
  });
}

/* ---------- custom cursor ---------- */
var cursor = document.getElementById("cursor-dot");
var contactSection = document.getElementById("contact");
var mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
var curX = mouseX, curY = mouseY;
var hasMouse = false;

if(!isTouch){
  window.addEventListener("mousemove", function(e){
    mouseX = e.clientX; mouseY = e.clientY;
    if(!hasMouse){ curX = mouseX; curY = mouseY; hasMouse = true; }
  }, {passive:true});

  (function raf(){
    curX += (mouseX - curX) * 0.22;
    curY += (mouseY - curY) * 0.22;
    cursor.style.left = curX + "px";
    cursor.style.top = curY + "px";
    requestAnimationFrame(raf);
  })();

  var hoverTargets = "a, .nav-item, .card-shot, .logo-shot, .photo-shot, .faq-item summary, button, .hero-desc, .hover-word";
  document.addEventListener("mouseover", function(e){
    if(e.target.closest && e.target.closest(hoverTargets)){
      cursor.classList.add("cursor-hover");
    }
  });
  document.addEventListener("mouseout", function(e){
    if(e.target.closest && e.target.closest(hoverTargets)){
      cursor.classList.remove("cursor-hover");
    }
  });

  if(contactSection){
    contactSection.addEventListener("mouseenter", function(){ cursor.classList.add("on-dark"); });
    contactSection.addEventListener("mouseleave", function(){ cursor.classList.remove("on-dark"); });
  }
}

/* ---------- top bar & side nav swap to light-on-dark once the dark contact section reaches them ---------- */
var topBar = document.getElementById("top-bar");
if(contactSection){
  var onDarkObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(topBar) topBar.classList.toggle("on-dark", entry.isIntersecting);
      if(sideNav) sideNav.classList.toggle("on-dark", entry.isIntersecting);
    });
  }, { rootMargin: "-64px 0px -92% 0px", threshold: 0 });
  onDarkObserver.observe(contactSection);
}

/* ---------- card tilt on hover ---------- */
if(!isTouch){
  document.querySelectorAll(".card-shot, .logo-shot, .photo-shot").forEach(function(card){
    card.addEventListener("mousemove", function(e){
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = "perspective(700px) rotateX(" + (py*-8) + "deg) rotateY(" + (px*10) + "deg) translateY(-4px)";
    });
    card.addEventListener("mouseleave", function(){
      card.style.transform = "perspective(700px) rotateX(0) rotateY(0) translateY(0)";
    });
  });
}

/* ---------- intro sequence: reveal the real logo, then the dot of the "i" detaches and becomes the cursor ---------- */
var introEl = document.getElementById("intro");
var introLogo = document.getElementById("intro-logo");

/* relative position of the dot above the "i", measured from the wordmark asset */
var DOT_X_FRAC = 0.6275;
var DOT_Y_FRAC = 0.1777;
var DOT_SIZE_FRAC = 0.0394;

var REVEAL_MS = 1100;
var HOLD_MS = 650;
var EXIT_MS = 1050;

function runIntro(){
  function start(){
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        introLogo.classList.add("in");

        setTimeout(function(){
          var r = introLogo.getBoundingClientRect();
          var dotX = r.left + r.width * DOT_X_FRAC;
          var dotY = r.top + r.height * DOT_Y_FRAC;
          var dotSize = Math.max(6, r.width * DOT_SIZE_FRAC);

          cursor.style.width = dotSize + "px";
          cursor.style.height = dotSize + "px";
          cursor.style.left = dotX + "px";
          cursor.style.top = dotY + "px";
          curX = dotX; curY = dotY; mouseX = dotX; mouseY = dotY;

          cursor.classList.add("show");
        }, REVEAL_MS);

        setTimeout(function(){
          introEl.classList.add("fade-out");
          introLogo.classList.add("intro-exit");
          cursor.style.width = "";
          cursor.style.height = "";
          setTimeout(function(){
            introEl.style.display = "none";
            hasMouse = false;
          }, EXIT_MS - 100);
        }, REVEAL_MS + HOLD_MS);
      });
    });
  }

  if(introLogo.complete){ start(); }
  else{ introLogo.addEventListener("load", start, {once:true}); }
}

if(!isTouch){
  runIntro();
} else {
  introEl.classList.add("fade-out");
  setTimeout(function(){ introEl.style.display = "none"; }, 400);
}

})();
