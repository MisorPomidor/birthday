(() => {
  'use strict';
  const CONFIG = { secretCode: 'KATYA-2312-7Q', storageKey: 'katya-sudoku-v1', hints: 2 };
  // This well-known puzzle has a single solution; it avoids slow client-side generation.
  const puzzle = [
    [1,0,0,0,0,7,0,9,0],[0,3,0,0,2,0,0,0,8],[0,0,9,6,0,0,5,0,0],
    [0,0,5,3,0,0,9,0,0],[0,1,0,0,8,0,0,0,2],[6,0,0,0,0,4,0,0,0],
    [3,0,0,0,0,0,0,1,0],[0,4,0,0,0,0,0,0,7],[0,0,7,0,0,0,3,0,0]
  ];
  const solution = [
    [1,6,2,8,5,7,4,9,3],[5,3,4,1,2,9,6,7,8],[7,8,9,6,4,3,5,2,1],
    [4,7,5,3,1,2,9,8,6],[9,1,3,5,8,6,7,4,2],[6,2,8,7,9,4,1,3,5],
    [3,5,6,4,7,8,2,1,9],[2,4,1,9,3,5,8,6,7],[8,9,7,2,6,1,3,5,4]
  ];
  const $ = id => document.getElementById(id);
  const els = { intro:$('intro'), game:$('game'), finale:$('finale'), board:$('board'), keypad:$('keypad'), timer:$('timer'), mistakes:$('mistakes'), progress:$('progress'), status:$('status'), hints:$('hintsLeft'), modal:$('modal'), confetti:$('confetti') };
  let state = { board: puzzle.map(r => [...r]), selected:null, mistakes:0, hints:CONFIG.hints, undo:[], seconds:0, completed:false };
  let timerId = null;
  function save(){ localStorage.setItem(CONFIG.storageKey, JSON.stringify(state)); }
  function load(){ try { const saved=JSON.parse(localStorage.getItem(CONFIG.storageKey)); if(saved && Array.isArray(saved.board)) state={...state,...saved,selected:null}; } catch(_){} }
  function show(name){ ['intro','game','finale'].forEach(n=>{els[n].hidden=n!==name;els[n].classList.toggle('is-active',n===name);}); if(name==='game') startTimer(); else stopTimer(); }
  function startTimer(){ if(!timerId&&!state.completed) timerId=setInterval(()=>{state.seconds++; renderStats();save();},1000); }
  function stopTimer(){clearInterval(timerId);timerId=null;}
  function fixed(r,c){return puzzle[r][c]!==0;}
  function render(){ els.board.innerHTML=''; state.board.forEach((row,r)=>row.forEach((val,c)=>{const b=document.createElement('button');b.className='cell';b.type='button';b.dataset.r=r;b.dataset.c=c;b.setAttribute('role','gridcell');b.setAttribute('aria-label',`Рядок ${r+1}, стовпчик ${c+1}${val?`, цифра ${val}`:', порожньо'}`);b.textContent=val||'';if(fixed(r,c))b.classList.add('fixed');if(state.selected){const[sr,sc]=state.selected;if(r===sr||c===sc||(Math.floor(r/3)===Math.floor(sr/3)&&Math.floor(c/3)===Math.floor(sc/3)))b.classList.add('related');if(r===sr&&c===sc)b.classList.add('selected');if(val&&val===state.board[sr][sc])b.classList.add('same');}els.board.append(b);})); renderStats(); }
  function renderStats(){ const filled=state.board.flat().filter(Boolean).length, entered=filled-puzzle.flat().filter(Boolean).length, total=81-puzzle.flat().filter(Boolean).length;els.progress.style.width=`${Math.round(entered/total*100)}%`;els.mistakes.textContent=state.mistakes;els.hints.textContent=state.hints;const m=Math.floor(state.seconds/60).toString().padStart(2,'0'),s=(state.seconds%60).toString().padStart(2,'0');els.timer.textContent=`${m}:${s}`; }
  function setStatus(){const filled=state.board.flat().filter(Boolean).length;let text='Спокійно, уважно — і все вийде ✦';if(filled>54)text='Ще трохи — ти майже біля фінішу';else if(filled>40)text='У тебе виходить!';else if(filled>32)text='Гарний початок ✨';els.status.textContent=text;}
  function select(r,c){if(state.completed)return;state.selected=[r,c];render();}
  function input(n){if(!state.selected||state.completed)return;const[r,c]=state.selected;if(fixed(r,c))return;const before=state.board[r][c];if(before===n)return;state.undo.push({r,c,value:before});state.board[r][c]=n;if(n && n!==solution[r][c]){state.mistakes++;els.status.textContent='Ця цифра не підходить — спробуй ще раз.';setTimeout(()=>{if(state.board[r][c]===n){state.board[r][c]=0;render();save();}},500);}else{setStatus();checkDone();}render();save();}
  function erase(){if(!state.selected)return;const[r,c]=state.selected;if(!fixed(r,c)&&state.board[r][c]){state.undo.push({r,c,value:state.board[r][c]});state.board[r][c]=0;render();save();}}
  function undo(){const last=state.undo.pop();if(last&&!fixed(last.r,last.c)){state.board[last.r][last.c]=last.value;render();save();}}
  function hint(){if(state.hints<1||state.completed)return;let target=state.selected&&!fixed(...state.selected)&&!state.board[state.selected[0]][state.selected[1]]?state.selected:null;if(!target){outer:for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(!state.board[r][c]){target=[r,c];break outer;}}if(!target)return;const[r,c]=target;state.undo.push({r,c,value:state.board[r][c]});state.board[r][c]=solution[r][c];state.hints--;state.selected=target;els.status.textContent='Маленька підказка вже на дошці ✦';render();save();checkDone();}
  function checkDone(){if(state.board.flat().every((n,i)=>n===solution.flat()[i])){state.completed=true;save();stopTimer();els.status.textContent='У тебе все вийшло! ✨';render();launchConfetti();setTimeout(()=>show('finale'),1200);}}
  function launchConfetti(){const cv=els.confetti,ctx=cv.getContext('2d');cv.width=innerWidth;cv.height=innerHeight;const bits=Array.from({length:75},()=>({x:Math.random()*cv.width,y:-20-Math.random()*cv.height*.35,s:4+Math.random()*5,c:['#d2a757','#c58da2','#a99ad5','#e69f76'][Math.floor(Math.random()*4)],v:2+Math.random()*3}));let frame=0;function draw(){ctx.clearRect(0,0,cv.width,cv.height);bits.forEach(b=>{b.y+=b.v;b.x+=Math.sin(b.y/32);ctx.fillStyle=b.c;ctx.fillRect(b.x,b.y,b.s,b.s*1.7);});if(frame++<110)requestAnimationFrame(draw);else ctx.clearRect(0,0,cv.width,cv.height);}draw();}
  function copyCode(){const code=CONFIG.secretCode;const done=()=>{const b=$('copyBtn');b.textContent='Код скопійовано!';els.copyStatus.textContent='Код скопійовано — надішли його мені в Telegram 😉';setTimeout(()=>b.textContent='Скопіювати код',1800);};if(navigator.clipboard&&isSecureContext)navigator.clipboard.writeText(code).then(done).catch(()=>fallback());else fallback();function fallback(){const t=document.createElement('textarea');t.value=code;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();try{document.execCommand('copy');done();}catch(_){els.copyStatus.textContent='Виділи код вище та скопіюй його вручну.';}t.remove();}}
  $('startBtn').addEventListener('click',()=>{show('game');render();});els.board.addEventListener('click',e=>{const b=e.target.closest('.cell');if(b)select(+b.dataset.r,+b.dataset.c);});els.keypad.addEventListener('click',e=>{const b=e.target.closest('.number');if(b)input(+b.dataset.number);});$('eraseBtn').addEventListener('click',erase);$('undoBtn').addEventListener('click',undo);$('hintBtn').addEventListener('click',hint);$('leaveBtn').addEventListener('click',()=>els.modal.hidden=false);$('stayBtn').addEventListener('click',()=>els.modal.hidden=true);$('confirmLeaveBtn').addEventListener('click',()=>{els.modal.hidden=true;show('intro');});$('copyBtn').addEventListener('click',copyCode);
  document.addEventListener('keydown',e=>{if(!els.game.hidden){if(/^[1-9]$/.test(e.key))input(+e.key);if(e.key==='Backspace'||e.key==='Delete')erase();if(e.key==='ArrowUp'||e.key==='ArrowDown'||e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();let[r,c]=state.selected||[0,0];if(e.key==='ArrowUp')r=(r+8)%9;if(e.key==='ArrowDown')r=(r+1)%9;if(e.key==='ArrowLeft')c=(c+8)%9;if(e.key==='ArrowRight')c=(c+1)%9;select(r,c);}}});
  for(let n=1;n<=9;n++){const b=document.createElement('button');b.className='number';b.type='button';b.dataset.number=n;b.textContent=n;b.setAttribute('aria-label',`Ввести цифру ${n}`);els.keypad.append(b);}load();if(state.completed)show('finale');render();
})();
