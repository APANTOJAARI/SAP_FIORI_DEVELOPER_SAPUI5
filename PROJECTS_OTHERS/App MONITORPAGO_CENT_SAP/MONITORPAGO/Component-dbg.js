sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"h2h/centria/h2hmonitorpagosrpa/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("h2h.centria.h2hmonitorpagosrpa.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// Start MockServer
			//mockserver.init();
			/*this._oMockServer = new MockServer({
				rootUri: "/MockDataService"
			});
			var sMockdataUrl = sap.ui.require.toUrl("h2h/centria/h2hmonitorpagosrpa/mockserver");
			console.log(sMockdataUrl);
			var sMetadataUrl = sMockdataUrl + "/metadata.xml";
			this._oMockServer.simulate(sMetadataUrl, {
				sMockdataBaseUrl: sMockdataUrl,
				aEntitySetsNames: ['ListaPagosRPASet']
			});
			this._oMockServer.start();*/

			// Set Spanish as Default Language
			sap.ui.getCore().getConfiguration().setLanguage("es");

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		},

		initMockServer: function () {

		}
	});
});