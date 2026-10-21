// Load the screenshot engine only when the user captures a page.
(() => {
  let pending;
  const loader = async (...args) => {
    if (!pending) pending = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'html2canvas.min.js';
      script.onload = () => window.html2canvas !== loader ? resolve() : reject(new Error('截图组件未能加载'));
      script.onerror = () => { script.remove(); reject(new Error('截图组件加载失败，请联网后重试')); };
      document.head.appendChild(script);
    }).catch(error => { pending = null; throw error; });
    await pending;
    return window.html2canvas(...args);
  };
  window.html2canvas = loader;
})();
