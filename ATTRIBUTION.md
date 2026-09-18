# 原模型出处与第三方声明

本项目使用的原模型为「推しの子 - アイ _ Oshino Ko - Hoshino Ai」。

**原始发布页面：https://sketchfab.com/models/20103e3eccd8433fbc7ebf7bd193143f/**

该链接由模型提供者指定。这里只标注已知来源，不猜测作者姓名或许可证类别；当前环境未能取得该页面的作者/授权元数据。公开发布前应打开原页面，核实并补充作者署名、许可证名称及链接、是否允许修改和再分发等要求。来源链接不等于再分发许可。

本仓库的 `assets/hoshino.glb` 是原资产的技术衍生版本：进行了退化几何清理、连通网格分组、场景减面、次要贴图降采样、材质转换及 Draco 编码。人物造型、贴图、角色及原作品版权仍归各原权利人所有。本项目不声称原创模型，也不对模型及贴图重新授予开源许可。

当前只在本地准备和测试。尚未发布到 GitHub、GitHub Pages 或 Cloudflare Pages。

## 第三方程序

- Three.js 0.186.0：MIT，原文保留于 `vendor/three/LICENSE`。
- Draco glTF 解码器：来自上述 Three.js 包附带的解码器文件，Apache-2.0，原文保留于 `vendor/three/examples/jsm/libs/draco/LICENSE`。其原 README 一并保留。不推测该捆绑二进制的具体 Draco 版本。
- Blender：使用机器上已安装的软件进行离线转换，不随网站分发。
- Playwright：仅作为可选本地测试工具，不随静态网站分发。

本仓库暂未为自编写代码指定发布许可证；后续公开时由仓库所有者决定。第三方代码遵循各自许可证。
