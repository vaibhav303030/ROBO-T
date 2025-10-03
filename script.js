// script.js
(function(){
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');

  // Theme toggle with persistence
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

  // Profile dropdown
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');
  function closeMenu(){ profileMenu.classList.remove('open'); profileMenu.setAttribute('aria-hidden','true'); profileBtn.setAttribute('aria-expanded','false'); }
  function toggleMenu(){ const open = !profileMenu.classList.contains('open'); if(open){ profileMenu.classList.add('open'); profileMenu.setAttribute('aria-hidden','false'); profileBtn.setAttribute('aria-expanded','true'); } else { closeMenu(); } }
  profileBtn?.addEventListener('click', (e)=>{ e.stopPropagation(); toggleMenu(); });
  document.addEventListener('click', (e)=>{ if(!profileMenu.contains(e.target) && e.target!==profileBtn){ closeMenu(); } });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });

  // Organization data
  const defaultOrg = {
    adminName: 'Dr. Ayesha Khan',
    hospitalName: 'SMARTMEDTROLLEY General Hospital',
    branchName: 'Main Campus – East Wing',
    staff: ['Nurse Priya', 'Nurse Omar', 'Pharmacist Liam'],
    locked: true
  };
  function loadOrg(){ try{ return JSON.parse(localStorage.getItem('smt_org')||'') || defaultOrg; }catch{ return defaultOrg; } }
  function saveOrg(data){ localStorage.setItem('smt_org', JSON.stringify(data)); }

  const elAdmin = document.getElementById('adminName');
  const elHospital = document.getElementById('hospitalName');
  const elBranch = document.getElementById('branchName');
  const elStaffCount = document.getElementById('staffCount');
  const elLockState = document.getElementById('lockState');
  const btnManageStaff = document.getElementById('manageStaff');
  const btnQuickLock = document.getElementById('quickLockToggle');
  const btnEditOrg = document.getElementById('editOrg');

  function renderOrg(){
    const org = loadOrg();
    elAdmin.textContent = org.adminName;
    elHospital.textContent = org.hospitalName;
    elBranch.textContent = org.branchName;
    elStaffCount.textContent = String(org.staff.length);
    elLockState.textContent = org.locked ? 'Locked' : 'Unlocked';
    elLockState.classList.toggle('warn', org.locked);
    btnQuickLock.textContent = org.locked ? 'Unlock' : 'Lock';
  }

  btnManageStaff?.addEventListener('click', ()=>{
    const org = loadOrg();
    const list = org.staff.map((s,i)=>`${i+1}. ${s}`).join('\n');
    const action = prompt(`Staff list:\n${list || '(none)'}\n\nType:\n  add:Name  to add\n  del:Index  to remove\n`, 'add:New Staff');
    if(!action) return;
    const [cmd, val] = action.split(':');
    if(cmd==='add' && val){ org.staff.push(val.trim()); }
    else if(cmd==='del' && val){ const idx = parseInt(val.trim(),10)-1; if(idx>=0 && idx<org.staff.length) org.staff.splice(idx,1); }
    saveOrg(org); renderOrg(); alert('Updated staff access.');
  });

  btnQuickLock?.addEventListener('click', ()=>{
    const org = loadOrg();
    org.locked = !org.locked;
    saveOrg(org); renderOrg();
  });

  btnEditOrg?.addEventListener('click', ()=>{
    const org = loadOrg();
    const admin = prompt('Administrative (name):', org.adminName) ?? org.adminName;
    const hosp = prompt('Hospital Name:', org.hospitalName) ?? org.hospitalName;
    const branch = prompt('Branch:', org.branchName) ?? org.branchName;
    const updated = { ...org, adminName: admin.trim()||org.adminName, hospitalName: hosp.trim()||org.hospitalName, branchName: branch.trim()||org.branchName };
    saveOrg(updated); renderOrg(); alert('Organization details updated.');
  });

  renderOrg();

  // Feature modal content
  const featureContent = {
    auto: {
      title: 'Auto‑follow & Obstacle Detection',
      html: `
        <p>SMARTMEDTROLLEY uses target tracking and multi‑sensor fusion to follow safely.</p>
        <ul>
          <li><strong>Tracking:</strong> person re‑identification + optical flow keeps lock on the caregiver.</li>
          <li><strong>Safety bubble:</strong> dynamic distance, slows near crowds, stops at unsafe angles.</li>
          <li><strong>Sensors:</strong> Lidar/ultrasonic bumpers, IMU, wheel encoders.</li>
          <li><strong>Modes:</strong> Follow, Dock, and Hold position.</li>
        </ul>
        <div>
          <span class="badge tag">Lidar</span>
          <span class="badge tag">Vision</span>
          <span class="badge tag">Fail‑safe</span>
        </div>
      `
    },
    lock: {
      title: 'Smart Lock & Theft Alert',
      html: `
        <p>Secures medicines with audit trails.</p>
        <ul>
          <li><strong>Auth:</strong> 4‑digit PIN/biometric; role‑based access per branch.</li>
          <li><strong>Tamper:</strong> wrong attempts trigger alarm + phone alert.</li>
          <li><strong>Logs:</strong> who opened which compartment and when.</li>
          <li><strong>Remote:</strong> temporary unlock codes for emergencies.</li>
        </ul>
        <div>
          <span class="badge tag">RBAC</span>
          <span class="badge tag">Alerts</span>
          <span class="badge tag">Audit</span>
        </div>
      `
    },
    reminder: {
      title: 'Dosage Reminder & Records',
      html: `
        <p>Keeps patients on schedule and provides adherence records.</p>
        <ul>
          <li><strong>Schedules:</strong> once, daily, or custom intervals.</li>
          <li><strong>Notifications:</strong> push + device chime; snooze & skip tracking.</li>
          <li><strong>Records:</strong> exportable CSV/PDF for clinicians.</li>
        </ul>
        <div>
          <span class="badge tag">Reminders</span>
          <span class="badge tag">Adherence</span>
          <span class="badge tag">Export</span>
        </div>
      `
    },
    cold: {
      title: 'Cold Storage – Vaccines, Insulins, Antibiotics',
      html: `
        <p>Pharmacy‑grade cold chain with scheduling and inventory context.</p>
        <ul>
          <li><strong>Setpoints:</strong> 2–8 °C for vaccines/sera; 2–8 °C or 8–15 °C per drug label.</li>
          <li><strong>Scheduling:</strong> plan vaccination sessions and serum usage windows; pre‑cool alerts.</li>
          <li><strong>Insulins:</strong> rapid‑acting, short‑acting, intermediate (NPH), long‑acting, premix—stored 2–8 °C; in‑use pens at room temp per brand guidance.</li>
          <li><strong>Antibiotics:</strong> reconstituted suspensions (e.g., amoxicillin‑clavulanate, cefalexin) kept refrigerated; expiry tracked by batch.</li>
          <li><strong>Compliance:</strong> continuous logging, excursion flags, printable reports.</li>
        </ul>
        <div>
          <span class="badge tag">2–8 °C</span>
          <span class="badge tag">Excursion Alerts</span>
          <span class="badge tag">Batch Tracking</span>
        </div>
      `
    }
  };

  const modal = document.getElementById('featureModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  const modalOk = document.getElementById('modalOk');

  function openModal(key){
    const data = featureContent[key];
    if(!data) return;
    modalTitle.textContent = data.title;
    modalBody.innerHTML = data.html;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
  }
  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
  }
  document.querySelectorAll('.view-more').forEach(btn=>{
    btn.addEventListener('click',()=>openModal(btn.dataset.feature));
  });
  modalClose.addEventListener('click', closeModal);
  modalOk.addEventListener('click', closeModal);
  modal.addEventListener('click',(e)=>{ if(e.target === modal) closeModal(); });
  document.addEventListener('keydown',(e)=>{ if(e.key === 'Escape') closeModal(); });

  // Canvas helpers
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

  const contactForm = document.getElementById('contactForm');
  const contactResult = document.getElementById('contactResult');
  contactForm.addEventListener('submit',e=>{
    e.preventDefault();
    contactForm.reset();
    contactResult.textContent = 'Thanks! We will get back to you shortly.';
  });

  function debounce(fn, wait){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); }; }
})();
