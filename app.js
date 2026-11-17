(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const definitions = {
    warn: {
      category: 'MODERATION / WARN', title: 'Warn a member.', description: 'Give a member a warning with a reason attached.',
      fields: [{name:'member',label:'MEMBER',value:'@alex',max:40}, {name:'reason',label:'REASON',value:'Spamming in general',max:100}],
      makeCommand: v => `/warn user:${asArg(v.member)} reason:${quoted(v.reason)}`,
      result: v => `${safeText(v.member, '@member')} would receive a warning for “${safeText(v.reason,'No reason provided')}”.`
    },
    poll: {
      category: 'UTILITY / POLL', title: 'Start a quick poll.', description: 'See what a simple community poll could look like.',
      fields: [{name:'question',label:'QUESTION',value:'What should we play?',max:100}, {name:'options',label:'OPTIONS (SEPARATE WITH COMMAS)',value:'Roblox, Minecraft, Other',max:120}],
      makeCommand: v => `/poll question:${quoted(v.question)} options:${quoted(v.options)}`,
      result: v => `A sample poll for “${safeText(v.question,'Untitled poll')}” would show ${Math.max(1,v.options.split(',').filter(x=>x.trim()).length)} option(s).`
    },
    clear: {
      category: 'MODERATION / CLEAR', title: 'Clean up a channel.', description: 'Preview a quick way to clear unwanted messages.',
      fields: [{name:'count',label:'NUMBER OF MESSAGES (1–100)',value:'10',max:3,type:'number',min:1,maxNumber:100}, {name:'channel',label:'CHANNEL',value:'#general',max:50}],
      makeCommand: v => `/clear amount:${validCount(v.count)} channel:${asArg(v.channel)}`,
      result: v => `${validCount(v.count)} message(s) would be cleared from ${safeText(v.channel,'#general')}.`
    },
    remind: {
      category: 'AUTOMATION / REMIND', title: 'Set a reminder.', description: 'A peek at how scheduled nudges could work.',
      fields: [{name:'task',label:'REMIND ME TO',value:'Check the mod logs',max:100}, {name:'time',label:'IN HOW LONG?',value:'30m',max:20}],
      makeCommand: v => `/remind task:${quoted(v.task)} in:${asArg(v.time)}`,
      result: v => `You would get a reminder to “${safeText(v.task,'your task')}” in ${safeText(v.time,'30m')}.`
    }
  };
  const commandOrder = Object.keys(definitions);
  let active = 'warn';
  let toastTimeout;
  let lastFocus = null;
  const fieldNode = $('#demoFields');
  const form = $('#demoForm');
  const previewNode = $('#commandPreview');
  const paletteOverlay = $('#paletteOverlay');
  const paletteInput = $('#paletteInput');
  const paletteResults = $('#paletteResults');
  function safeText(value, fallback) { return (value || '').trim() || fallback; }
  function asArg(value) { return safeText(value, '—').replace(/\s+/g, '_').replace(/[\r\n]/g, ''); }
  function quoted(value) { return `"${String(value || '').replace(/[\r\n]/g, ' ').replace(/"/g, "'")}"`; }
  function validCount(value) { const count = parseInt(value,10); return Number.isFinite(count) ? Math.max(1,Math.min(100,count)) : 1; }
  function values() { return Object.fromEntries(Array.from(new FormData(form).entries()).map(([key, value])=>[key,String(value)])); }
  function updatePreview() { previewNode.textContent = definitions[active].makeCommand(values()); }
  function showToast(message) {
    const toast = $('#toast'); toast.textContent = message; toast.classList.add('visible');
    clearTimeout(toastTimeout); toastTimeout = setTimeout(()=>toast.classList.remove('visible'),2600);
  }
  function selectCommand(key, focusFirst = false) {
    if (!definitions[key]) return;
    active = key;
    const def = definitions[key];
    $('#commandCategory').textContent = def.category;
    $('#commandTitle').textContent = def.title;
    $('#commandDescription').textContent = def.description;
    $('#commandCounter').textContent = `EXAMPLE ${String(commandOrder.indexOf(key)+1).padStart(2,'0')} — 04`;
    fieldNode.replaceChildren(...def.fields.map(field=> {
      const label = document.createElement('label'); label.className='field';
      const title = document.createElement('span'); title.textContent=field.label;
      const input = document.createElement('input');
      input.name=field.name; input.value=field.value; input.type=field.type || 'text';
      input.autocomplete='off'; input.maxLength=field.max;
      if (field.type==='number') { input.min=field.min; input.max=field.maxNumber; }
      input.setAttribute('aria-label',field.label); label.append(title,input); return label;
    }));
    $$('.command-item').forEach(item=> { item.classList.toggle('is-selected',item.dataset.command===key); item.setAttribute('aria-pressed', String(item.dataset.command===key)); });
    const output = $('#demoOutput'); output.classList.remove('has-result');
    output.querySelector('.output-label span:last-child').textContent='READY';
    output.querySelector('p').textContent='Select a command and hit Run simulation to see a sample response.';
    updatePreview();
    if (focusFirst) fieldNode.querySelector('input')?.focus();
  }
  $$('.command-item').forEach(button=>button.addEventListener('click',()=>selectCommand(button.dataset.command)));
  fieldNode.addEventListener('input',updatePreview);
  form.addEventListener('submit',event=> {
    event.preventDefault();
    const button = $('#runDemo'); if (button.disabled) return;
    button.disabled = true; button.querySelector('.play-icon').textContent='·';
    const output = $('#demoOutput'); output.querySelector('.output-label span:last-child').textContent='PROCESSING';
    output.querySelector('p').textContent='Running a local preview...'; output.classList.remove('has-result');
    const snapshot = definitions[active].result(values());
    setTimeout(()=>{
      button.disabled=false; button.querySelector('.play-icon').textContent='▶';
      output.querySelector('.output-label span:last-child').textContent='SIMULATED';
      output.querySelector('p').textContent=snapshot;
      output.classList.add('has-result');
    },430);
  });
  $('#copyCommand').addEventListener('click',async()=>{
    const value=previewNode.textContent;
    try { await navigator.clipboard.writeText(value); showToast('COMMAND COPIED'); }
    catch { // Fallback for browsers opened as a file without clipboard permissions.
      const hidden=document.createElement('textarea'); hidden.value=value; hidden.style.position='fixed'; hidden.style.opacity='0'; document.body.append(hidden);hidden.select();
      const success=document.execCommand('copy');hidden.remove();showToast(success?'COMMAND COPIED':'COPY NOT AVAILABLE IN THIS BROWSER');
    }
  });
  const routes = [
    {type:'PAGE',label:'Overview',search:'home introduction logo overview',id:'overview'},
    {type:'PAGE',label:"What's planned",search:'features capabilities roadmap moderation utilities',id:'capabilities'},
    {type:'PAGE',label:'Try the concept',search:'demo playground commands',id:'playground'},
    {type:'COMMAND',label:'/warn',search:'warn moderation member',command:'warn'},
    {type:'COMMAND',label:'/poll',search:'poll utility vote',command:'poll'},
    {type:'COMMAND',label:'/clear',search:'clear purge messages',command:'clear'},
    {type:'COMMAND',label:'/remind',search:'remind automation task',command:'remind'}
  ];
  function renderPalette() {
    const query=paletteInput.value.trim().toLowerCase();
    const matches=routes.filter(item=>(item.label+' '+item.search).toLowerCase().includes(query));
    paletteResults.replaceChildren();
    if (!matches.length) { const el=document.createElement('div');el.className='palette-empty';el.textContent='Nothing found. Try “poll” or “overview”.';paletteResults.append(el);return; }
    for (const type of ['PAGE','COMMAND']) {
      const group=matches.filter(item=>item.type===type);if (!group.length) continue;
      const title=document.createElement('div');title.className='palette-group-title';title.textContent=type==='PAGE'?'JUMP TO':'TRY A COMMAND';paletteResults.append(title);
      for (const item of group) {
        const button=document.createElement('button');button.type='button';button.className='palette-item';
        const name=document.createElement('span');name.textContent=item.label;
        const arrow=document.createElement('span');arrow.textContent='↗';button.append(name,arrow);
        button.addEventListener('click',()=>activateRoute(item));paletteResults.append(button);
      }
    }
  }
  function activateRoute(item) { closePalette();if (item.command) selectCommand(item.command);document.getElementById(item.id || 'playground')?.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}); }
  function openPalette() { if (!paletteOverlay.hidden) return; lastFocus=document.activeElement;paletteOverlay.hidden=false;document.body.classList.add('is-locked');paletteInput.value='';renderPalette();requestAnimationFrame(()=>paletteInput.focus()); }
  function closePalette() { if (paletteOverlay.hidden) return;paletteOverlay.hidden=true;document.body.classList.remove('is-locked');lastFocus?.focus(); }
  $('#openPalette').addEventListener('click',openPalette);
  $('#footerShortcuts').addEventListener('click',openPalette);
  paletteInput.addEventListener('input',renderPalette);
  paletteInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();const first=paletteResults.querySelector('.palette-item');first?.click();}if(event.key==='ArrowDown'){event.preventDefault();paletteResults.querySelector('.palette-item')?.focus();}});
  paletteResults.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const items=$$('.palette-item');const current=items.indexOf(document.activeElement);const next=(current+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();}});
  $$('[data-close-palette]').forEach(element=>element.addEventListener('click',closePalette));
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();paletteOverlay.hidden?openPalette():closePalette();}
    if(event.key==='Escape'){closePalette();closeMobileMenu();}
  });
  // Keep focus inside the open dialog for keyboard accessibility.
  paletteOverlay.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const items=[paletteInput,...$$('.palette-item')];const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
  const menuToggle=$('#mobileMenuToggle');const mobileMenu=$('#mobileMenu');
  function closeMobileMenu(){mobileMenu.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open navigation');}
  menuToggle.addEventListener('click',()=>{const shouldOpen=mobileMenu.hidden;mobileMenu.hidden=!shouldOpen;menuToggle.setAttribute('aria-expanded',String(shouldOpen));menuToggle.setAttribute('aria-label',shouldOpen?'Close navigation':'Open navigation');});
  $$('#mobileMenu a').forEach(link=>link.addEventListener('click',closeMobileMenu));
  $('#year').textContent=String(new Date().getFullYear());
  function onScroll(){const progress=(window.scrollY/(document.documentElement.scrollHeight-window.innerHeight))*100;$('#scrollProgress').style.width=`${Number.isFinite(progress)?progress:0}%`;}
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  const heroLogo=$('.hero-logo');const stage=$('#logoStage');
  if(window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches){
    stage.addEventListener('pointermove',event=>{const box=stage.getBoundingClientRect();const dx=(event.clientX-(box.left+box.width/2))/box.width;const dy=(event.clientY-(box.top+box.height/2))/box.height;heroLogo.style.transform=`translate(${dx*13}px, ${dy*13}px)`;});
    stage.addEventListener('pointerleave',()=>{heroLogo.style.transform='translate(0,0)';});
  }
  if ('IntersectionObserver' in window){
    const links=$$('.desktop-nav a');const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){links.forEach(link=>link.classList.toggle('active',link.getAttribute('href')==='#'+entry.target.id));}}},{rootMargin:'-20% 0px -65% 0px',threshold:0});
    ['overview','capabilities','playground'].forEach(id=>observer.observe(document.getElementById(id)));
  }
  selectCommand('warn');
})();
