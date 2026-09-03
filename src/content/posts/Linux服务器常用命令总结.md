---
author: Clover
pubDatetime: 2026-09-02T15:22:00Z
modDatetime: 2026-06-03T00:00:00.000Z
title: Linux服务器常用命令总结
featured: true
draft: false
tags:
  - Linux
canonicalURL: https://smale.codes/posts/setting-dates-via-git-hooks/
description: The usual command in Linux 
---

在这篇文章中，作者总结自己日常中最常用的 Linux 命令，涵盖服务管理、github、文件操作、docker、杂项等各个方面，作为一份随身速查手册。

## 服务(service)

### 服务的维护
```shell
# 开启服务
sudo systemctl start <服务名> 	
# 停止服务
sudo systemctl stop <服务名>
# 重启服务
sudo systemctl restart <服务名>
# 重载所有服务器配置      
sudo systemctl daemon-reload
# 实时跟踪服务日志	
sudo journalctl -u <服务名> -f
# 查看服务日志（最后 N 行）	
sudo journalctl -u <服务名> -n 50
```
### 服务从创建到启动

1. 创建一个服务
```shell
# 新建一个名为myapp的service
vim /etc/systemd/system/myapp.service    
```
2. 写入配置文件
```text
[Unit]
Description=My App # 服务描述
After=network.target

[Service]
User=ubuntu        # 运行的用户
WorkingDirectory=/home/ubuntu/myapp     # 运行目录
ExecStart=/home/ubuntu/myapp/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000    # 启动命令
Restart=always  # 重启策略

[Install]
WantedBy=multi-user.target
```
3. 配置完成后启动
```shell
# 重载服务配置
sudo systemctl daemon-reload
# 启用服务
sudo systemctl enable myapp
# 开启服务
sudo systemctl start myapp
```

### 服务配置详解

`[Unit]` 区块主要描述服务本身，并定义它与其他服务的关系。

| 字段 | 作用 | 说明与示例 |
| --- | --- | --- |
| Description | 服务的简短描述。 | 会显示在 systemctl status 等命令的输出中。应清晰说明服务功能，例如 Description=My FastAPI App。 |
| After | 定义服务启动顺序：在当前服务之前需要启动哪些服务。 | 如果指定了 After=network.target，系统会确保网络服务就绪后，才启动你的服务。 |
| Before | 与 After 相反，定义当前服务需要在哪些服务之前启动。 | 常用于那些需要先于其它服务运行的服务。 |
| Wants | 弱依赖。列出的服务会尽量启动，但即使它们启动失败，也不会影响当前服务的启动。 | 例如 Wants=network-online.target 表示“尽量确保网络在线”。推荐使用 Wants 而非 Requires 来避免因依赖服务故障而导致主服务无法启动。 |
| Requires | 强依赖。列出的服务必须成功启动，否则当前服务会启动失败。 | 除非有严格依赖，否则通常不推荐使用，因为它会使服务变得脆弱。 |
| Conflicts | 冲突。定义哪些服务不能与当前服务同时运行。 | 如果冲突的服务正在运行，启动当前服务会先停止它。 |
| Documentation | 提供服务的文档链接。 | 可以是 man:、https:// 等格式的URI，例如 Documentation=https://example.com/docs。 |

`[Service]` 区块定义了服务如何启动、运行和停止。

> 核心启动与执行

| 字段 | 作用 | 说明与示例 |
| --- | --- | --- |
| ExecStart | 启动服务的命令。 | 此字段通常为必填。例如 ExecStart=/usr/bin/python3 /path/to/app.py。 |
| Type | 定义服务的启动类型。 | systemd 通过它来判断服务是否已成功启动。常用值如下：<br>- simple (默认)：适用于大多数在前台运行的程序。<br>- forking：适用于传统的守护进程，程序会通过 fork() 创建子进程后父进程退出。常需配合 PIDFile= 使用。<br>- oneshot：适用于执行一次性任务的脚本，执行完即退出。常配合 RemainAfterExit=yes 使用。<br>- notify：程序启动完成后，会通过特定接口主动通知 systemd。<br>- idle：类似 simple，但会等待系统负载较低时再启动。 |
| ExecStartPre | 在 ExecStart 之前执行的命令。 | 常用于准备工作，如创建日志目录。 |
| ExecStartPost | 在 ExecStart 之后执行的命令。 | 常用于启动后的通知或初始化工作。 |
| ExecReload | 执行 systemctl reload 时运行的命令。 | 例如 Nginx 的 ExecReload=/usr/sbin/nginx -s reload。 |
| ExecStop | 执行 systemctl stop 时运行的命令。 | 如果不指定，systemd 会直接向进程发送终止信号。 |
| WorkingDirectory | 设置服务进程的工作目录。 | 如果程序需要读取相对路径的文件，设置此项至关重要。例如 WorkingDirectory=/home/ubuntu/myapp。 |

