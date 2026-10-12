const $=id=>document.getElementById(id);
const v=$('v'),seek=$('seek'),info=$('info'),t=$('t');
let fps=30,name='video';
const drop=$('drop'),file=$('file');
drop.onclick=()=>file.click();
file.onchange=()=>file.files[0]&&load(file.files[0]);
drop.ondragover=e=>{e.preventDefault();drop.classList.add('over')};
drop.ondragleave=()=>drop.classList.remove('over');
drop.ondrop=e=>{e.preventDefault();drop.classList.remove('over');e.dataTransfer.files[0]&&load(e.dataTransfer.files[0])};

function load(f){
  name=f.name.replace(/\.[^.]+$/,'');
  v.src=URL.createObjectURL(f);
  v.style.display='block';$('ctrl').style.display='block';
  v.onloadedmetadata=()=>{seek.max=v.duration;estimateFps();update()};
}
// 실제 프레임레이트 추정 (재생 중 프레임 콜백 간격 측정)
function estimateFps(){
  if(!v.requestVideoFrameCallback)return;
  const times=[];
  const cb=(now,m)=>{
    times.push(m.mediaTime);
    if(times.length<12){v.requestVideoFrameCallback(cb)}
    else{
      v.pause();
      const d=(times[times.length-1]-times[1])/(times.length-2);
      if(d>0)fps=Math.round(1/d*100)/100;
      v.currentTime=0;update();
    }
  };
  v.requestVideoFrameCallback(cb);
  v.play().catch(()=>{});
}
function update(){
  seek.value=v.currentTime;t.value=v.currentTime.toFixed(2);
  info.textContent=`${v.currentTime.toFixed(3)}s / ${v.duration.toFixed(2)}s · 프레임 ${Math.round(v.currentTime*fps)} · ${v.videoWidth}×${v.videoHeight} · 약 ${fps}fps`;
}
function step(n){v.pause();v.currentTime=Math.max(0,Math.min(v.duration,v.currentTime+n/fps))}
v.ontimeupdate=update;v.onseeked=update;
seek.oninput=()=>{v.pause();v.currentTime=+seek.value};
$('back').onclick=()=>step(-1);
$('fwd').onclick=()=>step(1);
$('go').onclick=()=>{v.pause();v.currentTime=+t.value};
function save(){
  const c=document.createElement('canvas');
  c.width=v.videoWidth;c.height=v.videoHeight;
  c.getContext('2d').drawImage(v,0,0);
  c.toBlob(b=>{
    const a=document.createElement('a');
    a.href=URL.createObjectURL(b);
    a.download=`${name}_${v.currentTime.toFixed(2)}s.png`;
    a.click();URL.revokeObjectURL(a.href);
  },'image/png');
}
$('save').onclick=save;
addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'&&e.target.type==='number')return;
  if(!v.src)return;
  if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}
  else if(e.key==='ArrowRight'){e.preventDefault();step(1)}
  else if(e.key==='s'||e.key==='S')save();
  else if(e.key===' '){e.preventDefault();v.paused?v.play():v.pause()}
});
