# 🚀 HtmlWrapper

**HTML → APK 封装框架**

一个极简的 Android WebView 壳子，加载 `assets/index.html` 作为界面。
用 MT Manager 反编译后直接修改 HTML 文件即可自定义界面，重新打包即可。

## ✨ 特性

- 📦 **纯 WebView 壳子** — 所有界面逻辑都在 HTML/JS 中
- 🔧 **MT Manager 友好** — 反编译后直接改 `assets/index.html` 即可
- 🌉 **JS ↔ Android 桥接** — 内置 `Android` 对象，可调用原生功能
- ☁️ **GitHub Actions 自动编译** — 推送代码自动生成 APK
- 📱 **最低 API 21** — 支持 Android 5.0+

## 🔌 JS Bridge API

| 方法 | 说明 |
|------|------|
| `Android.toast(msg)` | 显示短 Toast |
| `Android.toastLong(msg)` | 显示长 Toast |
| `Android.writeFile(path, content)` | 写入文件到应用私有目录 |
| `Android.readFile(path)` | 读取文件内容 |
| `Android.getVersion()` | 获取应用版本号 |
| `Android.exitApp()` | 退出应用 |

## 📖 使用方式

### 方式一：GitHub 云编译（推荐）

1. Fork 本仓库
2. 修改 `app/src/main/assets/index.html`
3. 推送代码，GitHub Actions 自动编译
4. 在 Releases 页面下载 APK

### 方式二：MT Manager 反编译修改

1. 下载编译好的 APK
2. 用 MT Manager 反编译
3. 修改 `assets/index.html`
4. 重新打包签名

### 方式三：本地编译

```bash
./gradlew assembleDebug
# APK 输出: app/build/outputs/apk/debug/app-debug.apk
```

## 📁 项目结构

```
HtmlWrapper/
├── .github/workflows/build.yml  # GitHub Actions 编译
├── app/
│   ├── build.gradle
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── assets/index.html    # ⭐ 主要修改这个文件
│       └── java/com/htmlwrapper/
│           └── MainActivity.java # WebView + JS Bridge
├── build.gradle
├── settings.gradle
└── gradlew
```

## 📜 License

MIT