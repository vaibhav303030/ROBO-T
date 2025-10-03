// script.js
(function(){
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if(savedTheme === 'light') root.setAttribute('data-theme','light');
  themeToggle.addEventListener('click',()=>{
    const isLight = root.getAttribute('data-theme') === 'light';
    if(isLight){root.removeAttribute('data-theme');localStorage.setItem('theme','dark');themeToggle.textContent='🌙'}
    else {root.setAttribute('data-theme','light');localStorage.setItem('theme','light');themeToggle.textContent='☀️'}
  });
  document.getElementById('year').textContent = new Date().getFullYear();

  // Auto-follow simulator
  const canvas = document.getElementById('followCanvas');
  const ctx = canvas.getContext('2d');
  const obstacleInput = document.getElementById('obstacleCount');
  const resetBtn = document.getElementById('resetFollow');
  const W = canvas.width, H = canvas.height;
  let leader = { x: W*0.8, y: H*0.5 };
  let bot = { x: W*0.2, y: H*0.5, vx:0, vy:0 };
  let obstacles = [];
  function spawnObstacles(count){
    obstacles = Array.from({length: count}, () => ({
      x: 40 + Math.random()*(W-80),
      y: 30 + Math.random()*(H-60),
      r: 8 + Math.random()*16
    }));
  }
  function reset(){
    bot = { x: W*0.2, y: H*0.5, vx:0, vy:0 };
    leader = { x: W*0.8, y: H*0.5 };
    spawnObstacles(+obstacleInput.value);
  }
  function avoid(ax, ay){
    let rx=0, ry=0;
    for(const o of obstacles){
      const dx = ax - o.x; const dy = ay - o.y; const d = Math.hypot(dx,dy);
      const safe = o.r + 18;
      if(d < safe && d>0){
        rx += (dx/d)*(safe-d)*0.9; ry += (dy/d)*(safe-d)*0.9;
      }
    }
    return {x: ax+rx, y: ay+ry};
  }
  function step(){
    const target = avoid(leader.x, leader.y);
    const dx = target.x - bot.x, dy = target.y - bot.y;
    bot.vx += dx*0.002; bot.vy += dy*0.002;
    bot.vx *= 0.98; bot.vy *= 0.98;
    bot.x += bot.vx; bot.y += bot.vy;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#ef4444';
    for(const o of obstacles){ ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(leader.x,leader.y,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.arc(bot.x,bot.y,10,0,Math.PI*2); ctx.fill();
    requestAnimationFrame(step);
  }
  canvas.addEventListener('mousemove',e=>{
    const rect = canvas.getBoundingClientRect();
    leader.x = e.clientX - rect.left; leader.y = e.clientY - rect.top;
  });
  obstacleInput.addEventListener('input',()=>spawnObstacles(+obstacleInput.value));
  resetBtn.addEventListener('click',reset);
  reset(); step();

  // Smart lock demo
  const pinInput = document.getElementById('pin');
  const setPinBtn = document.getElementById('setPin');
  const unlockBtn = document.getElementById('unlock');
  const lockStatus = document.getElementById('lockStatus');
  function getPin(){ return localStorage.getItem('sama_pin') || '1234'; }
  function setLocked(isLocked){ lockStatus.textContent = isLocked ? 'Locked' : 'Unlocked'; lockStatus.style.color = isLocked ? '' : 'var(--accent)'; }
  let locked = true; setLocked(locked);
  setPinBtn.addEventListener('click',()=>{
    const newPin = pinInput.value.trim();
    if(/^[0-9]{4}$/.test(newPin)){ localStorage.setItem('sama_pin', newPin); alert('PIN updated'); pinInput.value=''; locked=true; setLocked(true);} else alert('Enter a 4‑digit PIN');
  });
  unlockBtn.addEventListener('click',()=>{
    const tryPin = pinInput.value.trim();
    if(tryPin === getPin()){ locked=false; setLocked(false); navigator.vibrate?.(200); }
    else { alert('Tamper alert: wrong PIN'); window.navigator?.vibrate?.([100,80,100]); }
  });

  // Dosage reminders
  const reminderForm = document.getElementById('reminderForm');
  const remindersUl = document.getElementById('reminders');
  function loadReminders(){ try{ return JSON.parse(localStorage.getItem('sama_reminders')||'[]'); }catch{return []} }
  function saveReminders(list){ localStorage.setItem('sama_reminders', JSON.stringify(list)); }
  function renderReminders(){
    const list = loadReminders();
    remindersUl.innerHTML = '';
    for(const item of list){
      const li = document.createElement('li');
      li.textContent = `${item.time} – ${item.name}${item.notes?` (${item.notes})`:''}`;
      li.className='row';
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn';
      del.addEventListener('click',()=>{ saveReminders(list.filter(x=>x.id!==item.id)); renderReminders(); });
      li.appendChild(del); remindersUl.appendChild(li);
    }
  }
  reminderForm.addEventListener('submit',e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(reminderForm).entries());
    const list = loadReminders();
    list.push({ id: crypto.randomUUID(), name:data.name, time:data.time, notes:data.notes||'' });
    saveReminders(list); reminderForm.reset(); renderReminders();
  });
  setInterval(()=>{
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const current = `${hh}:${mm}`;
    const due = loadReminders().filter(r=>r.time===current);
    if(due.length){ alert(`Dose time: ${due.map(d=>d.name).join(', ')}`); }
  }, 30000);
  renderReminders();

  // Cold storage simulator
  const targetEl = document.getElementById('targetTemp');
  const ambientEl = document.getElementById('ambientTemp');
  const toggleBtn = document.getElementById('toggleCooling');
  const compOut = document.getElementById('compartmentTemp');
  const statusOut = document.getElementById('coolingStatus');
  const chart = document.getElementById('tempChart');
  const cctx = chart.getContext('2d');
  let running = false; let temp = 18; let history = [];
  function drawChart(){
    cctx.clearRect(0,0,chart.width,chart.height);
    cctx.strokeStyle = '#64748b'; cctx.strokeRect(0,0,chart.width,chart.height);
    cctx.beginPath(); cctx.strokeStyle = '#34d399';
    history.forEach((t,i)=>{ const x = (i/(history.length-1||1))*chart.width; const y = chart.height - ((t-(-5))/(35-(-5)))*chart.height; if(i===0)cctx.moveTo(x,y); else cctx.lineTo(x,y); });
    cctx.stroke();
  }
  function loop(){
    const target = parseFloat(targetEl.value);
    const ambient = parseFloat(ambientEl.value);
    const error = temp - target;
    const coolingPower = Math.max(0, Math.min(1, error/15));
    const heatLeak = (ambient - temp)*0.02;
    if(running){ temp -= coolingPower*0.6; statusOut.textContent = `Cooling ${(coolingPower*100)|0}%`; }
    else { statusOut.textContent = 'Idle'; }
    temp += heatLeak;
    history.push(temp);
    if(history.length>150) history.shift();
    compOut.textContent = temp.toFixed(1);
    drawChart();
    requestAnimationFrame(loop);
  }
  toggleBtn.addEventListener('click',()=>{ running = !running; toggleBtn.textContent = running ? 'Stop' : 'Start'; });
  loop();

  // Contact form (mock)
  const contactForm = document.getElementById('contactForm');
  const contactResult = document.getElementById('contactResult');
  contactForm.addEventListener('submit',e=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(contactForm).entries());
    localStorage.setItem('sama_contact_draft', JSON.stringify({ ...data, ts: Date.now() }));
    contactForm.reset();
    contactResult.textContent = 'Thanks! We will get back to you shortly.';
  });
})();