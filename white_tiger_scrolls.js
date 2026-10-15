(()=>{
 const board=document.createElement('section');board.className='tiger-scrolls';board.setAttribute('aria-label','白虎守约');
 board.innerHTML='<details class="tiger-scroll" open><summary>立 约 <span class="task-count"></span></summary><div class="scroll-paper"><div class="tiger-task-list" data-status="active"></div><button type="button" class="tiger-add">＋ 落笔立约</button></div></details><details class="tiger-scroll" open><summary>成 约 <span class="task-count"></span></summary><div class="scroll-paper"><div class="tiger-task-list" data-status="done"></div></div></details>';
 document.querySelector('.desk').append(board);
 function render(){const tasks=window.whiteTigerTasks.list();board.querySelectorAll('.tiger-task-list').forEach(list=>{
  const rows=tasks.filter(w=>w.status===list.dataset.status);list.replaceChildren();list.closest('details').querySelector('.task-count').textContent=rows.length||'';
  if(!rows.length){const empty=document.createElement('p');empty.className='scroll-empty';empty.textContent=list.dataset.status==='active'?'写下要守住的一件事。':'每一次践行，都落在这里。';list.append(empty);}
  rows.forEach(w=>{const row=document.createElement('article');row.className='tiger-task';const title=document.createElement('span');title.textContent=w.name;row.append(title);
   if(w.content){const text=document.createElement('p');text.textContent=w.content;row.append(text);}
   const date=w.status==='done'?w.doneAt:w.targetDate;if(date){const small=document.createElement('small');small.textContent=w.status==='done'?'成约 · '+new Date(date).toLocaleDateString('zh-CN'):'期限 · '+date;row.append(small);}
   if(w.status==='done'){const stamp=document.createElement('span');stamp.className='tiger-paw-stamp';stamp.setAttribute('role','img');stamp.setAttribute('aria-label','虎爪成约印');stamp.innerHTML='<svg viewBox="0 0 80 80" aria-hidden="true"><g fill="currentColor"><ellipse cx="17" cy="29" rx="8" ry="11" transform="rotate(-25 17 29)"/><ellipse cx="32" cy="20" rx="8" ry="12" transform="rotate(-8 32 20)"/><ellipse cx="49" cy="20" rx="8" ry="12" transform="rotate(8 49 20)"/><ellipse cx="64" cy="29" rx="8" ry="11" transform="rotate(25 64 29)"/><path d="M20 53c0-8 8-21 20-21s20 13 20 21c0 10-9 13-15 9-3-2-7-2-10 0-6 4-15 1-15-9Z"/></g></svg>';row.append(stamp);}
   const actions=document.createElement('div');actions.className='tiger-task-actions';const button=document.createElement('button');button.type='button';button.textContent=w.status==='active'?'盖印成约':'重启此约';button.onclick=()=>{window.whiteTigerTasks.set(w.id,w.status==='active'?'done':'active');};actions.append(button);
   const remove=document.createElement('button');remove.type='button';remove.textContent='移除';remove.onclick=()=>window.whiteTigerTasks.set(w.id,'released');actions.append(remove);row.append(actions);list.append(row);
  });
 });}
 board.querySelector('.tiger-add').onclick=()=>window.whiteTigerTasks.add();document.addEventListener('white-tiger-tasks-change',render);render();
})();

