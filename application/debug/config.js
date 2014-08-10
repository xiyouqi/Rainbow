define(function() {

  var rules = [];

  // for seajs.org
  rules.push([
    'http://10.65.162.60/Rainbow/',
    'http://rainbow.hulu.io/'
  ]);
  
  rules.push([
    'http://dev.perpetualinfo.com:8080/Rainbow/',
    'http://rainbow.hulu.io/'
  ]);
  
  rules.push([
    'http://pro.perpetualinfo.com:8080/Rainbow/',
    'http://rainbow.hulu.io/'
  ]);
  
  rules.push([
    'http://pm.perpetualinfo.com:8088/gbroshttp/Rainbow/',
    'http://rainbow.hulu.io/'
  ]);

  // set map rules
  seajs.config({'map': rules});

});