sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel"
], function (Controller, History, Filter, FilterOperator, JSONModel) {
	"use strict";

	return Controller.extend("ZSD_APP_GREMI.ZSD_APP_GREMI.controller.GreDetails", {

		onInit: function () {
			//Inicializar variables
			this._viewMain = this.getView();

			//Inicializar el oRouter
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("RouteGreDetails").attachPatternMatched(this._onObjectMatched, this);

			//Inicializar le Modelo
			var dataModelDetail = this.getOwnerComponent().getModel("DetailProduct");
			this.getView().setModel(dataModelDetail, "detailProducts");
		},
		onBeforeRendering: function () {

		},
		onAfterRendering: function () {

		},
		onExit: function () {

		},

		//Méthodo para refrescar los datos del Odata
		_onObjectMatched: function (oEvent) {

			//Inicializar 
			this._viewMain = this.getView();

			var oViewModel = this.getView().getModel();
			//var	oDataModel = this.getModel();

			//Inicializar TAB View
			var Tabini = this.getView().byId("idIconTabBarNoIcons");
			Tabini.setSelectedKey("info");

			//Inicializar Modelo
			this.clearModelHeader();

			var sId = oEvent.getParameter("arguments").IdGre;
			var aFilter = [];

			aFilter.push(new Filter('Numgr', FilterOperator.EQ, sId));

			//Forma 02
			this.getView().bindElement({
				path: "/HeaderSet(Numgr='" + sId + "')",
				events: {
					dataRequested: function (oData) {
						oViewModel.metadataLoaded().then(function () {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function (oData) {
						this._viewMain.setModel(new JSONModel(oData.mParameters.data), "modelDataGRE")
						this.updateTextsInputs(oData.mParameters.data); //Actualizar los Textos
						oViewModel.setProperty("/busy", false);
					}.bind(this)
				}
			});

			//Obtener datos para el Detalle
			this.clearModelDetail();
			this.ReadOdataParameterDetail("HeaderSet", "Numgr", sId, "/HeaderToDetail", "Detail");
			//Refresh
			this.refreshModels();

			//=====================================================//
			//*/
			/*
			//Forma 01 - Main
			//Leer el Odata de Consulta
			this.getView().getModel().read("/HeaderSet", {
				filters: aFilter,
				success: function (Odata) {
					this.getView().setModel(new JSONModel(Odata.results[0]), "modelDataGRE")
					this.updateTextsInputs(Odata.results[0]); //Actualizar los Textos
					console.log("Ok" + Odata);
				}.bind(this),
				error: function (oError) {
					console.log("Error" + oError);
				}

			});

			//Obtener datos para el Detalle
			this.clearModelDetail();
			this.ReadOdataParameterDetail("HeaderSet", "Numgr", sId, "/HeaderToDetail", "Detail");
			//Refresh
			this.refreshModels();*/

		},

		//Méthodo para retornar
		onNavBack: function () {
			//Clear Variables
			this.clearModelDetail();
			this.clearModelHeader();
			this.clearInputTexts();
			this.clearViewVisualizar();

			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("RouteApp", true);
			}
		},
		//====================================================================================================================================================//
		//====================================================================================================================================================//
		//Methodos de utilidades
		updateTextsInputs: function (oData) {

			var idKunnr = [];
			var idLifnr = [];

			this.ReadOdataParameterTexts("ZshGreCat20Set", "ZcoMot", oData.MotivoTraslado, "", "", "");
			this.ReadOdataParameterTexts("FapKredaSet", "Lifnr", oData.Conductor, "", "Conductor", "");
			this.ReadOdataParameterTexts("ZshLgortGreSet", "Werks", oData.Centro, oData.PuntoPartida, "Lgort", "lgortAlmaPar");

			//Obtener datos de Clientes:
			if (oData.Kunwe) {
				idKunnr.push({
					Field: "Destinatario",
					Value: oData.Kunwe
				});
			}

			if (oData.KunnrSucur) {
				idKunnr.push({
					Field: "ClienteSol",
					Value: oData.KunnrSucur
				});
			}
			if (oData.MotivoTraslado === '02' || oData.MotivoTraslado === '07') {

				if (oData.Proveedor) {
					idKunnr.push({
						Field: "LifnrKunnr",
						Value: oData.Proveedor
					});
				}
			}

			this.ReadOdataParameterTextsRanges("/DebiaSet", "Kunnr", "Kunnr", idKunnr);

			//Obtener datos de Proveedores:
			if (oData.Transportista) {
				idLifnr.push({
					Field: "Transportista",
					Value: oData.Transportista
				});
			}

			if (oData.Conductor) {
				idLifnr.push({
					Field: "Conductor",
					Value: oData.Conductor
				});
			}
			if (oData.MotivoTraslado !== '02' && oData.MotivoTraslado !== '07') {
				if (oData.Proveedor) {
					idLifnr.push({
						Field: "Proveedor",
						Value: oData.Proveedor
					});
				}
			}

			this.ReadOdataParameterTextsRanges("/FapKredaSet", "Lifnr", "Lifnr", idLifnr);

			if (oData.MotivoTraslado === '13' && oData.CategoriaVehiculo !== '') {
				//Motivo 13
				this.ReadOdataParameterTextsDirecc("AlmacenSet", "Werks", oData.Centro, oData.PuntoPartida, "Lgort", "PuntoLLegaAlmac");
				this.ReadOdataParameterTextsDirecc("DestinatarioSet", "Kunnr", oData.Kunwe, "", "", "PuntoPartidaDest");
			} else {
				//Actualizar Direcciones Largas
				if (oData.Proveedor) {
					if (oData.MotivoTraslado === '02' || oData.MotivoTraslado === '07') {
						this.ReadOdataParameterTextsDirecc("DestinatarioSet", "Kunnr", oData.Proveedor, "", "", "DirecAlmac");
					} else {
						this.ReadOdataParameterTextsDirecc("ProveedorSet", "Lifnr", oData.Proveedor, "", "", "DirecAlmac");
					}
				} else if (oData.Centro !== "" && (oData.Proveedor === "" || oData.Proveedor === undefined)) {
					this.ReadOdataParameterTextsDirecc("AlmacenSet", "Werks", oData.Centro, oData.PuntoPartida, "Lgort", "DirecAlmac");
				}

				if (oData.Kunwe) {
					if (oData.MotivoTraslado !== '02' && oData.MotivoTraslado !== '07') {
						this.ReadOdataParameterTextsDirecc("DestinatarioSet", "Kunnr", oData.Kunwe, "", "", "DirecTransp");
					} else if (oData.MotivoTraslado === '02' || oData.MotivoTraslado === '07') {
						this.ReadOdataParameterTextsDirecc("AlmacenSet", "Werks", oData.Centro, oData.PuntoPartida, "Lgort", "DirecTransp");
					}
				}
			}

			//Datos de Dirección
			if (oData.AlmacenDestino) {
				this.ReadOdataParameterTexts("AlmacenSet", "Werks", oData.CentroDestino, oData.AlmacenDestino, "Lgort", "centroDest");
			}

		},
		setTextsInputs: function (data, newField) {
			if (data) {
				if (data.Vstel) {
					this.getView().byId("TxtPtoExpDesc").setValue(data.Vtext);
				}
				if (data.ZcoMot) {
					this.getView().byId("TxtMotivTrasDesc").setValue(data.ZdesMot);
				}
				if (data.Kunnr) {
					this.getView().byId("TxtDesMciaDesc").setValue(data.Mcod1);
				}
				if (data.Vkorg) {
					this.getView().byId("TxtOrgVentDesc").setValue(data.Vtext);
				}

				if (newField === "lgortAlmaPar") {
					if (data.Lgobe) {
						this.getView().byId("TxtCAlmacen").setValue(data.Lgort + " - " + data.Lgobe);
					}
				}

				if (newField === "Conductor") {
					if (data.Lifnr) {
						this.getView().byId("TxtIdCondDesc").setValue(data.Mcod1);
					}
				}
				if (newField === "centroDest") {
					if (data.Lgobe) {
						this.getView().byId("TxtCAlmacenDest").setValue(data.Lgort + " - " + data.Lgobe);
						this.getView().byId("TxtPuntoLleg").setValue(data.Direccion);
					}
				}
			}
		},
		refreshModels: function (oData) {
			try {
				this.getView().getModel("detailProducts").refresh();
				this.getView().getModel("modelDataGRE").refresh();
			} catch (err) {}

		},
		//====================================================================================================================================================//
		//====================================================================================================================================================//
		//Methodos para la limpieza de Variables
		clearModelDetail: function () {
			var detailProduct = this.getView().getModel("detailProducts")
			detailProduct.setProperty("/Detail", []);
			detailProduct.setData({
				Detail: []
			});
			detailProduct.refresh();
		},
		clearModelHeader: function () {
			try {
				this.getView().getModel("modelDataGRE").aBindings = []
				this.getView().getModel("modelDataGRE").destroy();
				this.getView().getModel("modelDataGRE").refresh(true);
			} catch (err) {}
		},
		clearViewVisualizar: function () {
			this.getView().unbindElement();
		},
		clearInputTexts: function () {

			this.getView().byId("TxtMotivTrasDesc").setValue("");
			this.getView().byId("TxtCAlmacen").setValue("");
			this.getView().byId("TxtClientSolicDesc").setValue("");
			this.getView().byId("TxtIdTransDesc").setValue("");
			this.getView().byId("TxtIdCondDesc").setValue("");
			this.getView().byId("TxtProveedDesc").setValue("");
			this.getView().byId("TxtCentroDest").setValue("");
			this.getView().byId("TxtCAlmacenDest").setValue("");

		},
		//====================================================================================================================================================//
		//====================================================================================================================================================//
		//Methodos para lectura de Odatas
		ReadOdataParameterDetail: function (entity, keyField, valueField, entity2, opcion) {

			var path = "/" + entity + "(" + keyField + "='" + valueField + "')" + entity2;

			try {

				this.getView().getModel().read(path, {
					success: function (data) {
						this.getView().getModel("detailProducts").setData({
							Detail: data.results
						});
					}.bind(this),
					// @ts-ignore
					error: function (data) {
						console.log(data);
					}
				});
			} catch (err) {}
		},

		ReadOdataParameterTextsRanges: function (entitySet, idField, fieldRange, values) {

			var field = idField;
			var filtersData = [];
			var valuesAux = values;

			for (var i = 0; i < values.length; i++) {
				filtersData.push(new Filter(fieldRange, FilterOperator.EQ, values[i].Value));
			}

			this.getView().getModel().read(entitySet, {

				filters: filtersData,
				success: function (data) {
					for (var i = 0; i < valuesAux.length; i++) {
						switch (valuesAux[i].Field) {
						case "Destinatario":
							var destin = this.homologacionResultsFilter(data.results, valuesAux[i].Value, "Kunnr");
							if (destin) {
								this.getView().byId("TxtDesMciaDesc").setValue(destin);
							}
							break;
						case "ClienteSol":
							var clientSol = this.homologacionResultsFilter(data.results, valuesAux[i].Value, "Kunnr");
							if (clientSol) {
								this.getView().byId("TxtClientSolicDesc").setValue(clientSol);
							}
							break;
						case "Transportista":
							var trans = this.homologacionResultsFilter(data.results, valuesAux[i].Value, "Lifnr");
							if (trans) {
								this.getView().byId("TxtIdTransDesc").setValue(trans);
							}
							break;
						case "Conductor":
							var conduct = this.homologacionResultsFilter(data.results, valuesAux[i].Value, "Lifnr");
							if (conduct) {
								this.getView().byId("TxtIdCondDesc").setValue(conduct);
							}
							break;
						case "Proveedor":
							var provee = this.homologacionResultsFilter(data.results, valuesAux[i].Value, "Lifnr");
							if (provee) {
								this.getView().byId("TxtProveedDesc").setValue(provee);
							}
							break;
						case "LifnrKunnr":
							let clientSolLif = this.homologacionResultsFilter(data.results, valuesAux[i].Value, "Kunnr");
							if (clientSolLif) {
								this.getView().byId("TxtProveedDesc").setValue(clientSolLif);
							}
							break;
						default:
						}
					}

				}.bind(this),
				error: function (e) {
					console.log(e);
				}
			});

		},
		homologacionResultsFilter: function (oData, keyvalue, fieldResult) {
			for (var i = 0; i < oData.length; i++) {
				switch (fieldResult) {
				case "Kunnr":
					if (oData[i].Kunnr === keyvalue) {
						var value = oData[i].Mcod1;
						break;
					}
					break;
				case "Lifnr":
					if (oData[i].Lifnr === keyvalue) {
						var value = oData[i].Mcod1;
						break;
					}
					break;
				default:
				}
			}
			return value;
		},

		ReadOdataParameterTexts: function (entity, keyField, valueField, valueField2, keyField2, newField) {

			var newField = newField;

			if (valueField) {

				var path = "/" + entity + "(" + keyField + "='" + valueField + "')";

				if (valueField2) {
					var path = "/" + entity + "(" + keyField + "='" + valueField + "'," + keyField2 + "='" + valueField2 + "')";
				}

				try {

					this.getView().getModel().read(path, {
						success: function (data) {
							this.setTextsInputs(data, newField);
						}.bind(this),
						// @ts-ignore
						error: function (data) {
							console.log(data);
						}
					});

				} catch (err) {}
			}
		},
		ReadOdataParameterTextsDirecc: function (entity, keyField, valueField, valueField2, keyField2, newField) {

			var newField = newField;

			if (valueField) {

				var path = "/" + entity + "(" + keyField + "='" + valueField + "')";

				if (valueField2) {
					var path = "/" + entity + "(" + keyField + "='" + valueField + "'," + keyField2 + "='" + valueField2 + "')";
				}

				try {
					this.getView().getModel().read(path, {
						success: function (data) {

							if (newField === "DirecAlmac") {
								this._viewMain.byId("TxtPuntoPart").setValue(data.Direccion);
							} else if (newField === "DirecTransp") {
								this._viewMain.byId("TxtPuntoLleg").setValue(data.Direccion);
							} else if (newField === "PuntoLLegaAlmac") {
								this._viewMain.byId("TxtPuntoLleg").setValue(data.Direccion);
							} else if (newField === "PuntoPartidaDest") {
								this._viewMain.byId("TxtPuntoPart").setValue(data.Direccion);
							}

						}.bind(this),
						// @ts-ignore
						error: function (data) {
							console.log(data);
						}
					});

				} catch (err) {}
			}
		},
		formaterInteger: function (value) {
			if (value) {
				try {
					var valueConvert = parseInt(value);
					return valueConvert;

				} catch (err) {}

			}
		}

	});
});