> 运行环境与权限

| 字段 | 作用 | 说明与示例 |
| --- | --- | --- |
| User / Group | 指定运行服务的用户和用户组。 | 出于安全考虑，强烈建议不要使用 root 运行服务。例如 User=ubuntu。 |
| Environment | 设置环境变量。 | 可以设置 PATH 或应用特定的变量，例如 Environment="ENV=production"。 |
| EnvironmentFile | 从一个文件中加载环境变量。 | 适用于集中管理大量环境变量，例如 EnvironmentFile=/etc/sysconfig/myapp。 |

> 重启策略与控制

| 字段 | 作用 | 说明与示例 |
| --- | --- | --- |
| Restart | 定义何时自动重启服务。 | 常用值如下：<br>- no (默认)：任何情况下都不会自动重启。<br>- always：无论因何退出，都会重启。<br>- on-failure：仅在非正常退出时重启（如返回非零退出码、被信号终止等）。推荐用于大多数服务。<br>- on-success：仅在正常退出时（退出码为0）重启。 |
| RestartSec | 定义自动重启前的等待时间。 | 单位默认为秒（s），例如 RestartSec=10s。 |
| KillMode | 定义停止服务时如何终止进程。 | 常用值如下：<br>- control-group (默认)：终止该服务控制组内的所有进程。<br>- process：仅终止主进程，子进程可能变为孤儿进程。<br>- mixed：主进程收到 SIGTERM 信号，子进程收到 SIGKILL 信号。<br>- none：不终止任何进程，仅执行服务的 stop 命令。 |
| TimeoutSec | 定义 systemd 等待启动或停止命令完成的最长时间。 | 如果超时，该服务会被视为失败并强制终止。 |

`[Install]` 区块定义服务的安装与自启

| 字段 | 作用 | 说明与示例 |
| --- | --- | --- |
| WantedBy | 指定服务应该被哪个 "Target" 所需要。 | 这是实现开机自启的关键。最常用的值是 multi-user.target，表示在系统进入多用户模式时启动该服务。执行 systemctl enable 时，会在 /etc/systemd/system/multi-user.target.wants/ 目录下创建一个指向该服务的软链接。 |
| RequiredBy | 与 WantedBy 类似，但建立的是强依赖关系。 | 如果服务启动失败，依赖它的 target 也会启动失败。 |
| Alias | 为服务设置别名。 | 设置后，可以用别名来操作服务，例如 systemctl start myapp。 |
| Also | 在启用或禁用当前服务时，同时启用或禁用列表中的其他单元。 | 用于管理一组相关联的服务。 |

## Github相关

