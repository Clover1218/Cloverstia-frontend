---
author: Clover
pubDatetime: 2026-10-07T23:42:25+08:00
modDatetime: 2026-10-10T15:32:45+08:00
title: Minecraft服务器游玩常见问题(仅本人看来)解决方法
featured: true
draft: false
slug: solutions-to-usual-problems-of-Minecraft-Server
tags:
  - Minecraft
description: As the title says
---
# 前言
在上方打开目录以进行快速索引。
本博客仅记录作者和作者朋友在Minecraft服务器游玩时遇到的常见问题，不代表所有人也不代表所有问题。
# 如何安装并进入服务器
## 1. 获取PCL2启动器
可在网站主页下载，也可通过其他途径获取。打开PCL2启动器，先保证至少进行过一次更新操作，启动器更新按钮位置如下图所示。

![PCL2启动器更新按钮位置](https://r2.clovercloud.ccwu.cc/2026/10/c1310e51f7a6b01a3d033530333fefb5.png)
## 2. 获取并安装整合包
找到想要游玩的服务器，点击下载整合包按钮，获取整合包安装包。下载完成后，将安装包拖入PCL2启动器即可自动完成安装；或者在PCL2启动器主页点击`版本选择`，再点击`导入整合包`，选择刚才下载的安装包，也可达到相同的效果。

![手动导入整合包-找到版本选择](https://r2.clovercloud.ccwu.cc/2026/10/1bc433059e583347b267d8a2a807cf7b.png)

![手动导入整合包-找到导入整合包](https://r2.clovercloud.ccwu.cc/2026/10/18a8208d86d7a6682e94337ac49c340b.png)

## 3.注册皮肤站，并配置皮肤站外置登录
打开 https://littleskin.cn ，注册并登录，记住刚才注册的账号和密码。
登录完成后的仪表盘主要功能如图所示：

![配置皮肤站-仪表盘详解](https://r2.clovercloud.ccwu.cc/2026/10/ff79d31f6fae07ad4f6e7dfc654c0a65.png)

配置流程：
1. 进入角色管理页面，新建角色，角色名即为你进入游戏时显示的名字（最好不要带中文字符，可能会造成一些不便）

![配置皮肤站-角色管理](https://r2.clovercloud.ccwu.cc/2026/10/559d603c2f95a374e4202ee9c2cf2f12.png)

2. 进入皮肤库，选择心仪皮肤

![配置皮肤站-皮肤库](https://r2.clovercloud.ccwu.cc/2026/10/6722856f89b2fb27e52f0d7b5e6c589e.png)

比如这里我对这个皮肤感兴趣，可添加到衣柜。

![配置皮肤站-皮肤库皮肤详情](https://r2.clovercloud.ccwu.cc/2026/10/1db8cae2cf5d7b879ae59a662866c5d7.png)

4. 进入我的衣柜，找到刚才添加的皮肤，点击使用，使用至刚刚创建的角色。

 ![配置皮肤站-我的衣柜](https://r2.clovercloud.ccwu.cc/2026/10/930d7860991008e732a4b11e2902e522.png)

5. 回到启动器，配置外置登录，这里有两种方式，第一种是传统的手动，第二种是将仪表盘里的快捷配置登录卡片拖入PCL2启动器，下图展示传统的配置方式：

![配置皮肤站-选择外置登录](https://r2.clovercloud.ccwu.cc/2026/10/4b848ca4cd0a9f0eaf74d9655e762b53.png)

按第四张图原样填写，用到的文本：
```plain
https://littleskin.cn/api/yggdrasil
https://littleskin.cn/auth/register
LittleSkin 登录
```
随后点击左上角返回键。
无论是传统配置方式还是拖入配置方式，最终都会来到这个界面，输入刚才在皮肤站注册的账号与密码。

![配置皮肤站-启动器内再次登录](https://r2.clovercloud.ccwu.cc/2026/10/7f2d407801cd87450132a68670fffdd2.png)

登录成功后，提示选择角色，选择刚才创建的角色即可，然后便可进入游戏。

![配置皮肤站-如果成功，应显示类似这样"LittleSkin 登录"带头像的界面](https://r2.clovercloud.ccwu.cc/2026/10/98a59e62c4161ce533756d813dc1813b.png)

## 4.打开游戏添加服务器
打开游戏后，点击`多人游戏->添加服务器`，从网站上复制服务器ip，粘贴至`服务器地址`框中，点击确定。勤点`刷新`键，然后双击刚才添加的服务器即可加入服务器。Good Luck！
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