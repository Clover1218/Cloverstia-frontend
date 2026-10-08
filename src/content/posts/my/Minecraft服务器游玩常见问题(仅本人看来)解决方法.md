---
author: Clover
pubDatetime: 2026-10-07T23:42:25+08:00
modDatetime: 2026-10-08T22:52:29+08:00
title: Minecraft服务器游玩常见问题(仅本人看来)解决方法
featured: true
draft: false
slug: solutions-to-usual-problems-of-Minecraft-Server
tags:
  - Minecraft
description: As the title says
---
# 前言
本博客仅记录作者和作者朋友在Minecraft服务器游玩时遇到的常见问题，不代表所有人也不代表所有问题。
# CustomSkinLoader模组皮肤加载问题
## 原因
由于限制，作者开的服务器中会装`万用皮肤补丁(CustomerSkinLoader)`模组和`littleskin外置登录`解决自定义皮肤的问题，同时辅以`正版离线共存(trueuuid)`模组+`流量压缩(zstdnet)`模组的组合使流量耗量最小化，但这也强制让服务器的`online-mode`=`false`，因此不可避免地造成一系列皮肤加载问题。
在此情况下，皮肤加载的顺序为被调整为：官方档案、正版、皮肤站、本地皮肤。如`CustomSkinLoader.json`所示：
```json
{
  "version": "15.0.1",
  "buildNumber": 40,
  "loadlist": [
    {
      "name": "GameProfile",
      "type": "GameProfile"
    },
    {
      "name": "Mojang",
      "type": "MojangAPI",
      "apiRoot": "https://api.mojang.com/",
      "sessionRoot": "https://sessionserver.mojang.com/"
    },
    {
      "name": "LittleSkin",
      "type": "CustomSkinAPI",
      "root": "https://littleskin.cn/csl/"
    },
	...
    {
      "name": "LocalSkin",
      "type": "Legacy",
      "checkPNG": false,
      "skin": "LocalSkin/skins/{USERNAME}.png",
      "model": "auto",
      "cape": "LocalSkin/capes/{USERNAME}.png",
      "elytra": "LocalSkin/elytras/{USERNAME}.png"
    },
    ...
  ],
	...
}
```
`loadlist`字段即代表皮肤加载顺序：
+ **GameProfiler**：先用官方档案里留存的皮肤，如名字为Alex则赋予艾莉克丝皮肤。
+ **MojangAPI**：使用正版玩家的皮肤，会使用名字与自己相同的正版玩家的皮肤。
+ **CustomSkinAPI**：使用第三方皮肤站的皮肤，从第三方皮肤站获取皮肤。
+ **Legacy**：使用本地皮肤。

因此，如果自己的皮肤站皮肤被同名正版玩家覆盖，或是想进行个性化处理，则可通过调整上述`loadlist`里项顺序来解决。
## 解决方案
1. 找到`CustomSkinLoader` 模组文件夹(在与`mods`文件夹同级的目录)。可在PCL2启动器找到`版本设置->概览->快捷方式->版本文件夹`按钮来寻找。
![CustomSkinLoader文件夹位置](https://r2.clovercloud.ccwu.cc/2026/10/9d72bd0a32125f483146c4ec05435206.png)
2. 打开，找到`CustomSkinLoader.json`文件，用文本编辑工具（如记事本，Notepad++，VSCode）打开。
![CustomSkinLoader.json 位置](https://r2.clovercloud.ccwu.cc/2026/10/b6fa2210eaed591222548b5cc3b97f83.png)
3. 修改自己想要的顺序，这里以皮肤站皮肤被正版皮肤覆盖为例，原始文件如此：
![原始文件](https://r2.clovercloud.ccwu.cc/2026/10/dd631c1e781f1de4c5b576b3be5f266d.png)
将`MojangAPI`与`LittleSkin`互换，得：
![修改后的文件](https://r2.clovercloud.ccwu.cc/2026/10/a75c7d4c3df606164715025264a00615.png)
4. 修改后记得按`Ctrl+S`保存后再退出，建议再删掉第二步中指出的`caches`文件夹以免皮肤还是沿用缓存，然后重启客户端即可。