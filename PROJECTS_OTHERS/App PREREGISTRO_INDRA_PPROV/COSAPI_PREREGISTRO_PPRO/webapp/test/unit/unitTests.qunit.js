/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"nscosapi/preregistroproveedor/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
