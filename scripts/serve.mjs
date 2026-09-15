import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.png': 'image/png', '.wav': 'audio/wav', '.points': 'application/octet-stream' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const allowed = pathname === '/' || pathname === '/index.html' || pathname.startsWith('/src/') || pathname === '/assets/beijing/audio/beijing-orbit.wav' || /^\/assets\/beijing\/models\/(tiantan|tianqiao|siheyuan|cctv|chinazun)\.(points|json)$/.test(pathname) || ['/assets/beijing/approved-storyboard.png','/assets/beijing/clean-storyboard.png'].includes(pathname) || /^\/archive\/weather-continuous\/(index\.html|main\.js|style\.css)$/.test(pathname) || pathname.startsWith('/node_modules/three/build/') || pathname.startsWith('/node_modules/three/examples/jsm/');
    const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname.startsWith('/assets/') ? '/public' + pathname : pathname));
    if (!allowed || !target.startsWith(root) || pathname.split('/').some(part => part.startsWith('.'))) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    const content = await readFile(target);
    const headers={ 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': content.length };
    if(path.extname(target)==='.wav'){
      headers['Accept-Ranges']='bytes';
      if(req.headers.range){
        const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        let start=match&&match[1]?Number(match[1]):0,end=match&&match[2]?Number(match[2]):content.length-1;
        if(match&&!match[1]&&match[2]){start=Math.max(0,content.length-Number(match[2]));end=content.length-1;}
        end=Math.min(end,content.length-1);
        if(!match||start>end||start>=content.length){res.writeHead(416,{'Content-Range':`bytes */${content.length}`});res.end();return;}
        res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${content.length}`});res.end(content.subarray(start,end+1));return;
      }
    }
    res.writeHead(200, headers);
    res.end(content);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(5173, '127.0.0.1', () => console.log('空间探索室：http://127.0.0.1:5173'));
