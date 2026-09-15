// Spatially related patches share a current; loose grains and settled detail coexist.
export const grainFlowGLSL=`
float grainRegion(vec3 p){
 return clamp(.5+.24*sin(p.x*.13+sin(p.z*.11)*1.7)+.19*sin(p.y*.19-p.z*.09),0.,1.);
}
vec3 grainFlow(vec3 destination,float seed,float form,float time,float mode){
 float a=fract(seed*173.71),b=fract(seed*311.39);
 float u=clamp(form,0.,1.),v=1.-u;
 float angle=a*6.2831853;
 if(mode<.5){
  // Temple: independent grains approach a stable surface; no stretched roof sheets.
  if(destination.y<2.5)return destination;
  if(b<.72){
   vec3 offset=vec3(cos(angle),sin(seed*91.)*.65,sin(angle))*(2.+a*5.);
   return destination+offset*v*v;
  }
  float lane=floor(a*3.);
  vec3 origin=vec3(-28.+lane*23.+sin(seed*41.)*5.,5.+b*17.,27.+a*18.);
  vec3 crest=mix(origin,destination,.48)+vec3(-8.,5.+a*7.,-9.);
  return v*v*origin+2.*v*u*crest+u*u*destination;
 }
 if(mode>.5&&mode<1.5){
  // Clock tower: retained exactly as approved.
  vec3 origin=vec3(cos(angle)*(18.+b*24.),-18.-a*12.,sin(angle)*(18.+b*24.));
  vec3 crest=vec3(destination.x*.45,destination.y+22.+b*12.,destination.z*.45);
  return v*v*origin+2.*v*u*crest+u*u*destination;
 }
 float region=grainRegion(destination);
 float phase=region*5.3+mode*.71;
 vec3 direction=normalize(vec3(cos(phase),.3+sin(phase*.73)*.55,sin(phase)));
 float reach=28.+region*28.;
 vec3 source=destination*.16+direction*reach;
 // Different amounts of lift and spread, within the same continuous flow language.
 source.y+=(mode>4.5?26.:mode>3.5?-20.:mode>2.5?8.:4.);
 if(mode>1.5&&mode<2.5)source.y*=.45;
 source+=vec3(sin(seed*39.),cos(seed*27.),sin(seed*53.))*(1.2+b*2.5);
 vec3 tangent=vec3(-direction.z,.35,direction.x);
 vec3 bend=destination*.50+direction*reach*.25+tangent*(9.+region*10.);
 bend.y+=mode>4.5?12.:mode>3.5?18.:8.;
 vec3 p=v*v*source+2.*v*u*bend+u*u*destination;
 // Gentle moving bends vanish at both ends; no rigid spinning or floor-wise translation.
 float wave=sin(u*3.14159265)*v;
 p+=tangent*sin(time*.55+region*6.+b*.5)*wave*2.4;
 return p;
}
`;
