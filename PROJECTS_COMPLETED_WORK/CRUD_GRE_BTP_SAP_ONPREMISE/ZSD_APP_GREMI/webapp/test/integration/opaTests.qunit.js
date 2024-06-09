/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ZSD_APP_GREMI/ZSD_APP_GREMI/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});