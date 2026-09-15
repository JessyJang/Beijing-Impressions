import * as T from 'three';
// Bake the static procedural sky once. Stars remain independent animated 3D points.
export function createNebulaTexture(){
 const width=768,height=384,data=new Uint8Array(width*height*4);
 const fract=x=>x-Math.floor(x),mix=(a,b,t)=>a+(b-a)*t;
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const hash=(x,y,z)=>fract(Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453);
 function noise(x,y,z){
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);let u=fract(x),v=fract(y),w=fract(z);u=u*u*(3-2*u);v=v*v*(3-2*v);w=w*w*(3-2*w);
  return mix(mix(mix(hash(ix,iy,iz),hash(ix+1,iy,iz),u),mix(hash(ix,iy+1,iz),hash(ix+1,iy+1,iz),u),v),mix(mix(hash(ix,iy,iz+1),hash(ix+1,iy,iz+1),u),mix(hash(ix,iy+1,iz+1),hash(ix+1,iy+1,iz+1),u),v),w);
 }
 for(let j=0;j<height;j++)for(let i=0;i<width;i++){
  const theta=(1-(j+.5)/height)*Math.PI,phi=(i+.5)/width*Math.PI*2;
  const x=-Math.cos(phi)*Math.sin(theta),y=Math.cos(theta),z=Math.sin(phi)*Math.sin(theta);
  const n=noise(x*4+3,y*4+1,z*4+9),wisps=noise(x*12+n*2,y*12+n*2,z*12+n*2),fine=noise(x*29,y*29,z*29);
  const band=Math.exp(-1*((y+x*.36-.08)*3.2)**2),cloud=band*smooth(.28,.78,n)*(.35+wisps*.65),t=smooth(.32,.7,wisps);
  const col=[.009+cloud*mix(.028,.105,t)+.032*cloud*cloud*fine,.016+cloud*mix(.10,.045,t)+.055*cloud*cloud*fine,.031+cloud*mix(.14,.15,t)+.067*cloud*cloud*fine];
  const offset=(j*width+i)*4,dither=(hash(i,j,5)-.5)/255;
  for(let c=0;c<3;c++)data[offset+c]=Math.round(Math.max(0,col[c]+dither)*255);data[offset+3]=255;
 }
 const texture=new T.DataTexture(data,width,height);texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearFilter;texture.wrapS=T.RepeatWrapping;texture.needsUpdate=true;return texture;
}
