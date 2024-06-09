sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/m/Dialog",
	"sap/m/List",
	"sap/m/StandardListItem",
	"sap/m/Button",
	"sap/m/ButtonType",
	"../model/Formatter",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageToast",
	"sap/ui/export/Spreadsheet",
	"sap/ui/model/Sorter",
	"sap/m/GroupHeaderListItem",
	"../model/models",
	"../services/Xsjs"
], function (Controller, MessageBox, Dialog, List, StandardListItem, Button, ButtonType, Formatter, Fragment, Filter, FilterOperator,
	JSONModel, Busy, Toast, Spreadsheet, Sorter, GroupHeaderListItem, Models, XsjsService) {
	"use strict";
	let oFinalFilterFactura;
	let oModelDetalleBanco, oModeloTotales;
	return Controller.extend("com.centria.ReclasificacionViasPagoAcreedores.controller.View1", {
		formatter: Formatter,
		// var self = this;
		onInit: async function () {
			//Busy.show();
			//this.setMatchCodesModels();
			//this.setFilterValuesModel();
			//this.setColModel();
			//this.setDeleteModel();
			//this._sUserId = this.getLogonUser();
			//this.loadVariants();
	/*		this.onBeforeShow();
			this.getView().addEventDelegate({ // not added the controller as delegate to avoid controller functions with similar names as the events      
				onBeforeShow: $.proxy(function (evt) {
					this.onBeforeShow(evt);
				}, this)
			});*/

			let oStructure = {
				dataDetalleBancos: [],
				dataDetalleFacturas: [],
				dataDetalleProveedores: []
			};
			oModelDetalleBanco = new JSONModel(oStructure);
			this.getOwnerComponent().setModel(oModelDetalleBanco, "TablaResultadosModel");

			let oTotales = {
				MontoBancoUSD: 0,
				MontoBancoPEN: 0,
				sPEN: "PEN",
				sUSD: "USD"
			};
			oModeloTotales = new JSONModel(oTotales);
			this.getView().setModel(oModeloTotales, "ModeloTotales");

		/*	let oDeviceModel = Models.createDeviceModel();
			this.getView().setModel(oDeviceModel, "oDeviceModel");
			sap.ui.core.IconPool.addIcon('sap', 'customfont', 'icomoon', 'e900');*/

			//Obtener constantes
		/*	this.oConstantes = await XsjsService.obtenerConstantes().catch(
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

		onClearSmart: function (oEvent) {
			let oSelViaPago = this._byId("cboViaPago");
			oSelViaPago.setSelectedKeys([]);
		},

		onSearchSmart: function (oEvent) {
			let that = this;
			let oSmartFilterBar = oEvent.getSource();
			let oSmartTable = this._byId("smtReporte");
			let aFilters = oSmartFilterBar.getFilters();
			let oCboViaPago = this.byId("cboViaPago");
			let aViasKeys = oCboViaPago.getSelectedKeys();
			let aFiltrosVias = [];

			if (aFilters.length) {
				let aFilterArray = aFilters[0].aFilters;

				for (let i = 0; i < aViasKeys.length; i++) {
					aFiltrosVias.push(new Filter("Zlsch", FilterOperator.EQ, aViasKeys[i]));
				}

				let oFilterViaPago = new Filter({
					filters: aFiltrosVias,
					and: false
				});

				aFilterArray.push(oFilterViaPago);
			}

			let oSapModel = this.getServiceModel();
			Busy.show(0);
			oSapModel.read("/Im_TR072_Detalle_Set", {
				filters: aFilters,
				success: function (data) {
					let aResults = data.results;
					let aResultados = [];
					let aProveedores = [];
					let aFacturas = [];

					let oDetalles = {};

					for (let i = 0; i < aResults.length; i++) {
						let oReg = aResults[i];

						oReg.Dmbtr = parseFloat(oReg.Dmbtr);
						oReg.Wrbtr = parseFloat(oReg.Wrbtr);

						if (oReg.Check === "P") {
							aProveedores.push(oReg);
							continue;
						}

						aFacturas.push(oReg);

						let sKey = oReg.Bukrs + oReg.Hbkid + oReg.Waers + oReg.Zlsch + oReg.Sgtxt;

						if (!oDetalles.hasOwnProperty(sKey)) {
							oDetalles[sKey] = {
								Bukrs: oReg.Bukrs,
								Hbkid: oReg.Hbkid,
								Waers: oReg.Waers,
								Zlsch: oReg.Zlsch,
								Sgtxt: oReg.Sgtxt,
								Nrreg: parseInt(oReg.Nrreg, 0),
								Dmbtr: parseFloat(oReg.Dmbtr),
								Wrbtr: parseFloat(oReg.Wrbtr),
								Total: false
							};
						} else {
							oDetalles[sKey].Dmbtr += parseFloat(oReg.Dmbtr);
							oDetalles[sKey].Wrbtr += parseFloat(oReg.Wrbtr);
							oDetalles[sKey].Nrreg += parseInt(oReg.Nrreg, 0);
						}

					}

					let fMontoPen = 0,
						fMontoUsd = 0;

					for (let key in oDetalles) {
						if (oDetalles.hasOwnProperty(key)) {
							fMontoPen += oDetalles[key].Dmbtr;
							fMontoUsd += oDetalles[key].Wrbtr;

							oDetalles[key].Dmbtr = that.redondearMonto(oDetalles[key].Dmbtr);
							oDetalles[key].Wrbtr = that.redondearMonto(oDetalles[key].Wrbtr);
							aResultados.push(oDetalles[key]);
						}
					}
					oModelDetalleBanco.setSizeLimit(aFacturas.length);
					oModeloTotales.setProperty("/MontoBancoPEN", fMontoPen);
					oModeloTotales.setProperty("/MontoBancoUSD", fMontoUsd);

					let oStructure = {
						dataDetalleBancos: aResultados,
						dataDetalleFacturas: aFacturas,
						dataDetalleProveedores: aProveedores
					};
					that.ordenarBanco(oStructure.dataDetalleBancos);
					oModelDetalleBanco.setData(oStructure);
					oModelDetalleBanco.refresh();

					Busy.hide();
				},
				error: function (error) {
					Busy.hide();
					console.log(error);
					//MessageBox.error("Ocurrió un error al consultar la data");
				}
			});

		},

		ordenarBanco: function (aDetalles) {
			let fMontoPen = 0,
				fMontoUsd = 0,
				iNumReg = 0;
			let iOriginalLength = aDetalles.length;
			aDetalles.sort((a, b) => a.Bukrs.localeCompare(b.Bukrs) || a.Hbkid.localeCompare(b.Hbkid) || a.Waers.localeCompare(b.Waers));

			if (aDetalles.length > 1) {
				for (let i = 0; i < aDetalles.length; i++) {
					let oRow = aDetalles[i];

					if (oRow.Total === true) {
						continue;
					}

					if (i > 0) {
						let oRowAnterior = aDetalles[i - 1];
						if (oRow.Bukrs !== oRowAnterior.Bukrs || oRow.Hbkid !== oRowAnterior.Hbkid || oRow.Waers !== oRowAnterior.Waers && !oRowAnterior
							.Total) {
							let oSubTotal = {
								Bukrs: oRowAnterior.Bukrs,
								Hbkid: oRowAnterior.Hbkid,
								Waers: oRowAnterior.Waers,
								Zlsch: "",
								Sgtxt: "",
								Nrreg: parseInt(iNumReg, 0),
								Dmbtr: this.redondearMonto(parseFloat(fMontoPen)),
								Wrbtr: this.redondearMonto(parseFloat(fMontoUsd)),
								Total: true
							};
							aDetalles.push(oSubTotal);
							fMontoPen = parseFloat(oRow.Dmbtr);
							fMontoUsd = parseFloat(oRow.Wrbtr);
							iNumReg = parseInt(oRow.Nrreg, 0);

							if (i === (iOriginalLength - 1)) {
								let oRowSiguiente = aDetalles[i + 1];
								if (oRow.Bukrs !== oRowSiguiente.Bukrs || oRow.Hbkid !== oRowSiguiente.Hbkid || oRow.Waers !== oRowSiguiente.Waers && !
									oRowSiguiente.Total) {
									let oSubTotal2 = {
										Bukrs: oRow.Bukrs,
										Hbkid: oRow.Hbkid,
										Waers: oRow.Waers,
										Zlsch: "",
										Sgtxt: "",
										Nrreg: parseInt(iNumReg, 0),
										Dmbtr: this.redondearMonto(parseFloat(fMontoPen)),
										Wrbtr: this.redondearMonto(parseFloat(fMontoUsd)),
										Total: true
									};

									aDetalles.push(oSubTotal2);

								}
							}

						} else {
							fMontoPen += parseFloat(oRow.Dmbtr);
							fMontoUsd += parseFloat(oRow.Wrbtr);
							iNumReg += parseInt(oRow.Nrreg, 0);

						}
					} else {
						fMontoPen += parseFloat(oRow.Dmbtr);
						fMontoUsd += parseFloat(oRow.Wrbtr);
						iNumReg += parseInt(oRow.Nrreg, 0);
					}

				}
			}

			aDetalles.sort((a, b) => a.Bukrs.localeCompare(b.Bukrs) || a.Hbkid.localeCompare(b.Hbkid) || a.Waers.localeCompare(b.Waers));

		},

		onInitialise: function (oEvent) {

			var oTable = oEvent.getSource().getTable();
			oTable.bindAggregation("items", {
				path: "TablaResultadosModel>/dataDetalleBancos",
				template: this._byId("templateBancos")
			});
		},

		onInitialiseProveedor: function (oEvent) {
			var oTable = oEvent.getSource().getTable();
			oTable.bindAggregation("items", {
				path: "TablaResultadosModel>/dataDetalleProveedores",
				template: this._byId("templateProveedor")
			});
		},

		onInitialiseFacturas: function (oEvent) {
			let that = this;
			var oTable = oEvent.getSource().getTable();
			let oTablaReporte = this.byId("tableReporte");
			let aSelectedItems = oTablaReporte.getSelectedItems();
			let aFinalFilter = [];

			for (let i = 0; i < aSelectedItems.length; i++) {
				let oContext = aSelectedItems[i].getBindingContext("TablaResultadosModel");
				let bTotal = oContext.getProperty("Total");

				if (bTotal) {
					continue;
				}

				let aFilterAnd = [
					new Filter("Bukrs", "EQ", oContext.getProperty("Bukrs")),
					new Filter("Hbkid", "EQ", oContext.getProperty("Hbkid")),
					new Filter("Zlsch", "EQ", oContext.getProperty("Zlsch")),
					new Filter("Waers", "EQ", oContext.getProperty("Waers"))
				];
				let oFilterAnd = new Filter({
					filters: aFilterAnd,
					and: true
				});

				aFinalFilter.push(oFilterAnd);
			}

			oFinalFilterFactura = new Filter({
				filters: aFinalFilter,
				and: false
			});

			function getGroupHeaderFactory(oGroup) {
				let oSubtotales = that.getSubTotalesFacturas("Lifnr", oGroup.key);
				return new GroupHeaderListItem({
					title: "Acreedor: " + oGroup.key + " | Subtotal PEN: " + oSubtotales.fMontoPen + " | Subtotal USD: " + oSubtotales.fMontoUsd,
					upperCase: false
				});
			}

			oTable.bindAggregation("items", {
				path: "TablaResultadosModel>/dataDetalleFacturas",
				filters: [oFinalFilterFactura],
				sorter: new Sorter("Lifnr", false, true),
				groupHeaderFactory: getGroupHeaderFactory,
				template: this._byId("templateFactura")
			});
		},

		getSubTotalesFacturas: function (sPropiedad, sValor) {
			let oModel = this.getOwnerComponent().getModel("TablaResultadosModel");
			if (!oModel) {
				return false;
			}

			let aLista = oModel.getProperty("/dataDetalleFacturas");
			let aListaFiltrada = aLista.filter(item => item.Lifnr === sValor && item.Zlsch != "X");

			let fMontoPen = 0,
				fMontoUsd = 0;
			for (let i = 0; i < aListaFiltrada.length; i++) {
				fMontoPen += parseFloat(aListaFiltrada[i].Dmbtr);
				fMontoUsd += parseFloat(aListaFiltrada[i].Wrbtr);
			}

			return {
				fMontoPen: this.redondearMonto(fMontoPen),
				fMontoUsd: this.redondearMonto(fMontoUsd)
			};
		},

		onUpdateFinished: function (oEvent) {
			let oTable = oEvent.getSource();
			let aItems = oTable.getItems();
			let oSmartTable = this._byId("smtReporte");
			let oCustomData;
			let oCheckBoxAll = oTable._selectAllCheckBox;
			let iItems = 0;

			if (oCheckBoxAll) {
				oCheckBoxAll.setVisible(false);
			}

			function resaltarTexto(aCells, bResaltar) {
				for (let i = 0; i < aCells.length; i++) {
					let oCell = aCells[i];
					if (bResaltar) {
						oCell.setDesign(sap.m.LabelDesign.Bold);
					} else {
						oCell.setDesign(sap.m.LabelDesign.Standard);
					}
				}
			}

			for (let i = 0; i < aItems.length; i++) {
				let oContext = aItems[i].getBindingContext("TablaResultadosModel");
				let aCells = aItems[i].getCells();
				let bTotal = oContext.getProperty("Total");

				if (!bTotal) {
					iItems++;
				}

				resaltarTexto(aCells, bTotal);
				oCustomData = new sap.ui.core.CustomData({
					key: "resaltar",
					value: bTotal.toString(),
					writeToDom: true
				});

				let oCheckBox = aItems[i]._oMultiSelectControl;
				if (oCheckBox) {
					oCheckBox.setVisible(!bTotal);
				}

				aItems[i].addCustomData(oCustomData);
			}

			let sTitulo = this.getI18nText("titleTableDetBan", [iItems]);
			oSmartTable.setHeader(sTitulo);
		},

		onUpdateFinishFactura: function (oEvent) {
			let oTable = oEvent.getSource();
			let aItems = oTable.getItems();
			let oSmartTable = this._byId("smtFactura");
			let fMontoPen = 0,
				fMontoUsd = 0;

			for (let i = 0; i < aItems.length; i++) {
				let oContext = aItems[i].getBindingContext("TablaResultadosModel");
				if (oContext) {
					fMontoPen += parseFloat(oContext.getProperty("Dmbtr"));
					fMontoUsd += parseFloat(oContext.getProperty("Wrbtr"));
				} else if (aItems[i].TagName === "tr") {
					let sTitulo = aItems[i].getTitle();
					let aTitulo = sTitulo.split(":");
					if (aTitulo.length === 2) {
						let sPropiedad = aTitulo[0].trim();
						let sValor = aTitulo[1].trim();

						if (sPropiedad === "Acreedor") {
							//Calcular subtotales
							let oSubtotales = this.getSubTotalesFacturas("Lifnr", sValor);
							sTitulo += " | Subtotal PEN: " + oSubtotales.fMontoPen + " | Subtotal USD: " + oSubtotales.fMontoUsd;
							aItems[i].setTitle(sTitulo);
						}
					}

				}
			}

			oModeloTotales.setProperty("/MontoFacturaPEN", fMontoPen);
			oModeloTotales.setProperty("/MontoFacturaUSD", fMontoUsd);

			let sTitulo = this.getI18nText("titleFacturas", [aItems.length]);
			oSmartTable.setHeader(sTitulo);

			oTable.setBusy(false);
		},

		onUpdateFinishProveedor: function (oEvent) {
			let oTable = oEvent.getSource();
			let aItems = oTable.getItems();
			let oSmartTable = this._byId("smtProveedor");
			let fMontoPen = 0,
				fMontoUsd = 0;

			for (let i = 0; i < aItems.length; i++) {
				let oContext = aItems[i].getBindingContext("TablaResultadosModel");

				fMontoPen += parseFloat(oContext.getProperty("Dmbtr"));
				fMontoUsd += parseFloat(oContext.getProperty("Wrbtr"));
			}

			oModeloTotales.setProperty("/MontoProveedorPEN", fMontoPen);
			oModeloTotales.setProperty("/MontoProveedorUSD", fMontoUsd);

			let sTitulo = this.getI18nText("titleProveedores", [aItems.length]);
			oSmartTable.setHeader(sTitulo);

			oTable.setBusy(false);
		},

		onSelectionChange: function (oEvent) {
			let oTable = oEvent.getSource();
			let aItemsSelected = oEvent.getParameter("listItems");
			let bSelectAll = oEvent.getParameter("selectAll");

			if (bSelectAll) {
				for (let i = 0; i < aItemsSelected.length; i++) {
					let oContext = aItemsSelected[i].getBindingContext("TablaResultadosModel");
					let bTotal = oContext.getProperty("Total");
					if (bTotal) {
						oTable.setSelectedItem(aItemsSelected[i], false);
					}
				}
			}

		},

		onBeforeRebindFactura: function (oEvent) {
			let oBindingParam = oEvent.getParameter("bindingParams");
			if (oBindingParam.filters) {
				oBindingParam.filters.push(oFinalFilterFactura);
			} else {
				oBindingParam.filters = [];
				oBindingParam.filters.push({
					aFilters: [oFinalFilterFactura]
				});
			}
		},

		redondearMonto: function (fMonto) {
			let fMontoRedondeado = Math.round(fMonto * 100) / 100;
			return fMontoRedondeado.toFixed(2);
		},

		onExportarExcel: function (oEvent) {
			let oSmartTable = oEvent.getSource().getParent().getParent();
			let oTable = oSmartTable.getTable();
			let aColumnas = oTable.getColumns();
			let aItems = oTable.getItems();
			let aColumnasExcel = [];
			let aItemsExcel = [];

			if (!aItems.length) {
				MessageBox.information("No hay data para exportar");
				return false;
			}

			for (let i = 0; i < aColumnas.length; i++) {
				let oCustomData = aColumnas[i].data("p13nData");
				let sType = oCustomData.type;
				if (!sType) {
					sType = "string";
				}
				aColumnasExcel.push({
					label: aColumnas[i].getHeader().getText(),
					property: oCustomData.columnKey,
					type: oCustomData.type
				});
			}

			for (let i = 0; i < aItems.length; i++) {
				let oContext = aItems[i].getBindingContext("TablaResultadosModel");
				let oObject = oContext.getObject();
				aItemsExcel.push(oObject);
			}

			let oSettings = {
				workbook: {
					columns: aColumnasExcel
				},
				dataSource: aItemsExcel,
				fileName: oSmartTable.getHeader() + ".xlsx",
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			let oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});

		},

		onExportarExcelTest: function (oEvent) {
			let oSmartTable = oEvent.getSource().getParent().getParent();
			let oTable = oSmartTable.getTable();
			let aColumnas = oTable.getColumns();
			let aItems = oModelDetalleBanco.getProperty("/dataDetalleFacturas");
			let aColumnasExcel = [];

			if (!aItems.length) {
				MessageBox.information("No hay data para exportar");
				return false;
			}

			for (let i = 0; i < aColumnas.length; i++) {
				let oCustomData = aColumnas[i].data("p13nData");
				let sType = oCustomData.type;
				if (!sType) {
					sType = "string";
				}
				aColumnasExcel.push({
					label: aColumnas[i].getHeader().getText(),
					property: oCustomData.columnKey,
					type: oCustomData.type
				});
			}

			let oSettings = {
				workbook: {
					columns: aColumnasExcel
				},
				dataSource: aItems,
				fileName: oSmartTable.getHeader() + ".xlsx",
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			let oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});

		},

		//Manejo de variante
		/**
		 * Guarda valor de filtro personalizado en la variante.
		 *  
		 * @access   private		  
		 * @listens event:beforeVariantSave		 
		 * @param {sap.ui.base.Event}   oEvent      Contexto del filtro.
		 * 
		 * */
		_fnBeforeVariantSave: function (oEvent) {
			let oSmartFilter = oEvent.getSource();
			let oSelViaPago = this._byId("cboViaPago");
			oSmartFilter.setFilterData({
				_CUSTOM: {
					ViaPago: oSelViaPago.getSelectedKeys()
				}
			});
		},

		/**
		 * Descripción: Se obtiene el valor de los filtros personalizados y se asignan a los controles 
		 * correspondientes 
		 * 
		 * @access   private		  
		 * @listens event:afterVariantLoad		
		 * @param {sap.ui.base.Event}   oEvent      Contexto del filtro.
		 * 
		 * */
		_fnAfterVariantLoad: function (oEvent) {
			let oSmartFilter = oEvent.getSource();
			let oData = oSmartFilter.getFilterData();
			let oCustomFieldData = oData["_CUSTOM"];

			let oSelViaPago = this._byId("cboViaPago");
			oSelViaPago.setSelectedKeys(oCustomFieldData.ViaPago);
		},

		//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////	
		//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////	

		confirmDialog: function (oEvent) {
			if (this.oInputOrigin) {
				this.oInputOrigin.setValue(oEvent.getParameters().selectedItem.getAttributes()[0].getText());
				if (this.oInputAsoc) {
					this.oInputAsoc.setValue(oEvent.getParameters().selectedItem.getTitle());
				}
			}
		},

		processBankDetail: function (oEvent) {
			var self = this;

			//let oModelFactura = this.getView().getModel("TablaResultadosModel").getData().dataDetalleFacturas;
			// let that = this;
			// let oBody = {
			// 	Bukrs: "0001",
			// 	ActCci: "",
			// 	Hkont: "10413800",
			// 	ActAk: "X",
			// 	Filter_Cab_CciSet: [],
			// 	Filter_Cab_HkontSet: []
			// };
			// that.createEntry("Im_Filter_CabSet", oBody).then((oResult) => {

			// });
			//let aDelete = this.deleteGlobalArray;

			//let oFilterModel = this.getView().getModel("FilterValuesModel").getData()

			MessageBox.confirm(this.getI18nText("dialogBanksBody"), {
				title: this.getI18nText("dialogBanksTitle"),
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				onClose: oAction => {
					if (oAction === "OK") {
						sap.ui.core.BusyIndicator.show(0);
						var query = "/Im_Proccab_072Set";
						var ServiceH2HModel = this.getOwnerComponent().getModel();
						//var otable = this.getView().byId("idTablePlanificador");
						//var array = otable.getSelectedIndices();

						//var oDataMain = self.getView().getModel("TablaResultadosModel").getData();

						//var index = array[0];
						let oDataDetalle = oModelDetalleBanco.getData();
						let aFacturas = oDataDetalle.dataDetalleFacturas;

						if (!aFacturas.length) {
							sap.ui.core.BusyIndicator.hide();
							MessageBox.error("Debe seleccionar un registro para procesar");
							return false;
						}
						/*	if (self._oSociedadInput.getTokens().length > 0) {
								oFilterModel.aSociedad = self._oSociedadInput.getTokens();
							}*/
						let oBody = {
							"Bukrs": aFacturas[0].Bukrs, //Valor dummy
							// "Bukrs": "0011",
							"Lifnr": "",
							"Belnr": "",
							// "Budat": "2016-07-08T12:34:56",
							// "Budat": new Date(fechaVenc + "T00:00:00"),
							//"Budat": "19911109",
							"Hbkid": "",
							"Check": "",
							"Im_TR072_Detalle_Set": [],
							"Campfilt_072Set": []
						};

						//Obtener items seleccionados
						let oTablaBancos = self._byId("tableReporte");
						let aItemsSeleccionados = oTablaBancos.getSelectedItems();
						let aFilterDetalleFactura = [];

						if (!aItemsSeleccionados.length) {
							sap.ui.core.BusyIndicator.hide();
							MessageBox.error("Debe seleccionar un registro para procesar");
							return false;
						}

						for (let i = 0; i < aItemsSeleccionados.length; i++) {
							let oContext = aItemsSeleccionados[i].getBindingContext("TablaResultadosModel");
							let oItem = oContext.getObject();

							if (oItem.Total || oItem.Zlsch === "X") {
								continue;
							}

							let aFacturasFiltradas = aFacturas.filter((f) => {
								return (f.Bukrs === oItem.Bukrs && f.Hbkid === oItem.Hbkid && f.Zlsch === oItem.Zlsch && f.Waers === oItem.Waers);
							});

							$.each(aFacturasFiltradas, function (kf, vf) {
								aFilterDetalleFactura.push(vf);
							});

						}

						for (let i = 0; i < aFilterDetalleFactura.length; i++) {

							let value = aFilterDetalleFactura[i];

							if (value.Zlsch !== "X" && !value.Total) {
								value.Bldat = value.Bldat;
								value.Budat = value.Budat;
								value.Zfbdt = value.Zfbdt;
								value.Zvenc = value.Zvenc;
								value.Wrbtr = parseFloat(value.Wrbtr).toFixed(2);
								value.Dmbtr = parseFloat(value.Dmbtr).toFixed(2);
								// value.Nrreg = value.Nrreg + '';
								delete value.Zbd1t;
								delete value.Total;
								//oDetalle.Zbd1t = parseFloat(oDetalle.Zbd1t) * 1;
								delete value.__metadata;
								delete value.to_Acreedor;
								delete value.to_Pais;
								delete value.to_Sociedad;

								oBody.Im_TR072_Detalle_Set.push(value);

								//////////////////////////////////////////////////////////////////////////

								var oJson1 = {},
									oJson2 = {},
									oJson3 = {};

								if (value.Belnr) {
									oJson1.Campo = "BELNR";
									oJson1.Bukrs = "";
									oJson1.Belnr = value.Belnr;
									oJson1.Sign = "I";
									oJson1.Option = "EQ";
									oJson1.Valor1 = value.Belnr;
									oBody.Campfilt_072Set.push(oJson1);
								};
								if (value.Bukrs) {
									oJson2.Campo = "BUKRS";
									oJson2.Bukrs = value.Bukrs;
									oJson2.Belnr = "";
									oJson2.Sign = "I";
									oJson2.Option = "EQ";
									oJson2.Valor1 = value.Bukrs;
									oBody.Campfilt_072Set.push(oJson2);
								};
								if (value.Lifnr) {
									oJson3.Campo = "LIFNR";
									oJson3.Bukrs = "";
									oJson3.Belnr = value.Belnr;
									oJson3.Sign = "I";
									oJson3.Option = "EQ";
									oJson3.Valor1 = value.Lifnr;
									oBody.Campfilt_072Set.push(oJson3);
								}
							}
						}

						// var oDetalle = oData.dataDetalleFacturas[index];

						// var oDetalle = oData;
						// var oDetalleSet = JSON.parse(JSON.stringify(oDetalle));

						//////////////////////////////////////////////////////////////////////////

						ServiceH2HModel.create(query, oBody, {
							success: function (oResult) {
								// sap.ui.core.BusyIndicator.hide();
								/*	console.log(oResult);
									var newList = [];

									$.each(array, function (index1, value1) {
										$.each(oDataMain.dataDetalleBancos, function (index2, value2) {
											if (value1 !== index2) {
												newList.push(value2);
											}
										});

									});*/

								//oDataMain.dataDetalleBancos = newList;
								//self.getView().setModel(new JSONModel(oDataMain), "TablaResultadosModel");
								//otable.clearSelection()
								sap.ui.core.BusyIndicator.hide();
								MessageBox.success(self.getI18nText("dialogBanksSuccess"));
							},
							error: function (oError) {
								sap.ui.core.BusyIndicator.hide();
								console.log(oError);
								//MessageBox.error(self.getI18nText("txtErrorOData"));
							}
						});
					}

				}
			});
		},

		_byId: function (sName) {
			var cmp = this.byId(sName);
			if (!cmp) {
				cmp = sap.ui.getCore().byId(sName);
			}
			return cmp;
		},
		getI18nText: function (sText, aParameters = []) {
			return aParameters.length > 0 ? this.getView().getModel("i18n").getResourceBundle().getText(sText, aParameters) : this.getView().getModel(
				"i18n").getResourceBundle().getText(sText);
		},
		openFragmentFacturas: function () {

			let oTabla = this.byId("tableReporte");
			let aSelectedItems = oTabla.getSelectedItems();
			//let aFinalFilter = [];

			if (aSelectedItems.length > 0) {
				let oFragment = sap.ui.xmlfragment("com.centria.ReclasificacionViasPagoAcreedores.view.fragments.Facturas", this);
				this.getView().addDependent(oFragment);
				//let oTablaFactura = this._byId("tblFacturas");
				//oTablaFactura.getBinding("items").filter([oFinalFilterFactura]);
				oFragment.open();
			} else {
				MessageBox.information(this.getI18nText("txtWarningSelected"));
			}

		},
		openFragmentProveedores: function () {
			let oFragment = sap.ui.xmlfragment("com.centria.ReclasificacionViasPagoAcreedores.view.fragments.Proveedores", this);
			this.getView().addDependent(oFragment);
			oFragment.open();
		},

		closeDialog: function (oEvent) {
			oEvent.getSource().getParent().destroy();
			this._oDialog = null;
		},
		onCloseDialog: function (oEvent) {
			oEvent.getSource().destroy();
			this._oDialog = null;
		},

		getServiceModel: function () {
			return this.getOwnerComponent().getModel();
		},
		readEntity: function (sQuery, aFilters = []) {
			return new Promise((resolve, reject) => {
				this.getServiceModel().read("/" + sQuery, {
					filters: aFilters,
					success: (oData) => {
						resolve(oData);
					},
					error: (err) => {
						reject(err);
					}
				});
			});
		},
		createEntry: function (sPath, oBody = {}) {
			return new Promise((resolve, reject) => {
				this.getServiceModel().create("/" + sPath, oBody, {
					success: (oData) => {
						resolve(oData);
					},
					error: (err) => {
						reject(err);
					},
				});
			});
		},

		deleteRegisters: function (oEvent) {
			let that = this;
			let oTable = this._byId("tblFacturas");
			let oData = oModelDetalleBanco.getData();
			let aFacturas = oData.dataDetalleFacturas;
			let aDeleteIndexArray = oTable.getSelectedItems();
			let oDetalles = {};
			let aResultados = [];

			function eliminar() {
				for (let i = 0; i < aDeleteIndexArray.length; i++) {
					let oContext = aDeleteIndexArray[i].getBindingContext("TablaResultadosModel");
					let oFact = oContext.getObject();
					oFact.Hbkid = "9999";
					oFact.Waers = "";
					oFact.Zlsch = "X";
					oFact.Sgtxt = "Listado de excepciones";
				}

				for (let i = 0; i < aFacturas.length; i++) {
					let oReg = aFacturas[i];
					//Actualizar montos
					let sKey = oReg.Bukrs + oReg.Hbkid + oReg.Waers + oReg.Zlsch + oReg.Sgtxt;
					if (!oDetalles.hasOwnProperty(sKey)) {
						oDetalles[sKey] = {
							Bukrs: oReg.Bukrs,
							Hbkid: oReg.Hbkid,
							Waers: oReg.Waers,
							Zlsch: oReg.Zlsch,
							Sgtxt: oReg.Sgtxt,
							Nrreg: parseInt(oReg.Nrreg, 0),
							Dmbtr: parseFloat(oReg.Dmbtr),
							Wrbtr: parseFloat(oReg.Wrbtr),
							Total: false
						};
					} else {
						oDetalles[sKey].Dmbtr += parseFloat(oReg.Dmbtr);
						oDetalles[sKey].Wrbtr += parseFloat(oReg.Wrbtr);
						oDetalles[sKey].Nrreg += parseInt(oReg.Nrreg, 0);
					}
				}

				let fMontoPen = 0,
					fMontoUsd = 0;

				for (let key in oDetalles) {
					if (oDetalles.hasOwnProperty(key)) {
						fMontoPen += oDetalles[key].Dmbtr;
						fMontoUsd += oDetalles[key].Wrbtr;

						oDetalles[key].Dmbtr = that.redondearMonto(oDetalles[key].Dmbtr);
						oDetalles[key].Wrbtr = that.redondearMonto(oDetalles[key].Wrbtr);
						aResultados.push(oDetalles[key]);
					}
				}

				oModeloTotales.setProperty("/MontoBancoPEN", fMontoPen);
				oModeloTotales.setProperty("/MontoBancoUSD", fMontoUsd);

				that.ordenarBanco(aResultados);
				oData.dataDetalleBancos = aResultados;
				oModelDetalleBanco.setData(oData);
				oModelDetalleBanco.refresh();

				oTable.getBinding("items").filter([oFinalFilterFactura]);

				Toast.show(that.getI18nText("deletedRegisters"));
			}

			if (aDeleteIndexArray.length === 0) {
				Toast.show(this.getI18nText("noDeletedRegisters"));
			} else {
				MessageBox.confirm("¿Desea eliminar las facturas seleccionadas?", {
					title: "Eliminar Facturas",
					onClose: function (sAccion) {
						if (sAccion === "OK") {
							eliminar();
						}
					},

				});

			}

		},

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
		formatSAP: function (pValue) {
			if (pValue) {
				var fecha = pValue.split("T", 1)[0];
				var month, day, year;
				year = fecha.split("-", 3)[0];
				month = fecha.split("-", 3)[1];
				day = fecha.split("-", 3)[2];
				var FechaSAP = year + "-" + month + "-" + day;
				return FechaSAP;
			}
		},
		formatterFechaSAP: function (pValue) {
			if (pValue !== null && pValue !== undefined) {
				var d = pValue;
				var month = '' + (d.getMonth() + 1),
					day = '' + d.getDate(),
					year = '' + d.getFullYear();

				if (month.length < 2) month = '0' + month;
				if (day.length < 2) day = '0' + day;

				return [year, month, day].join('-');
			} else {
				return "";
			}
		}
	});
});