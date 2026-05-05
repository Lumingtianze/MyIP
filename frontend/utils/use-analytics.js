import Analytics from 'analytics';
import googleAnalytics from '@analytics/google-analytics';

// 获取环境变量中的 Google Analytics ID
const analyticsID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID || '';

// 定义插件数组
const plugins = [];

// 只有当配置了有效的 ID 时才加载 Google Analytics 插件
// 这样可以避免在 ID 为空时，插件依然尝试请求 google-analytics 的脚本
if (analyticsID) {
    plugins.push(
        googleAnalytics({
            measurementIds: [analyticsID],
        })
    );
}

// 初始化 Analytics
const analytics = Analytics({
    app: 'MyIP',
    plugins: plugins
});

/**
 * 跟踪事件函数
 * @param {string} category 
 * @param {string} action 
 * @param {string} label 
 */
function trackEvent(category, action, label) {
    // 即使插件没加载，analytics.track 也会安全执行而不会报错
    analytics.track(action, {
        category: category,
        label: label,
    });
}

export { analytics, trackEvent };