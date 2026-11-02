// Give desktop visitors the same viewport and interaction coordinates as a phone.
(() => {
  if (window.self !== window.top || window.innerWidth <= 600) return;
  const shell = new URL('./phone.html', location.href);
  shell.searchParams.set('page', location.pathname.split('/').pop() + location.search + location.hash);
  location.replace(shell.href);
})();
