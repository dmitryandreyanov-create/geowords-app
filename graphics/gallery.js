(()=>{
 const root=document.getElementById('gallery'),progress=document.getElementById('progress'),button=document.getElementById('background');
 button.addEventListener('click',()=>{const teal=document.body.classList.toggle('teal');button.textContent=teal?'Светлый фон':'Бирюзовый фон'});
 fetch('../data/graphics-manifest.json').then(r=>{if(!r.ok)throw Error('Список недоступен');return r.json()}).then(({assets})=>{
  const ready=assets.filter(a=>a.status==='ready');progress.textContent=`Готово ${ready.length} из ${assets.length} файлов по списку. Остальные добавляются партиями.`;
  const navigation=document.createElement('nav');navigation.setAttribute('aria-label','Разделы графики');root.append(navigation);
  for(const group of [...new Set(ready.map(a=>a.group))]){
   const id='group-'+group.charAt(0),heading=document.createElement('h2');heading.id=id;heading.textContent=group;root.append(heading);
   const jump=document.createElement('a');jump.href='#'+id;jump.textContent=group.split('.')[0];navigation.append(jump);
   const section=document.createElement('section');section.setAttribute('aria-labelledby',id);root.append(section);
   ready.filter(a=>a.group===group).forEach(a=>{const card=document.createElement('article');if(a.width/a.height>1.3)card.className='wide';const link=document.createElement('a');link.href='../'+a.path;const img=document.createElement('img');img.src='../'+(a.gamePath||a.path);img.alt=a.description;img.loading='lazy';img.width=a.width;img.height=a.height;img.style.aspectRatio=`${a.width}/${a.height}`;link.append(img);const title=document.createElement('h3');title.textContent=a.file;const p=document.createElement('p');p.textContent=a.description;const details=document.createElement('p');details.className='details';details.textContent=`${a.width} × ${a.height} · ждёт просмотра на телефоне`;card.append(link,title,p,details);section.append(card)});
  }
  const heading=document.createElement('h2');heading.textContent='Следующие партии';root.append(heading);
  for(const group of [...new Set(assets.filter(a=>a.status!=='ready').map(a=>a.group))]){const p=document.createElement('p');p.className='planned';p.textContent=group+' — '+assets.filter(a=>a.group===group&&a.status!=='ready').length+' файлов';root.append(p)}
 }).catch(e=>{progress.textContent=e.message});
})();
