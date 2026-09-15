import * as T from 'three';
// Both shots continue moving behind one softly feathered, directional transition.
export function createSceneOverlap(){
 const a=new T.WebGLRenderTarget(1,1,{depthBuffer:true}),b=a.clone(),scene=new T.Scene(),camera=new T.Camera();
 const uniforms={a:{value:a.texture},b:{value:b.texture},mixAmount:{value:0}};
 const material=new T.ShaderMaterial({uniforms,depthWrite:false,depthTest:false,vertexShader:'varying vec2 uvScreen;void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`varying vec2 uvScreen;uniform sampler2D a;uniform sampler2D b;uniform float mixAmount;void main(){float front=mixAmount*1.7-.35;float edge=1.-uvScreen.x+.07*sin(uvScreen.y*7.);float blend=1.-smoothstep(front-.30,front+.30,edge);blend=mixAmount<.001?0.:mixAmount>.999?1.:blend;gl_FragColor=mix(texture2D(a,uvScreen),texture2D(b,uvScreen),blend);}`});
 const plane=new T.Mesh(new T.PlaneGeometry(2,2),material);plane.frustumCulled=false;scene.add(plane);const size=new T.Vector2();
 return{render(renderer,drawA,drawB,amount){renderer.getDrawingBufferSize(size);if(a.width!==size.x||a.height!==size.y){a.setSize(size.x,size.y);b.setSize(size.x,size.y);}const previous=renderer.getRenderTarget();try{renderer.setRenderTarget(a);drawA();renderer.setRenderTarget(b);drawB();renderer.setRenderTarget(previous);uniforms.mixAmount.value=amount;renderer.render(scene,camera);}finally{renderer.setRenderTarget(previous);}}};
}
