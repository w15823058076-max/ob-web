import {
  AVATARS,
  ASSET_FILES,
  FLOW,
  LEGACY_STORAGE_KEYS,
  ONBOARDING_COUNT,
  OPTIONS,
  STORAGE_KEY,
  featureData,
  freshState,
} from './app-config.js';

let state=loadState();

function readStorage(key){
 try{return JSON.parse(sessionStorage.getItem(key)||'null');}
 catch{return null;}
}

function normalizeState(saved){
 const next=freshState();
 if(!saved||typeof saved!=='object')return next;
 next.name=typeof saved.name==='string'?saved.name.slice(0,30):'';
 next.avatar=Number.isInteger(saved.avatar)&&saved.avatar>=-1&&saved.avatar<AVATARS.length?saved.avatar:-1;
 next.plan=saved.plan==='weekly'?'weekly':'yearly';
 next.bindingEmail=typeof saved.bindingEmail==='string'?saved.bindingEmail.slice(0,120):'';
 next.bindingName=typeof saved.bindingName==='string'?saved.bindingName.slice(0,60):'';
 next.bindingCountry=typeof saved.bindingCountry==='string'&&saved.bindingCountry.trim()?saved.bindingCountry:'Netherlands';
 next.bindingPhone=typeof saved.bindingPhone==='string'?saved.bindingPhone.slice(0,30):'';
 next.bound=saved.bound===true;
 for(const [key,opts] of Object.entries(OPTIONS)){
  const values=opts.map(option=>option[1]);
  if(key==='needs')next.picks[key]=Array.isArray(saved.picks?.[key])?saved.picks[key].filter(value=>values.includes(value)):[];
  else if(values.includes(saved.picks?.[key]))next.picks[key]=saved.picks[key];
 }
 return next;
}

