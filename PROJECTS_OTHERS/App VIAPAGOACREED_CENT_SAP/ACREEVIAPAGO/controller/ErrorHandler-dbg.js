sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox"
], function (UI5Object, MessageBox) {
	"use strict";

	return UI5Object.extend("com.centria.ReclasificacionViasPagoAcreedores.controller.ErrorHandler", {

		/**
		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @class
		 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
		 * @public
		 * @alias pe.com.gloria.SalesOrders.controller.ErrorHandler
		 */
		constructor: function (oComponent, aModel) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._bMessageOpen = false;
			this._sErrorText = this._oResourceBundle.getText("errorText");

			for (let i = 0; i < aModel.length; i++) {
				let _oModel = oComponent.getModel(aModel[i]);
				if (aModel[i] === "") {
					_oModel = oComponent.getModel();
				}

			/*	_oModel.attachMetadataFailed(function (oEvent) {
					var oParams = oEvent.getParameters();
					this._showServiceError(oParams.response);
				}, this);*/

				_oModel.attachRequestFailed(function (oEvent) {
					var oParams = oEvent.getParameters();
					var oResponse = oParams.response;
					var oHeaders = oResponse.headers;

					if (oHeaders["com.sap.cloud.security.login"] === "login-request") {
						return false;
					}

					this._showStandardError(JSON.parse(oResponse.responseText).error.message.value);

				}, this);

				_oModel.attachBatchRequestCompleted(function (oEvent) {
					var oParams = oEvent.getParameters();
					var oResponse = oParams.response;
					var oHeaders = oResponse.headers;
					if (oHeaders["com.sap.cloud.security.login"] === "login-request") {
						MessageBox.warning("La sesión ha caducado, es necesario recargar la página", {
							onClose: function (sAccion) {
								window.location.reload();
							}
						});
					}
				}, this);
			}

		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function (sDetails) {
			sap.ui.core.BusyIndicator.hide();
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			MessageBox.error(
				this._sErrorText, {
					id: "serviceErrorMessageBox",
					details: sDetails,
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		},
		_showStandardError: function (sMessage) {
			sap.ui.core.BusyIndicator.hide();
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			MessageBox.error(sMessage, {
				id: "serviceWarningMessageBox",
				onClose: function () {
					this._bMessageOpen = false;
				}.bind(this)
			});
		}

	});

});