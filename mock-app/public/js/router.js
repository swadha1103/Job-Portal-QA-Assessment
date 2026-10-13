/**
 * TalentCraft Careers Portal - Client Side Router
 */

const Router = (function () {
  function parseRoute() {
    const path = window.location.pathname;
    const match = path.match(/^\/job\/(\d+)$/);

    if (match) {
      return {
        view: 'detail',
        jobId: parseInt(match[1], 10)
      };
    }

    if (path === '/' || path === '' || path === '/index.html') {
      return { view: 'directory' };
    }

    // Any other /job/* path with non-numeric or unknown
    const genericJobMatch = path.match(/^\/job\/(.+)$/);
    if (genericJobMatch) {
      return {
        view: 'detail',
        jobId: parseInt(genericJobMatch[1], 10) || genericJobMatch[1]
      };
    }

    return { view: 'not-found' };
  }

  function navigateTo(url, replace = false) {
    if (replace) {
      window.history.replaceState({}, '', url);
    } else {
      window.history.pushState({}, '', url);
    }
    handleRouteChange();
  }

  function handleRouteChange() {
    const route = parseRoute();
    if (window.App && typeof window.App.onRouteChanged === 'function') {
      window.App.onRouteChanged(route);
    }
  }

  window.addEventListener('popstate', handleRouteChange);

  return {
    parseRoute,
    navigateTo,
    handleRouteChange
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Router;
}
