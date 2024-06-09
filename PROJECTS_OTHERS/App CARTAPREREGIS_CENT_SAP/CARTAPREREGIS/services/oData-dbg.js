sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Filter"
], function (Object, Filter) {
	"use strict";
	let oSAPModel;
	let instance;
	let services = Object.extend("com.centria.CartaPreregistro.oData", {
		constructor: function () {},

		setODataSapModel: function (oDataModel) {
			oSAPModel = oDataModel;
		},

		obtenerBotones: function () {
			return new Promise(function (resolve, reject) {
				oSAPModel.metadataLoaded().then(function () {
					sap.ui.core.BusyIndicator.show(0);
					oSAPModel.read("/Boton107Set", {
						success: function (data) {
							sap.ui.core.BusyIndicator.hide();
							resolve(data.results);
						},
						error: function (error) {
							sap.ui.core.BusyIndicator.hide();
							console.log(error);
							reject(error.responseText);
						}
					});
				});
			});
		},

		obtenerPDFCarta: function (oPropuesta) {
			return new Promise(function (resolve, reject) {
				oSAPModel.metadataLoaded().then(function () {

					sap.ui.core.BusyIndicator.show(0);
					oSAPModel.read("/DescarCartasPDF107Set", {
						filters: [new Filter("Botonopc", "EQ", oPropuesta.Botonopc),
							new Filter("Bukrs", "EQ", oPropuesta.Bukrs),
							new Filter("Laufi", "EQ", oPropuesta.Laufi),
							new Filter("Laufd", "EQ", oPropuesta.Laufd)
						],
						success: function (data) {
							sap.ui.core.BusyIndicator.hide();
							resolve(data);
						},
						error: function (error) {
							sap.ui.core.BusyIndicator.hide();
							console.log(error);
							reject(error);
						}
					});
				});
			});
		},

		fnAutocompletarCampos: function (oCarta, pBoton) {
			return new Promise(function (resolve, reject) {
				oSAPModel.metadataLoaded().then(function () {
					let aFilters = [];
					//Exterior
					if (pBoton === "9") {
						aFilters = [new Filter("Botonopc", "EQ", oCarta.Botonopc),
							new Filter("Bukrs", "EQ", oCarta.Bukrs),
							new Filter("Bankl", "EQ", oCarta.Bankl),
							new Filter("Gvprov", "EQ", oCarta.Gvprov)

						];
					} else {
						//Nacional	
						aFilters = [new Filter("Botonopc", "EQ", oCarta.Botonopc),
							new Filter("Bukrs", "EQ", oCarta.Bukrs),
							new Filter("Bankl", "EQ", oCarta.Bankl),
							new Filter("Bukrsben", "EQ", oCarta.Bukrsben),
							new Filter("Banklben", "EQ", oCarta.Banklben)
						];
					}

					sap.ui.core.BusyIndicator.show(0);
					oSAPModel.read("/AutoCompCampR107Set", {
						filters: aFilters,
						success: function (data) {
							sap.ui.core.BusyIndicator.hide();
							resolve(data);
						},
						error: function (error) {
							sap.ui.core.BusyIndicator.hide();
							console.log(error);
							reject(error);
						}
					});
				});
			});
		},

		eliminarEntidadSAP: function (sContextPath) {
			return new Promise(function (resolve, reject) {
				oSAPModel.metadataLoaded().then(function () {

					sap.ui.core.BusyIndicator.show(0);
					oSAPModel.remove(sContextPath, {
						success: function (data) {
							sap.ui.core.BusyIndicator.hide();
							resolve(data);
						},
						error: function (error) {
							sap.ui.core.BusyIndicator.hide();
							console.log(error);
							reject(error.responseText);
						}
					});
				});
			});
		},
		crearEntidadSAP: function (sContextPath, oData) {
			return new Promise(function (resolve, reject) {
				oSAPModel.metadataLoaded().then(function () {

					sap.ui.core.BusyIndicator.show(0);
					oSAPModel.create(sContextPath, oData, {
						success: function (data) {
							sap.ui.core.BusyIndicator.hide();
							resolve(data);
						},
						error: function (error) {
							sap.ui.core.BusyIndicator.hide();
							console.log(error);
							reject(error.responseText);
						}
					});
				});
			});
		},

		readEntidadSAP: function (sPath, aFilters) {
			return new Promise(function (resolve, reject) {
				oSAPModel.metadataLoaded().then(function () {
					sap.ui.core.BusyIndicator.show(0);
					oSAPModel.read(sPath, {
						filters: aFilters,
						success: function (data) {
							sap.ui.core.BusyIndicator.hide();
							resolve(data);
						},
						error: function (error) {
							sap.ui.core.BusyIndicator.hide();
							console.log(error);
							reject(error.responseText);
						}
					});
				});
			});
		}

	});
	return {
		getInstance: function () {
			if (!instance) {
				instance = new services();
			}
			return instance;
		}
	};
});