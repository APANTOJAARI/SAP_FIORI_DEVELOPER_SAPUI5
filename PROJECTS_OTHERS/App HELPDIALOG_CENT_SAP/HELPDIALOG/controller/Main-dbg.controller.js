sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/ColumnListItem",
	"sap/m/Label",
	"sap/m/Token",
	"sap/base/util/deepExtend",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/SearchField",
	"sap/m/MessageBox",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/type/String",
	"sap/ui/core/Item",
	"../model/models",
	"../services/Xsjs"
], function (Controller, JSONModel, ColumnListItem, Label, Token, deepExtend, Filter, FilterOperator, SearchField, MessageBox,
	BusyIndicator, typeString, Item, Models, XsjsService) {
	"use strict";

	return Controller.extend("com.everis.centria.ZFIR098.controller.Main", {
		onInit: async function () {
			BusyIndicator.show(0);
			this.setupValueHelp();
			this.setupModels();
			this.loadData();
			this._sUserId = this.getLogonUser();
			//this.loadVariants();

		/*	this.onBeforeShow();
			this.getView().addEventDelegate({ // not added the controller as delegate to avoid controller functions with similar names as the events      
				onBeforeShow: $.proxy(function (evt) {
					this.onBeforeShow(evt);
				}, this)
			});*/

			var oModelEntidad = new JSONModel(sap.ui.require.toUrl("com/everis/centria/ZFIR098/model") +
				"/variante.json");
			this._oModelEntidad = oModelEntidad;
			this.getView().setModel(this._oModelEntidad, "oModelEntidad");

		/*	//Setear modelo device
			let oDeviceModel = Models.createDeviceModel();
			this.getView().setModel(oDeviceModel, "oDeviceModel");
			sap.ui.core.IconPool.addIcon('sap', 'customfont', 'icomoon', 'e900');

			//Obtener constantes
			this.oConstantes = await XsjsService.obtenerConstantes().catch(
				(err) => {
					console.error(err);
					MessageBox.error(err.responseText, {
						title: "Obtener constantes"
					});
				});*/

		},

		onPressHome: function (oEvent) {
			if (this.oConstantes && this.oConstantes.rpta) {
				let sDomainUrl = this.oConstantes.rpta.sDocumentUrl;
				let aUrlParts = sDomainUrl.split("#");
				window.location.replace(aUrlParts[0])
			}
		},

		onBeforeShow: function (oEvent) {
			$(document).ready(function () {
				$('[id*="shell-header"]').hide();
			});
		},

		getI18nText: function (sProperty) {
			return this.getView().getModel("i18n").getProperty(sProperty);
		},

		getLogonUser: function () {
			var sUserID = "DEFAULT_USER";
			if (sap.ushell) {
				var oUserInfo = sap.ushell.Container.getService("UserInfo");
				if (oUserInfo) {
					sUserID = oUserInfo.getId();
				}
			}

			return sUserID;
		},

		setupModels: function () {
			this._oOperacionesModel = new JSONModel(sap.ui.require.toUrl("com/everis/centria/ZFIR098/model") +
				"/operaciones.json");
			this._oSociedadColumnsModel = new JSONModel(sap.ui.require.toUrl("com/everis/centria/ZFIR098/model") +
				"/sociedadColumnsModel.json");
			this._oBancoColumnsModel = new JSONModel(sap.ui.require.toUrl("com/everis/centria/ZFIR098/model") +
				"/bancoColumnsModel.json");
			this._oViasPagoColumnsModel = new JSONModel(sap.ui.require.toUrl("com/everis/centria/ZFIR098/model") +
				"/viasPagoColumnsModel.json");
		},

		//#region VALUE HELP
		setupValueHelp: function () {
			this._oSociedadInput = this.getView().byId("iSociedad");
			this._oSociedadInput.addValidator(function (args) {
				if (args.suggestionObject) {
					var key = args.suggestionObject.getCells()[0].getText();
					var text = args.suggestionObject.getCells()[1].getText() + " (" + key + ")";

					return new Token({
						key: key,
						text: text
					});
				}
				return null;
			});

			this._oBancoInput = this.getView().byId("iBanco");
			this._oBancoInput.addValidator(function (args) {
				if (args.suggestionObject) {
					var key = args.suggestionObject.getCells()[1].getText();
					var text = args.suggestionObject.getCells()[4].getText() + " (" + key + ")";

					return new Token({
						key: key,
						text: text
					});
				}
				return null;
			});

			this._oViasPagoInput = this.getView().byId("iViasPago");
			this._oViasPagoInput.addValidator(function (args) {
				if (args.suggestionObject) {
					var key = args.suggestionObject.getCells()[0].getText();
					var text = args.suggestionObject.getCells()[2].getText() + " (" + key + ")";

					return new Token({
						key: key,
						text: text
					});
				}
				return null;
			});
		},

		loadData: function () {
			var oData = {};
			var oModel = new JSONModel(oData);
			oModel.setSizeLimit(1000);
			this._oModel = oModel;
			this.getView().setModel(this._oModel);
			this._ODataModel = this.getView().getModel("ODataModel");
			var that = this;
			Promise.all([
				this.loadSociedades(),
				this.loadBancos(),
				this.loadViasDePago()
			]).then(function (results) {
				that.loadOperaciones();
				BusyIndicator.hide();
			});
		},

		loadOperaciones: function () {
			this._oModel.setProperty("/Operaciones", this._oOperacionesModel.getData().list);
		},

		loadSociedades: function () {
			var that = this;
			return new Promise(function (resolve, reject) {
				var query = "/Im_SociedadSet";
				that._ODataModel.read(query, {
					success: function (oResult) {
						var aResponse = oResult.results;
						that._oModel.setProperty("/Sociedades", aResponse);
						resolve();
					},
					error: function (oError) {
						var sErrorMessage = oError.message;
						BusyIndicator.hide();
						MessageBox.error(that.getI18nText("txtErrorOData") + sErrorMessage, {
							details: oError.responseText
						});
						reject();
					}
				});
			});
		},

		loadBancos: function () {
			var that = this;
			return new Promise(function (resolve, reject) {
				var query = "/Im_BancosSet";
				that._ODataModel.read(query, {
					success: function (oResult) {
						var aResponse = oResult.results;
						that._oModel.setProperty("/Bancos", aResponse);
						resolve();
					},
					error: function (oError) {
						var sErrorMessage = oError.message;
						BusyIndicator.hide();
						MessageBox.error(that.getI18nText("txtErrorOData") + sErrorMessage, {
							details: oError.responseText
						});
						reject();
					}
				});
			});
		},

		loadViasDePago: function () {
			var that = this;
			return new Promise(function (resolve, reject) {
				var query = "/Im_ViaPagoSet";
				that._ODataModel.read(query, {
					success: function (oResult) {
						var aResponse = oResult.results;
						var i = 1;
						aResponse.forEach(function (item) {
							item.key = i;
							i++;
						});
						that._oModel.setProperty("/ViasPago", aResponse);
						resolve();
					},
					error: function (oError) {
						var sErrorMessage = oError.message;
						BusyIndicator.hide();
						MessageBox.error(that.getI18nText("txtErrorOData") + sErrorMessage, {
							details: oError.responseText
						});
						reject();
					}
				});
			});
		},

		onSociedadValueHelpRequest: function () {
			BusyIndicator.show(0);
			var aCols = this._oSociedadColumnsModel.getData().cols;
			this._oBasicSearchField = new SearchField({
				showSearchButton: false
			});

			this._oValueHelpDialog = sap.ui.xmlfragment(
				"com.everis.centria.ZFIR098.view.dialogs.SociedadValueHelpDialog", this);
			this.getView().addDependent(this._oValueHelpDialog);

			this._oValueHelpDialog.setRangeKeyFields([{
				label: "Sociedad",
				key: "Zbukr",
				type: "string",
				typeInstance: new typeString({}, {
					maxLength: 7
				})
			}]);

			var oFilterBar = this._oValueHelpDialog.getFilterBar();
			oFilterBar.setFilterBarExpanded(false);
			oFilterBar.setBasicSearch(this._oBasicSearchField);

			this._oValueHelpDialog.getTableAsync().then(function (oTable) {
				oTable.setModel(this._oModel);
				oTable.setModel(this._oSociedadColumnsModel, "columns");

				if (oTable.bindRows) {
					oTable.bindAggregation("rows", "/Sociedades");
				}

				if (oTable.bindItems) {
					oTable.bindAggregation("items", "/Sociedades", function () {
						return new ColumnListItem({
							cells: aCols.map(function (column) {
								return new Label({
									text: "{" + column.template + "}"
								});
							})
						});
					});
				}

				this._oValueHelpDialog.update();
				BusyIndicator.hide();
			}.bind(this));

			this._oValueHelpDialog.setTokens(this._oSociedadInput.getTokens());
			this._oValueHelpDialog.open();
		},

		onBancoValueHelpRequest: function () {
			BusyIndicator.show(0);
			var aCols = this._oBancoColumnsModel.getData().cols;
			this._oBasicSearchField = new SearchField({
				showSearchButton: false
			});

			this._oValueHelpDialog = sap.ui.xmlfragment(
				"com.everis.centria.ZFIR098.view.dialogs.BancoValueHelpDialog", this);
			this.getView().addDependent(this._oValueHelpDialog);

			this._oValueHelpDialog.setRangeKeyFields([{
				label: "Banco",
				key: "Hbkid",
				type: "string",
				typeInstance: new typeString({}, {
					maxLength: 7
				})
			}]);

			var oFilterBar = this._oValueHelpDialog.getFilterBar();
			oFilterBar.setFilterBarExpanded(false);
			oFilterBar.setBasicSearch(this._oBasicSearchField);

			this._oValueHelpDialog.getTableAsync().then(function (oTable) {
				oTable.setModel(this._oModel);
				oTable.setModel(this._oBancoColumnsModel, "columns");

				if (oTable.bindRows) {
					oTable.bindAggregation("rows", "/Bancos");
				}

				if (oTable.bindItems) {
					oTable.bindAggregation("items", "/Bancos", function () {
						return new ColumnListItem({
							cells: aCols.map(function (column) {
								return new Label({
									text: "{" + column.template + "}"
								});
							})
						});
					});
				}

				this._oValueHelpDialog.update();
				BusyIndicator.hide();
			}.bind(this));

			this._oValueHelpDialog.setTokens(this._oBancoInput.getTokens());
			this._oValueHelpDialog.open();
		},

		onViasPagoValueHelpRequest: function () {
			BusyIndicator.show(0);
			var aCols = this._oViasPagoColumnsModel.getData().cols;
			this._oBasicSearchField = new SearchField({
				showSearchButton: false
			});

			this._oValueHelpDialog = sap.ui.xmlfragment(
				"com.everis.centria.ZFIR098.view.dialogs.ViasPagoValueHelpDialog", this);
			this.getView().addDependent(this._oValueHelpDialog);

			this._oValueHelpDialog.setRangeKeyFields([{
				label: "Vías de Pago",
				key: "Rzawe",
				type: "string",
				typeInstance: new typeString({}, {
					maxLength: 7
				})
			}]);

			var oFilterBar = this._oValueHelpDialog.getFilterBar();
			oFilterBar.setFilterBarExpanded(false);
			oFilterBar.setBasicSearch(this._oBasicSearchField);

			this._oValueHelpDialog.getTableAsync().then(function (oTable) {
				oTable.setModel(this._oModel);
				oTable.setModel(this._oViasPagoColumnsModel, "columns");

				if (oTable.bindRows) {
					oTable.bindAggregation("rows", "/ViasPago");
				}

				if (oTable.bindItems) {
					oTable.bindAggregation("items", "/ViasPago", function () {
						return new ColumnListItem({
							cells: aCols.map(function (column) {
								return new Label({
									text: "{" + column.template + "}"
								});
							})
						});
					});
				}

				this._oValueHelpDialog.update();
				BusyIndicator.hide();
			}.bind(this));

			this._oValueHelpDialog.setTokens(this._oViasPagoInput.getTokens());
			this._oValueHelpDialog.open();
		},

		onSociedadesFilterBarSearch: function (oEvent) {
			var sSearchQuery = this._oBasicSearchField.getValue(),
				aSelectionSet = oEvent.getParameter("selectionSet");
			var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
				if (oControl.getValue()) {
					aResult.push(new Filter({
						path: oControl.getName(),
						operator: FilterOperator.Contains,
						value1: oControl.getValue()
					}));
				}

				return aResult;
			}, []);

			aFilters.push(new Filter({
				filters: [
					new Filter({
						path: "Bukrs",
						operator: FilterOperator.Contains,
						value1: sSearchQuery
					}),
					new Filter({
						path: "Butxt",
						operator: FilterOperator.Contains,
						value1: sSearchQuery
					})
				],
				and: false
			}));

			this._filterTable(new Filter({
				filters: aFilters,
				and: true
			}));
		},

		onBancosFilterBarSearch: function (oEvent) {
			var sSearchQuery = this._oBasicSearchField.getValue(),
				aSelectionSet = oEvent.getParameter("selectionSet");
			var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
				if (oControl.getValue()) {
					aResult.push(new Filter({
						path: oControl.getName(),
						operator: FilterOperator.Contains,
						value1: oControl.getValue()
					}));
				}

				return aResult;
			}, []);

			aFilters.push(new Filter({
				filters: [
					new Filter({
						path: "Hbkid",
						operator: FilterOperator.Contains,
						value1: sSearchQuery
					}),
					new Filter({
						path: "Banka",
						operator: FilterOperator.Contains,
						value1: sSearchQuery
					})
				],
				and: false
			}));

			this._filterTable(new Filter({
				filters: aFilters,
				and: true
			}));
		},

		onViasPagoFilterBarSearch: function (oEvent) {
			var sSearchQuery = this._oBasicSearchField.getValue(),
				aSelectionSet = oEvent.getParameter("selectionSet");
			var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
				if (oControl.getValue()) {
					aResult.push(new Filter({
						path: oControl.getName(),
						operator: FilterOperator.Contains,
						value1: oControl.getValue()
					}));
				}

				return aResult;
			}, []);

			aFilters.push(new Filter({
				filters: [
					new Filter({
						path: "Zlsch",
						operator: FilterOperator.Contains,
						value1: sSearchQuery
					}),
					new Filter({
						path: "Text1",
						operator: FilterOperator.Contains,
						value1: sSearchQuery
					})
				],
				and: false
			}));

			this._filterTable(new Filter({
				filters: aFilters,
				and: true
			}));
		},

		_filterTable: function (oFilter) {
			var oValueHelpDialog = this._oValueHelpDialog;

			oValueHelpDialog.getTableAsync().then(function (oTable) {
				if (oTable.bindRows) {
					oTable.getBinding("rows").filter(oFilter);
				}

				if (oTable.bindItems) {
					oTable.getBinding("items").filter(oFilter);
				}

				oValueHelpDialog.update();
			});
		},

		onSociedadValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			this._oSociedadInput.setTokens(aTokens);
			this._oValueHelpDialog.close();
		},

		onBancoValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			this._oBancoInput.setTokens(aTokens);
			this._oValueHelpDialog.close();
		},

		onViasPagoValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			this._oViasPagoInput.setTokens(aTokens);
			this._oValueHelpDialog.close();
		},

		onValueHelpCancelPress: function () {
			this._oValueHelpDialog.close();
		},

		onValueHelpAfterClose: function () {
			this._oValueHelpDialog.destroy();
		},
		//#endregion VALUE HELP

		onCloseFragment: function (oEvent) {
			this._oFragment.close();
		},

		onAfterCloseFragment: function (oEvent) {
			this._oFragment.destroy();
		},

		onCloseFragmentEntidad: function (oEvent) {
			this._oFragmentEntidad.close();
		},

		onAfterCloseFragmentEntidad: function (oEvent) {
			this._oFragmentEntidad.destroy();
		},

		createFilter: function (oRange) {
			return new Filter({
				path: oRange.keyField,
				operator: oRange.exclude ? "NE" : oRange.operation,
				value1: oRange.value1,
				value2: oRange.value2
			});
		},

		onEjecutar: function (oEvent) {
			//inicio required
			var oInputSociedad = this.getView().byId("iSociedad");
			if (oInputSociedad.getTokens().length === 0) {
				MessageBox.error(this.getI18nText("txtErrorSociedad"));
				return;
			}

			var oDiaEjecucion = this.getView().byId("drsDiaEjecucion");
			if (oDiaEjecucion.getDateValue() === "") {
				MessageBox.error(this.getI18nText("txtErrorDiaEjecucion"));
				return;
			}

			var oInputIdentificacionFrom = this.getView().byId("iIdentificacionFrom");
			if (oInputIdentificacionFrom.getValue() === "") {
				MessageBox.error(this.getI18nText("txtErrorIdentificador"));
				return;
			}
			//fin required

			var that = this;
			var aFilters = [];

			var sEntidad = this.getView().byId("sEntidad").getSelectedKey();
			aFilters.push(new Filter({
				path: "Banco",
				operator: FilterOperator.EQ,
				value1: sEntidad
			}));

			var aSociedades = oInputSociedad.getTokens();
			aSociedades.forEach(function (token) {
				if (token.data().range) {
					var oRange = token.data().range;
					var oFilter = that.createFilter(oRange);
					aFilters.push(oFilter);
				} else {
					aFilters.push(new Filter({
						path: "Zbukr",
						operator: FilterOperator.EQ,
						value1: token.getKey()
					}));
				}
			});

			aFilters.push(new Filter({
				path: "Laufd",
				operator: FilterOperator.BT,
				value1: oDiaEjecucion.getFrom(),
				value2: oDiaEjecucion.getTo()
			}));

			var oInputIdentificacionTo = this.getView().byId("iIdentificacionTo");
			if (oInputIdentificacionTo.getValue() === "") {
				aFilters.push(new Filter({
					path: "Laufi",
					operator: FilterOperator.EQ,
					value1: oInputIdentificacionFrom.getValue()
				}));
			} else {
				aFilters.push(new Filter({
					path: "Laufi",
					operator: FilterOperator.BT,
					value1: oInputIdentificacionFrom.getValue(),
					value2: oInputIdentificacionTo.getValue()
				}));
			}

			var oInputBanco = this.getView().byId("iBanco");
			var aBancos = oInputBanco.getTokens();
			aBancos.forEach(function (token) {
				if (token.data().range) {
					var oRange = token.data().range;
					var oFilter = that.createFilter(oRange);
					aFilters.push(oFilter);
				} else {
					aFilters.push(new Filter({
						path: "Hbkid",
						operator: FilterOperator.EQ,
						value1: token.getKey()
					}));
				}
			});

			var oInputViasPago = this.getView().byId("iViasPago");
			var aViasPago = oInputViasPago.getTokens();
			aViasPago.forEach(function (token) {
				if (token.data().range) {
					var oRange = token.data().range;
					var oFilter = that.createFilter(oRange);
					aFilters.push(oFilter);
				} else {
					var sText = token.getText();
					var sCode = sText[0];
					aFilters.push(new Filter({
						path: "Rzawe",
						operator: FilterOperator.EQ,
						value1: sCode
					}));
				}
			});

			var sFechaProcesar = this.getView().byId("dFechaProcesar").getValue();
			if (sFechaProcesar !== "") {
				aFilters.push(new Filter({
					path: "Zaldt",
					operator: FilterOperator.EQ,
					value1: sFechaProcesar
				}));
			}

			var oSwitchDescargaDirecta = this.getView().byId("swDescargaDirecta");
			BusyIndicator.show(0);
			var query = "/Im_Text_H2hSet";
			this._ODataModel.read(query, {
				filters: aFilters,
				success: function (oResult) {
					if (oResult.results.length > 0) {
						that._sFileData = oResult.results[0].FileData;
						that._sFileName = oResult.results[0].FileName;
						if (oSwitchDescargaDirecta.getState()) {
							that.onDownload();
						} else {
							var oData = {};
							oData.Respuesta = oResult.results;
							oData.sumaImporte = that.sumImporte(oResult.results);
							var oModel = new JSONModel(oData);
							that.getView().setModel(oModel, "oModelRespuesta");
							if (sEntidad === "BBVA") {
								that._oFragment = sap.ui.xmlfragment(
									"com.everis.centria.ZFIR098.view.fragments.RespuestaExtra", that);
							} else {
								that._oFragment = sap.ui.xmlfragment(
									"com.everis.centria.ZFIR098.view.fragments.Respuesta", that);
							}

							that.getView().addDependent(that._oFragment);
							that._oFragment.open();
						}
					} else {
						MessageBox.information(that.getI18nText("txtInfoNoData"));
					}

					BusyIndicator.hide();
				},
				error: function (oError) {
					var sErrorMessage = oError.message;
					BusyIndicator.hide();
					MessageBox.error(that.getI18nText("txtErrorOData") + sErrorMessage, {
						details: oError.responseText
					});
				}
			});
		},

		clearAllFilters: function (oEvent) {
			var oTable = sap.ui.getCore().byId("tRespuesta");
			var aColumns = oTable.getColumns();
			for (var i = 0; i < aColumns.length; i++) {
				oTable.filter(aColumns[i], null);
			}
		},

		sumImporte: function (aResults) {
			var fTotal = 0;
			aResults.forEach(function (item) {
				fTotal += parseFloat(item.Dmbtr);
			});
			return fTotal.toFixed(2);
		},

		onDownload: function (oEvent) {
			var data = this._sFileData;
			var fileName = this._sFileName;
			var a = document.createElement("a");
			document.body.appendChild(a);
			a.style = "display: none";
			a.href = "data:text/plain;base64," + data;
			a.download = fileName;
			a.click();
		},

		//#region VARIANTES
		loadVariants: async function () {
			var that = this;
			var query = "/Im_Gest_VarianteSet";
			var aFilters = [];
			aFilters.push(new Filter({
				path: "Tcode",
				operator: FilterOperator.EQ,
				value1: "ZFIR098"
			}));

			function loadVariante() {
				BusyIndicator.show(0);
				return new Promise(function (resolve, reject) {
					that._ODataModel.read(query, {
						filters: aFilters,
						urlParameters: {
							"$expand": "Gest_VarianteSet"
						},
						success: function (oResult) {
							//debugger;
							var oData = {};
							oData.rows = oResult.results;
							var oVariantsModel = new JSONModel(oData);
							that._oVariantsModel = oVariantsModel;
							that.getView().setModel(that._oVariantsModel, "oVariantsModel");
							BusyIndicator.hide();
							resolve(true)
						},
						error: function (oError) {
							var sErrorMessage = oError.message;
							BusyIndicator.hide();
							MessageBox.error(that.getI18nText("txtErrorOData") + sErrorMessage, {
								details: oError.responseText
							});
							BusyIndicator.hide();
							resolve(false);
						}
					});
				});
			}

			let aVariantes = await loadVariante();

			if (!aVariantes) {
				return false;
			}

			var oModelEntidad = new JSONModel(sap.ui.require.toUrl("com/everis/centria/ZFIR098/model") +
				"/variante.json");
			this._oModelEntidad = oModelEntidad;
			this.getView().setModel(this._oModelEntidad, "oModelEntidad");
		},

		onDisplayVariants: function (oEvent) {
			this.loadVariants();
			this._oFragment = sap.ui.xmlfragment(
				"com.everis.centria.ZFIR098.view.fragments.Variantes", this);
			this.getView().addDependent(this._oFragment);
			this._oFragment.open();
		},

		onApplyVariant: function (oEvent) {
			var oTable = sap.ui.getCore().byId("tVariants");
			if (oTable.getSelectedIndices().length === 0 || oTable.getSelectedIndices().length > 1) {
				MessageBox.information(this.getI18nText("txtInformationApply"));
			} else {
				var iSelectedIndex = oTable.getSelectedIndex();
				var oVariante = oTable.getContextByIndex(iSelectedIndex).getObject();
				this.loadTemplate(oVariante.Gest_VarianteSet.results);
				this._oFragment.close();
			}
		},

		loadTemplate: function (aTemplate) {
			var that = this;
			aTemplate.forEach(function (oControl) {
				switch (oControl.ModeAsig) {
				case "key":
					that.getView().byId(oControl.IdControl).setSelectedKey(oControl.Value);
					break;
				case "value":
					that.getView().byId(oControl.IdControl).setValue(oControl.Value);
					break;
				case "token":
					that.getView().byId(oControl.IdControl).setTokens(that.createTokens(oControl.Value));
					break;
				case "selection":
					var bSelected = oControl.Value === "true" ? true : false;
					that.getView().byId(oControl.IdControl).setSelected(bSelected);
					break;
				}
			});
		},

		createTokens: function (sValue) {
			var aTokens = [];
			if (sValue !== "") {
				var aSegments = sValue.split(",");
				aSegments.forEach(function (sSegment) {
					var aTokenRange = sSegment.split("|");
					var aToken = aTokenRange[0].split(":");
					var oToken = new Token({
						key: aToken[0],
						text: aToken[1]
					});
					if (aTokenRange[1]) {
						var aRange = aTokenRange[1].split(":");
						var oRange = {};
						oRange.exclude = aRange[0] === "true" ? true : false;
						oRange.keyField = aRange[1];
						oRange.operation = aRange[2];
						oRange.value1 = aRange[3];
						oRange.value2 = aRange[4] === "null" ? null : aRange[4];
						oToken.data("range", oRange);
					}
					aTokens.push(oToken);
				});
			}
			return aTokens;
		},

		createTemplate: function () {
			var aNewTemplate = [{
				"IdControl": "sEntidad",
				"ModeAsig": "key",
				"Value": ""
			}, {
				"IdControl": "iSociedad",
				"ModeAsig": "token",
				"Value": ""
			}, {
				"IdControl": "drsDiaEjecucion",
				"ModeAsig": "value",
				"Value": ""
			}, {
				"IdControl": "iIdentificacionFrom",
				"ModeAsig": "value",
				"Value": ""
			}, {
				"IdControl": "iIdentificacionTo",
				"ModeAsig": "value",
				"Value": ""
			}, {
				"IdControl": "iBanco",
				"ModeAsig": "token",
				"Value": ""
			}, {
				"IdControl": "iViasPago",
				"ModeAsig": "token",
				"Value": ""
			}, {
				"IdControl": "dFechaProcesar",
				"ModeAsig": "value",
				"Value": ""
			}];
			return aNewTemplate;
		},

		onNewVariant: function (oEvent) {
			var oVariant = {};
			oVariant.Tcode = "ZFIR098";
			oVariant.IndOperacion = "C"; //create odata
			oVariant.Usuario = this._sUserId;
			oVariant.Gest_VarianteSet = this.createTemplate();
			this.getView().getModel("oModelEntidad").setProperty("/Variante", oVariant);
			this._oFragmentEntidad = sap.ui.xmlfragment(
				"com.everis.centria.ZFIR098.view.fragments.FormularioVariante", this);
			this.getView().addDependent(this._oFragmentEntidad);
			this._oFragmentEntidad.bindElement({
				path: "/Variante",
				model: "oModelEntidad"
			});
			this._oFragmentEntidad.open();
		},

		onEditVariant: function (oEvent) {
			var oTable = sap.ui.getCore().byId("tVariants");
			if (oTable.getSelectedIndices().length === 0 || oTable.getSelectedIndices().length > 1) {
				MessageBox.information(this.getI18nText("txtInformationEdit"));
			} else {
				var iSelectedIndex = oTable.getSelectedIndex();
				var oVariant = oTable.getContextByIndex(iSelectedIndex).getObject();
				oVariant.IndOperacion = "U"; //update odada
				this.getView().getModel("oModelEntidad").setProperty("/Variante", oVariant);
				this._oFragmentEntidad = sap.ui.xmlfragment(
					"com.everis.centria.ZFIR098.view.fragments.FormularioVariante",
					this);
				this.getView().addDependent(this._oFragmentEntidad);
				this._oFragmentEntidad.bindElement({
					path: "/Variante",
					model: "oModelEntidad"
				});
				this._oFragmentEntidad.open();
			}
		},

		validateInputs: function (oVariant) {
			return (oVariant.Nombre !== "" && oVariant.Nombre !== undefined) && (oVariant.Descripcion !== "" && oVariant.Descripcion !==
				undefined);
		},

		onSaveVariant: function (oEvent) {
			var oTable = sap.ui.getCore().byId("tVariants");
			var oForm = sap.ui.getCore().byId("fVariante");
			var oVariante = oForm.getModel("oModelEntidad").getProperty("/Variante");
			if (this.validateInputs(oVariante)) {
				BusyIndicator.show(0);
				var that = this;
				var query = "/Im_Gest_VarianteSet";
				if (oVariante.IndOperacion === "C") {
					this.modifyTemplate(oVariante.Gest_VarianteSet);
					this._ODataModel.create(query, oVariante, {
						success: function (oResult) {
							BusyIndicator.hide();
							that._oFragmentEntidad.close();
							MessageBox.success(that.getI18nText("txtSuccess"));
							oTable.setSelectedIndex(-1);
							that.loadVariants();
						},
						error: function (oError) {
							var sErrorMessage = oError.message;
							BusyIndicator.hide();
							that._oFragmentEntidad.close();
							MessageBox.error(that.getI18nText("txtErrorOData") + sErrorMessage, {
								details: oError.responseText
							});
							that.loadVariants();
						}
					});
				} else if (oVariante.IndOperacion === "U") {
					this.modifyTemplate(oVariante.Gest_VarianteSet.results);
					var aNewTemplate = oVariante.Gest_VarianteSet.results;
					oVariante.Gest_VarianteSet = aNewTemplate;
					this._ODataModel.create(query, oVariante, {
						success: function (oResult) {
							BusyIndicator.hide();
							that._oFragmentEntidad.close();
							MessageBox.success(that.getI18nText("txtSuccess"));
							oTable.setSelectedIndex(-1);
							that.loadVariants();
						},
						error: function (oError) {
							var sErrorMessage = oError.message;
							BusyIndicator.hide();
							that._oFragmentEntidad.close();
							MessageBox.error(that.getI18nText("txtErrorOData") + sErrorMessage, {
								details: oError.responseText
							});
							that.loadVariants();
						}
					});
				}
			} else {
				MessageBox.information(this.getI18nText("txtInformationRequired"));
			}
		},

		modifyTemplate: function (aTemplate) {
			var that = this;
			aTemplate.forEach(function (oControl) {
				switch (oControl.ModeAsig) {
				case "key":
					oControl.Value = that.getView().byId(oControl.IdControl).getSelectedKey();
					break;
				case "value":
					oControl.Value = that.getView().byId(oControl.IdControl).getValue();
					break;
				case "token":
					oControl.Value = that.stringifyTokens(that.getView().byId(oControl.IdControl).getTokens());
					break;
				case "selection":
					var bSelected = that.getView().byId(oControl.IdControl).getSelected();
					oControl.Value = bSelected ? "true" : "false";
					break;
				}
			});
		},

		stringifyTokens: function (aTokens) {
			var sValue = "";
			aTokens.forEach(function (oToken) {
				if (oToken.data().range) {
					var oRange = oToken.data().range;
					sValue += oToken.getKey() + ":" + oToken.getText() + "|" +
						oRange.exclude + ":" + oRange.keyField + ":" + oRange.operation + ":" + oRange.value1 + ":" + oRange.value2 + ",";
				} else {
					sValue += oToken.getKey() + ":" + oToken.getText() + ",";
				}
			});
			return sValue.substring(0, sValue.lastIndexOf(","));
		},

		onDeleteVariant: function (oEvent) {
			var oTable = sap.ui.getCore().byId("tVariants");
			if (oTable.getSelectedIndices().length === 0 || oTable.getSelectedIndices().length > 1) {
				MessageBox.information(this.getI18nText("txtInformationDelete"));
			} else {
				var that = this;
				MessageBox.confirm(this.getI18nText("txtDeleteConfirmation"), {
					onClose: function (sAction) {
						if (sAction === "OK") {
							BusyIndicator.show(0);
							var iSelectedIndex = oTable.getSelectedIndex();
							var oVariante = oTable.getContextByIndex(iSelectedIndex).getObject();
							oVariante.IndOperacion = "D";
							var aTemplate = oVariante.Gest_VarianteSet.results;
							oVariante.Gest_VarianteSet = aTemplate;
							var query = "/Im_Gest_VarianteSet";
							that._ODataModel.create(query, oVariante, {
								success: function (oResult) {
									BusyIndicator.hide();
									MessageBox.success(that.getI18nText("txtSuccess"));
									oTable.setSelectedIndex(-1);
									that.loadVariants();
								},
								error: function (oError) {
									var sErrorMessage = oError.message;
									BusyIndicator.hide();
									MessageBox.error(that.getI18nText("txtErrorOData") + sErrorMessage, {
										details: oError.responseText
									});
									that.loadVariants();
								}
							});
						}
					}
				});
			}
		},
		//#endregion VARIANTES
		//Visualizar documentos
		getDocumentUrl: function (sDocumento, dFechaContabilizacion, sProveedor, sSociedad) {

			if (!sDocumento || !dFechaContabilizacion || !sProveedor || !sSociedad) {
				return "";
			}

			if (this.oConstantes && this.oConstantes.rpta) {
				let sDomainUrl = this.oConstantes.rpta.sDocumentUrl;
				let sFinalUrl = "?AccountingDocument=" + sDocumento + "&ClearingAccountingDocument=" + sDocumento + "&CompanyCode=" + sSociedad +
					"&FiscalYear=" + dFechaContabilizacion.getFullYear() + "&Supplier=" + sProveedor;

				return sDomainUrl + sFinalUrl;
			} else {
				return "";
			}

		},
		onSortTable: function (oEvent) {
			let oTabla = oEvent.getSource();
			let sId = oTabla.getId();
			let aColumnas = oTabla.getColumns();
			let oColumna = oEvent.getParameter("column");
			let sOrden = oEvent.getParameter("sortOrder");
			let sPropiedad = oColumna.getSortProperty();
			let aLista, oModel, oModelData;

			oModel = oColumna.getParent().getModel("oModelRespuesta");
			oModelData = oModel.getData();
			aLista = oModelData.Respuesta;

			oEvent.preventDefault();

			let iSortOrder = 1;
			if (sOrden !== "Ascending") {
				iSortOrder = -1;
			}

			function compareImporte(a, b) {
				if (parseFloat(a[sPropiedad]) < parseFloat(b[sPropiedad])) {
					return -1 * iSortOrder;
				}
				if (parseFloat(a[sPropiedad]) > parseFloat(b[sPropiedad])) {
					return 1 * iSortOrder;
				}
				return 0;
			}

			function compare(a, b) {
				if (a[sPropiedad] < b[sPropiedad]) {
					return -1 * iSortOrder;
				}
				if (a[sPropiedad] > b[sPropiedad]) {
					return 1 * iSortOrder;
				}
				return 0;
			}

			if (sPropiedad === "Dmbtr") {
				aLista.sort(compareImporte);
			} else {
				aLista.sort(compare);
			}

			oModel.refresh(true);

			//agregar indicador de ordenamiento
			for (let i = 0; i < aColumnas.length; i++) {
				let oCol = aColumnas[i];
				let sSortProp = oCol.getSortProperty();
				if (sSortProp === sPropiedad) {
					oCol.setSorted(true);
					oCol.setSortOrder(sOrden);
				} else {
					oCol.setSorted(false);
				}
			}
		}
	});
});