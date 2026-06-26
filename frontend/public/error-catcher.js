window.addEventListener('error', function(e) {
  document.body.innerHTML = '<div style="color: red; padding: 20px; font-family: monospace; font-size: 16px;"><h1>Global Error</h1><pre>' + (e.error ? e.error.stack : e.message) + '</pre></div>';
});
window.addEventListener('unhandledrejection', function(e) {
  document.body.innerHTML = '<div style="color: red; padding: 20px; font-family: monospace; font-size: 16px;"><h1>Unhandled Promise</h1><pre>' + (e.reason && e.reason.stack ? e.reason.stack : e.reason) + '</pre></div>';
});
