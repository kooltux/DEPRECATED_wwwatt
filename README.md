* Yoctopuce Wattmeter (and other devices) web interface

** Install

- clone wwwatt git

$ git clone git@git.vannes:lab/wwwatt

- install node.js >0.10

$ sudo zypper ar http://download.opensuse.org/repositories/devel:/languages:/nodejs/openSUSE_12.2/
$ sudo zypper in nodejs

- Build node modules

$ cd wwwatt
$ ./reconfigure

- Start the web server:

$ ./wwwattd 
---------------------------------------------------
Loading config from /home/sdx/devel/wwwatt/etc/wwwattd.conf
2013-07-12T16:36:00.394Z - debug: DEBUG mode - console log not removed
2013-07-12T16:36:00.395Z - info: -------------- new daemon session -----------------
2013-07-12T16:36:00.397Z - debug: Creating www server with config: { port: 8080,
  confdir: '/home/sdx/devel/wwwatt/etc',
  htdocs: '/home/sdx/devel/wwwatt/htdocs',
  timeout: 5000,
  title: 'WWWATT Server' }
2013-07-12T16:36:00.475Z - info: Listening on port 8080
...

- Launch Firefox or Chrome and connect on: http://localhost:8080/

- Plug the Yoctowatt module 

In the log:
...
2013-07-12T16:37:29.774Z - info: WattMeter connected:  beacon=0, deviceId=42, devRelease=0, firmware=11871, logicalName=, manufacturer=, nbInterfaces=1, productName=Yocto-Watt, serial=YWATTMK1-09CE1, vendorId=9440

- On the GUI, go to 'measures' tab


** Diagnostics

- stop the server (^C)

- run the check.js script:

$ sanbox/check.js

