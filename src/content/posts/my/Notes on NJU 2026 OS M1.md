---
author: Clover
pubDatetime: 2026-09-19T15:35:07+08:00
modDatetime: 2026-09-20T22:10:20+08:00
title: Notes on NJU 2026 OS M1
featured: false
draft: true
tags:
  - OS
---
# 命令解析实现
起初拿到要求一头雾水，要从头处理繁杂的解析和错误处理吗？后来在实验文档中看到
>在写实验代码时使用 `getopt()` 或 `getopt_long()` 来处理命令行参数

于是在终端里输入
```
man 3 getopt_long
```
得到其定义：
```c
int getopt_long(int argc, char *argv[],
    const char *optstring,
	const struct option *longopts, int *longindex);
```
查询文档，可知该函数可以同时处理长参数和短参数，分别用optsring与longopts控制，正好符合实验要求。
这个函数并不是一次性解析完所有参数，而是靠游标一步步迭代，每次迭代都会指向下一个参数。这也正是为什么需要一个while接switch。
>`optsring` 的用法：
>- **不带冒号（如 `"v"`）**：表示 `-v` 只是个开关，不需要参数。
>- **单冒号（如 `"m:"`）**：表示 `-m` **必须带参数**。
>- **双冒号（如 `"m::"`）**：GNU 扩展，表示参数是**可选的**。如果写成 `-mfoo`，参数就是 `foo`；如果写 `-m`，则参数为空。
>- **特殊字符**：`-`、`:`、`;` 不能作为选项字符。
>- **`W;`（GNU扩展）**：`-W foo` 会被当成 `--foo` 处理。

`option`结构体定义如下：
```c
struct option {
    const char *name;
    int         has_arg;
    int        *flag;
    int         val;
    };
```
- `name`：长选项名，如 `"map"`。
- `has_arg`：传参模式。`no_argument` (0)、`required_argument` (1)、`optional_argument` (2)。
- `flag`：如果填了指针，匹配成功时 `getopt_long` 会返回 `0` 并把 `val` 写入这个指针指向的变量。填 `NULL` 时，它直接返回 `val`。
- `val`：匹配成功后状态机要返回的值。**这就是打通长短选项的“锚点”**，比如把 `--map` 的 `val` 设为 `'m'`，它就能和你短选项 `-m` 共享同一个 `case 'm':`。
- 数组的最后一个元素必须是 `{0, 0, 0, 0}`（全零，充当终止符）。

`getopt_long` 的返回值：
- 成功找到选项：返回 `val`（或短选项字符）。
- 遍历结束：返回 `-1`。
- 异常情况：返回 `'?'` 或 `':'`。

因此，编写代码如下：
```c
    static struct option long_options[] = {
        {"map",    required_argument, 0, 'm'},
        {"player", required_argument, 0, 'p'},
        {"move",   required_argument, 0, 'x'},
        {"version", no_argument,      0, 'v'},
        {0, 0, 0, 0}
    };
    int option_index = 0;
    int show_version = 0;
    int opt;
    while ((opt = getopt_long(argc, argv, "m:p:", long_options, &option_index)) != -1) {
        switch (opt) {
            case 'm':
                break;
            case 'p':
                break;
            case 'x':
                break;
            case 'v':
                show_version = 1;
                break;
            case '?':
                return EXIT_FAILURE;
            default:
                return EXIT_FAILURE;
        }
    }
    if (show_version == 1) {
        printf("Labyrinth Game version 1.0\n");
        if (argc > 2) return EXIT_FAILURE;
        return EXIT_SUCCESS;
    }
```
# 文件读取
输入
```
man fopen
```
不放出全部内容了，其中一个诡异的点在于，如果函数出错，错误信息都放在一个全局变量`errno`里，其他没什么好说的。

打开文件相关：
```c
FILE* fd = fopen(filename,"r");
if (!fd) {
    fprintf(stderr, "labyrinth: cannot open '%s': %s\n", filename, strerror(errno)); //直接从errno里拿错误信息
    return false;
}
```
读取文件相关：
```c
while (NULL != fgets(buffer, sizeof(buffer), fd)) {
	buffer[strcspn(buffer, "\n")] = '\0';
	int len = strlen(buffer);
    if (len == 0) contin
    if (len > 100) { fclose(fd); return false
    strcpy(labyrinth->map[current_line],buffe
    printf("%s\n",buffe
    current_line
    if (current_line > 100) { fclose(fd); return false; }
}
```
`fgets`有很多美妙的特性，比如会老老实实把`\n`也读进来。而且，他的报错信息极难获取，读取成功时返回缓冲区指针，失败或者结束返回NULL。
如果一行的字符数超过了`sizeof(buffer)`，他照样返回缓冲区指针，意味着每次必须检查读取长度。
当他返回NULL后，`errno`会被设置，此时要立刻用`ferror()`和`feof()`来探测到底是什么错误。
