// simple, uninspired http tunneling server, adapted from
// <https://nodejs.org/api/http.html#http_event_connect>
const url = require('url')
const net = require('net');
const http = require('http');

const defaultOnClientSocketError = request => error => {
  console.error(
    `clientSocket error for request: ${request.method} ${request.url}`, 
    error
  )
}

const defaultOnServerSocketError = request => error => {
  console.error(
    `serverSocket error for request: ${request.method} ${request.url}`,
    error
  )
  request.destroy()
}

function createProxyServer(
  onRequest = () => {}, 
  {
    onClientSocketError = defaultOnClientSocketError,
    onServerSocketError = defaultOnServerSocketError
  } = {}
) {
  const proxyServer = http.createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });

    res.end('OK');
  });

  proxyServer.on('connect', (req, clientSocket, head) => {
    onRequest(req);

    clientSocket.on('error', onClientSocketError(req));

    const {
      port,
      hostname
    } = url.parse(`http://${req.url}`);

    var serverSocket = net.connect(port, hostname, () => {
      clientSocket.write(
        'HTTP/1.1 200 Connection Established\r\n' +
        'Proxy-agent: Node.js-Proxy\r\n' +
        '\r\n'
      );

      serverSocket.write(head);
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    });

    serverSocket.on('error', onServerSocketError(req));
  });

  return proxyServer;
}

module.exports = createProxyServer;
