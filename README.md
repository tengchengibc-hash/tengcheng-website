# MOLEI 摩垒官网

本项目是在现有“MOLEI 摩垒”官网基础上重新整合的静态网站，内容来源为 `竞品资料` 目录中的项目资料，尤其是 SpaceKraft / ReadyFill / International Paper 相关产品手册、图纸、测试报告和视频。

## 页面

- `index.html`：首页、核心优势、产品预览、SpaceKraft 对标、选型工具、行业应用、联系表单
- `products.html`：1000L Paper IBC、1410×1060 重型纸箱、内衬与加热系统、缠绕机产线
- `technology.html`：连续缠绕、梯度湿压、原纸体系、专利与成型产线、传统方案对比
- `resources.html`：项目全部资料索引、重点视频、SpaceKraft 与同行参考网站

## 本地打开

直接双击 `官网/index.html` 即可浏览，所有本地资源使用相对路径。

推荐用本地静态服务器打开，便于视频、PDF 和 3D 演示保持正常跨文件访问：

```powershell
cd E:\01-产品性能\07-国际国内一线同行信息
python -m http.server 8765 --bind 127.0.0.1
```

然后访问 `http://127.0.0.1:8765/官网/index.html`。

## 资料中心索引

`assets/js/resources-data.js` 自动生成自 `竞品资料` 目录，共收录项目内的 PDF、视频、图纸、3D/CAD、历史资料、翻译资料、价格调研和官网存档。

如需重新生成索引，可在项目根目录执行：

```powershell
Get-ChildItem -LiteralPath '竞品资料' -Recurse -File |
  Where-Object { $_.FullName -notmatch '_待清理' } |
  ForEach-Object { $_.FullName }
```

## 注意

`assets/own/SK融合型缠绕机效果图.html` 使用 Three.js CDN，打开 3D 演示时需要联网加载 `unpkg.com`。其余网站页面均可离线浏览。
