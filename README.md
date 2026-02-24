# NKAtlas - 图床前端

NKAtlas 图床系统的前端部分，基于 Vue 3 + TypeScript + Vite 构建的单页应用，通过 RESTful API 与后端通信。

![Vue](https://img.shields.io/badge/Vue-3.5-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Vite](https://img.shields.io/badge/Vite-5.4-purple)
![License](https://img.shields.io/badge/License-MIT-yellow)

**在线演示：** [nkatlas.nixstudio.cn](https://nkatlas.nixstudio.cn)

## 功能特性

### 核心功能

| 功能 | 说明 |
|------|------|
| **图片上传** | 拖拽/粘贴上传，支持分类选择、每日限额、水印配置 |
| **图片库** | 瀑布流/网格浏览，支持搜索、分类筛选、批量操作 |
| **相册管理** | 创建相册，批量整理图片 |
| **分享系统** | 生成分享链接/短链，支持密码保护和过期时间 |
| **链接格式** | 一键复制 URL / Markdown / HTML / BBCode 格式 |
| **回收站** | 已删除图片可恢复，支持配置自动清理天数 |
| **主题系统** | 亮色/暗色/跟随系统，8 种预设主题色 + 自定义颜色 |
| **国际化** | 中文 / English 双语支持 |
| **快捷键** | 全局快捷键（上传、搜索等），按 `?` 查看快捷键面板 |
| **响应式布局** | 适配桌面端、平板和移动端 |
| **骨架屏** | 图片卡片、相册列表等加载状态的骨架屏占位 |
| **管理后台** | 用户管理、站点配置、操作日志、登录日志、公告管理 |

### 页面说明

| 页面 | 路由 | 功能描述 |
|------|------|----------|
| **首页** | `/` | 功能介绍、注册/登录引导 |
| **图片库** | `/gallery` | 图片浏览、搜索、上传、批量管理 |
| **相册列表** | `/albums` | 创建和管理相册 |
| **相册详情** | `/albums/:id` | 查看相册内图片 |
| **回收站** | `/trash` | 已删除图片恢复/彻底删除 |
| **分享管理** | `/shares` | 管理已创建的分享链接 |
| **分享页面** | `/share/:code` | 公开的图片分享浏览页 |
| **个人资料** | `/user/profile` | 头像上传、个人信息编辑 |
| **偏好设置** | `/user/settings` | 主题、语言、显示偏好 |
| **上传设置** | `/user/upload-settings` | 水印、默认分类等上传偏好 |
| **API Token** | `/user/tokens` | 管理 API 访问令牌 |
| **域名白名单** | `/user/domains` | 配置图片外链允许的域名 |
| **管理后台** | `/admin/*` | 仪表盘、用户管理、站点配置、日志、公告 |

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue | 3.5 |
| 语言 | TypeScript | 5.5 |
| 构建工具 | Vite | 5.4 |
| 状态管理 | Pinia | 2.2 |
| 路由 | Vue Router | 4.4 (History 模式) |
| HTTP 客户端 | Axios | 1.7 |
| 国际化 | vue-i18n | 9.14 |
| 原子化 CSS | UnoCSS | 0.62 |
| 工具库 | @vueuse/core, dayjs | - |
| 样式 | CSS Variables + Scoped CSS | - |

## 工程结构

```
frontend/
├── public/                              # 静态资源
│   └── favicon.svg                      # 网站图标
├── src/
│   ├── main.ts                          # 应用入口，插件注册
│   ├── App.vue                          # 根组件，全局上传对话框
│   ├── api/                             # API 请求层
│   │   ├── admin.ts                     # 管理后台 API
│   │   ├── album.ts                     # 相册 API
│   │   ├── announcement.ts              # 公告 API
│   │   ├── apiToken.ts                  # API Token 管理
│   │   ├── auth.ts                      # 登录/注册/重置密码
│   │   ├── image.ts                     # 图片上传/管理
│   │   ├── link.ts                      # 链接格式
│   │   ├── logs.ts                      # 日志查询
│   │   ├── settings.ts                  # 设置
│   │   ├── share.ts                     # 分享
│   │   ├── user.ts                      # 用户信息
│   │   └── whitelist.ts                 # 域名白名单
│   ├── components/                      # 组件
│   │   ├── admin/                       # 管理后台组件
│   │   │   └── AdminNav.vue             # 后台导航栏
│   │   ├── common/                      # 通用组件
│   │   │   ├── ConfirmDialog.vue        # 确认对话框
│   │   │   ├── DateTimePicker.vue       # 日期时间选择器
│   │   │   ├── DropdownMenu.vue         # 下拉菜单
│   │   │   ├── HotkeysPanel.vue         # 快捷键面板
│   │   │   ├── ImageSkeleton.vue        # 图片骨架屏
│   │   │   ├── LanguageSwitcher.vue     # 语言切换
│   │   │   ├── MobileDrawer.vue         # 移动端抽屉菜单
│   │   │   ├── QuotaProgress.vue        # 配额进度条
│   │   │   ├── SelectDropdown.vue       # 下拉选择器
│   │   │   ├── Skeleton.vue             # 通用骨架屏
│   │   │   └── ToastContainer.vue       # Toast 通知
│   │   ├── layout/                      # 布局组件
│   │   │   ├── AnnouncementBar.vue      # 公告栏
│   │   │   ├── AppHeader.vue            # 顶部导航
│   │   │   └── MainLayout.vue           # 主布局
│   │   ├── share/                       # 分享相关
│   │   │   ├── LinkFormatPanel.vue      # 链接格式面板
│   │   │   └── ShareDialog.vue          # 分享对话框
│   │   ├── upload/                      # 上传相关
│   │   │   ├── ImageUploader.vue        # 图片上传器
│   │   │   └── WatermarkConfig.vue      # 水印配置
│   │   └── user/                        # 用户相关
│   │       └── AvatarUploader.vue       # 头像上传
│   ├── composables/                     # 组合式函数
│   │   ├── useConfirm.ts               # 确认对话框
│   │   ├── useGesture.ts               # 手势识别
│   │   ├── useHotkeys.ts               # 快捷键管理
│   │   ├── useLocale.ts                # 语言切换
│   │   ├── useToast.ts                 # Toast 通知
│   │   ├── useUpload.ts                # 上传逻辑
│   │   └── useWatermark.ts             # 水印处理
│   ├── config/                          # 配置
│   │   └── index.ts                     # 环境变量、常量
│   ├── constants/                       # 常量定义
│   │   ├── icons.ts                     # SVG 图标路径
│   │   └── index.ts                     # 导出
│   ├── locales/                         # 国际化
│   │   ├── index.ts                     # i18n 实例
│   │   ├── zh-CN.ts                     # 中文
│   │   └── en-US.ts                     # English
│   ├── router/                          # 路由
│   │   └── index.ts                     # 路由配置、导航守卫
│   ├── stores/                          # Pinia 状态管理
│   │   ├── site.ts                      # 站点配置、公告
│   │   ├── theme.ts                     # 主题模式、主题色
│   │   └── user.ts                      # 用户信息、Token
│   ├── styles/                          # 全局样式
│   │   ├── variables.css                # CSS 变量定义
│   │   ├── main.css                     # 全局样式
│   │   └── responsive.css               # 响应式断点
│   ├── types/                           # TypeScript 类型定义
│   │   ├── index.ts                     # 通用类型（User、LoginResponse 等）
│   │   ├── admin.ts                     # 管理后台类型
│   │   ├── album.ts                     # 相册类型
│   │   ├── announcement.ts              # 公告类型
│   │   ├── apiToken.ts                  # API Token 类型
│   │   ├── image.ts                     # 图片类型
│   │   ├── link.ts                      # 链接类型
│   │   ├── logs.ts                      # 日志类型
│   │   ├── settings.ts                  # 设置类型
│   │   ├── share.ts                     # 分享类型
│   │   └── whitelist.ts                 # 白名单类型
│   ├── utils/                           # 工具函数
│   │   ├── clipboard.ts                 # 剪贴板操作
│   │   ├── error.ts                     # 错误处理
│   │   ├── format.ts                    # 格式化（文件大小、日期等）
│   │   ├── image.ts                     # 图片处理
│   │   └── request.ts                   # Axios 实例封装
│   ├── views/                           # 页面视图
│   │   ├── Home.vue                     # 首页
│   │   ├── admin/                       # 管理后台页面
│   │   ├── album/                       # 相册页面
│   │   ├── auth/                        # 登录/注册/找回密码
│   │   ├── gallery/                     # 图片库
│   │   ├── share/                       # 分享页面
│   │   ├── trash/                       # 回收站
│   │   └── user/                        # 用户设置页面
│   └── vite-env.d.ts                    # Vite 环境变量类型声明
├── .env.example                         # 环境变量模板
├── index.html                           # Vite 入口 HTML
├── package.json                         # 依赖配置
├── tsconfig.json                        # TypeScript 配置
├── tsconfig.node.json                   # Node 端 TS 配置
├── uno.config.ts                        # UnoCSS 配置
└── vite.config.ts                       # Vite 构建配置
```

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装步骤

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

开发服务器启动后访问 `http://localhost:5173`，API 请求会自动代理到 `http://localhost:8080`。

### 环境变量配置

复制 `.env.example` 为 `.env.production` 并修改：

```bash
# API 路径前缀
# 同域部署：使用默认值 /api/v1
# 分离部署：填写后端完整地址，如 https://api.yourdomain.com/api/v1
VITE_API_URL=/api/v1

# 网站标题
VITE_APP_TITLE=NKAtlas
```

### 构建与部署

```bash
# 构建生产版本
npm run build

# 本地预览构建产物
npm run preview
```

构建产物输出到 `dist/` 目录，部署时配合 Nginx 将 API 请求代理到后端即可。

**Nginx 参考配置：**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 前端静态资源
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:8080;
    }

    # 短链重定向
    location /s/ {
        proxy_pass http://localhost:8080;
    }

    # 图片直链
    location /i/ {
        proxy_pass http://localhost:8080;
    }

    # 上传的文件
    location /uploads/ {
        proxy_pass http://localhost:8080;
    }
}
```

## 许可证

MIT License

## 作者

NixStudio (Nix Lockhart)
