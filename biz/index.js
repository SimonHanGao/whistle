var net = require('net');
var util = require('../lib/util');

module.exports = function(req, res, next) {
  var config = this.config;
  var host = (req.headers.host || '').split(':');
  var port = host[1] || 80;
  host = host[0];
  if (net.isIP(host) && util.isLocalAddress(host)) {
    if (port == config.port || port == config.uiport) {
      host = config.localUIHost;
    } else if (port == config.weinreport) {
      host = config.WEINRE_HOST;
    }
  }

  var pluginMgr = this.pluginMgr;
  var fullUrl = req.fullUrl = util.getFullUrl(req);
  var pluginHomePage = pluginMgr.getPluginByPath(req);
  if (pluginHomePage) {
    fullUrl = req.fullUrl;
    host = '';
  }
  if (req.headers[config.WEBUI_HEAD] || config.isLocalUIUrl(host)) {
    util.transformReq(req, res, config.uiport);
  } else if (config.isWeinreUrl(host)) {
    util.transformReq(req, res, config.weinreport, true);
  } else if (pluginHomePage || (pluginHomePage = pluginMgr.getPluginByHomePage(fullUrl))) {
    pluginMgr.loadPlugin(pluginHomePage, function(err, ports) {
      if (err || !ports.uiPort) {
        res.response(util.wrapResponse({
          statusCode: err ? 500 : 404,
          headers: {
            'content-type': 'text/plain; charset=utf-8'
          },
          body: err || 'Not Found'
        }));
        return;
      }
      util.transformReq(req, res, ports.uiPort);
    });
  } else {
    next();
  }
};

