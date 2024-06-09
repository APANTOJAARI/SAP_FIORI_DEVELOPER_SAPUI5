/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/everis/centria-ZFIR098-generacion-texto-banco-web/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});