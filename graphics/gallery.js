(()=>{
 const root=document.getElementById('gallery'),progress=document.getElementById('progress'),button=document.getElementById('background');
 button.addEventListener('click',()=>{const teal=document.body.classList.toggle('teal');button.textContent=teal?'Светлый фон':'Бирюзовый фон'});
 fetch('../data/graphics-manifest.json').then(r=>{if(!r.ok)throw Error('Список недоступен');return r.json()}).then(({assets})=>{
  const ready=assets.filter(a=>a.status==='ready');progress.textContent=`Готово ${ready.length} из ${assets.length} файлов по списку. Остальные добавляются партиями.`;
  const section=document.createElement('section');root.append(section);
  ready.forEach(a=>{const card=document.createElement('article');if(a.file==='pip-sheet.png')card.className='wide';const link=document.createElement('a');link.href='../'+a.path;const img=document.createElement('img');img.src=link.href;img.alt=a.description;img.loading='lazy';link.append(img);const title=document.createElement('h3');title.textContent=a.file;const p=document.createElement('p');p.textContent=a.description;card.append(link,title,p);section.append(card)});
  const heading=document.createElement('h2');heading.textContent='Следующие партии';root.append(heading);
  for(const group of [...new Set(assets.filter(a=>a.status!=='ready').map(a=>a.group))]){const p=document.createElement('p');p.className='planned';p.textContent=group+' — '+assets.filter(a=>a.group===group&&a.status!=='ready').length+' файлов';root.append(p)}
 }).catch(e=>{progress.textContent=e.message});
})();
