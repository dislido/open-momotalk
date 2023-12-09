import showMessage from '@/components/message';

if (window.pageConstants.env === 'production') {
  navigator.serviceWorker.register('/static/sw.js', { scope: '/' }).then(
    (registration) => {
      registration.addEventListener('updatefound', () => {
        showMessage('新版本可用,更新中...');
        const { installing } = registration;
        if (!installing) return;
        installing.onstatechange = function () {
          if (installing.state === 'installed') {
            showMessage('更新完成,页面将自动刷新');
            installing.postMessage('update');
          }
        };
      });
    },
    // (error) => {
    //   console.error(\`Service worker registration failed: \${error}\`);
    // },
  );
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}
