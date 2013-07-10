#!/usr/bin/env node

var util=require('util');

var yapi=require('node-yoctopuce').yapi;

var devices=yapi.getAllDevices();
devices.forEach(function(devid) {
});

/*
yapi.on("functionUpdate", function (descriptor, value) {
  util.log(util.format("function: %d value: %s.", descriptor, value));
});
*/



