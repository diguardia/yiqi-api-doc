window.onload = function() {
  const params = new URLSearchParams(window.location.search);
  const specUrl = params.get('url') || 'Security.api.json';
  const readableName = specUrl.split('/').pop().replace(/\.json$/i, '');
  document.title = `YiQi API · ${readableName}`;

  window.ui = SwaggerUIBundle({
    url: decodeURIComponent(specUrl),
    dom_id: '#swagger-ui',
    deepLinking: true,
    displayRequestDuration: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: 'StandaloneLayout'
  });
};