### 克隆仓库
```shell
# 克隆远程仓库到本地（默认使用 HTTPS）
git clone https://github.com/username/repo.git
# 使用 SSH 方式（需配置 SSH 密钥）
git clone git@github.com:username/repo.git
# 克隆到指定目录
git clone https://github.com/username/repo.git myfolder
```
### 远程仓库管理
```shell
# 查看当前配置的远程仓库
git remote -v
# 添加远程仓库（通常命名为 origin）
git remote add origin https://github.com/username/repo.git
# 修改已有远程仓库的 URL
git remote set-url origin https://github.com/username/new-repo.git
# 删除远程仓库
git remote remove origin
```
### 拉取仓库
```shell
# 拉取远程当前分支的最新代码并合并（最常用）
git pull
# 指定远程仓库和分支
git pull origin main
# 只拉取不合并（获取最新提交到本地，但不合并）
git fetch origin
# 拉取并变基（保持提交历史线性，常用）
git pull --rebase
```
### 分支管理
```shell
# 查看所有本地分支（当前分支前有 * 标记）
git branch
# 查看所有远程分支
git branch -r
# 查看所有本地和远程分支
git branch -a
# 新建分支（但不会切换）
git branch <新分支名>
# 新建分支并立即切换过去
git checkout -b <新分支名>
# 或者使用新版 switch 命令
git switch -c <新分支名>
# 切换分支
git checkout <分支名>
# 或
git switch <分支名>
# 删除本地分支
git branch -d <分支名>   # 安全删除（已合并）
git branch -D <分支名>   # 强制删除（未合并也删）
# 删除远程分支
git push origin --delete <分支名>
```
### 提交更改
```shell
# 查看当前文件状态
git status
# 添加文件到暂存区
git add <文件名>        # 单个文件
git add .              # 所有修改（包括新文件）
git add -u             # 只更新已跟踪的文件
# 提交到本地仓库
git commit -m "提交信息"
# 修改最近一次提交信息（或补充遗漏文件）
git commit --amend -m "新的信息"
```
### 推送更改
```shell
# 推送当前分支到远程同名分支（首次推送需设置上游）
git push
# 首次推送新分支并建立追踪关系
git push -u origin <新分支名>
# 强制推送（覆盖远程，慎用！）
git push --force
# 更安全的强制推送（只覆盖远程上不存在的提交）
git push --force-with-lease
```
### 常用组合命令
```shell
# 拉取最新代码并保持历史干净	
git pull --rebase origin main
# 新建功能分支并开始开发	
git checkout -b feature/new-login
git push -u origin feature/new-login
# 开发完成合并到主分支	
git checkout main
git pull
git merge feature/new-login
git push
# 放弃本地所有修改，强制同步远程	
git fetch origin
git reset --hard origin/main
# 修改上一次提交信息	
git commit --amend -m "新信息"
git push --force-with-lease
```

## 文件操作

### chmod – 修改文件或目录权限

- `+x`：添加执行权限，例如 `chmod +x start.sh`
- `u=rwx,g=rx,o=r`：精细控制不同角色的权限
- `600`：所有者读写，其他人无权限，适用于私密配置文件，如 `chmod 600 /etc/secret.cfg`
- `644`：所有者读写，其他人只读（默认文件权限）
- `755`：所有者读写执行，组和其他人读执行，常用于目录，如 `chmod 755 /var/www/html`
- `750`：所有者读写执行，组读执行，其他人无权限
- `-R`：递归修改目录及其下所有文件，例如 `chmod -R 755 /var/www`
- `-v`：显示修改过程
- `--reference=<参考文件>`：将权限设置成与参考文件一致

> `4`、`r`=读，`2`、`w`=写，`1`、`x`=执行，分别对应所有者、组、其他人。

---

### rm – 删除文件或目录

- `-i`：删除前逐一确认，安全操作，例如 `rm -i file.txt`
- `-f`：强制删除，忽略不存在的文件，不提示，例如 `rm -f /tmp/lock.pid`
- `-r` 或 `-R`：递归删除目录及其内容（删除目录必需），例如 `rm -r old_backup/`
- `-rf`：强制递归删除，例如 `rm -rf /some/dir`
- `-v`：显示被删除的文件名
- `--preserve-root`：保护根目录不被删除（很多发行版默认开启）

---

### mv – 移动或重命名文件/目录

- `-i`：覆盖前询问，例如 `mv -i data.log logs/`
- `-u`：仅在源文件比目标更新或目标不存在时才移动，例如 `mv -u cache/* /tmp/`
- `-n`：不覆盖已存在的文件，例如 `mv -n old.conf new.conf`
- `-v`：显示移动过程，例如 `mv -v *.txt archive/`
- `-f`：强制覆盖，不询问
- `-b`：若覆盖目标，先备份目标文件（生成 `~` 后缀）

> 移动目录时：如果目标目录已存在，源目录会被移动到目标目录内部；如果目标不存在，则相当于重命名。

---

### ls – 列出目录内容

- `-l`：长格式显示（权限、链接数、所有者、大小、时间）
- `-a`：显示所有文件，包括以 `.` 开头的隐藏文件
- `-h`：与 `-l` 配合，文件大小以人类可读格式（K、M、G）显示，常用组合 `ls -lh`
- `-t`：按修改时间排序（最新在上），例如 `ls -lt`
- `-tr`：按修改时间逆序（最旧在上），例如 `ls -ltr`
- `-S`：按文件大小排序（大在前）
- `-R`：递归列出子目录内容，例如 `ls -R /var/log`
- `-d */`：只显示目录（不显示其内容），例如 `ls -d */`
- `--color=auto`：高亮显示不同类型文件（一般默认）
- `-1`：每行只输出一个文件（适用于脚本）

