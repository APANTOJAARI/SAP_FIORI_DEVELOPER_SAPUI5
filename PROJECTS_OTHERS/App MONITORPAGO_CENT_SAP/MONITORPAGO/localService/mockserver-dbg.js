sap.ui.define([
		"sap/ui/core/util/MockServer",
		"sap/base/util/UriParameters"
	],
	function (MockServer, UriParameters) {
		"use strict";
		return {
			init: function () {
				// create MockServer
				var oMockServer = new MockServer({
					rootUri: "/sap/opu/odata/sap/ZFISO_MONITOR_RPA_H2H_SRV/"
				});
				var oUriParameters = new UriParameters(window.location.href);
				// configure MockServer
				MockServer.config({
					autoRespond: true, // boolean
					autoRespondAfter: oUriParameters.get("serverDelay") || 1000 // int
				});
				// simulate
				//var sPath = jQuery.sap.getModulePath("De", sSuffix)
				var sPath = "../localService";
				oMockServer.simulate(sPath + "/metadata.xml", sPath + "/mockdata");
				// start MockServer
				oMockServer.start();
			}
		};
	});