function loadState(){
 const current=readStorage(STORAGE_KEY);
 if(current)return normalizeState(current);
 for(const key of LEGACY_STORAGE_KEYS){
  const legacy=readStorage(key);
  if(legacy){
   const migrated=normalizeState(legacy);
   try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));}catch{/* Storage can be unavailable in private browsing. */}
   return migrated;
  }
 }
 return freshState();
}
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image=(name,cls='',alt='')=>`<img src="./assets/${ASSET_FILES[name]||`${name}.png`}" class="${cls}" alt="${esc(alt)}" draggable="false">`;
const svg=(paths,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICON={arrow:svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),close:svg('<path d="m6 6 12 12M18 6 6 18"/>'),check:svg('<path d="m4 13 5 5L20 5"/>'),pencil:svg('<path d="m4 17-1 4 4-1L20 7l-3-3L4 17Z" fill="currentColor"/><path d="m14 7 3 3" stroke="#aa8fff"/>'),camera:svg('<path d="M3 6h5l2-3h4l2 3h5v15H3z"/><circle cx="12" cy="13" r="4"/>'),photo:svg('<rect x="2" y="3" width="20" height="18" rx="3"/><circle cx="8" cy="8" r="2"/><path d="m2 17 6-5 4 4 4-6 6 7"/>')};
let current='gender', previousIndex=0, modal=null, draftAvatar=-1, uploadedUrl=null, draftUpload=null, photoReturn=null;
const query=new URLSearchParams(location.search);
const reviewMode=query.has('review');
const fullscreenMode=!reviewMode&&query.get('fullscreen')!=='0';
if(reviewMode){document.body.classList.add('review-mode');$('#designReview').hidden=false;}
if(fullscreenMode)document.body.classList.add('fullscreen-mode');
function save(){try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{/* Storage can be unavailable in private browsing. */}}
function assetAvatar(avatar=state.avatar,url=uploadedUrl){return url||`./assets/${avatar>=0?AVATARS[avatar]:'profile-default'}.png`;}
function title(text,classes=''){return `<h1 class="title question-title ${classes}">${text}</h1>`;}
function ready(){
 if(current==='name')return Boolean(state.name.trim());
 if(current==='needs')return Boolean(state.picks.needs?.length);
 if(current==='binding')return Boolean(state.bindingEmail?.trim()&&(state.bindingName?.trim()||state.name?.trim()));
 if(OPTIONS[current])return Boolean(state.picks[current]);
 return true;
}
function header(screen,index){
 const hasClose=['rights','price'].includes(screen.id);
 const progress=screen.progressBar?(()=>{const value=Math.round(((index+1)/ONBOARDING_COUNT)*100);return `<div class="nav-progress" role="progressbar" aria-label="Onboarding progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><i style="width:${value}%"></i></div><button class="nav-skip" data-action="next">Skip</button>`})():'';
 return `<div class="status-bar" aria-hidden="true"><span class="status-time">9:41</span>${image('status-icons','status-icons')}</div><div class="nav-bar">${progress}${hasClose?`<button class="close-button" data-action="previous" aria-label="Close">${ICON.close}</button>`:''}${screen.id==='price'?'<button class="restore-button" data-action="restore">Restore Purchases</button>':''}</div>`;
}
function footer(){
 if(['binding','download'].includes(current))return '';
  const benefit=current==='rights';
  return `<button class="cta ${['rights','price'].includes(current)?'shine':''}" data-action="continue" ${ready()?'':'disabled'}>${benefit?'GET MY LOVE PLAN 🙌':'Continue'}${benefit?'':ICON.arrow}</button>`;
}
function choices(key,top){
 const round=['age','distance','needs'].includes(key),multi=key==='needs';
 return `<div class="choice-list" style="top:${top}px" role="${multi?'group':'radiogroup'}" aria-label="${key}">${OPTIONS[key].map(([emoji,label],i)=>{
 const selected=multi?(state.picks[key]||[]).includes(label):state.picks[key]===label;
 return `<button class="choice ${round?'rounded':''} ${selected?'selected':''}" role="${multi?'checkbox':'radio'}" aria-checked="${selected}" data-action="pick" data-index="${i}"><span class="emoji" aria-hidden="true">${emoji}</span><span class="choice-label">${esc(label)}</span>${round?`<span class="radio" aria-hidden="true">${selected?'✓':''}</span>`:''}</button>`;
 }).join('')}</div>`;
}
function gender(){return `${title('Which gender best\ndescribes you?','gender-title')}<div class="choice-list gender-options" role="radiogroup" aria-label="Gender"><div class="gender-large-row">${OPTIONS.gender.slice(0,2).map(([,label],i)=>`<button role="radio" aria-checked="${state.picks.gender===label}" class="gender-large ${state.picks.gender===label?'selected':''}" data-action="pick" data-index="${i}">${state.picks.gender===label?'<i class="hi-bubble" aria-hidden="true">Hi</i>':''}${image(i?'gender-male':'gender-female')}<span>${label}</span></button>`).join('')}</div>${OPTIONS.gender.slice(2).map(([emoji,label],i)=>`<button class="choice ${state.picks.gender===label?'selected':''}" role="radio" aria-checked="${state.picks.gender===label}" data-action="pick" data-index="${i+2}"><span class="emoji" aria-hidden="true">${emoji}</span><span>${label}</span></button>`).join('')}</div>`;}
function profile(){return `${title('👏 What should we call\nyou?')}<div class="profile-description"><span class="profile-faces">${image('avatar-m1')}${image('profile-default')}</span><p class="description">Add a profile photo so your partner can see you.</p></div><button class="profile-edit" data-action="avatar-open" aria-label="Edit profile photo"><img src="${esc(assetAvatar())}" alt="Your selected avatar"><span class="edit-pencil">${ICON.pencil}</span></button><label class="sr-only" for="nameInput">Your name</label><input class="name-input" id="nameInput" name="name" maxlength="30" value="${esc(state.name)}" placeholder="Your name" autocomplete="given-name" enterkeyhint="next">`;}
function feature(id){const d=featureData[id];return `<img class="feature-art" style="top:${d.top}px" src="./assets/${d.image}.png" alt="${esc(d.title)}"><div class="feature-copy"><h1>${d.title}</h1><p>${d.copy}</p></div>`;}
const reviewCopy='My husband and I use this app to keep strengthening our relationship. It helps us understand each other better and stay connected throughout the day. We absolutely love it!';
function brand(){return `${image('logo-award','brand-logo','Love8')}<h1 class="brand-title">The App Made for Couples</h1><p class="brand-description">Trusted by 20 million+ couples worldwide</p>${image('brand-chart','brand-chart','Love8 Couples and Other Couples over two weeks')}<div class="brand-reviews" aria-label="Couple reviews">${[0,1,2].map((n)=>`<article class="review-card"><h2>${n===0?'😘 ':''}Love8 really helped us!</h2><p>${reviewCopy}</p><div class="review-by">${image('sarah')}<span>@Sarah, 26 (Together for 3 years)</span></div></article>`).join('')}</div>`;}
function product(){const a=['"Where are you?"<br>texts','Unnecessary worries','Feeling disconnected','Forgetting special<br>milestones'];const b=['Live location &<br>Status','Perfect peace of<br>mind','Always by your<br>side','A shared space for<br>memories'];return `<h1 class="title comparison-title">Grow your love with<br><span class="purple">Love8</span></h1><section class="comparison before"><h2>Without Love8</h2><ul>${a.map(t=>`<li>${t}</li>`).join('')}</ul>${image('comparison-before')}</section><section class="comparison after"><h2>With Love8</h2><ul>${b.map(t=>`<li><span>${t}</span></li>`).join('')}</ul>${image('comparison-after')}</section>`;}
function benefits(){const list=['Real-time Location','Speeding Alerts','Low Battery Alerts','Satellite Map & Street View','Premium Widgets & Themes','Exclusive Pet Interactions','Anniversary Reminder'];return `${image('benefits-header','benefits-heading','Let love grow together. Top 10 Couple Apps.')}<h1 class="sr-only">Let love grow together</h1><section class="benefits-card" aria-label="Premium Benefits"><div class="benefits-card-head"><span class="pro-badge"><b>♛</b>Pro</span><span class="benefits-caption">👇 Premium Benefits 👇</span></div><ul class="benefits-list">${list.map(t=>`<li><span class="tick" aria-hidden="true">✔</span><span class="benefit-text">${t}</span></li>`).join('')}</ul></section>`;}
const star='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 1 3.5 7.1 7.8 1.1-5.6 5.5 1.3 7.8-7-3.7-7 3.7 1.3-7.8L.7 9.2l7.8-1.1Z"/></svg>';
function plans(){return `${title('Choose your plan','plan-title')}${image('plan-ribbon','plan-ribbon','One subscription, You both enjoy it')}<div class="plan-testimonial"><div class="plan-stars" aria-label="5 stars">${star.repeat(5)}</div><blockquote>My husband and I have been using this app.<br>It helps us understand each other better. We<br>really love it.</blockquote><div class="plan-author">${image('sarah')}Sarah</div><div class="dots" aria-label="Review pages">${[0,1,2].map(i=>`<button class="${i===1?'active':''}" data-action="review-dot" aria-label="Review ${i+1}" aria-pressed="${i===1}"></button>`).join('')}</div></div>${image('plan-mascot','plan-mascot')}<div role="radiogroup" aria-label="Subscription plan"><button class="plan yearly ${state.plan==='yearly'?'selected':''}" role="radio" aria-checked="${state.plan==='yearly'}" data-action="plan" data-plan="yearly"><span class="popular">MOST POPULAR</span><span class="plan-info"><strong>Yearly</strong><span class="plan-discount">Save 80%</span><span class="plan-billed" style="display:block">🎉 Only $29.99/year.</span></span><span class="plan-price">$0.62/week</span></button><button class="plan weekly ${state.plan==='weekly'?'selected':''}" role="radio" aria-checked="${state.plan==='weekly'}" data-action="plan" data-plan="weekly"><strong>Weekly</strong><span class="plan-price">$2.99/week</span></button></div><div class="payment-caption-in-scene"><div class="payment-caption" style="position:static"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1 22 5v7c0 6-10 11-10 11S2 18 2 12V5Z"/><path d="m7 12 3 3 7-7" fill="none" stroke="white" stroke-width="2"/></svg><span>Secure with Apple Pay. Cancel anytime.</span></div></div>`;}
function specialStatus(){return `<div class="special-status" aria-hidden="true"><span>9:41</span>${image('status-icons','special-status-icons')}</div>`;}
function specialNav(titleText,right,action='previous'){return `<div class="special-nav"><button class="special-back" data-action="${action}" aria-label="Back">‹</button><strong>${titleText}</strong>${right?`<button class="special-nav-action" data-action="${right==='Help'?'help':'restore'}">${right}</button>`:''}</div>`;}
function binding(){
 const name=state.bindingName||state.name;
 return `<div class="special-screen binding-screen">${specialStatus()}${specialNav('Account','Restore Purchases')}<section class="payment-success"><div><strong>Payment successful</strong><span>Benefits activated</span><small>Your subscription is ready</small></div><b aria-hidden="true">✓</b></section><div class="binding-copy"><h1>Link your account</h1><p>Link your account to restore your subscription on any device.</p></div><form class="binding-form" novalidate><label for="bindingEmail">Email</label><input id="bindingEmail" type="email" autocomplete="email" value="${esc(state.bindingEmail)}" placeholder="Enter your email address"><label for="bindingName">Full name</label><input id="bindingName" type="text" autocomplete="name" value="${esc(name)}" placeholder="Enter your name"><label for="bindingCountry">Country / region</label><div class="country-field"><select id="bindingCountry" aria-label="Country / region"><option${state.bindingCountry==='Netherlands'?' selected':''}>Netherlands</option><option${state.bindingCountry==='United States'?' selected':''}>United States</option><option${state.bindingCountry==='United Kingdom'?' selected':''}>United Kingdom</option><option${state.bindingCountry==='Australia'?' selected':''}>Australia</option></select><span>⌄</span></div><label for="bindingPhone">Phone number (optional)</label><input id="bindingPhone" type="tel" autocomplete="tel" value="${esc(state.bindingPhone)}" placeholder="🇳🇱  +31"><p class="binding-help">If you lose access to your account, you can use this information to recover it.</p></form><button class="binding-cta" data-action="bind-continue" ${ready()?'':'disabled'}>Link Account &amp; Continue</button></div>`;
}
function download(){
 return `<div class="special-screen download-screen">${specialStatus()}${specialNav('Download the App','Help')}<div class="download-intro"><h1>Two steps to go 🙌</h1><p>Open Love8 on your phone to continue using your subscription.</p></div><div class="download-steps" aria-label="Complete setup"><div class="step-line"><i></i></div>${[['✓','Purchase','done'],['✓','Link','done'],['3','Download','current'],['4','Sign in','pending']].map(([n,label,klass])=>`<div class="download-step ${klass}"><b>${n}</b><span>${label}</span></div>`).join('')}</div><section class="download-card"><h2>1. Download Love8</h2><p>Install Love8 to continue on your phone.</p><div class="love8-brand" aria-label="Love8 app listing"><div class="love8-brand-head">${image('love8-app-icon','love8-mark','Love8 app icon')}<strong>Love8</strong></div><h3>Couples &amp; Relationship App</h3><p class="app-description">Stay close, wherever you are.</p><div class="app-meta"><span class="app-rating">★ 4.6</span><span>20M+ downloads</span></div></div></section><section class="access-card"><h2>2. Copy your access code</h2><div class="access-code">A8K 2QH</div><button class="copy-code" data-action="copy-code">Copy</button><p>Valid for 24 hours</p></section><section class="login-instruction"><h2>3. Open Love8 and sign in</h2><p>Choose “Sign in with access code,” paste the code above,<br>and your subscription will sync automatically.</p></section><button class="download-cta" data-action="download-app">Download Love8</button><button class="installed-link" data-action="open-app">Already installed? Open Love8</button></div>`;
}
function screenContent(){switch(current){case'gender':return gender();case'name':return profile();case'age':return `${title(`🔢 Hi, ${esc(state.name.trim()||'Jasmine')}! Glad\nyou're here. How old are you?` )}${choices('age',163)}`;case'together':return `${title('How long have you\nbeen together?','centered-title')}${choices('together',136)}`;case'distance':return `${title('📍 How far apart are you?')}${choices('distance',163)}`;case'purpose':return `${title('What brings you here?','centered-title purpose-title')}<p class="description purpose-subtitle">I want to...</p>${choices('purpose',136)}`;case'needs':return `${title('❤️ What do you want most from Love8?')}<p class="description question-subtitle">This helps us focus on what matters most to<br>you and your relationship. (Select all that apply)</p>${choices('needs',163)}`;case'brand':return brand();case'product':return product();case'rights':return benefits();case'price':return plans();case'binding':return binding();case'download':return download();default:return feature(current);}}
function fit(){const mobile=innerWidth<=640;const viewportHeight=innerHeight;const available=innerWidth-(reviewMode&&!mobile?246:0);const s=mobile?innerWidth/402:(fullscreenMode?Math.min(1,viewportHeight/874,innerWidth/402):Math.min(1,(innerHeight-76)/874,(available-40)/402));document.documentElement.style.setProperty('--scale',Math.max(.3,s));document.documentElement.style.setProperty('--device-h',mobile?`${viewportHeight/s}px`:'874px');}
function syncScroller(){const scroller=$('#scroller');if(!scroller)return;const scrollable=scroller.scrollHeight>scroller.clientHeight+1;scroller.classList.toggle('is-scrollable',scrollable);if(!scrollable)scroller.scrollTop=0;}
function refreshOptions(index){const focused=document.activeElement;const scroll=$('#scroller').scrollTop;$('#scene').innerHTML=screenContent();$('#footer').innerHTML=footer();$('#scroller').scrollTop=scroll;const next=$(`#scene [data-action="pick"][data-index="${index}"]`);if(focused?.dataset.action==='pick')next?.focus({preventScroll:true});syncScroller();save();}
function render(animate=true){
 const screen=FLOW.find(x=>x.id===current)||FLOW[0];
 const index=FLOW.findIndex(x=>x.id===current);
 const special=['binding','download'].includes(current);
 $('#device').className=`device ${current==='rights'?'benefits':''} ${special?'special-device':''}`;
 $('#header').innerHTML=special?'':header(screen,index);$('#scene').innerHTML=screenContent();$('#footer').innerHTML=special?'':footer();$('#scene').dataset.figmaNode=screen.node;
 $('#scene').className=`scene ${special?'special-scene':''}`;if(animate){void $('#scene').offsetWidth;$('#scene').classList.add(index>=previousIndex?'enter-forward':'enter-back');}
 previousIndex=index;$('#scroller').scrollTop=0;$('#scene').focus({preventScroll:true});$('#screenCaption').textContent=`${index>=0?String(index+1).padStart(2,'0')+' / '+FLOW.length+' · ':''}${screen.name}`;
 const announcer=$('#pageAnnouncer');if(announcer)announcer.textContent=`${screen.name} page`;
 $('#previousScreen').disabled=index<=0;$('#nextScreen').disabled=index<0||index>=FLOW.length-1;
 for(const b of document.querySelectorAll('[data-review]'))b.classList.toggle('active',b.dataset.review===current);
 document.title=`Love8 · ${screen.name}`;fit();syncScroller();
}
function go(id){if(!FLOW.some(x=>x.id===id))return;location.hash=id;}
function next(){const i=FLOW.findIndex(x=>x.id===current);if(i>=0&&i<FLOW.length-1)go(FLOW[i+1].id);}
function previous(){const i=FLOW.findIndex(x=>x.id===current);if(i>0)go(FLOW[i-1].id);}
function haptic(pattern=8){try{navigator.vibrate?.(pattern);}catch{/* Haptics are optional and unsupported in some browsers. */}}
function showToast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>$('#toast').classList.remove('show'),2400);}
function inertBackground(value){for(const id of ['header','scroller','footer'])$('#'+id).inert=value;}
function renderAvatarSheet(){
 const content=`<section class="avatar-sheet" role="dialog" aria-modal="true" aria-labelledby="avatarLabel"><div class="grabber" aria-hidden="true"></div><button class="sheet-close" data-action="avatar-cancel" aria-label="Cancel avatar selection">${ICON.close}</button><button class="sheet-done" data-action="avatar-save" aria-label="Save avatar">${ICON.check}</button><img class="sheet-avatar" src="${esc(assetAvatar(draftAvatar,draftUpload))}" alt="Avatar preview"><div class="photo-actions"><button data-action="camera">${ICON.camera}Camera</button><button data-action="photo">${ICON.photo}Photo</button></div><h2 id="avatarLabel" class="avatar-label">Select an AI Avatar</h2><div class="avatar-grid" role="radiogroup" aria-label="AI Avatars">${AVATARS.map((a,i)=>`<button class="avatar-option ${!draftUpload&&draftAvatar===i?'selected':''}" role="radio" aria-checked="${!draftUpload&&draftAvatar===i}" data-action="avatar" data-index="${i}" aria-label="Avatar ${i+1}">${image(a)}</button>`).join('')}</div></section>`;
 $('#overlay').innerHTML=content;$('#overlay').hidden=false;inertBackground(true);modal='avatar';
}
function openAvatar(){draftAvatar=state.avatar;draftUpload=uploadedUrl;photoReturn=document.activeElement;renderAvatarSheet();$('#overlay .sheet-close').focus({preventScroll:true});}
function closeOverlay(){const wasAvatar=modal==='avatar';modal=null;$('#overlay').hidden=true;$('#overlay').innerHTML='';inertBackground(false);if(wasAvatar){if(draftUpload&&draftUpload!==uploadedUrl)URL.revokeObjectURL(draftUpload);const edit=$('[data-action="avatar-open"]');edit?.focus({preventScroll:true});}else photoReturn?.focus?.({preventScroll:true});}
function showInfo(heading,copy,button='Got it'){photoReturn=document.activeElement;modal='info';inertBackground(true);$('#overlay').innerHTML=`<section class="simple-sheet" role="dialog" aria-modal="true" aria-labelledby="infoHeading"><h2 id="infoHeading">${esc(heading)}</h2><p>${esc(copy)}</p><button data-action="dismiss">${esc(button)}</button></section>`;$('#overlay').hidden=false;$('#overlay button').focus({preventScroll:true});}
function route(){closeOverlay();const id=location.hash.slice(1).split('/')[0];current=FLOW.some(x=>x.id===id)||id==='binding'?id:'gender';render();if(location.hash==='#name/avatar')openAvatar();}
function buildReview(){const sections=[['Design pages',FLOW],['Design states',[{id:'gender-selected',name:'Gender · Selected'},{id:'name/avatar',name:'Name · Avatar picker'},{id:'price-weekly',name:'Pricing · Weekly plan'},{id:'binding',name:'Link account · Implemented'},{id:'download',name:'Download app · Implemented'}]]];$('#designReview').innerHTML=`<h1>Love8 · OB Web</h1><p>Figma 402 × 874<br>Ordered left to right from the canvas</p>${sections.map(([name,rows])=>`<h2>${name}</h2>${rows.map(r=>`<button data-review="${r.id}">${r.name}</button>`).join('')}`).join('')}<a href="./design/manifest.json" target="_blank" rel="noreferrer">View Figma mapping</a><a href="./" >Open full experience →</a>`;}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');const review=e.target.closest('[data-review]');
 if(review){const id=review.dataset.review;if(id==='gender-selected'){state.picks.gender='Female';save();go('gender');if(current==='gender')render(false);}else if(id==='price-weekly'){state.plan='weekly';save();go('price');if(current==='price')render(false);}else if(id==='name/avatar'){go('name');location.hash='name/avatar';}else go(id);return;}
 if(!el)return;const action=el.dataset.action;
 if(['pick','continue','bind-continue','next','previous','avatar','avatar-save','plan','download-app','open-app'].includes(action))haptic();
 if(action==='pick'){const key=current;const value=OPTIONS[key]?.[Number(el.dataset.index)]?.[1];if(!value)return;if(key==='needs'){const list=state.picks.needs||[];state.picks.needs=list.includes(value)?list.filter(v=>v!==value):[...list,value];}else state.picks[key]=value;refreshOptions(el.dataset.index);}
 if(action==='continue'&&ready()){if(current==='price')showInfo('Checkout is coming soon','This plan is available to preview. Web payments are not available yet, and you have not been charged.','Back to plans');else next();}
 if(action==='bind-continue'&&ready()){state.bound=true;save();go('download');}
 if(action==='download-app')showInfo('Download Love8','Install Love8 from the App Store or Google Play. The production store link will be connected here.');
 if(action==='open-app')showInfo('Open Love8','The deep link will open Love8 after the app is installed.');
 if(action==='help')showInfo('Need help?','If the code is expired, return to the purchase page and request a new access code.');
 if(action==='copy-code'){navigator.clipboard?.writeText('A8K 2QH').then(()=>showToast('Access code copied')).catch(()=>showToast('Please copy the access code manually'));}
 if(action==='next')next();if(action==='previous')previous();
 if(action==='avatar-open')openAvatar();
 if(action==='avatar'){if(draftUpload&&draftUpload!==uploadedUrl)URL.revokeObjectURL(draftUpload);draftUpload=null;draftAvatar=Number(el.dataset.index);renderAvatarSheet();$(`#overlay [data-index="${draftAvatar}"]`)?.focus({preventScroll:true});}
 if(action==='avatar-save'){if(uploadedUrl&&uploadedUrl!==draftUpload)URL.revokeObjectURL(uploadedUrl);uploadedUrl=draftUpload;state.avatar=draftAvatar;save();closeOverlay();$('#scene').innerHTML=profile();$('[data-action="avatar-open"]').focus({preventScroll:true});}
 if(action==='avatar-cancel'||action==='dismiss')closeOverlay();
 if(action==='photo')$('#photoInput').click();if(action==='camera')$('#cameraInput').click();
 if(action==='plan'){state.plan=el.dataset.plan;save();$('#scene').innerHTML=plans();$(`#scene [data-plan="${state.plan}"]`).focus({preventScroll:true});}
 if(action==='restore')showInfo('Restore your subscription','Subscription restoration is not available in this web preview. Open Love8 to restore an existing purchase.');
 if(action==='review-dot'){for(const b of document.querySelectorAll('.dots button')){b.classList.toggle('active',b===el);b.setAttribute('aria-pressed',b===el);} /* Figma repeats the same testimonial across all three cards. */}
});
document.addEventListener('input',e=>{
 if(e.target.id==='nameInput'){state.name=e.target.value;save();$('#footer .cta').disabled=!state.name.trim();}
 if(e.target.id==='bindingEmail'){state.bindingEmail=e.target.value;save();$('.binding-cta')?.toggleAttribute('disabled',!ready());}
 if(e.target.id==='bindingName'){state.bindingName=e.target.value;save();$('.binding-cta')?.toggleAttribute('disabled',!ready());}
 if(e.target.id==='bindingPhone'){state.bindingPhone=e.target.value;save();}
});
document.addEventListener('change',e=>{if(e.target.id==='bindingCountry'){state.bindingCountry=e.target.value;save();}});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&modal){e.preventDefault();closeOverlay();return;}
 if(modal&&e.key==='Tab'){const buttons=Array.from($('#overlay').querySelectorAll('button:not(:disabled),a,input'));if(!buttons.length)return;const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 if(e.key==='Enter'&&e.target.id==='nameInput'&&ready()){e.preventDefault();next();}
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&e.target.getAttribute('role')==='radio'){
 const group=e.target.closest('[role="radiogroup"]');if(!group)return;const options=Array.from(group.querySelectorAll('[role="radio"]'));const dir=['ArrowRight','ArrowDown'].includes(e.key)?1:-1;const target=options[(options.indexOf(e.target)+dir+options.length)%options.length];e.preventDefault();target.click();const sel=target.dataset.plan?`[data-plan="${target.dataset.plan}"]`:`[data-index="${target.dataset.index}"]`;group.isConnected?group.querySelector(sel)?.focus():$(modal?'#overlay':'#scene').querySelector(sel)?.focus();
 }
});
for(const id of ['photoInput','cameraInput'])$('#'+id).addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!file.type.startsWith('image/')){showToast('Please choose an image.');return;}if(file.size>10*1024*1024){showToast('Please choose an image under 10 MB.');return;}
 const url=URL.createObjectURL(file);try{const test=new Image();test.src=url;await test.decode();if(draftUpload&&draftUpload!==uploadedUrl)URL.revokeObjectURL(draftUpload);draftUpload=url;draftAvatar=-1;renderAvatarSheet();$('#overlay .sheet-done').focus({preventScroll:true});}catch{URL.revokeObjectURL(url);showToast('This image could not be opened. Try JPG or PNG.');}
});
$('#overlay').addEventListener('click',e=>{if(e.target===$('#overlay'))closeOverlay();});
$('#previousScreen').addEventListener('click',previous);$('#nextScreen').addEventListener('click',next);
document.addEventListener('dblclick',e=>{if(e.target.closest?.('button'))e.preventDefault();},{passive:false});
addEventListener('hashchange',route);addEventListener('resize',()=>{fit();syncScroller();});
if(reviewMode)buildReview();route();
