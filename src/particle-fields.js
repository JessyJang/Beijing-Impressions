import * as T from 'three';
// Spatial density is tied to the surface, so it only needs to be computed at load.
// Integer lattice noise avoids evaluating dozens of trigonometric hashes per vertex per frame.
function hash(x,y,z){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,2147483647);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;}
function noise(x,y,z){
 const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);let u=x-ix,v=y-iy,w=z-iz;u=u*u*(3-2*u);v=v*v*(3-2*v);w=w*w*(3-2*w);
 const a=hash(ix,iy,iz),b=hash(ix+1,iy,iz),c=hash(ix,iy+1,iz),d=hash(ix+1,iy+1,iz),e=hash(ix,iy,iz+1),f=hash(ix+1,iy,iz+1),g=hash(ix,iy+1,iz+1),h=hash(ix+1,iy+1,iz+1);
 const low=(a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v,high=(e+(f-e)*u)*(1-v)+(g+(h-g)*u)*v;return low+(high-low)*w;
}
export function attachSpatialField(geometry,coarse,fine=coarse,weight=.7){
 const p=geometry.attributes.position.array,values=new Float32Array(p.length/3);
 for(let i=0;i<values.length;i++){const x=p[i*3],y=p[i*3+1],z=p[i*3+2];values[i]=weight*noise(x*coarse,y*coarse,z*coarse)+(1-weight)*noise(x*fine,y*fine,z*fine);}
 geometry.setAttribute('spatialField',new T.BufferAttribute(values,1));
}
