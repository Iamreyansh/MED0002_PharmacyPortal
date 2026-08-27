function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri === '/runtime-config.json') {
    return request;
  }

  if (uri !== '/' && uri.indexOf('.') === -1) {
    request.uri = '/index.html';
  }

  return request;
}
