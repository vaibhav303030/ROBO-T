// script.js (adds theme toggle with persistence)
(function(){
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');

  // Theme: load saved, default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if(savedTheme === 'light'){ root.setAttribute('data-theme','light'); themeToggle.textContent='☀️'; }
  else { root.removeAttribute('data-theme'); themeToggle.textContent='🌙'; }
  themeToggle?.addEventListener('click',()=>{
    const isLight = root.getAttribute('data-theme') === 'light';
    if(isLight){ root.removeAttribute('data-theme'); localStorage.setItem('theme','dark'); themeToggle.textContent='🌙'; }
    else { root.setAttribute('data-theme','light'); localStorage.setItem('theme','light'); themeToggle.textContent='☀️'; }
  });

  // Mobile menu
  menuToggle?.addEventListener('click',()=>{
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

  document.getElementById('year').textContent = new Date().getFullYear();

  // Resize-aware canvases
  function sizeCanvas(canvas, ratio=21/12){
    const parent = canvas.parentElement;
    const w = parent.clientWidth;
    const h = Math.round(w / ratio);
    canvas.width = w;
    canvas.height = h;
  }
  const followCanvas = document.getElementById('followCanvas');
  const tempChart = document.getElementById('tempChart');
  const resizeAll = ()=>{ sizeCanvas(followCanvas, 21/12); sizeCanvas(tempChart, 21/10); };
  window.addEventListener('resize', debounce(resizeAll, 100));
  resizeAll();

  // Auto-follow simulator
  const fctx = followCanvas.getContext('2d');
  const obstacleInput = document.getElementById('obstacleCount');
  const resetBtn = document.getElementById('resetFollow');
  let leader = { x: followCanvas.width*0.8, y: followCanvas.height*0.5 };
  let bot = { x: followCanvas.width*0.2, y: followCanvas.height*0.5, vx:0, vy:0 };
  let obstacles = [];
  function spawnObstacles(count){
    const W = followCanvas.width, H = followCanvas.height;
    obstacles = Array.from({length: count}, () => ({
      x: 30 + Math.random()*(W-60),
      y: 24 + Math.random()*(H-48),
      r: 6 + Math.random()*14
    }));
  }
  function reset(){
    bot = { x: followCanvas.width*0.2, y: followCanvas.height*0.5, vx:0, vy:0 };
    leader = { x: followCanvas.width*0.8, y: followCanvas.height*0.5 };
    spawnObstacles(+obstacleInput.value);
  }
  function avoid(ax, ay){
    let rx=0, ry=0;
    for(const o of obstacles){
      const dx = ax - o.x, dy = ay - o.y, d = Math.hypot(dx,dy), safe = o.r + 16;
      if(d < safe && d>0){ rx += (dx/d)*(safe-d)*0.9; ry += (dy/d)*(safe-d)*0.9; }
    }
    return {x: ax+rx, y: ay+ry};
  }
  function step(){
    const W = followCanvas.width, H = followCanvas.height;
    leader.x = Math.max(8, Math.min(W-8, leader.x));
    leader.y = Math.max(8, Math.min(H-8, leader.y));
    const target = avoid(leader.x, leader.y);
    const dx = target.x - bot.x, dy = target.y - bot.y;
    bot.vx += dx*0.002; bot.vy += dy*0.002;
    bot.vx *= 0.985; bot.vy *= 0.985;
    bot.x += bot.vx; bot.y += bot.vy;

    fctx.clearRect(0,0,W,H);
    fctx.fillStyle = '#ef4444';
    for(const o of obstacles){ fctx.beginPath(); fctx.arc(o.x,o.y,o.r,0,Math.PI*2); fctx.fill(); }
    fctx.fillStyle = '#22d3ee'; fctx.beginPath(); fctx.arc(leader.x,leader.y,7,0,Math.PI*2); fctx.fill();
    fctx.fillStyle = '#60a5fa'; fctx.beginPath(); fctx.arc(bot.x,bot.y,9,0,Math.PI*2); fctx.fill();

    requestAnimationFrame(step);
  }
  followCanvas.addEventListener('mousemove',e=>{
    const r = followCanvas.getBoundingClientRect();
    leader.x = (e.clientX - r.left) * (followCanvas.width / r.width);
    leader.y = (e.clientY - r.top) * (followCanvas.height / r.height);
  });
  obstacleInput.addEventListener('input',()=>spawnObstacles(+obstacleInput.value));
  resetBtn.addEventListener('click',reset);
  window.addEventListener('resize', debounce(reset, 120));
  reset(); step();

  // Smart lock (frontend demo)
  const pinInput = document.getElementById('pin');
  const setPinBtn = document.getElementById('setPin');
  const unlockBtn = document.getElementById('unlock');
  const lockStatus = document.getElementById('lockStatus');
  const getPin = ()=> localStorage.getItem('sama_pin') || '1234';
  const setLocked = (b)=>{ lockStatus.textContent = b ? 'Locked' : 'Unlocked'; lockStatus.style.color = b ? '' : 'var(--accent)'; };
  let locked = true; setLocked(true);
  setPinBtn.addEventListener('click',()=>{
    const p = pinInput.value.trim();
    if(/^[0-9]{4}$/.test(p)){ localStorage.setItem('sama_pin', p); alert('PIN updated'); pinInput.value=''; locked=true; setLocked(true); }
    else alert('Enter a 4‑digit PIN');
  });
  unlockBtn.addEventListener('click',()=>{
    if(pinInput.value.trim() === getPin()){ locked=false; setLocked(false); navigator.vibrate?.(200); }
    else { alert('Tamper alert: wrong PIN'); navigator.vibrate?.([100,80,100]); }
  });

  // Reminders
  const reminderForm = document.getElementById('reminderForm');
  const remindersUl = document.getElementById('reminders');
  const loadReminders = ()=> { try{return JSON.parse(localStorage.getItem('sama_reminders')||'[]')}catch{return[]} };
  const saveReminders = (l)=> localStorage.setItem('sama_reminders', JSON.stringify(l));
  function renderReminders(){
    const list = loadReminders();
    remindersUl.innerHTML = '';
    for(const item of list){
      const li = document.createElement('li');
      li.textContent = `${item.time} – ${item.name}${item.notes?` (${item.notes})`:''}`;
      li.className='row wrap';
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn';
      del.addEventListener('click',()=>{ saveReminders(list.filter(x=>x.id!==item.id)); renderReminders(); });
      li.appendChild(del); remindersUl.appendChild(li);
    }
  }
  reminderForm.addEventListener('submit',e=>{
    e.preventDefault();
    const d = Object.fromEntries(new FormData(reminderForm).entries());
    const list = loadReminders();
    list.push({ id: crypto.randomUUID(), name:d.name, time:d.time, notes:d.notes||'' });
    saveReminders(list); reminderForm.reset(); renderReminders();
  });
  setInterval(()=>{
    const now = new Date(), hh = String(now.getHours()).padStart(2,'0'), mm = String(now.getMinutes()).padStart(2,'0');
    const due = loadReminders().filter(r=>r.time===`${hh}:${mm}`);
    if(due.length) alert(`Dose time: ${due.map(d=>d.name).join(', ')}`);
  }, 30000);
  renderReminders();

  // Cold storage simulator
  const targetEl = document.getElementById('targetTemp');
  const ambientEl = document.getElementById('ambientTemp');
  const toggleBtn = document.getElementById('toggleCooling');
  const compOut = document.getElementById('compartmentTemp');
  const statusOut = document.getElementById('coolingStatus');
  const cctx = tempChart.getContext('2d');
  let running=false, temp=18, history=[];
  function drawChart(){
    const W = tempChart.width, H = tempChart.height;
    cctx.clearRect(0,0,W,H);
    cctx.strokeStyle = '#64748b'; cctx.strokeRect(0,0,W,H);
    cctx.beginPath(); cctx.strokeStyle = '#34d399';
    history.forEach((t,i)=>{ const x=(i/(history.length-1||1))*W; const y=H - ((t-(-5))/(35-(-5)))*H; if(i===0)cctx.moveTo(x,y); else cctx.lineTo(x,y); });
    cctx.stroke();
  }
  function loop(){
    const target = parseFloat(targetEl.value), ambient = parseFloat(ambientEl.value);
    const error = temp - target, cooling = Math.max(0, Math.min(1, error/15)), leak = (ambient - temp)*0.02;
    if(running){ temp -= cooling*0.6; statusOut.textContent = `Cooling ${(cooling*100)|0}%`; } else statusOut.textContent = 'Idle';
    temp += leak; history.push(temp); if(history.length>150) history.shift();
    compOut.textContent = temp.toFixed(1); drawChart(); requestAnimationFrame(loop);
  }
  toggleBtn.addEventListener('click',()=>{ running=!running; toggleBtn.textContent = running ? 'Stop' : 'Start'; });
  window.addEventListener('resize', debounce(drawChart, 100));
  loop();

  // Contact form (mock)
  const contactForm = document.getElementById('contactForm');
  const contactResult = document.getElementById('contactResult');
  contactForm.addEventListener('submit',e=>{
    e.preventDefault();
    contactForm.reset();
    contactResult.textContent = 'Thanks! We will get back to you shortly.';
  });

  function debounce(fn, wait){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); }; }
})();