> 组合使用：`ls -lah` 是最常用的组合，显示所有文件、人性化大小、详细属性。

---

### ln – 创建链接（硬链接与软链接）

默认 `ln` 创建硬链接，使用 `-s` 创建软链接（符号链接）。

- `-s`：创建软链接，例如 `ln -s /usr/bin/python3 /usr/local/bin/python`
- `-f`：强制覆盖已存在的目标文件，例如 `ln -sf /new/path /old/link`
- `-n`：将目标视为普通文件（如果目标是目录的符号链接，则不会进入该目录）
- `-v`：显示创建的链接信息，例如 `ln -sv source link`
- `-i`：若目标已存在，提示确认
- `-T`：将目标始终视为普通文件（即使它是目录链接）

硬链接与软链接的区别如下：

- **硬链接**：同一文件数据的多个入口（同一个 inode）
  - 不能跨文件系统
  - 不能指向目录
  - 删除原文件后，硬链接仍可访问数据
  - 文件大小与原文件相同（不占额外空间）
  - 与原文件共享权限

- **软链接**：指向另一个文件路径的指针
  - 可以跨文件系统
  - 可以指向目录
  - 删除原文件后，软链接失效（“断链”）
  - 文件大小很小（仅存储路径字符串）
  - 拥有自己的权限（但取决于目标）

常用示例：

- 创建软链接（指向文件）：`ln -s /etc/nginx/nginx.conf /home/user/nginx.conf`
- 创建软链接（指向目录）：`ln -s /var/log /home/user/logs`
- 强制覆盖已有软链接：`ln -sf /new/target /old/link`
- 创建硬链接（常用于备份）：`ln /original/file /backup/hardlink`

> 实用场景：软链接常用于管理多个版本的软件（如 `python` 指向 `python3.10`），硬链接则用于节省空间的备份（不复制数据，只是增加引用计数）。

## Docker操作

0. 前置准备：确认 docker-compose 工具，如果没装，可手动安装
```shell
# 检查是否安装 docker-compose（新版已集成到 docker compose）
docker compose version
# 或旧版独立工具
docker-compose version
# 安装docker-compose
sudo apt install docker-compose   
```
1. 日常查看与状态检查
```shell
# 查看当前运行中的容器列表
docker ps
# 查看所有容器（包括已停止的）
docker ps -a
# 查看本地已有的镜像列表
docker images
# 查看 Docker 占用的磁盘空间（镜像、容器、卷、缓存分别占多少）
docker system df
```
2. 容器生命周期操作
```shell
# 优雅停止容器（让进程处理完后续工作）
docker stop <容器名>
# 启动一个已停止的容器
docker start <容器名>
# 重启容器（相当于 stop + start）
docker restart <容器名>
# 删除容器（加 -f 可强制删除运行中的容器），删除容器后数据会丢失，除非用了数据卷挂载
docker rm <容器名>
# 查看容器日志：
# -f：实时跟踪日志输出
# --tail 100：只看最后 100 行
docker logs <容器名>
# 停止并删除所有容器，忽略错误
docker stop $(docker ps -aq) 2>/dev/null || true && docker rm $(docker ps -aq) 2>/dev/null || true
```
3. Docker Compose 核心操作
```shell
# 启动 Compose 项目（-p 指定项目名，-d 后台运行）
docker-compose -p <项目名> up -d
# 启动并强制重新构建镜像（高频常用）
docker-compose -p <项目名> up -d --build
# 停止并删除容器和网络（保留数据卷）
docker-compose -p <项目名> down
# 停止并删除容器、网络和匿名卷（会删除数据）
docker-compose -p <项目名> down -v
# 仅停止容器（不删除）
docker-compose -p <项目名> stop
# 仅启动容器（不构建）
docker-compose -p <项目名> start
# 重启某个服务（例如 docker compose restart backend）
docker-compose -p <项目名> restart <服务名>
# 查看该 Compose 项目下所有容器状态
docker-compose -p <项目名> ps
# 查看 Compose 项目所有服务的日志
docker-compose -p <项目名> logs
# 实时跟踪日志（-f），只查看单个服务的日志
docker-compose -p <项目名> logs -f <服务名>
```
4. 构建相关（常配合清理缓存）
```shell
# 构建镜像（例如 docker build -t my-backend ./backend）
docker-build -t <镜像名> <路径>
# 无缓存重新构建（彻底重来）
docker-build --no-cache -t <镜像名> <路径>
# 构建 Compose 项目中所有服务的镜像（不启动）
docker-compose -p <项目名> build
# 只构建某个服务
docker-compose -p <项目名> build <服务名>
# 删除镜像（加 -f 强制删除）
docker rmi <镜像ID或名称>
```
5. 进入容器内部调试
```shell
# 进入容器的交互式 Shell（也可以用 bash 如果镜像支持）
docker exec -it <容器名> sh
# 在容器内执行单条命令
docker exec <容器名> <命令>
# 例：查看容器内根目录文件
docker exec repair-backend ls -la /root
# 查看容器当前工作目录
docker exec repair-backend pwd
# 查看容器内环境变量
docker exec repair-backend env
# 查看容器内进程
docker exec repair-backend ps aux
```
6. 清理与维护（释放空间）
```shell
# 专门清理构建缓存（最占空间，不删镜像）
docker builder prune -a -f
# 一键清理所有未使用的镜像、容器、网络、缓存（大扫除）
docker system prune -a -f
# 删除没有容器使用的数据卷
docker volume prune -f
# 删除所有未使用的镜像
docker image prune -a -f
```
7. 日常使用组合拳（复制即用）
```shell
# 彻底重来（删容器 + 删缓存 + 重构建 + 启动）
docker compose -p <项目名> down && docker system prune -a -f && docker compose -p <项目名> up -d --build
# 改完代码后重新构建某个服务
docker compose -p <项目名> up -d --build backend
# 修改配置文件后重启服务（不重建）
docker compose -p <项目名> restart backend
# 查看实时日志并过滤错误
docker logs -f repair-backend 2>&1 | grep -i error
# 进入容器验证配置文件是否挂载成功
docker exec -it repair-backend cat /app/config/config.yaml
```





