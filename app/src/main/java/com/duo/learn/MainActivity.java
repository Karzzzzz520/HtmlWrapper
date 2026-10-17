package com.duo.learn;

import android.os.Bundle;
import android.net.Uri;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.JavascriptInterface;
import android.content.Context;
import android.widget.Toast;
import java.io.*;
import androidx.appcompat.app.AppCompatActivity;

/**
 * 用假域名 https://appassets.androidplatform.net/ 提供 assets 里的网页。
 *
 * 为什么不直接用 file:///android_asset/：
 *   1. file:// 下 localStorage 在多数 WebView 上不可靠，存档会丢
 *   2. file:// 下 index.html 和 lesson.html 算不算同一个源没有保证，
 *      两边各存一份进度，地图页和答题页就对不上
 * 换成 https 假域名后，两件事都解决：同源、localStorage 稳定。
 */
public class MainActivity extends AppCompatActivity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    /** 网页底色 #131f24，给 WebView 自己也刷上，避免加载瞬间闪一下白 */
    private static final int BG = 0xFF131F24;

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setBackgroundColor(BG);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        // 点一下就出声，不要求先有个手势（原来的壳会卡第一声）
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (u == null || !HOST.equals(u.getHost())) return null;

                String path = u.getPath();
                if (path == null || path.isEmpty() || "/".equals(path)) path = "/index.html";
                String name = path.startsWith("/") ? path.substring(1) : path;

                try {
                    InputStream is = getAssets().open(name);
                    return new WebResourceResponse(mimeOf(name), "UTF-8", is);
                } catch (IOException e) {
                    return new WebResourceResponse("text/plain", "UTF-8",
                            new ByteArrayInputStream(("404 " + name).getBytes()));
                }
            }
        });

        webView.addJavascriptInterface(new AndroidBridge(this), "Android");
        webView.loadUrl(START);
    }

    /** 按扩展名给 MIME —— 给错了浏览器会拒绝执行或用错方式解析 */
    private static String mimeOf(String name) {
        String n = name.toLowerCase();
        if (n.endsWith(".html") || n.endsWith(".htm")) return "text/html";
        if (n.endsWith(".js")) return "application/javascript";
        if (n.endsWith(".css")) return "text/css";
        if (n.endsWith(".json")) return "application/json";
        if (n.endsWith(".svg")) return "image/svg+xml";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".webp")) return "image/webp";
        if (n.endsWith(".gif")) return "image/gif";
        if (n.endsWith(".mp3")) return "audio/mpeg";
        if (n.endsWith(".wav")) return "audio/wav";
        if (n.endsWith(".ogg")) return "audio/ogg";
        if (n.endsWith(".woff")) return "font/woff";
        if (n.endsWith(".woff2")) return "font/woff2";
        if (n.endsWith(".ttf")) return "font/ttf";
        if (n.endsWith(".otf")) return "font/otf";
        return "application/octet-stream";
    }

    public class AndroidBridge {
        private Context context;

        AndroidBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void toast(String message) {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
        }

        @JavascriptInterface
        public void toastLong(String message) {
            Toast.makeText(context, message, Toast.LENGTH_LONG).show();
        }

        @JavascriptInterface
        public String readFile(String path) {
            try {
                File file = new File(context.getFilesDir(), path);
                if (!file.exists()) return "";
                StringBuilder sb = new StringBuilder();
                BufferedReader reader = new BufferedReader(new FileReader(file));
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
                reader.close();
                return sb.toString();
            } catch (Exception e) {
                return "ERROR: " + e.getMessage();
            }
        }

        @JavascriptInterface
        public boolean writeFile(String path, String content) {
            try {
                File file = new File(context.getFilesDir(), path);
                file.getParentFile().mkdirs();
                FileWriter writer = new FileWriter(file);
                writer.write(content);
                writer.close();
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public String getVersion() {
            try {
                return context.getPackageManager().getPackageInfo(context.getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "1.0";
            }
        }

        @JavascriptInterface
        public void exitApp() {
            ((MainActivity) context).finish();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}