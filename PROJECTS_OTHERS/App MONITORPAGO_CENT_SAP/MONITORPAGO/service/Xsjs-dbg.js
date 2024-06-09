sap.ui.define([
	"sap/ui/model/json/JSONModel"
], function (JSONModel) {
	"use strict";
	return {
		getToken: function () {
			sap.ui.core.BusyIndicator.show(0);
			return new Promise(function (resolve, reject) {
				$.ajax({
					type: "GET",
					url: "/H2H/PropuestaPago/xsjs/guardarAdjunto.xsjs",
					headers: {
						"X-CSRF-Token": "Fetch"
					},
					success: function (data, statusText, xhr) {
						sap.ui.core.BusyIndicator.hide();
						resolve(xhr.getResponseHeader("X-CSRF-Token"));
					},
					error: function (errMsg) {
						sap.ui.core.BusyIndicator.hide();
						reject(errMsg);
					}

				});
			}.bind(this));
		},

		savePropuesta: function (oContextData) {
			return new Promise(function (resolve, reject) {
				var _this = this;
				this.getToken().then(function (oToken) {
					sap.ui.core.BusyIndicator.show(0);
					$.ajax({
						type: "POST",
						url: "/H2H/PropuestaPago/xsjs/guardarPropuesta.xsjs",
						data: oContextData,
						headers: {
							"X-CSRF-Token": oToken
						},
						success: function (result) {
							sap.ui.core.BusyIndicator.hide();
							resolve(result);
						},
						error: function (errMsg) {
							sap.ui.core.BusyIndicator.hide();
							reject(errMsg);
						},
						dataType: "json",
						contentType: "application/json"
					});
				}).catch(function (sErrorMsg) {
					reject(sErrorMsg);
				});

			}.bind(this));
		},
		
		obtenerConstantes: function () {
			sap.ui.core.BusyIndicator.show(0);
			return new Promise(function (resolve, reject) {
				$.ajax({
					type: "GET",
					url: "/H2H/PropuestaPago/xsjs/getConstantes.xsjs",
					success: function (data, statusText, xhr) {
						sap.ui.core.BusyIndicator.hide();
						resolve(data);
					},
					error: function (errMsg) {
						sap.ui.core.BusyIndicator.hide();
						reject(errMsg);
					}

				});
			}.bind(this));
		}

	};
});