## 杂项与常用命令

### 基础环境与快捷键

- `PATH` 环境变量示例：`PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin`，系统按此顺序查找可执行文件
- `Shift + PgUp`：向上翻页（终端中查看长输出时有用）
- `Shift + PgDn`：向下翻页

---

### 变量（Shell 变量）

- `name=value`：声明一个变量（注意 `=` 两边不能有空格），例如 `name=hello`
- `$name`：输出变量的值，例如 `echo $name`
- `${name}`：与 `$name` 相同，但在边界模糊时更安全，例如 `echo ${name}_suffix`
- `"$name"`：将变量值作为整体输出（推荐），例如 `echo "$name"`
- `declare`：声明变量的类型，常用选项：
  - `-a`：声明为数组，例如 `declare -a arr=(1 2 3)`
  - `-i`：声明为整数，例如 `declare -i num=10`
  - `-x`：声明为环境变量（等价于 `export`），例如 `declare -x MY_ENV=prod`
  - `-r`：声明为只读变量，例如 `declare -r readonly_var=不可改`

> 注意：直接用 `echo name` 会输出字符串 "name" 而非变量值，引用变量必须加 `$`。

---

### 别名（Alias）

- `alias 别名='命令'`：为长命令设置简写，例如 `alias ll='ls -alF'`
- `unalias 别名`：取消已设置的别名，例如 `unalias ll`
- 永久保存别名：写入 `~/.bashrc` 或 `~/.bash_aliases`，然后 `source ~/.bashrc` 生效

---

### 重定向

| 类型 | 代码 | 符号 | 说明 |
| :--- | :--- | :--- | :--- |
| 标准输入（stdin） | 0 | `<` 或 `<<` | 从文件读取输入，`<<` 为 Here Document（多行输入） |
| 标准输出（stdout） | 1 | `>` 或 `>>` | `>` 覆盖写入，`>>` 追加写入 |
| 标准错误输出（stderr） | 2 | `2>` 或 `2>>` | `2>` 覆盖写入错误信息，`2>>` 追加写入 |

常用组合：

- `command > output.log 2>&1`：将标准输出和标准错误都重定向到同一文件
- `command 2> /dev/null`：丢弃所有错误信息（静默运行）
- `command &> all.log`：将 stdout 和 stderr 合并输出到文件（bash 简写）

---

### 多命令连接符

- `;`：按顺序依次执行，无论前一条是否成功，例如 `cd /tmp; ls -la`
- `A && B`：若 A 执行成功，才执行 B；若 A 失败，B 不执行（常用于确保依赖条件满足）
- `A || B`：若 A 执行成功，B 不执行；若 A 失败，才执行 B（常用于错误处理或备选方案）

