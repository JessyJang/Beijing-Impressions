const chapters=[
 {en:'TEMPLE OF HEAVEN',title:'天坛 · 祈年殿',copy:'柏影深处，天光落在三重檐上。',range:[1.1,5.9],mark:'I',tone:'#c7bf9f',path:'M12 62Q46 59 60 45Q74 59 108 62M20 47Q47 45 60 31Q73 45 100 47M32 32Q51 29 60 16Q69 29 88 32M30 64V75H90V64M60 10V17'},
 {en:'TIANQIAO',title:'天桥 · 四面钟',copy:'钟声之外，街巷正热。',range:[.2,4.4],mark:'II',tone:'#d0ad7d',path:'M60 16A24 24 0 1 1 59.99 16M60 24V40L73 48M47 65V78H73V65M32 80H88M60 12V8M28 40H24M96 40H92'},
 {en:'HUTONG COURTYARD',title:'胡同 · 四合院',copy:'推开一扇门，看见一方日常。',range:[4.35,6.85],mark:'III',tone:'#c8aa85',path:'M22 18H98V76H69M51 76H22V18M32 28H88V66H32V28M42 38H78V56H42V38M51 66V83M69 66V83'},
 {en:'CCTV HEADQUARTERS',title:'中央电视台总部大楼',copy:'城市的线条，在空中相遇。',range:[.9,4.5],mark:'IV',tone:'#9bbdc9',path:'M28 79L39 16H91L82 45H63L56 79Z M39 16L51 29H77L70 38H54L45 79M91 16L77 29M82 45L70 38'},
 {en:'CITIC TOWER',title:'中国尊',copy:'从街巷到云端，北京向远处展开。',range:[1.9,7.25],mark:'V',tone:'#adc2d7',path:'M43 80Q53 47 45 12H75Q67 47 77 80ZM50 80Q57 47 52 12M60 80V12M70 80Q63 47 68 12M39 83H81'},
];
chapters.push({en:'FORBIDDEN CITY · CORNER TOWER',title:'角楼 · 初雪',copy:'雪落宫墙，飞鸟掠过城的轮廓。',range:[1.6,5.3],tone:'#adc2d7'});
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*t*(t*(t*6-15)+10);};
export function createEditorialFrame(){
 const root=document.createElement('aside');root.className='editorial-frame';root.setAttribute('aria-label','城市影像题记');
 root.innerHTML=`<div class="frame-rule" aria-hidden="true"></div><div class="scene-caption"><div class="caption-body"><div class="caption-kicker"></div><h1></h1><p></p></div></div>`;
 document.body.appendChild(root);
 const caption=root.querySelector('.scene-caption'),title=root.querySelector('h1'),copy=root.querySelector('p'),english=root.querySelector('.caption-kicker');
 let active=-1,letters=[],effectKey="";
 return{update(place,local,blackout,quiet){
  const data=chapters[place];
  if(active!==place){
   active=place;effectKey="";root.dataset.scene=String(place);root.style.setProperty('--ink',data.tone);
   english.textContent=data.en;copy.textContent=data.copy;title.replaceChildren();title.setAttribute('aria-label',data.title);
   letters=[...data.title].map(char=>{const span=document.createElement('span');span.textContent=char===' '?'\u00a0':char;span.setAttribute('aria-hidden','true');title.appendChild(span);return span;});

  }
  const enter=quiet?1:smooth(data.range[0],data.range[0]+.72,local),leave=quiet?0:smooth(data.range[1]-.62,data.range[1],local),visibility=(1-blackout);
  const opacity=enter*(1-leave)*visibility;
  root.style.setProperty('--caption-opacity',String(opacity));root.style.setProperty('--frame-opacity',String(.36*visibility));
  root.style.setProperty('--reveal',String(enter));
  english.style.clipPath=`inset(0 ${(1-enter)*100}% 0 0)`;
  copy.style.opacity=String(quiet?1:smooth(data.range[0]+.36,data.range[0]+1.02,local));

  const key=quiet?"quiet":local<data.range[0]+1.15?local.toFixed(3):`${enter.toFixed(3)}:${leave.toFixed(3)}`;
  if(key!==effectKey){effectKey=key;
  letters.forEach((span,i)=>{
   const p=quiet?1:smooth(data.range[0]+i*.033,data.range[0]+.54+i*.033,local);
   span.style.opacity=String(p*(1-leave));
   span.style.transform=`translate3d(${((1-p)*((i%3)-1)*6+leave*(i-letters.length/2)*2).toFixed(2)}px,${((1-p)*(6+i%3*3)-leave*(4+i%4*2)).toFixed(2)}px,0)`;
   span.style.filter=`blur(${((1-p)*3+leave*2).toFixed(2)}px)`;
  });
  }
  caption.setAttribute('aria-hidden',opacity<.05?'true':'false');
 }};
}
