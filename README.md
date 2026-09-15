# Beijing Impressions · 北京·印象

GPT-6 Astra 带我感受了一把理科生的浪漫——用百万粒子，收藏一座印象里的北京。除了独特的建筑，印象里还有四合院里的落叶、宫墙上的初雪，以及从屋檐旁飞过的鸟。

后续有时间，或许会在这片星云里增加其他建筑和场景，让镜头穿行其间，看到建筑，也看到生活的痕迹。

陆陆续续耗时 24 小时的尝试。整体交互基于 Three.js 实时渲染，由 GPT-6 Astra 辅助开发，结合三维点云、GLSL 粒子着色器和镜头路径编排。

创作：JessyJang。

当前版本：`beijing-corner-detail-v43`。六个场景依次为祈年殿、角楼初雪、天桥四面钟、四合院、央视总部和中国尊，全片约 55 秒，自动循环。

## 本地运行

使用 Node.js 20 或更高版本：

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:5173/ 。不要直接双击 `index.html`：ES 模块和资源路径需要 HTTP 服务。首次安装依赖需要联网，安装后运行不依赖在线模型服务或 API 密钥。

- 点击右上角开启声音。
- 空格暂停 / 继续，F 切换全屏。
- 开发定格：`?t=4.5` 查看祈年殿，`?snow=3.4` 查看第二幕初雪。

## 技术与数据

Three.js 0.180.0、三维彩色点云、自定义 GLSL 着色器、连续相机路径、Web Audio / HTML 音频同步。普通点云不是 3D Gaussian Splatting。

| 点云资产 | 源点数 |
| --- | ---: |
| 祈年殿 | 1,400,000 |
| 四面钟 | 999,991 |
| 四合院 | 2,014,962 |
| CCTV 总部 | 854,000 |
| 中国尊 | 798,996 |

初雪场景由程序生成，包含约 133 万个建筑及环境源点，另有雪与飞鸟。运行时按固定预算采样，源点数不等于同时绘制点数；较弱设备可能掉帧。

## 代码入口

- `src/main.js`：场景与播放循环。
- `src/spatial-models.js`、`src/grain-flow.js`：点云加载、着色与粒子轨迹。
- `src/spatial-route.js`、`src/winter-route.js`：空间路径与镜头衔接。
- `src/winter-finale.js`：第二幕角楼、雪与环境。
- `src/film-edit.js`、`src/film-rhythm.js`：剪辑和节奏。
- `public/assets/beijing/`：运行所需点云、配乐及概念图。

## 检查

```sh
npm run check
node scripts/check-winter.mjs
node scripts/check-winter-route.mjs
node scripts/check-film-edit.mjs
node scripts/check-cctv-passage.mjs
node scripts/check-steady-light.mjs
```

`archive/`、`references/`、`visual-development/` 与封面草稿 `output/` 保留在创作者本地，不纳入仓库。部分历史素材生成脚本依赖这些本地归档或原始模型，不是运行前置步骤；当前运行资产已包含在仓库中。

## 来源与使用边界

- 祈年殿点云源自 ycpan3468 的 [Beijing Tiantan](https://sketchfab.com/3d-models/beijing-tiantan-e4ab14a6ccc1487f8e1992b93fa7d4a8)，CC BY 4.0。
- 四面钟点云源自 imbroke227 的 [a Clock Tower in Beijing](https://sketchfab.com/3d-models/a-clock-tower-in-beijing-12137ce88b2e41f0b4b56627beccf0d6)，CC BY 4.0。
- 上述模型经过归一化、表面采样、颜色提取与粒子动画处理；模型许可独立于项目代码。
- 其余主体与环境为原创简化几何；角楼、现代建筑与路线均为视觉表达，非测绘、BIM 或真实地理复原。
- Three.js 使用 MIT 许可。本项目原创代码与素材尚未单独授予开源许可；上传仓库不改变第三方资源原有许可。

完整资源登记见 [docs/resources.md](docs/resources.md)，迭代与验证见 [docs/progress.md](docs/progress.md)，模型署名页为 [src/credits.html](src/credits.html)。