示例：

- `mkdir dir && cd dir`：只有创建目录成功才进入
- `ping -c 1 8.8.8.8 || echo "网络不通"`：ping 失败时输出提示

---

### grep 与正则表达式

#### 基本用法

- `grep [-选项] "表达式" 文件路径`：在文件中搜索匹配的行
- `-n`：显示匹配行所在的行号
- `-v`：反选，显示不匹配的行
- `-i`：忽略大小写
- `-r`：递归搜索目录下所有文件，例如 `grep -r "error" /var/log/`
- `-E`：使用扩展正则表达式（等价于 `egrep`）
- `-c`：只统计匹配的行数

#### 基础正则表达式（BRE）

- `[0-9]`、`[a-z]`、`[A-Z]`：指定范围内的单个字符
- `[^0-9]`：反选，匹配除了数字以外的任意字符
- `^...`：匹配行首，例如 `^root` 匹配以 root 开头的行
- `$...`：匹配行尾，例如 `bash$` 匹配以 bash 结尾的行
- `.`：匹配一定有一个任意字符（不包括换行）
- `*`：重复前一个字符 0 到无穷多次，例如 `a*` 匹配空、a、aa、aaa...
- `.*`：代表 0 到无穷多个任意字符（最常用通配）
- `\{n,m\}`：连续 n 至 m 个前一个字符，例如 `a\{2,4\}` 匹配 aa、aaa、aaaa
- `\{n\}`：连续恰好 n 个前一个字符
- `\{n,\}`：连续 n 个以上前一个字符

#### 扩展正则表达式（ERE）- 需加 `-E` 或使用 `egrep`

- `+`：代表 1 个或 1 个以上的前一个字符，例如 `a+` 匹配 a、aa、aaa...
- `?`：代表 0 个或 1 个的前一个字符，例如 `a?` 匹配 空 或 a
- `()`：群组，将括号内的内容视为一个整体，例如 `(ab)+` 匹配 ab、abab、ababab...
- `|`：或（逻辑 OR），例如 `error|warn` 匹配包含 error 或 warn 的行

> 提示：在字符集 `[]` 中的特殊字符（如 `*`、`.`）大多会失去特殊含义，按字面匹配。

---

### 管道命令（`|`）

管道的作用：**将前一个命令的 stdout（标准输出）作为后一个命令的 stdin（标准输入）**，实现命令的链式组合。

基本语法：`命令A | 命令B | 命令C ...`

#### 常用管道组合示例

- `grep error /var/log/syslog | less`：在日志中搜索 error，然后用分页方式查看
- `ps aux | grep python`：查看所有进程，筛选出包含 python 的进程（常用于找特定服务）
- `history | grep docker`：从历史命令中查找 docker 相关的命令
- `cat file.txt | wc -l`：统计文件行数（等价于 `wc -l file.txt`）
- `ls -la | sort -k5 -rn`：列出文件并按第 5 列（大小）倒序排序
- `docker ps -a | grep Exited | awk '{print $1}' | xargs docker rm`：列出所有已退出的容器，提取容器 ID，然后删除它们

#### 进阶组合：xargs

当管道传递的不是文本流而是“命令行参数列表”时，`xargs` 可以将标准输入转换成命令的参数。

示例：

- `find . -name "*.log" | xargs rm -f`：找到所有 `.log` 文件并用 `rm` 删除
- `docker ps -aq | xargs docker stop`：停止所有容器（等价于 `docker stop $(docker ps -aq)`）

---

### 常用查询命令

- `which <命令>`：查找命令的绝对路径，例如 `which python3`
- `whereis <命令>`：查找命令、源代码和手册页的位置，例如 `whereis nginx`
- `type <命令>`：判断命令是内置命令、外部程序还是别名，例如 `type cd`
- `man <命令>`：查看命令的详细帮助手册，例如 `man grep`
- `--help`：大多数命令支持的简短帮助，例如 `ls --help`

---

### 管道与重定向组合使用技巧

- `command 2>&1 | grep "error"`：将标准错误合并到标准输出，一起传给 grep
- `command 2>/dev/null | tee output.log`：丢弃错误，同时将输出打印到屏幕并写入文件
- `command | tee output.log | grep "key"`：既在屏幕显示完整输出，又用 grep 筛选关键行