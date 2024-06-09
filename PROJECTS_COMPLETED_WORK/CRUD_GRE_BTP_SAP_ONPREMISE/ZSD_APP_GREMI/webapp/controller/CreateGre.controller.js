sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/Core",
	"sap/ui/core/library",
	"sap/ui/unified/library",
	"ZSD_APP_GREMI/ZSD_APP_GREMI/model/Utilidades", //Funciones JavaScript
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/List",
	"sap/m/StandardListItem",
	"sap/ui/core/IconPool",
	"jquery.sap.global",
	"sap/m/library"
], function (Controller, History, Filter, FilterOperator, JSONModel, MessageBox, MessageToast, Core, CoreLibrary, UnifiedLibrary,
	Utilidades, Dialog, Button, Text, List, StandardListItem, IconPool, jQuery, mobileLibrary) {
	"use strict";
	//Para campos Fechas
	var ValueState = CoreLibrary.ValueState;

	return Controller.extend("ZSD_APP_GREMI.ZSD_APP_GREMI.controller.CreateGre", {
		onInit: function () {
			
			this._viewMain = this.getView();
			this._Odata = {};

			//Reset
			new sap.ui.core.UIComponent.getRouterFor(this).attachRoutePatternMatched(this.onRouteMatched, this);

			//Inicializar el Modelo en local
			var objJsonModelEmpl = new sap.ui.model.json.JSONModel;
			objJsonModelEmpl.loadData("./model/json/Template.json", false);
			this._viewMain.setModel(objJsonModelEmpl, "jsonTemplatePage");

			this.performInitFecha();
			/*
			//Inicializar el Modelo Detail
			this._data = { Products : [] };
			this.jModel = new sap.ui.model.json.JSONModel();
			this.jModel.setData(this._data);*/

			//Inicializar el Modelo Detail
			/*
			this.objJsonModelDetail = new sap.ui.model.json.JSONModel;
			this.objJsonModelDetail.loadData("./model/json/DetailProduct.json", false);
			this._viewMain.setModel(this.objJsonModelDetail, "jsonDetail");*/

			var dataModelDetail = this.getOwnerComponent().getModel("DetailProduct");
			this.getView().setModel(dataModelDetail, "detailProducts");

			//Update
			// for the data binding example do not use the change event for check but the data binding parsing events
			Core.attachParseError(
				function (oEvent) {
					var oElement = oEvent.getParameter("element");

					if (oElement.setValueState) {
						oElement.setValueState(ValueState.Error);
					}
				});

			Core.attachValidationSuccess(
				function (oEvent) {
					var oElement = oEvent.getParameter("element");

					if (oElement.setValueState) {
						oElement.setValueState(ValueState.None);
					}
				});
		},
		onBeforeRendering: function () {

			//this.byId("DetalleEntreg").setModel(this.objJsonModelDetail);

		},
		onAfterRendering: function () {

		},
		onExit: function () {

		},

		onSaveGre: function () {
			//Confirmar
			MessageBox.confirm(this.oView.getModel("i18n").getResourceBundle().getText("TitDialog1"), {
				onClose: function (sAction) {
					if (sAction === MessageBox.Action.OK) {
						this.onSaveGreOk();
					}
				}.bind(this)
			});

		},
		onSaveGreOk: function () {
			//Init variables 
			var idGre = 0;
			//Crear el Array con la estructura del servicio
			var inputDataBody = {
				Vstel: "",
				Vkorg: "",
				Kunwe: "",
				KunnrSucur: "",
				Centro: "",
				PuntoPartida: "",
				Wadat: "",
				MotivoTraslado: "",
				CategoriaVehiculo: "",
				RetornoEnvaceVacio: "",
				RetornoVehiculoVacio: "",
				Transbordo: "",
				Transportista: "",
				Conductor: "",
				Motivo: "",
				Observacion: "",
				HeaderToDetail: [],
				HeaderToMessage: []
			};

			//Set datos de cabecera:
			//=============================================================================================================
			//Datos Obligatorios
			//inputDataBody.Vstel = this.getView().byId("TxtPtoExp").getValue("value"); //Puesto exped.
			inputDataBody.MotivoTraslado = this.getView().byId("TxtMotivTras").getValue("value"); //Motivo de Traslado
			//inputDataBody.Wadat = this.getView().byId("TxtDateMov").getValue("value"); //Mov.mcía.prev.
			inputDataBody.Wadat = Utilidades.formatDate(this.getView().byId("TxtDateMov").getDateValue());
			inputDataBody.DateTraslado = Utilidades.formatDate(this.getView().byId("TxtDateEntrega").getDateValue());

			inputDataBody.Kunwe = this.getView().byId("TxtDesMcia").getValue("value"); //Datos del Destinatario
			//inputDataBody.Vkorg = this.getView().byId("TxtOrgVent").getValue("value"); //Organiz.ventas
			//Nuevos Campos
			inputDataBody.Centro = this.getView().byId("TxtCentro").getValue("value"); //Centro
			inputDataBody.PuntoPartida = this.getView().byId("TxtCAlmacen").getValue("value"); //Almacén

			if (inputDataBody.PuntoPartida !== "") {
				const dataText = inputDataBody.PuntoPartida.split("-");
				inputDataBody.PuntoPartida = dataText[0];
			}
			var convertPuntpart = inputDataBody.PuntoPartida.trim();
			inputDataBody.PuntoPartida = convertPuntpart;

			//=============================================================================================================
			//Datos de Información de Traslado
			if (this.getView().byId("FlgRev").getSelected()) { //Retorno de envace vacío
				inputDataBody.RetornoEnvaceVacio = "X";
			}
			if (this.getView().byId("FlgDevc").getSelected()) { //Vehículos  cat. M1 o L
				inputDataBody.CategoriaVehiculo = "X";
			}
			if (this.getView().byId("FlgRvv").getSelected()) { //Retorno de vehículo vacío
				inputDataBody.RetornoVehiculoVacio = "X";
			}
			if (this.getView().byId("FlgTrp").getSelected()) { //Transbordo
				inputDataBody.Transbordo = "X";
			}

			//=============================================================================================================
			//Datos de Información de Traslado - Cantidades

			if (this.getView().byId("TxtPesoTot").getValue("value")) {
				inputDataBody.PesoTotal = parseFloat(this.getView().byId("TxtPesoTot").getValue("value")).toFixed(3);
			}

			inputDataBody.UnidadMedida = this.getView().byId("TxtUnidMed").getSelectedKey();

			if (this.getView().byId("TxtNumBult").getValue("value")) {
				inputDataBody.CantidadBultos = this.getView().byId("TxtNumBult").getValue("value");
			}

			//=============================================================================================================
			//Datos de Transportista
			inputDataBody.Transportista = this.getView().byId("TxtTransport").getValue("value");

			if (this.getView().byId("Rbopt2").getSelected()) {
				inputDataBody.ConductorPlaca = this.getView().byId("TxtDmCPlacaCN").getValue("value");
			}

			//Transportista de datos Manual
			if (this.getView().byId("CheckTrans").getSelected() && this.getView().byId("Rbopt1").getSelected()) {

				inputDataBody.TransportistaRazon = this.getView().byId("TxtDmRazon").getValue("value");
				inputDataBody.TransportistaRuc = this.getView().byId("TxtDmRuc").getValue("value");
				inputDataBody.TransportistaMtc = this.getView().byId("TxtDmMtc").getValue("value");
			}

			//=============================================================================================================
			//Datos de Conductor 
			inputDataBody.Conductor = this.getView().byId("TxtIdConductor").getValue("value");
			//Datos de Conductor Manual
			if (this.getView().byId("CheckConduct").getSelected() && this.getView().byId("Rbopt2").getSelected()) {
				inputDataBody.ConductorNombre = this.getView().byId("TxtDmCName").getValue("value");
				inputDataBody.ConductorApellido = this.getView().byId("TxtDmCApell").getValue("value");
				inputDataBody.ConductorDocumento = this.getView().byId("TxtDmCDni").getValue("value");
				inputDataBody.ConductorPlaca = this.getView().byId("TxtDmCPlaca").getValue("value");
				inputDataBody.ConductorLicencia = this.getView().byId("TxtDmCLicen").getValue("value");
			}

			//=============================================================================================================
			//Datos de destino 
			if (this.getView().byId("CheckClienteSolic").getSelected()) {
				inputDataBody.KunnrSucur = this.getView().byId("TxtClientSolic").getValue("value");
			}

			//=============================================================================================================
			//Datos de Observaciones 

			inputDataBody.Observacion = this.getView().byId("TxtObservaciones").getValue("value");
			inputDataBody.Motivo = this.getView().byId("TxtMotivo13").getValue("value");
			//Campos Nuevos
			this.setValuesnewcampos(inputDataBody);

			//Validar campos
			if (this.Validar_fields(inputDataBody) === false) {
				return
			}

			//==================================================================================================================================//
			//==================================================================================================================================//
			//Guardar el Detalle
			var oTableitems = this.getView().byId("DetalleEntreg").getItems();
			var oTable = this.getView().byId("DetalleEntreg");
			var arrayDetail = [];
			for (var i = 0, len = oTableitems.length; i < len; i++) {

				//oTable.getItems()[0].getCells()[0].mProperties.value
				var cantidad = 0;
				var lv_cantidad = this.getView().byId("DetalleEntreg").getItems()[i].getCells()[3].mProperties.value;
				if (lv_cantidad === "" || lv_cantidad === null) {
					cantidad = parseFloat(lv_cantidad).toFixed(3);
				} else {
					cantidad = parseFloat(this.getView().byId("DetalleEntreg").getItems()[i].getCells()[3].mProperties.value).toFixed(3);
				}

				if (this.getView().byId("DetalleEntreg").getItems()[i].getCells()[9].getDateValue()) {
					var fechaVenc = Utilidades.formatDate(this.getView().byId("DetalleEntreg").getItems()[i].getCells()[9].getDateValue());
				}

				arrayDetail.push({
					Matnr: this.getView().byId("DetalleEntreg").getItems()[i].getCells()[0].mProperties.value,
					Arktx: this.getView().byId("DetalleEntreg").getItems()[i].getCells()[1].mProperties.value,
					MatnrSunat: this.getView().byId("DetalleEntreg").getItems()[i].getCells()[2].mProperties.value,
					Lfimg: cantidad,
					Vrkme: this.getView().byId("DetalleEntreg").getItems()[i].getCells()[4].mProperties.value,
					//Campos Adicionales
					Sexo: this.getView().byId("DetalleEntreg").getItems()[i].getCells()[5].mProperties.value,
					Edad: this.getView().byId("DetalleEntreg").getItems()[i].getCells()[7].mProperties.value,
					NroLote: this.getView().byId("DetalleEntreg").getItems()[i].getCells()[6].mProperties.value,
					NroSerie: this.getView().byId("DetalleEntreg").getItems()[i].getCells()[8].mProperties.value,
					FechaVencimiento: fechaVenc
				});
			}

			inputDataBody.HeaderToDetail = arrayDetail;
			//==================================================================================================================================//
			//==================================================================================================================================//
			//Stop Seconds
			this.getView().setBusy(true);

			//Llamar a la función POST - CREATE del Odata - Cabecera
			this.getView().getModel().create("/HeaderSet", inputDataBody, {

				success: function (data) {
					this.getView().setBusy(false);
					idGre = parseInt(data.Numgr);
					if (idGre === 0 || idGre === undefined) {
						Utilidades.showLogCreate(data.HeaderToMessage.results, this._viewMain);
					} else {
						//MessageBox.information(this.oView.getModel("i18n").getResourceBundle().getText("GreNew") + " " + idGre.toString(), {
						MessageBox.information(data.HeaderToMessage.results[0].LogMessage, {
							onClose: function () {
								this.clear_form(); //Clear
								var oRouter = new sap.ui.core.UIComponent.getRouterFor(this);
								oRouter.navTo("RouteApp", {}, false)
							}.bind(this)
						});
					}
				}.bind(this),
				error: function (e) {
					this.getView().setBusy(false);
					console.log("error:" + e);
					MessageToast.show(this.oView.getModel("i18n").getResourceBundle().getText("odataSaveKO"));
				}.bind(this)
			});

		},
		performInitFecha: function () {
			var oModel = new JSONModel({
				dDefaultDate: new Date()
			});
			this.getView().setModel(oModel, "view");
		},
		clearModelFecha: function () {
			try {
				this.getView().getModel("view").aBindings = []
				this.getView().getModel("view").destroy();
				this.getView().getModel("view").refresh(true);
			} catch (err) {}
		},

		clear_form: function () {;

			//Limpiar las variables:
			var inputField2 = this.byId("TxtMotivTras");
			inputField2.setValue("");
			var inputField3 = this.byId("TxtDateMov");
			inputField3.setValue("");
			var inputField3_2 = this.byId("TxtDateEntrega");
			inputField3_2.setValue("");

			var inputField4 = this.byId("TxtDesMcia");
			inputField4.setValue("");
			var inputField4_1 = this.byId("TxtDesMciaDesc");
			inputField4_1.setValue("");

			var inputField7 = this.byId("FlgRev");
			inputField7.setSelected(false);
			var inputField7_1 = this.byId("FlgRvv");
			inputField7_1.setSelected(false);
			var inputField8 = this.byId("FlgTrp");
			inputField8.setSelected(false);
			var inputField9 = this.byId("FlgDevc");
			inputField9.setSelected(false);

			var inputField10 = this.byId("TxtPesoTot");
			inputField10.setValue("");
			var inputField11 = this.byId("TxtNumBult");
			inputField11.setValue("");
			var inputField12 = this.byId("TxtUnidMed");
			//inputField12.setValue("");
			inputField12.setSelectedKey("");

			var inputField13 = this.byId("TxtPuntPart");
			inputField13.setValue("");
			var inputField14 = this.byId("TxtPuntLLeg");
			inputField14.setValue("");
			var inputField15 = this.byId("TxtCodSuc");
			inputField15.setValue("");
			var inputField16 = this.byId("TxtTransport");
			inputField16.setValue("");
			var inputField17 = this.byId("TxtIdConductor");
			inputField17.setValue("");
			var inputField18 = this.byId("TxtDmCPlaca");
			inputField18.setValue("");
			var inputField19 = this.byId("TxtObservaciones");
			inputField19.setValue("");
			var inputField20 = this.byId("TxtMotivo13");
			inputField20.setValue("");

			//Limpiar el Modelo
			var oModel = this.getView().getModel("jsonTemplatePage");
			var arrayLog = [];

			oModel.setData({
				Log: []
			});
			oModel.updateBindings(true);

			/*
			//Clear la tabla del Detalle
			var oTable = this.byId("DetalleEntreg");
			oTable.removeAllItems();
			//this.getView().byId("DetalleEntreg").getModel().refresh(true);
			//oTable.unbindItems();*/

			//Limpiar los textos nuevos
			var idClientSolic = this.getView().byId("TxtClientSolic");
			var idClientSolicDesc = this.getView().byId("TxtClientSolicDesc");
			var idTxtDmRazon = this.getView().byId("TxtDmRazon");
			var idTxtDmRuc = this.getView().byId("TxtDmRuc");
			var idTxtDmMtc = this.getView().byId("TxtDmMtc");
			var idTxtDmCName = this.getView().byId("TxtDmCName");
			var TxtDmCApell = this.getView().byId("TxtDmCApell");
			var idTxtDmCDni = this.getView().byId("TxtDmCDni");
			var idTxtDmCPlaca = this.getView().byId("TxtDmCPlaca");
			var idTxtDmCLicen = this.getView().byId("TxtDmCLicen");
			var TxtMotivTrasDesc = this.getView().byId("TxtMotivTrasDesc");
			var TxtIdTransDesc = this.getView().byId("TxtIdTransDesc");
			var TxtIdCondDesc = this.getView().byId("TxtIdCondDesc");

			TxtIdCondDesc.setValue("");
			TxtIdTransDesc.setValue("");
			TxtMotivTrasDesc.setValue("");

			idClientSolic.setValue("");
			idClientSolicDesc.setValue("");
			idTxtDmMtc.setValue("");
			idTxtDmRuc.setValue("");
			idTxtDmRazon.setValue("");
			idTxtDmCName.setValue("");
			TxtDmCApell.setValue("");
			idTxtDmCDni.setValue("");
			idTxtDmCPlaca.setValue("");
			idTxtDmCLicen.setValue("");

			//Limpiar los checkBoxs
			var idCheckTrans = this.getView().byId("CheckTrans");
			var idCheckConduct = this.getView().byId("CheckConduct");
			var idCheckClienteSolic = this.getView().byId("CheckClienteSolic");

			idCheckClienteSolic.setSelected(false);
			idCheckTrans.setSelected(false);
			idCheckConduct.setSelected(false);

			//Limpiar el Modelo
			/*
			var detailProduct = this.getView().getModel("jsonDetail");
			detailProduct.setData({
				Detail: []
			});
			//detailProduct.setProperty("/Detail", []);
			 detailProduct.refresh();*/
			//detailProduct.updateBindings(true);

			//Limpiar las nuevas variables:
			var newinput01 = this.getView().byId("TxtTotTara");
			var newinput02 = this.getView().byId("TxtPesoNet");
			var newinput03 = this.getView().byId("TxtPesoBru");
			var newinput04 = this.getView().byId("TxtPesoPro");
			var newinput05 = this.getView().byId("TxtNjcb");
			var newinput06 = this.getView().byId("TxtNp");
			var newinput07 = this.getView().byId("TxtNpjab");
			var newinput08 = this.getView().byId("TxtNPrecinto");
			var newinput09 = this.getView().byId("TxtNgranja");
			var newinput10 = this.getView().byId("TxtNGalon");
			var newinput11 = this.getView().byId("TxtNPedido");
			var newinput12 = this.getView().byId("TxtPuntoPart");
			var newinput13 = this.getView().byId("TxtPuntoLleg");
			var newinput14 = this.getView().byId("TxtCentro");
			var newinput15 = this.getView().byId("TxtCAlmacen");
			var newinput16 = this.getView().byId("TxtProveed");
			var newinput17 = this.getView().byId("TxtProveedDesc");
			var newinput19 = this.getView().byId("TxtDmCPlacaCN");

			newinput01.setValue("");
			newinput02.setValue("");
			newinput03.setValue("");
			newinput04.setValue("");
			newinput05.setValue("");
			newinput06.setValue("");
			newinput07.setValue("");
			newinput08.setValue("");
			newinput09.setValue("");
			newinput10.setValue("");
			newinput11.setValue("");
			newinput12.setValue("");
			newinput13.setValue("");
			newinput14.setValue("");
			newinput15.setValue("");
			newinput16.setValue("");
			newinput17.setValue("");
			newinput19.setValue("");

			this.clearModelFecha();

			//Inicializar textos y inputs
			this.getView().byId("FieldProveed").setVisible(false); //Add
			this.getView().byId("formElementWdest").setVisible(false); //Add
			this.getView().byId("TxtCentroDest").setValue("");;

			this.getView().byId("TxtDesMcia").setEditable(true);
			this.getView().byId("LblPuntoPart").setText(this.oView.getModel("i18n").getResourceBundle().getText("TxtPuntoPart"));
			this.getView().byId("LblPuntoLleg").setText(this.oView.getModel("i18n").getResourceBundle().getText("TxtPuntoLlegada"));

		},

		/* Méthod para verificar sí la fecha es correcto */

		handleChangeDate: function (oEvent) {
			var oDP = oEvent.getSource(),
				sValue = oEvent.getParameter("value"),
				bValid = oEvent.getParameter("valid");

			this._iEvent++;

			if (bValid) {
				oDP.setValueState(ValueState.None);
			} else {
				oDP.setValueState(ValueState.Error);
			}
		},
		onDelete: function (oEvent) {

			var indice = [];
			//Forma 01
			var oTable = this.getView().byId("DetalleEntreg");
			var detailProduct = this.getView().getModel("DetailProduct").getData();
			var selectedRowData = oTable.getSelectedContexts(); //
			var SelectedRowData2 = oTable.getSelectedItems();

			if (selectedRowData.length === 0) {
				MessageToast.show(this.oView.getModel("i18n").getResourceBundle().getText("RowDelete"));
				return;
			} else {
				for (var i = 0; i < SelectedRowData2.length; i++) {
					//for (var i = 0; i < selectedRowData.length; i++) {
					var oThisObj = selectedRowData[i].getObject();
					indice.push({
						oThisObj
					});
					/*
					var index = $.map(detailProduct.Detail, function (obj, index) {
						if (obj === oThisObj) {

							return index;
						}
					});*/
					//detailProduct.Detail.splice(index, 1);
				}
				//+add Nuevo eliminar
				for (var i = 0, len = indice.length; i < len; i++) {
					var oThisObj = indice[i].oThisObj
					var index = $.map(detailProduct.Detail, function (obj2, index) {
						if (obj2 === oThisObj) {
							return index;
						}
					});
					if (index) {
						detailProduct.Detail.splice(index, 1);
					}
				}

				this.getView().getModel("detailProducts").setData(detailProduct);
				oTable.removeSelections();
			}

			/*
			//Forma 02
			//Obtener el Id de la tabla
			var oTable = this.getView().byId("DetalleEntreg");
			//Obtener las filas
			var SelectedRowData = oTable.getSelectedItems();
			var detailProduct = this.getView().getModel("DetailProduct");

			if (SelectedRowData.length === 0) {
				MessageToast.show(this.oView.getModel("i18n").getResourceBundle().getText("RowDelete"));
				return;
			} else {
				for (var i = 0; i < SelectedRowData.length; i++) {
					oTable.removeItem(SelectedRowData[i]);
					//var index = detailProduct.getData().Detail.indexOf(i + 1);
					//detailProduct.getData().Detail.splice(index, 1);
				}
			}

			//refrescar el modelo del detalle

			//Pasar los valores nuevos de la tabla
			var oTableitems = this.getView().byId("DetalleEntreg").getItems();
			var oTable = this.getView().byId("DetalleEntreg");
			var arrayDetail = [];
			for (var i = 0, len = oTableitems.length; i < len; i++) {
				arrayDetail.push({
					Matnr: this.getView().byId("DetalleEntreg").getItems()[i].getCells()[0].mProperties.value,
					Arktx: this.getView().byId("DetalleEntreg").getItems()[i].getCells()[1].mProperties.value,
					Lfimg: this.getView().byId("DetalleEntreg").getItems()[i].getCells()[2].mProperties.value,
					Vrkme: this.getView().byId("DetalleEntreg").getItems()[i].getCells()[3].mProperties.value,
				});
			}
			this.ClearModeloDetail();
			detailProduct.setData({
				Detail: arrayDetail
			});

			detailProduct.refresh();
			this.getView().byId("DetalleEntreg").removeSelections();*/

		},
		onAdd: function (oEvent) {
			//Hideen Column
			this.hiddenColumnTable();
			//Forma con el modelo del Manifest
			var itemProductEmpty = {
				Matnr: "",
				Arktx: "",
				Lfimg: "",
				Vrkme: "",
				CodSunat: "",
				Sexo: "",
				NroLote: "",
				Edad: "",
				NroSerie: "",
				FechaVencimiento: ""
			};

			var detailProduct = this.getView().getModel("detailProducts").getData().Detail;
			var detailProduct2 = this.getView().getModel("detailProducts").getData();

			if (detailProduct) {
				detailProduct2.Detail.push(itemProductEmpty);
				this.getView().getModel("detailProducts").setData(detailProduct2);
			} else {
				this.getView().getModel("detailProducts").setData({
					Detail: itemProductEmpty
				});
			}

			var oTable = this.getView().byId("DetalleEntreg");
			oTable.removeSelections();

			/*
			//Forma 01: 
			var itemProductEmpty = [];
			itemProductEmpty.push({
				Matnr: "",
				Arktx: "",
				Lfimg: "",
				Vrkme: "",
				CodSunat: ""
			});
			this.objJsonModelDetail.refresh();*/

			/*
			//Forma 02:
			var detailProduct = this.getView().getModel("jsonDetail");
			var itemProduct = detailProduct.getData().Detail;
			var itemProductEmpty = [];

			if (itemProduct) {
				itemProduct.push({
					Matnr: "",
					Arktx: "",
					Lfimg: "",
					Vrkme: "",
					CodSunat: ""
				});
				itemProductEmpty = itemProduct;
			} else {
				itemProductEmpty.push({
					Matnr: "",
					Arktx: "",
					Lfimg: "",
					Vrkme: "",
					CodSunat: ""
				});
			}

			//detailProduct.setProperty("/Detail", itemProductEmpty);
			this.ClearModeloDetail();
			detailProduct.setData({ Detail: itemProductEmpty });
			detailProduct.refresh();
			//detailProduct.updateBindings(true);*/

			/*
						//Forma 03:
						var TextProduct = this.oView.getModel("i18n").getResourceBundle().getText("IdProductoPh");
						var TextUm = this.oView.getModel("i18n").getResourceBundle().getText("UmDetPh");
			
						//Agregar una nueva fila
						var oItem = new sap.m.ColumnListItem({

							cells: [new sap.m.Input({
									showValueHelp: true,
									maxLength: 40,
									placeholder: TextProduct,
								}),
								new sap.m.Input(),
								new sap.m.Input({
									type: "Number",
									change: this.onChangeInputQuantity
								}),
								new sap.m.Input({
									showValueHelp: true,
									maxLength: 3,
									placeholder: TextUm,
									valueHelpRequest: this.onValueHelpUm
								}),
							]
						});
			
						var oTable = this.getView().byId("DetalleEntreg");
						oTable.addItem(oItem);*/

			/*
						this._data.Products.push({
							Matnr: "",
							Arktx: "",
							Lfimg: "",
							Vrkme: "",
							CodSunat: ""
						});

						this.objJsonModelDetail.refresh();
						this.byId("DetalleEntreg").setModel(this.jModel);
						this.getView().byId("DetalleEntreg").getModel().refresh(true);
			


						//this.getView().byId("DetalleEntreg").setModel(detailProduct);
						//this.getView().byId("DetalleEntreg").getModel().refresh(true);*/

		},
		hiddenColumnTable: function (oEvent) {

			var tableDetail = this.getView().byId("DetalleEntreg");

			if (this.getView().byId("TxtMotivTras").getValue("value") === "01") {
				tableDetail.getColumns()[5].setVisible(true);
				tableDetail.getColumns()[6].setVisible(true);
				tableDetail.getColumns()[7].setVisible(false);
				tableDetail.getColumns()[8].setVisible(false);
				tableDetail.getColumns()[9].setVisible(false);
			} else if (this.getView().byId("TxtMotivTras").getValue("value") === "04") {
				tableDetail.getColumns()[5].setVisible(true);
				tableDetail.getColumns()[6].setVisible(true);
				tableDetail.getColumns()[7].setVisible(true);
				tableDetail.getColumns()[8].setVisible(true);
				tableDetail.getColumns()[9].setVisible(true);

			} else {
				tableDetail.getColumns()[5].setVisible(false);
				tableDetail.getColumns()[6].setVisible(false);
				tableDetail.getColumns()[7].setVisible(false);
				tableDetail.getColumns()[8].setVisible(false);
				tableDetail.getColumns()[9].setVisible(false);
			}

		},
		//=============================================================================================================
		//Sección de MatchCodes
		onValueHelpProveed: function (oEvent) {
			Utilidades.showDialogF4Proveed(oEvent, this._viewMain);
		},
		onValueHelpWerks: function (oEvent) {
			Utilidades.showDialogF4Werks(oEvent, this._viewMain);
		},
		onValueHelpWerksDest: function (oEvent) {
			Utilidades.showDialogF4WerksDest(oEvent, this._viewMain);
		},
		onValueHelpIdProduct: function (oEvent) {
			this.selectedValueHelp = oEvent.getSource();
			Utilidades.showDialogF4Product(oEvent, this._viewMain);
		},
		onValueHelpUmDet: function (oEvent) {
			this.selectedValueHelp2 = oEvent.getSource();
			Utilidades.showDialogF4UMDetail(oEvent, this._viewMain);
		},
		onValueHelpUm: function (oEvent) {},

		onValueHelpOrgVent: function (oEvent) {
			//this.ReadOdata("/HTvkoSet") //Obtener los datos
			Utilidades.F4Vkorg2(oEvent, this._viewMain); //Mostrar la Popup de la matchcode
		},
		onValueHelpMotivTras: function (oEvent) {
			Utilidades.showDialogF4Motivo(oEvent, this._viewMain);
		},
		onValueHelpDesMcia: function (oEvent) {
			//this.ReadOdata("/HKna1Set") //Obtener los datos
			Utilidades.F4DesMcia2(oEvent, this._viewMain); //Mostrar la Popup de la matchcode
		},
		onValueHelptClientSoli: function (oEvent) {
			Utilidades.showDialogF4ClientSolic(oEvent, this._viewMain); //Mostrar la Popup de la matchcode	
		},
		onValueHelpPtoExp: function (oEvent) {
			Utilidades.showDialogF4PtoExp(oEvent, this._viewMain); //Mostrar la Popup de la matchcode
		},
		onValueHelpUmHead: function (oEvent) {
			Utilidades.showDialogF4UMHeader(oEvent, this._viewMain); //Mostrar la Popup de la matchcode)
		},
		onValueHelpIdTrans: function (oEvent) {
			Utilidades.showDialogF4Transp(oEvent, this._viewMain);
		},
		onValueHelpConduct: function (oEvent) {
			Utilidades.showDialogF4Conduct(oEvent, this._viewMain);
		},
		handleSearchPtoExp: function (oEvent) {
			Utilidades.F4FilterResults(oEvent, "Vtext");
		},
		handleSearchUMHeader: function (oEvent) {
			Utilidades.F4FilterResults(oEvent, "Msehl");
		},
		handleSearchProduct: function (oEvent) {
			Utilidades.F4FilterResults(oEvent, "Maktx");
		},
		handleSearchCondPriv: function (oEvent) {
			Utilidades.F4FilterResults(oEvent, "Mcod1");
		},
		handleSearchTransPub: function (oEvent) {
			Utilidades.F4FilterResults(oEvent, "Mcod1");
		},
		handleSearchMotivo: function (oEvent) {
			Utilidades.F4FilterResults(oEvent, "ZdesMot");
		},
		handleSearchUMDetail: function (oEvent) {
			Utilidades.F4FilterResults(oEvent, "Msehl");
		},
		handleSearchWerks: function (oEvent) {
			//Utilidades.F4FilterResults(oEvent, "Lgobe");
			Utilidades.F4FilterResults(oEvent, "Direccion");
		},
		handleSearchWerksDest: function (oEvent) {
			Utilidades.F4FilterResults(oEvent, "Direccion");
		},
		handleSearchProveed: function (oEvent) {
			Utilidades.F4FilterResults(oEvent, "Mcod1");
		},
		handleCloseHpProveed: function (oEvent) {
			var result = {};
			result = Utilidades.F4ResultSelected(oEvent, "TransPub");
			//Actualizar los valores
			if (result) {
				if (result.Lifnr) {
					var TxtProveed = this.byId("TxtProveed");
					TxtProveed.setValue(result.Lifnr);

					var TxtProveedDesc = this.byId("TxtProveedDesc");
					TxtProveedDesc.setValue(result.Mcod1);

					this.ReadOdataParameterTexts("ProveedorSet", "Lifnr", result.Lifnr, "", "", "DirecAlmac");
				}
			}
		},
		handleCloseHpProveedKn: function (oEvent) {
			var result = {};
			result = Utilidades.F4DesMcia_setResult(oEvent);
			//Actualizar los valores
			if (result) {
				if (result.Kunnr) {
					let TxtProveedId = this.byId("TxtProveed");
					TxtProveedId.setValue(result.Kunnr);

					let TxtProveedDescId = this.byId("TxtProveedDesc");
					TxtProveedDescId.setValue(result.Mcod1);
					
				   this.ReadOdataParameterTexts("DestinatarioSet", "Kunnr", result.Kunnr, "", "", "DirecAlmac");
				}
			}
		},
		handleCloseHpUMDetail: function (oEvent) {
			var result = {};
			result = Utilidades.F4ResultSelected(oEvent, "MeinsHead");
			//Actualizar los valores
			if (result) {
				if (result.Msehi) {
					//Actualizar la fila con el registro
					this.selectedValueHelp2.setValue(result.Msehi);
					this.selectedValueHelp2.setValueState(sap.ui.core.ValueState.None);
					this.selectedValueHelp2 = null;

				}
			}
		},

		handleCloseHpWerks: function (oEvent) {
			var result = {};
			result = Utilidades.F4ResultSelected(oEvent, "Werks");
			//Actualizar los valores
			if (result) {
				if (result.Werks) {
					var TxtCentro = this.byId("TxtCentro");
					TxtCentro.setValue(result.Werks);
					TxtCentro.setValueState(sap.ui.core.ValueState.None);

					var TxtCAlmacen = this.byId("TxtCAlmacen");
					TxtCAlmacen.setValue(result.Lgort + " - " + result.Lgobe);
					if (this.getView().byId("TxtMotivTras").getValue("value") !== "02" && this.getView().byId("TxtMotivTras").getValue("value") !==
						"07") {
						this.ReadOdataParameterTexts("AlmacenSet", "Werks", result.Werks, result.Lgort, "Lgort", "DirecAlmac");
					} else if (this.getView().byId("TxtMotivTras").getValue("value") === "02" || this.getView().byId("TxtMotivTras").getValue("value") ===
						"07") {
						this.ReadOdataParameterTexts("AlmacenSet", "Werks", result.Werks, result.Lgort, "Lgort", "DirecTransp");
						//Agregar los datos en automático para el campo Destinatario
						if (result.Werks) {
							let id_kunnr = "C" + result.Werks;
							this.getView().byId("TxtDesMcia").setValue(id_kunnr);
							this.ReadOdataParameterTexts("DestinatarioSet", "Kunnr", id_kunnr, "", "", "DestMerc");
						}

					}
				}
			}
		},
		handleCloseHpWerksDest: function (oEvent) {
			let resultrpta = {};
			resultrpta = Utilidades.F4ResultSelected(oEvent, "Werks");
			//Actualizar los valores
			if (resultrpta) {
				if (resultrpta.Werks) {
					let TxtCentroDest = this.byId("TxtCentroDest");
					TxtCentroDest.setValue(resultrpta.Werks);
					TxtCentroDest.setValueState(sap.ui.core.ValueState.None);

					let TxtCAlmacenDest = this.byId("TxtCAlmacenDest");
					TxtCAlmacenDest.setValue(resultrpta.Lgort + " - " + resultrpta.Lgobe);
					if (resultrpta.Direccion) {
						this.getView().byId("TxtPuntoLleg").setValue(resultrpta.Direccion);
					}
					if (resultrpta.Lgort) {
						let id_kunnr = "C" + resultrpta.Werks;
						this.getView().byId("TxtDesMcia").setValue(id_kunnr);
						this.ReadOdataParameterTexts("DestinatarioSet", "Kunnr", id_kunnr, "", "", "DestMerc");
					}
				}
			}
		},
		handleCloseHpMotivo: function (oEvent) {
			var result = {};
			result = Utilidades.F4ResultSelected(oEvent, "Motivo");
			//Actualizar los valores
			if (result) {
				if (result.ZcoMot) {
					var TxtMotivTras = this.byId("TxtMotivTras");
					TxtMotivTras.setValue(result.ZcoMot);
					TxtMotivTras.setValueState(sap.ui.core.ValueState.None);

					var TxtMotivTrasDesc = this.byId("TxtMotivTrasDesc");
					TxtMotivTrasDesc.setValue(result.ZdesMot);
					this.changeTextsLabelPtfin(result.ZcoMot); //++
					this.hiddenCheckClient(); //++
					this.infoTrasladoMotivo(); //++
				}
			}
		},
		handleCloseHpCondPriv: function (oEvent) {

			var result = {};
			result = Utilidades.F4ResultSelected(oEvent, "TransPub");
			//Actualizar los valores
			if (result) {
				if (result.Lifnr) {
					var TxtIdConductor = this.byId("TxtIdConductor");
					TxtIdConductor.setValue(result.Lifnr);

					var TxtIdCondDesc = this.byId("TxtIdCondDesc");
					TxtIdCondDesc.setValue(result.Mcod1);
				}
			}
		},
		handleCloseHpTransPub: function (oEvent) {
			var result = {};
			result = Utilidades.F4ResultSelected(oEvent, "TransPub");
			//Actualizar los valores
			if (result) {
				if (result.Lifnr) {
					var TxtTransport = this.byId("TxtTransport");
					TxtTransport.setValue(result.Lifnr);

					var TxtIdTransDesc = this.byId("TxtIdTransDesc");
					TxtIdTransDesc.setValue(result.Mcod1);
				}
			}
		},
		handleCloseHpProduct: function (oEvent) {
			var result = {};
			result = Utilidades.F4ResultSelected(oEvent, "Product");
			//Actualizar los valores
			if (result) {
				if (result.Matnr) {
					//Actualizar la fila con el registro
					this.selectedValueHelp.setValue(result.Matnr);
					//Actualizar otras Celdas
					//Actualizar la fila con el registro
					var oRowCells = this.selectedValueHelp.getParent().getCells();
					oRowCells[1].setValue(result.Maktx); //Descripción
					oRowCells[2].setValue(result.Normt);
					oRowCells[4].setValue(result.Meins);

					oRowCells[1].setEditable(false);
					oRowCells[2].setEditable(false); //Código de Sunat
					//Validar que ingrese la cantidad
					oRowCells[3].setValueState(sap.ui.core.ValueState.Error);
					oRowCells[3].setValueStateText(this.oView.getModel("i18n").getResourceBundle().getText("ValidCantidad"));

					this.selectedValueHelp = null;
				}
			}
		},
		handleCloseHpUMHeader: function (oEvent) {
			var result = {};
			result = Utilidades.F4ResultSelected(oEvent, "MeinsHead");
			//Actualizar los valores
			if (result) {
				if (result.Msehi) {
					var TxtPtoExp = this.byId("TxtUnidMed");
					TxtPtoExp.setValue(result.Msehi);
				}
			}
		},
		handleCloseHpPtoExp: function (oEvent) {

			var result = {};
			result = Utilidades.F4ResultSelected(oEvent, "PtoExp");
			//Actualizar los valores
			if (result) {
				if (result.Vstel) {
					var TxtPtoExp = this.byId("TxtPtoExp");
					TxtPtoExp.setValue(result.Vstel);

					var TxtPtoExpDesc = this.byId("TxtPtoExpDesc");
					TxtPtoExpDesc.setValue(result.Vtext);
				}
			}
		},
		handleCloseHpOrgVent: function (oEvent) {
			var result = {};
			result = Utilidades.F4Vkorg_setResult(oEvent);
			//Actualizar los valores
			if (result) {
				if (result.Vkorg) {
					var TxtOrgVent = this.byId("TxtOrgVent");
					TxtOrgVent.setValue(result.Vkorg);

					var TxtOrgVentDesc = this.byId("TxtOrgVentDesc");
					TxtOrgVentDesc.setValue(result.Vtext);
				}
			}
		},
		handleCloseHpDesMcia: function (oEvent) {
			var result = {};
			result = Utilidades.F4DesMcia_setResult(oEvent);

			//Actualizar los valores
			if (result) {
				if (result.Kunnr) {
					var TxtIdMcia = this.byId("TxtDesMcia");
					TxtIdMcia.setValue(result.Kunnr);

					var TxtIdMciaDesc = this.byId("TxtDesMciaDesc");
					TxtIdMciaDesc.setValue(result.Mcod1);

					if (this.getView().byId("TxtMotivTras").getValue("value") !== "02" && this.getView().byId("TxtMotivTras").getValue("value") !==
						"07") {
						this.ReadOdataParameterTexts("DestinatarioSet", "Kunnr", result.Kunnr, "", "", "DirecTransp");
					}
				}
			}
		},
		handleSearchDesMcia: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			let cadena = String(sValue);
			let valueLower = cadena.toLowerCase();
			
			 //var oFilter = new Filter("Mcod1", FilterOperator.Contains, sValue);
			 let oFilter = new Filter({ 
                                          filters: [ new Filter ("Mcod1", FilterOperator.Contains, sValue),
                                                     new Filter ("Mcod1", FilterOperator.Contains, valueLower) ]});
                                                     
			var oBinding2 = oEvent.getSource().getBinding("items");
			oBinding2.filter([oFilter]);

		},
		handleSearchClientSolic: function (oEvent) {
			let sValue2 = oEvent.getParameter("value");
			let cadena = String(sValue);
			let valueLower = cadena.toLowerCase();
			
			//var oFilter2 = new Filter("Mcod1", FilterOperator.Contains, sValue2);
			 let oFilter2 = new Filter({ 
                                          filters: [ new Filter ("Mcod1", FilterOperator.Contains, sValue2),
                                                     new Filter ("Mcod1", FilterOperator.Contains, valueLower) ]});
                                                     
			var oBinding3 = oEvent.getSource().getBinding("items");
			oBinding3.filter([oFilter2]);
		},
		handleCloseHpClientSolic: function (oEvent) {

			var result = {};
			result = Utilidades.F4DesMcia_setResult(oEvent);

			//Actualizar los valores
			if (result) {

				if (result.Kunnr) {
					var TxtIdMcia = this.byId("TxtClientSolic");
					TxtIdMcia.setValue(result.Kunnr);

					var TxtIdMciaDesc = this.byId("TxtClientSolicDesc");
					TxtIdMciaDesc.setValue(result.Mcod1);
				}
			}

		},
		//=====================================================================================================================================//
		//=====================================================================================================================================//
		//Operaciones
		ReadOdata: function (entityOdata) {
			try {
				//Llamar a la función POST - READ del Odata - Cabecera
				this.getView().getModel().read(entityOdata, {
					success: function (data) {
						//Validar Los datos
						if (data.results) {
							switch (entityOdata) {
							case "/HTvkoSet":
								Utilidades.setModel_F4Vkorg(this._viewMain, data.results);
								break;
							case "/HKna1Set":
								Utilidades.setModel_F4DesMcia(this._viewMain, data.results);
								break;

							default:
							}
						}

					}.bind(this),
					error: function (e) {
						console.log("error Lectura F4:");
						console.log(e);
					}.bind(this)
				});

			} catch (e) {
				console.log("error Lectura F4:");
				console.log(e);
			}
		},

		//=====================================================================================================================================//
		//=====================================================================================================================================//
		//Datos de Radio button y formularios ocultos:
		TransPub_handleR1: function (oEvent) {
			var selected = oEvent.getSource().getSelected();
			this.clear_forms("R1", selected, "", false);
		},
		TransPri_handleR2: function (oEvent) {

			var selected1 = oEvent.getSource().getSelected();
			this.clear_forms("R2", selected1, "", false);

		},
		onChangeInputPosit: function (oEvent) {
			try {
				var val = oEvent.getParameters("value").value;
				val = val.replace(/[^\d]/g, '');
				this.byId(oEvent.mParameters.id).setValue(val);
			} catch (err) {}

		},
		validateFloatInput: function (oControl) {
			var oBinding = oControl.getBinding("value");
			var oValue = oControl.getValue();
			try {
				var oParsedValue = oBinding.getType().parseValue(oValue, oBinding.sInternalType); // throw error if cannot parse value
				if (oParsedValue) {
					oControl.setValueState(sap.ui.core.ValueState.None);
				} else {
					oControl.setValueState(sap.ui.core.ValueState.Error);
				}
			} catch (ex) {
				oControl.setValueState(sap.ui.core.ValueState.Error);
			}
		},
		onSelectTrasPriv: function (oEvent) {
			var selected = oEvent.getSource().getSelected();
			this.clear_forms("", false, "CP", selected);
		},

		onSelectTrasMan: function (oEvent) {

			var selected1 = oEvent.getSource().getSelected();
			this.clear_forms("", false, "CT", selected1);

		},
		onChkClienteSolic: function (oEvent) {
			var selected2 = oEvent.getSource().getSelected();
			this.ChkClienteSolicVerif(selected2);
		},

		ChkClienteSolicVerif: function (oValue) {
			var Form = this.getView().byId("FormHd01_1");
			var idClientSolic = this.getView().byId("TxtClientSolic");
			var idClientSolicDesc = this.getView().byId("TxtClientSolicDesc");

			if (oValue) {
				Form.setVisible(true);
			} else {
				idClientSolic.setValue("");
				idClientSolicDesc.setValue("");
				Form.setVisible(false);
			}
		},

		clear_forms: function (rb, rbSel, check, checkSel) {

			var Form = this.getView().byId("FormTrans1");
			var Form2 = this.getView().byId("FormTrans1_1");
			var Form3 = this.getView().byId("FormTrans2");
			var Form4 = this.getView().byId("FormTrans2_1");
			var CheckTrans = this.getView().byId("CheckTrans");
			var CheckConduct = this.getView().byId("CheckConduct");

			//Validar Radio Button
			switch (rb) {
			case "R1":
				if (rbSel) {
					Form.setVisible(true);
					CheckTrans.setVisible(true);
					CheckTrans.setSelected(false);

					Form2.setVisible(false);
					Form3.setVisible(false);
					Form4.setVisible(false);
					CheckConduct.setVisible(false);
					CheckConduct.setSelected(false);

					//Limpiar TextBoxs
					var txt21 = this.getView().byId("TxtIdConductor");
					var txt22 = this.getView().byId("TxtIdCondDesc");
					txt21.setValue("");
					txt22.setValue("");
					this.clearVariablesConduc();
				}
				break;
			case "R2":
				if (rbSel) {
					Form3.setVisible(true);
					CheckConduct.setVisible(true);
					CheckConduct.setSelected(false);

					Form.setVisible(false);
					Form2.setVisible(false);
					Form4.setVisible(false);
					CheckTrans.setVisible(false);
					CheckTrans.setSelected(false);

					//Limpiar TextBoxs
					var txt1 = this.getView().byId("TxtTransport");
					var txt2 = this.getView().byId("TxtIdTransDesc");
					txt1.setValue("");
					txt2.setValue("");
					this.clearVariablesTransp();

				}
				break;
			default:
			}

			//Validar CheckBox
			switch (check) {
			case "CT":
				if (checkSel) {
					Form2.setVisible(true);

					Form.setVisible(false);
					Form3.setVisible(false);
					Form4.setVisible(false);

					CheckConduct.setVisible(false);
					CheckConduct.setSelected(false);

				} else {
					Form.setVisible(true);

					Form2.setVisible(false);
					Form3.setVisible(false);
					Form4.setVisible(false);

					CheckConduct.setVisible(false);
					CheckConduct.setSelected(false);

					this.clearVariablesTP_BP();
				}
				break;
			case "CP":
				if (checkSel) {
					Form4.setVisible(true);

					Form.setVisible(false);
					Form2.setVisible(false);
					Form3.setVisible(false);

					CheckTrans.setVisible(false);
					CheckTrans.setSelected(false);

				} else {
					Form3.setVisible(true);

					Form.setVisible(false);
					Form2.setVisible(false);
					Form4.setVisible(false);

					CheckConduct.setVisible(true);
					CheckConduct.setSelected(false);

					CheckTrans.setVisible(false);
					CheckTrans.setSelected(false);

					this.clearVariablesConduc();

				}
				break;
			default:
			}
		},

		onTabBar: function (oEvent) {

			var TabKey = oEvent.getSource().getSelectedKey();
			var opt1 = this.getView().byId("Rbopt1").getSelected();
			var opt2 = this.getView().byId("Rbopt2").getSelected();
			var chk1 = this.getView().byId("CheckClienteSolic").getSelected();
			var CheckTrans = this.getView().byId("CheckTrans").getSelected();
			var CheckConduct = this.getView().byId("CheckConduct").getSelected();

			switch (TabKey) {
			case "Transport":
				if (opt1 === true && CheckTrans === false) {
					this.clear_forms("R1", opt1, "", false);
				}
				if (opt2 === true && CheckConduct === false) {
					this.clear_forms("R2", opt2, "", false);
				}
				break;
			case "info":
				this.ChkClienteSolicVerif(chk1);
				break;

			case "Adic":

				var idMotivo = this.getView().byId("TxtMotivTras").getValue("value");
				var idForm = this.getView().byId("FormAdic")
				if (idMotivo === "01" || idMotivo === "04") {
					idForm.setVisible(true);
					if (idMotivo === "01") {
						this.getView().byId("FieldPrecinto").setVisible(false);
					} else if (idMotivo === "04") {
						this.getView().byId("FieldPrecinto").setVisible(true);
					}

				} else {
					idForm.setVisible(false);
				}

				break;
			default:
			}
		},
		clearVariablesTransp: function () {
			var inputField1 = this.byId("TxtDmRazon");
			var inputField2 = this.byId("TxtDmRuc");
			var inputField3 = this.byId("TxtDmMtc");

			inputField1.setValue("");
			inputField2.setValue("");
			inputField3.setValue("");

		},
		clearVariablesConduc: function () {
			var inputField1 = this.byId("TxtDmCName");
			var inputField2 = this.byId("TxtDmCApell");
			var inputField3 = this.byId("TxtDmCDni");
			var inputField4 = this.byId("TxtDmCPlaca");
			var inputField5 = this.byId("TxtDmCLicen");
			var inputField6 = this.byId("TxtIdConductor");
			var inputField7 = this.byId("TxtIdCondDesc");

			inputField1.setValue("");
			inputField2.setValue("");
			inputField3.setValue("");
			inputField4.setValue("");
			inputField5.setValue("");
			inputField6.setValue("");
			inputField7.setValue("");

		},
		clearVariablesTP_BP: function () {

			var inputField2 = this.byId("TxtDmRazon");
			var inputField3 = this.byId("TxtDmRuc");
			var inputField4 = this.byId("TxtDmMtc");
			var inputField5 = this.byId("TxtIdConductor");
			var inputField6 = this.byId("TxtIdCondDesc");
			var inputField7 = this.byId("TxtDmCName");
			var inputField8 = this.byId("TxtDmCRuc");
			var inputField9 = this.byId("TxtDmCDni");
			var inputField10 = this.byId("TxtDmCPlaca");
			var inputField11 = this.byId("TxtDmCLicen");
			var Check = this.getView().byId("CheckConduct");

			inputField2.setValue("");
			inputField3.setValue("");
			inputField4.setValue("");
			inputField5.setValue("");
			inputField6.setValue("");
			inputField7.setValue("");
			inputField8.setValue("");
			inputField9.setValue("");
			inputField10.setValue("");
			Check.setSelected(false);
		},

		onRouteMatched: function (oEvent) {
			this.sRouteName = oEvent.getParameters();
			try {

				var Tabini = this.getView().byId("idIconTabBarNoIcons");
				Tabini.setSelectedKey("info");
				//
				this._viewMain = this.getView();

				//Inicializar checkBox del primer Tab
				var idCheckClienteSolic = this.getView().byId("CheckClienteSolic");
				this.ChkClienteSolicVerif(idCheckClienteSolic.getSelected());

				//Inicializar el Modelo Detail
				/*
				var detailProduct = this.getView().getModel("jsonDetail");
				this.getView().byId("DetalleEntreg").setModel(detailProduct);
				this.getView().byId("DetalleEntreg").getModel().refresh(true);*/

				var detailProduct = this.getView().getModel("detailProducts")
				detailProduct.setProperty("/Detail", []);
				detailProduct.setData({
					Detail: []
				});
				detailProduct.refresh();

				this.performInitFecha();

			} catch (e) {
				console.log("Error-Route");
				console.log(e);
			}
		},
		//Validar campos de la cabecera
		Validar_fields: function (Odata) {

			var lv_flag_field_empty = false;

			var Id_fecha = this.getView().byId("TxtDateEntrega")
			var MotivoTras = this.getView().byId("TxtMotivTras");

			//Validar Fecha
			if (Odata.DateTraslado) {
				Id_fecha.setValueState(sap.ui.core.ValueState.None);
			} else {
				Id_fecha.setValueStateText(this.oView.getModel("i18n").getResourceBundle().getText("ValidFecha2"));
				Id_fecha.setValueState(sap.ui.core.ValueState.Error);
				MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("ValidFecha2"));
				return false;
			}
			//Validar Motivo de Pedido
			if (Odata.MotivoTraslado) {
				MotivoTras.setValueState(sap.ui.core.ValueState.None);
			} else {
				MotivoTras.setValueStateText(this.oView.getModel("i18n").getResourceBundle().getText("ValidMotivo"));
				MotivoTras.setValueState(sap.ui.core.ValueState.Error);
				return false;
			}

			//Validar Centro
			if (Odata.Centro) {
				//Ok	
			} else {
				MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("ValidWerks"));
				return false;
			}

			//Validar Destinatario
			if (Odata.Kunwe) {
				//ok
			} else {
				MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("ValidKunwe"));
				return false;
			}

			//Validar datos de Transportista o Privado
			if (this.getView().byId("Rbopt1").getSelected()) {
				if (this.getView().byId("CheckTrans").getSelected() === false && this.getView().byId("TxtTransport").getValue("value") === "") {
					MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("ValidTransPub1"));
					return false;
				} else {
					if ((this.getView().byId("TxtDmRazon").getValue("value") === "" ||
							this.getView().byId("TxtDmRuc").getValue("value") === "" ||
							this.getView().byId("TxtDmMtc").getValue("value") === "") && this.getView().byId("CheckTrans").getSelected() === true) {
						MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("ValidTransPub2"));
						return false;
					}
				}
			}
			//Opción Privado
			if (this.getView().byId("Rbopt2").getSelected()) {
				if (this.getView().byId("CheckConduct").getSelected() === false && this.getView().byId("TxtIdConductor").getValue("value") === "") {
					MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("ValidTransPri1"));
					return false;
				} else {
					if ((this.getView().byId("TxtDmCName").getValue("value") === "" ||
							this.getView().byId("TxtDmCApell").getValue("value") === "" ||
							this.getView().byId("TxtDmCDni").getValue("value") === "" ||
							this.getView().byId("TxtDmCPlaca").getValue("value") === "") && this.getView().byId("CheckConduct").getSelected() === true) {
						MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("ValidTransPri2"));
						return false;
					}
				}
			}
			//Validar Peso Total y Unidad de Medida
			if (this.getView().byId("TxtPesoTot").getValue("value") === "" || this.getView().byId("TxtPesoTot").getValue("value") === undefined) {
				MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("ValidPesoTotal"));
				return false;
			}
			if (this.getView().byId("TxtUnidMed").getSelectedKey() === "" || this.getView().byId("TxtUnidMed").getSelectedKey() === undefined) {
				MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("ValidUnidMed"));
				return false;
			}

			//Validar Motivo 02
			if (this.getView().byId("TxtMotivTras").getValue("value") === "02" || this.getView().byId("TxtMotivTras").getValue("value") ===
				"07") {
				if (this.getView().byId("TxtProveed").getValue("value") === "") {
					MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("Valid04Prov"));
					return false;
				}
			}

			//Validar Motivo 04
			if (this.getView().byId("TxtMotivTras").getValue("value") === "04" && this.getView().byId("TxtCentroDest").getValue("value") === "") {
				MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("Valid04Wdest"));
				return false;
			}

			//Validar Detalle
			var oTableitems = this.getView().byId("DetalleEntreg").getItems();
			if (oTableitems.length === 0) {
				MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("ValidDetalle2"));
				return false;
			}
			for (var i = 0, len = oTableitems.length; i < len; i++) {

				//Campos vacíos:
				var lv_desc = this.getView().byId("DetalleEntreg").getItems()[i].getCells()[1].mProperties.value;
				var lv_cant = this.getView().byId("DetalleEntreg").getItems()[i].getCells()[3].mProperties.value;
				var lv_um = this.getView().byId("DetalleEntreg").getItems()[i].getCells()[4].mProperties.value;

				if (lv_cant === "" || lv_cant === 0 || lv_cant === null || lv_cant === undefined) {
					lv_flag_field_empty = true;
					break;
				} else if (lv_um === "" || lv_um === 0 || lv_um === null || lv_um === undefined) {
					lv_flag_field_empty = true;
					break;
				} else if (lv_desc === "" || lv_desc === 0 || lv_desc === null || lv_desc === undefined) {
					lv_flag_field_empty = true;
					break;
				}
			}

			if (lv_flag_field_empty) {
				MessageBox.error(this.oView.getModel("i18n").getResourceBundle().getText("ValidDetalle"));
				return false;
			}

			return true;
		},
		clearFieldsProveedor: function (motivo) {

			var newinput16 = this.getView().byId("TxtProveed");
			var newinput17 = this.getView().byId("TxtProveedDesc");
			var newinput18 = this.getView().byId("TxtPuntoPart");
			var newinput19 = this.getView().byId("TxtPuntoLleg");

			newinput16.setValue("");
			newinput17.setValue("");
			newinput18.setValue("");
			newinput19.setValue("");

		},
		changeTextsLabelPtfin: function (motivo) {
			if (motivo === "02" || motivo === "07") {
				this.motivo4ChangeFields(false);
				this.clearFieldsProveedor();

				this.getView().byId("LblPuntoPart").setText(this.oView.getModel("i18n").getResourceBundle().getText("TxtPuntoPart2"));
				this.getView().byId("LblPuntoLleg").setText(this.oView.getModel("i18n").getResourceBundle().getText("TxtPuntoLlegada3"));
				this.getView().byId("FieldProveed").setVisible(true);

				if (this.getView().byId("TxtCentro").getValue("value")) {

					var puntoPart2 = this.getView().byId("TxtCAlmacen").getValue("value"); //Almacén
					if (puntoPart2 !== "") {
						var dataText = puntoPart2.split("-");
						var textAlmac = dataText[0];
						var convertPuntpart = textAlmac.trim();
						this.ReadOdataParameterTexts("AlmacenSet", "Werks", this.getView().byId("TxtCentro").getValue("value"), convertPuntpart, "Lgort",
							"DirecTransp");
					}
					//Autocompletar Cliente Destinatario
					let id_kunnr = "C" + this.getView().byId("TxtCentro").getValue("value");
					this.getView().byId("TxtDesMcia").setValue(id_kunnr);
					this.ReadOdataParameterTexts("DestinatarioSet", "Kunnr", id_kunnr, "", "", "DestMerc");
				}
			
			} else if (motivo === "04") {
				this.motivo4ChangeFields(true);
			} else {

				this.clearFieldsProveedor();
				this.getView().byId("LblPuntoPart").setText(this.oView.getModel("i18n").getResourceBundle().getText("TxtPuntoPart"));
				this.getView().byId("LblPuntoLleg").setText(this.oView.getModel("i18n").getResourceBundle().getText("TxtPuntoLlegada"));
				this.getView().byId("FieldProveed").setVisible(false);
				this.motivo4ChangeFields(false);

				if (this.getView().byId("TxtCentro").getValue("value")) {

					var puntoPart = this.getView().byId("TxtCAlmacen").getValue("value"); //Almacén
					if (puntoPart !== "") {
						var dataText = puntoPart.split("-");
						var textAlmac = dataText[0];
						var convertPuntpart = textAlmac.trim();
						this.ReadOdataParameterTexts("AlmacenSet", "Werks", this.getView().byId("TxtCentro").getValue("value"), convertPuntpart, "Lgort",
							"DirecAlmac");
					}
				}
				var Destina = this.getView().byId("TxtDesMcia").getValue("value");
				if (Destina !== "") {
					this.ReadOdataParameterTexts("DestinatarioSet", "Kunnr", Destina, "", "", "DirecTransp");
				}

			}

		},
		clearProductoManul: function (oEvent) {
			try {
				//Actualizar la fila con el registro
				var oRow = oEvent.getSource().getParent();
				var aCells = oRow.getCells();
				aCells[1].setValue(""); //Descripción
				aCells[2].setValue(""); //Código de Sunat
				aCells[4].setValue("");

				aCells[1].setEditable(true);
				aCells[2].setEditable(true); //Código de Sunat

			} catch (e) {
				console.log(e);
			}

		},
		onLiveChangeProductDesc: function (oEvent) {
			//Actualizar la fila con el registro
			var oRow = oEvent.getSource().getParent();
			var aCells = oRow.getCells();
			if (!aCells[2].getValue()) {
				aCells[2].setValueStateText(this.oView.getModel("i18n").getResourceBundle().getText("ValidDetCsunat"));
				aCells[2].setValueState(sap.ui.core.ValueState.Error); //+
			}
			if (!aCells[3].getValue()) {
				aCells[3].setValueStateText(this.oView.getModel("i18n").getResourceBundle().getText("ValidCantidad"));
				aCells[3].setValueState(sap.ui.core.ValueState.Error); //+
			}
			if (!aCells[4].getValue()) {
				aCells[4].setValueStateText(this.oView.getModel("i18n").getResourceBundle().getText("ValidUM"));
				aCells[4].setValueState(sap.ui.core.ValueState.Error); //+
			}

		},
		onLiveChangeProduct: function (oEvent) {
			this.clearProductoManul(oEvent);
		},
		onChangeCodSunat: function (oEvent) {
			var oRow = oEvent.getSource().getParent();
			var aCells = oRow.getCells();
			if (oEvent.getParameters("value").value) {
				aCells[2].setValueState(sap.ui.core.ValueState.None); //+
			} else {
				aCells[2].setValueStateText(this.oView.getModel("i18n").getResourceBundle().getText("ValidDetCsunat"));
				aCells[2].setValueState(sap.ui.core.ValueState.Error); //+	
			}

		},
		onChangeUmDet: function (oEvent) {
			var oRow = oEvent.getSource().getParent();
			var aCells = oRow.getCells();
			if (oEvent.getParameters("value").value) {
				aCells[4].setValueState(sap.ui.core.ValueState.None); //+
			} else {
				aCells[4].setValueStateText(this.oView.getModel("i18n").getResourceBundle().getText("ValidDetCsunat"));
				aCells[4].setValueState(sap.ui.core.ValueState.Error); //+	
			}
		},
		onChangeParseDec: function (oEvent) {
			var result = parseFloat(oEvent.getParameters("value").value).toFixed(3);
			try {
				this.byId(oEvent.mParameters.id).setValue(result);

				//Validar Decimales
				if (this.validateDecimal(result)) {
					this.byId(oEvent.mParameters.id).setValueState(sap.ui.core.ValueState.None);
				} else {
					this.byId(oEvent.mParameters.id).setValueState(sap.ui.core.ValueState.Error);
				}

			} catch (err) {}
		},
		validateDecimal: function (valor) {
			try {
				var RE = /^\d*\.?\d*$/;
				if (RE.test(valor)) {
					return true;
				} else {
					return false;
				}
			} catch (err) {}
		},
		onChangeProduct: function (oEvent) {

		},
		onChangeInputQuantity: function (oEvent) {
			try {
				var result = parseFloat(oEvent.getParameters("value").value).toFixed(3);
				//sap.ui.getCore().byId("TxtQuantityDet").setValue(result);

				//Actualizar la fila con el registro
				var oRow = oEvent.getSource().getParent();
				var aCells = oRow.getCells();

				aCells[3].setValue(result);
				aCells[3].setValueState(sap.ui.core.ValueState.None); //+

				//Validar Decimales
				if (this.validateDecimal(result)) {
					aCells[3].setValueState(sap.ui.core.ValueState.None); //+
				} else {
					aCells[3].setValueState(sap.ui.core.ValueState.Error);
				}

			} catch (e) {
				console.log(e);
			}
		},
		onChangePesoTot: function (oEvent) {
			try {
				var result = parseFloat(oEvent.getParameters("value").value).toFixed(3);
				this.byId("TxtPesoTot").setValue(result);
				//sap.ui.getCore().byId("TxtPesoTot").setValue(result);
				if (this.validateDecimal(result)) {
					this.byId("TxtPesoTot").setValueState(sap.ui.core.ValueState.None);
				} else {
					this.byId("TxtPesoTot").setValueState(sap.ui.core.ValueState.Error);
				}
			} catch (e) {
				console.log(e);
			}

		},
		onChangeMotiv: function (oEvent) {
			if (this.byId("TxtMotivTras").getValue()) {
				this.byId("TxtMotivTras").setValueState(sap.ui.core.ValueState.None);
				this.changeTextsLabelPtfin();
				this.hiddenCheckClient(); //++
				this.infoTrasladoMotivo(); //++

			} else {
				this.byId("TxtMotivTras").setValueState(sap.ui.core.ValueState.Error);
			}
		},
		onCancelar: function (oEvent) {
			MessageBox.confirm(this.oView.getModel("i18n").getResourceBundle().getText("TitleCancel"), {
				onClose: function (sAction) {
					if (sAction === MessageBox.Action.OK) {
						this.onNavBack();
					}
				}.bind(this)
			});

		},
		onChangeCheckLength3: function (oEvent) {
			try {
				if (oEvent.getSource().getValue().length > 3) {
					oEvent.getSource().setValue(oEvent.getSource().getValue().slice(0, -1))
				}
			} catch (err) {}
		},
		hiddenCheckClient: function (oEvent) {
			try {
				if (this.getView().byId("TxtMotivTras").getValue("value") === "03") {
					this.getView().byId("CheckClienteSolic").setVisible(true);
				} else {
					this.getView().byId("CheckClienteSolic").setVisible(false);
				}
			} catch (err) {}
		},
		motivo4ChangeFields: function (clear) {

			let txtDesMci = this.byId("TxtDesMcia");
			let txtDesMciDes = this.byId("TxtDesMciaDesc");

			if (!clear) {
				txtDesMci.setEditable(true);
				if (txtDesMci.getValue()) {
					txtDesMci.setValue("");
					txtDesMciDes.setValue("");
				}
				this.getView().byId("formElementWdest").setVisible(false);

				this.getView().byId("TxtCentroDest").setValue("");
				this.getView().byId("TxtCAlmacenDest").setValue("");
				this.getView().byId("TxtPuntoLleg").setValue("");

			} else {

				this.clearFieldsProveedor();
				txtDesMci.setValue("");
				txtDesMciDes.setValue("");
				
				this.getView().byId("TxtCentro").setValue("");
				this.getView().byId("TxtCAlmacen").setValue("");
				
				//
				this.getView().byId("FieldProveed").setVisible(false);
				this.getView().byId("formElementWdest").setVisible(true); //Add
				txtDesMci.setEditable(false);
				this.getView().byId("LblPuntoPart").setText(this.oView.getModel("i18n").getResourceBundle().getText("TxtPuntoPart"));
				this.getView().byId("LblPuntoLleg").setText(this.oView.getModel("i18n").getResourceBundle().getText("TxtPuntoLlegada4"));
			}

		},

		//Salir
		onNavBack: function () {
			this.clear_form(); //Clear
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("RouteApp", {}, true);
			}
		},

		ClearModeloDetail: function () {
			//Limpiar el Modelo
			var detailProduct = this.getView().getModel("jsonDetail");
			detailProduct.setData({
				Detail: []
			});
			detailProduct.setProperty("/Detail", []);
			detailProduct.refresh();
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
							if (newField === "DirecAlmac") {
								this._viewMain.byId("TxtPuntoPart").setValue(data.Direccion);
							} else if (newField === "DirecTransp") {
								this._viewMain.byId("TxtPuntoLleg").setValue(data.Direccion);
							} else if (newField === "DestMerc") {
								this._viewMain.byId("TxtDesMciaDesc").setValue(data.Name1 + " " + data.Name2);
							}
						}.bind(this),
						// @ts-ignore
						error: function (data) {
							console.log("Error Parameter Texts");
							console.log(data);
						}
					});

				} catch (err) {}
			}
		},
		setValuesnewcampos: function (inputJson) {
			if (this.getView().byId("TxtProveed").getValue("value")) {
				inputJson.Proveedor = this.getView().byId("TxtProveed").getValue("value");
			}
			//Grupo Peso
			if (this.getView().byId("TxtTotTara").getValue("value")) {
				inputJson.TotalTara = this.getView().byId("TxtTotTara").getValue("value");
			}
			if (this.getView().byId("TxtPesoNet").getValue("value")) {
				inputJson.PesoNeto = this.getView().byId("TxtPesoNet").getValue("value");
			}
			if (this.getView().byId("TxtPesoBru").getValue("value")) {
				inputJson.PesoBruto = this.getView().byId("TxtPesoBru").getValue("value");
			}
			if (this.getView().byId("TxtPesoPro").getValue("value")) {
				inputJson.PesoPromedio = this.getView().byId("TxtPesoPro").getValue("value");
			}
			//Grupo Cantidades
			if (this.getView().byId("TxtNjcb").getValue("value")) {
				inputJson.NroJabas = this.getView().byId("TxtNjcb").getValue("value");
			}
			if (this.getView().byId("TxtNp").getValue("value")) {
				inputJson.NroPollos = this.getView().byId("TxtNp").getValue("value");
			}
			if (this.getView().byId("TxtNpjab").getValue("value")) {
				inputJson.NroPollosJaba = this.getView().byId("TxtNpjab").getValue("value");
			}

			if (this.getView().byId("TxtNPrecinto").getValue("value")) {
				inputJson.NroPrecinto = this.getView().byId("TxtNPrecinto").getValue("value");
			}

			//Grupo Granja
			if (this.getView().byId("TxtNgranja").getValue("value")) {
				inputJson.NombreGranja = this.getView().byId("TxtNgranja").getValue("value");
			}
			if (this.getView().byId("TxtNGalon").getValue("value")) {
				inputJson.NroGalpon = this.getView().byId("TxtNGalon").getValue("value");
			}
			if (this.getView().byId("TxtNPedido").getValue("value")) {
				inputJson.NroPedido = this.getView().byId("TxtNPedido").getValue("value");
			}

			//Campos del Motivo 04
			if (this.getView().byId("TxtCentroDest").getValue("value")) {
				inputJson.CentroDestino = this.getView().byId("TxtCentroDest").getValue("value");
			}

			if (this.getView().byId("TxtCAlmacenDest").getValue("value")) {
				let dataText = this.getView().byId("TxtCAlmacenDest").getValue("value").split("-");
				inputJson.AlmacenDestino = dataText[0];

				let almacenDest = inputJson.AlmacenDestino.trim();
				inputJson.AlmacenDestino = almacenDest;
			}

			return inputJson;
		},
		infoTrasladoMotivo: function () {

			let flagRev = this.getView().byId("FlgRev");
			let flagRvv = this.getView().byId("FlgRvv");
			let flagTrp = this.getView().byId("FlgTrp");
			let flagDevc = this.getView().byId("FlgDevc");

			if (this.getView().byId("TxtMotivTras").getValue("value")) {

				flagRev.setSelected(false);
				flagRvv.setSelected(false);
				flagTrp.setSelected(false);
				flagDevc.setSelected(false);

				if (this.getView().byId("TxtMotivTras").getValue("value") === '13') {
					this.getView().byId("FlgRev").setVisible(true);
					this.getView().byId("FlgRvv").setVisible(true);
					this.getView().byId("FlgTrp").setVisible(true);
					this.getView().byId("FlgDevc").setVisible(true);

				} else {
					this.getView().byId("FlgRev").setVisible(true);
					this.getView().byId("FlgRvv").setVisible(true);
					this.getView().byId("FlgTrp").setVisible(true);
					this.getView().byId("FlgDevc").setVisible(false);
				}
			}
		},
		onSelectDevc: function (oEvent) {

			if (this.getView().byId("TxtMotivTras").getValue("value") === '13') {
				if (oEvent.mParameters.selected) {
					this.setFieldsMotivo13(true);
				} else {
					this.setFieldsMotivo13(false);
				}
			}
		},
		setFieldsMotivo13: function (execute) {

			let puntoLlegValue = this.getView().byId("TxtPuntoLleg").getValue("value");
			let puntoPartValue = this.getView().byId("TxtPuntoPart").getValue("value");

			if (execute) {
				this.getView().byId("LblPuntoPart").setText(this.oView.getModel("i18n").getResourceBundle().getText("TxtPuntoPartM13"));
				this.getView().byId("LblPuntoLleg").setText(this.oView.getModel("i18n").getResourceBundle().getText("TxtPuntoLlegadaM13"));

				if (puntoLlegValue) {
					this.getView().byId("TxtPuntoPart").setValue(puntoLlegValue);
				}

				if (puntoPartValue) {
					this.getView().byId("TxtPuntoLleg").setValue(puntoPartValue);
				}

			} else {

				this.getView().byId("TxtPuntoPart").setValue("");
				this.getView().byId("TxtPuntoLleg").setValue("");
				this.getView().byId("TxtCentro").setValue("");
				this.getView().byId("TxtCAlmacen").setValue("");
				this.getView().byId("TxtDesMcia").setValue("");
				this.getView().byId("TxtDesMciaDesc").setValue("");

				this.getView().byId("LblPuntoPart").setText(this.oView.getModel("i18n").getResourceBundle().getText("TxtPuntoPart"));
				this.getView().byId("LblPuntoLleg").setText(this.oView.getModel("i18n").getResourceBundle().getText("TxtPuntoLlegada"));
			}

		}

	});
});