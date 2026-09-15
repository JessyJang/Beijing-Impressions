import assert from 'node:assert/strict';
import * as T from 'three';
import {createPointBudget} from '../src/point-budget.js';
import {createShotTransition} from '../src/shot-transition.js';
import {routeAt} from '../src/spatial-route.js';
const make=n=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(n*3),3));return new T.Points(g,new T.ShaderMaterial({uniforms:{presence:{value:1}}}));};
const a=make(10000),b=make(20000),root=new T.Group();root.add(b);
b.userData.preserveDetail=true;
const budget=createPointBudget([a,b]),counts=[a.geometry.drawRange.count,b.geometry.drawRange.count];
for(const hidden of [true,false,true,false]){root.visible=!hidden;b.material.uniforms.presence.value=hidden?0:1;budget.update();assert.deepEqual([a.geometry.drawRange.count,b.geometry.drawRange.count],counts);}
assert.equal(b.geometry.drawRange.count,20000,'Detail-preserving cloud keeps all source points');
const scene=new T.Scene(),camera=new T.PerspectiveCamera(),transition=createShotTransition(scene,camera);
const veil=camera.children.find(c=>c.material?.uniforms?.amount);
for(let t=1;t<=36.2;t+=.05){transition.update(routeAt(t),t,false,600);assert.equal(veil.material.uniforms.amount.value,0,'No full-screen dim between landmarks');}
console.log('Fixed cloud density across visibility changes and no mid-film dimming passed.');
