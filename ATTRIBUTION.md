# 原模型出处与第三方声明

本项目使用的原模型为「推しの子 - アイ _ Oshino Ko - Hoshino Ai」。

**原始发布页面：https://sketchfab.com/models/20103e3eccd8433fbc7ebf7bd193143f/**

该链接是模型来源页面。模型和贴图不是本项目原创；如有侵权或不适合公开展示，请通过本项目仓库 Issue 联系我，我会及时删除相关内容。

本仓库的 `assets/hoshino.glb` 是原资产的技术衍生版本：进行了退化几何清理、连通网格分组、场景减面、次要贴图降采样、材质转换及 Draco 编码。人物造型、贴图、角色及原作品版权仍归各原权利人所有。本项目不声称原创模型，也不对模型及贴图重新授予开源许可。

当前只在本地准备和测试。尚未发布到 GitHub、GitHub Pages 或 Cloudflare Pages。

## 动画官网视觉素材

应援页还使用动画《【推しの子】》第一季官网公开的爱角色立绘、新年视觉、情人节视觉和角色歌 Vol.1 封面。来源页面及用途列于 `docs/SOURCES.md`。这些图片及角色版权归原权利人；如有侵权或不适合公开展示，请通过本项目仓库 Issue 联系我，我会及时删除相关图片。

## 第三方程序

- Three.js 0.186.0：MIT，原文保留于 `vendor/three/LICENSE`。
- Draco glTF 解码器：来自上述 Three.js 包附带的解码器文件，Apache-2.0，原文保留于 `vendor/three/examples/jsm/libs/draco/LICENSE`。其原 README 一并保留。不推测该捆绑二进制的具体 Draco 版本。
- Blender：使用机器上已安装的软件进行离线转换，不随网站分发。
- Playwright：仅作为可选本地测试工具，不随静态网站分发。

本仓库暂未为自编写代码指定发布许可证；后续公开时由仓库所有者决定。第三方代码遵循各自许可证。
