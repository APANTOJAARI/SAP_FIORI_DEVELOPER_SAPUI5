sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/List",
	"sap/m/StandardListItem",
	"sap/ui/core/Fragment",
	"sap/ui/core/syncStyleClass",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (JSONModel, Device, Dialog, Button, Text, List, StandardListItem, Fragment, syncStyleClass, Filter, FilterOperator) {
	"use strict";
	this._Odata = {};
	return {

		parse: function () {},

		formatDate: function (value) {
			if (value) {
				//Fecha SAP- \/Date(1686787200000)\/

				//let dateParse = Date.parse(value);
				var dateInput = new Date(value);
				return dateInput;

				/*
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd/MM/yyyy"
				});
				
				var dateNowFormat = new Date(dateFormat.format(value));
				return dateNowFormat;*/
			}
			/*
				var TimezoneOffset = new Date(value).getTimezoneOffset();

				// SAPUI5 formatters
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd/MM/yyyy"
				});
				
				var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
					pattern: "KK:mm:ss a"
				});
				
				// timezoneOffset is in hours convert to milliseconds
				var TZOffsetMs = new Date(value).getTimezoneOffset() * 60 * 1000;
				// format date and time to strings offsetting to GMT
				var dateStr = dateFormat.format(new Date(dateInput.getTime() + TZOffsetMs)); //05-12-2012
				
				//var timeStr = timeFormat.format(new Date(DepartureTime.ms + TZOffsetMs)); //11:00 AM
				//parse back the strings into date object back to Time Zone
				var parsedDate = new Date(dateFormat.parse(dateStr).getTime() - TZOffsetMs); //1354665600000  
				//var parsedTime = new Date(timeFormat.parse(timeStr).getTime() - TZOffsetMs); //39600000

				DateConvert = "\/Date(" + parsedDate + ")\/";

				return DateConvert;

			} else {

				return value;

			}
			*/
		},
		showLogCreate: function (oData, oView) {

			var oModel = oView.getModel("jsonTemplatePage");
			var arrayLog = [];

			oModel.setData({
				Log: []
			});
			oModel.updateBindings(true);

			//Pasar los valores
			for (var i = 0, len = oData.length; i < len; i++) {
				arrayLog.push({
					Key: oData[i].Type,
					Text: oData[i].LogMessage
				});
			}

			oModel.setProperty("/Log", arrayLog);
			oModel.refresh();
			oModel.updateBindings(true);

			if (!this.oResizableDialog) {
				this.oResizableDialog = new Dialog({
					title: "Log de Errores:",
					contentWidth: "550px",
					contentHeight: "300px",
					resizable: true,
					content: new List({
						items: {
							path: "jsonTemplatePage>/Log",
							template: new StandardListItem({
								title: "{jsonTemplatePage>Text}",
								infoState: "Error",
								infoStateInverted: true,
								info: "Error"
							})
						}
					}),
					endButton: new Button({
						text: "Close",
						press: function () {
							this.oResizableDialog.close();
						}.bind(this)
					})
				});

				//to get access to the controller's model
				oView.addDependent(this.oResizableDialog);
			}
			this.oResizableDialog.open();

		},
		F4Vkorg2: function (oEvent, oViewMain) {
			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog70) {
				this._pDialog70 = Fragment.load({
					id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupVkorg",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog70.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},
		F4Vkorg: function (oEvent, oViewMain, Controller) {

			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog2) {
				this._pDialog2 = Fragment.load({
					id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupVkorg",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog2.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},
		F4DesMcia2: function (oEvent, oViewMain) {
			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog50) {
				this._pDialog50 = Fragment.load({
					id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupDesMcia2",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog50.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},
		F4DesMcia: function (oEvent, oViewMain, Controller) {

			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog3) {
				this._pDialog3 = Fragment.load({
					id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupDesMcia",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog3.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));
		},
		showDialogF4Proveed: function (oEvent, oViewMain) {

			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog21) {
				this._pDialog21 = Fragment.load({
					id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupProveedorKunnr",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog21.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},
		showDialogF4ClientSolic: function (oEvent, oViewMain) {

			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog40) {
				this._pDialog40 = Fragment.load({
					id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupClientSolic2",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog40.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},

		showDialogF4PtoExp: function (oEvent, oViewMain) {

			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog5) {
				this._pDialog5 = Fragment.load({
					id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupPtoExp",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog5.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},
		showDialogF4UMHeader: function (oEvent, oViewMain) {

			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog6) {
				this._pDialog6 = Fragment.load({
					id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupUMHeader",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog6.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},
		showDialogF4Transp: function (oEvent, oViewMain) {

			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog7) {
				this._pDialog7 = Fragment.load({
					id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupTransport",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog7.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},
		showDialogF4Motivo: function (oEvent, oViewMain) {
			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog10) {
				this._pDialog10 = Fragment.load({
					//id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupMotivo",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog10.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},
		showDialogF4Conduct: function (oEvent, oViewMain) {

			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog8) {
				this._pDialog8 = Fragment.load({
					id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupConductor",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog8.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},

		showDialogF4Werks: function (oEvent, oViewMain) {

			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog100) {
				this._pDialog100 = Fragment.load({
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupWerksNew",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog100.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},
		showDialogF4WerksDest: function (oEvent, oViewMain) {

			let oButton1 = oEvent.getSource(),
				  oView1 = oViewMain;

			if (!this._pDialog250) {
				this._pDialog250 = Fragment.load({
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupWerksDestino",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog250.then(function (oDialog) {
				this._configDialog(oButton1, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},
		showDialogF4Product: function (oEvent, oViewMain) {

			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog80) {
				this._pDialog80 = Fragment.load({
					//id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupProduct",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog80.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},
		showDialogF4UMDetail: function (oEvent, oViewMain) {

			var oButton = oEvent.getSource(),
				oView = oViewMain;

			if (!this._pDialog35) {
				this._pDialog35 = Fragment.load({
					//id: oView.getId(),
					name: "ZSD_APP_GREMI.ZSD_APP_GREMI.fragments.PopupUMDetail",
					controller: oViewMain.oController
				}).then(function (oDialog) {
					oViewMain.addDependent(oDialog);
					return oDialog;
				});
			}

			//Mostar el Dialog
			this._pDialog35.then(function (oDialog) {
				this._configDialog(oButton, oDialog, oViewMain);
				oDialog.open();
			}.bind(this));

		},

		//Setear los resultados de la fila seleccionado
		F4Vkorg_setResult: function (oEvent) {

			var result = {};
			// reset the filter
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);

			//===================================================================//
			//Traer el objeto Press Item o Click
			const aContexts = oEvent.getParameter("selectedContexts")

			if (aContexts && aContexts.length) {

				var oSelectedItem = oEvent.getSource();
				var oContext = oSelectedItem.getBindingContext();
				//var sPath = oContext.getPath();

				// SET INPUT TEXT VALUE //
				result.Vkorg = aContexts[0].getObject().Vkorg;
				result.Vtext = aContexts[0].getObject().Vtext;

			}

			return result;

		},

		F4ResultSelected: function (oEvent, field) {

			var result = {};
			// reset the filter
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);

			//===================================================================//
			//Traer el objeto Press Item o Click
			const aContexts = oEvent.getParameter("selectedContexts")

			if (aContexts && aContexts.length) {

				var oSelectedItem = oEvent.getSource();
				var oContext = oSelectedItem.getBindingContext();
				//var sPath = oContext.getPath();

				// SET INPUT TEXT VALUE //
				switch (field) {
				case "PtoExp":
					result.Vstel = aContexts[0].getObject().Vstel;
					result.Vtext = aContexts[0].getObject().Vtext;
					break;
				case "MeinsHead":
					result.Msehi = aContexts[0].getObject().Msehi;
					result.Msehl = aContexts[0].getObject().Msehl;
					break;
				case "TransPub":
					result.Lifnr = aContexts[0].getObject().Lifnr;
					result.Mcod1 = aContexts[0].getObject().Mcod1;
					break;
				case "Product":
					result.Matnr = aContexts[0].getObject().Matnr;
					result.Maktx = aContexts[0].getObject().Maktx;
					result.Meins = aContexts[0].getObject().Meins;
					result.Normt = aContexts[0].getObject().Normt;
					break;
				case "Motivo":
					result.ZcoMot = aContexts[0].getObject().ZcoMot;
					result.ZdesMot = aContexts[0].getObject().ZdesMot;
					break;
				case "Werks":
					result.Werks = aContexts[0].getObject().Werks;
					result.Lgort = aContexts[0].getObject().Lgort;
					result.Lgobe = aContexts[0].getObject().Lgobe;
					result.Direccion = aContexts[0].getObject().Direccion;
					break;
				default:
				}
			}
			return result;

		},
		F4FilterResults: function (oEvent, Field) {
			let sValue = oEvent.getParameter("value");
			let cadena = String(sValue);
			let valueLower = cadena.toLowerCase();
			//var oFilter = new Filter(Field, FilterOperator.Contains, sValue);
			 let oFilter = new Filter({ 
                                          filters: [ new Filter (field, FilterOperator.Contains, sValue),
                                                     new Filter (field, FilterOperator.Contains, valueLower) ]});
                                                     
			var oBinding2 = oEvent.getSource().getBinding("items");
			oBinding2.filter([oFilter]);
		},

		//Setear los resultados de la fila seleccionado
		F4DesMcia_setResult: function (oEvent) {

			var result = {};
			// reset the filter
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);

			//===================================================================//
			//Traer el objeto Press Item o Click
			const aContexts = oEvent.getParameter("selectedContexts")

			if (aContexts && aContexts.length) {

				var oSelectedItem = oEvent.getSource();
				var oContext = oSelectedItem.getBindingContext();
				//var sPath = oContext.getPath();

				// SET INPUT TEXT VALUE //
				result.Kunnr = aContexts[0].getObject().Kunnr;
				result.Mcod1 = aContexts[0].getObject().Mcod1;
			}

			return result;
		},

		//Configuración del Dialog F4
		_configDialog: function (oButton, oDialog, oViewMain) {
			// Set draggable property
			var bDraggable = oButton.data("draggable");
			oDialog.setDraggable(bDraggable == "true");

			// Set resizable property
			var bResizable = oButton.data("resizable");
			oDialog.setResizable(bResizable == "true");

			// Multi-select if required
			var bMultiSelect = !!oButton.data("multi");
			oDialog.setMultiSelect(bMultiSelect);

			// Remember selections if required
			var bRemember = !!oButton.data("remember");
			oDialog.setRememberSelections(bRemember);

			var sResponsivePadding = oButton.data("responsivePadding");
			var sResponsiveStyleClasses =
				"sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer";

			if (sResponsivePadding) {
				oDialog.addStyleClass(sResponsiveStyleClasses);
			} else {
				oDialog.removeStyleClass(sResponsiveStyleClasses);
			}

			// Set custom text for the confirmation button
			var sCustomConfirmButtonText = oButton.data("confirmButtonText");
			oDialog.setConfirmButtonText(sCustomConfirmButtonText);

			// toggle compact style
			//sap.ui.core.syncStyleClass("sapUiSizeCompact", oViewMain, oDialog);
			oDialog.addStyleClass("sapUiSizeCompact");
		},
		setModel_F4Vkorg: function (oViewMain, oData) {

			this.ClearModel(oViewMain);

			var oModel = oViewMain.getModel("jsonTemplatePage");
			var arrayData = [];

			//Pasar los valores
			for (var i = 0, len = oData.length; i < len; i++) {
				arrayData.push({
					Vkorg: oData[i].Vkorg,
					Vtext: oData[i].Vtext
				});
			}

			oModel.setProperty("/HTvko", arrayData);
			oModel.refresh();
			oModel.updateBindings(true);

		},
		setModel_F4DesMcia: function (oViewMain, oData) {

			this.ClearModel(oViewMain);

			var oModel = oViewMain.getModel("jsonTemplatePage");
			var arrayData = [];

			//Pasar los valores
			for (var i = 0, len = oData.length; i < len; i++) {
				arrayData.push({
					Begru: oData[i].Begru,
					Kunnr: oData[i].Kunnr,
					Name1: oData[i].Name1,
				});
			}

			oModel.setProperty("/HKna1", arrayData);
			oModel.refresh();
			oModel.updateBindings(true);

		},

		ClearModel: function (oViewMain) {
			var oModel = oViewMain.getModel("jsonTemplatePage");
			oModel.setData({
				Log: [],
				HTvko: [],
				HKna1: []
			});
			oModel.updateBindings(true);
			oModel.refresh();
		},
		ReadOdata: function (oViewMain, entityOdata) {

			this._Odata = {};
			try {
				oViewMain.getModel().read(entityOdata, {
					success: function (data) {

						this._Odata = data.results;
						console.log(data.results);

					}.bind(oViewMain),

					error: function (e) {
						console.log(e);
					}

				});

				if (this._Odata) {
					return this._Odata;
				}

			} catch (e) {
				console.log(e);
			}
		}

	};
});