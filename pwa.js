(() => {
  const SW_VERSION = 'v6-cache-migration-1';
  const reloadKey = `epaule-sw-reload-${SW_VERSION}`;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (sessionStorage.getItem(reloadKey) === '1') return;
      sessionStorage.setItem(reloadKey, '1');
      window.location.reload();
    });

    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register(`./sw.js?${SW_VERSION}`, {
          updateViaCache: 'none'
        });
        await registration.update();
      } catch (error) {
        console.error('Service worker registration failed', error);
      }
    });
  }

  const button = document.getElementById('installAppButton');
  if (!button) return;
  let installPrompt = null;

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    button.hidden = false;
  });

  button.addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    button.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    button.hidden = true;
  });
})();
