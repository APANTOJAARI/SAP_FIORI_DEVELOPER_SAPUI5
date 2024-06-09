sap.ui.define(["sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/DialogType",
    "sap/m/Button",
    "sap/m/ButtonType",
    "sap/m/Text",
    "sap/m/MessageToast",
    "sap/ui/core/library",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/History",
    "sap/ui/core/format/DateFormat"],

    function (Controller, UIComponent, MessageBox, Dialog, DialogType, Button, ButtonType, Text, MessageToast, CoreLibrary, Filter, FilterOperator, History, DateFormat) {

        "use strict";
        return Controller.extend("centria.net.fisbactivos.controller.BaseController", {
            getRouter: function () {
                return UIComponent.getRouterFor(this)
            },
            getAppModel: function (e) {
                return this.getOwnerComponent().getModel(e)
            },
            setAppModel: function (e, t) {
                return this.getOwnerComponent().setModel(e, t || "")
            },
            getViewModel: function (e) {
                return this.getView().getModel(e || "")
            },
            setRouterNavTo: function (router) {
                let oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo(router, true);
            },
            clearModelItemDetailAdd: function () {
                let modelItemAdd = this.getView().getModel("detailProdAdd");
                if (modelItemAdd) {
                    modelItemAdd.setProperty("/Detail", {});
                    modelItemAdd.setData({ Detail: {} });
                    modelItemAdd.updateBindings(true);
                    modelItemAdd.refresh();
                }
            },
            clearModelSolicBaja: function () {
                let modelMainSolBaj = this.getView().getModel("solicBajaMain");
                if (modelMainSolBaj) {
                    modelMainSolBaj.setProperty("/SolicBaja", {});
                    modelMainSolBaj.setData
                        ({
                            SolicBaja: {
                                DetailSolBajaSet: [],
                                AdjuntoSolBajaSet: [],
                                MessageSolBajaSet: []
                            }
                        });

                    modelMainSolBaj.updateBindings(true);
                    modelMainSolBaj.refresh();
                }
                this.clearModelStatusAproba();//+
            },
            clearModelStatusBtn: function () {
                let statusBtn = this.getViewModel("statusForm");
                if (statusBtn) {
                    statusBtn.setProperty("/Status", {});
                    statusBtn.updateBindings(true);
                    statusBtn.refresh();
                }
            },
            clearModelStatusAproba: function () {
                let statusAprob = this.getViewModel("statSolBaj");
                if (statusAprob) {
                    statusAprob.setProperty("/Status", []);
                    statusAprob.setData({ Status: [] });
                    statusAprob.updateBindings(true);
                    statusAprob.refresh();
                }

            },
            clearModelAuthorization: function () {
                let statusAuth = this.getViewModel("authSolBaj");
                if (statusAuth) {
                    statusAuth.setProperty("/AuthorizationSet", {});
                    statusAuth.updateBindings(true);
                    statusAuth.refresh();
                }
            },
            clear_ModelLogAux: function () {
                let oModelLog = this.getView().getModel("logSolBaj");
                if (oModelLog) {
                    oModelLog.setProperty("/Log", []);
                    oModelLog.setData({ Log: [] });
                    oModelLog.updateBindings(true);
                    oModelLog.refresh();
                }
            },
            getById: function (idName) {
                let idObject = this.byId(idName);
                if (!idObject) {
                    idObject = sap.ui.getCore().byId(idName)
                }
                return idObject
            },
            setViewModel: function (e, t) {
                return this.getView().setModel(e, t || "")
            },
            getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle()
            },
            onSuccessMessageDialogPress: function (titulo, mensaje, navTo, routeApp) {
                if (!this.oSuccessMessageDialog) {
                    this.oSuccessMessageDialog = new Dialog({
                        type: DialogType.Message,
                        title: titulo,
                        state: CoreLibrary.ValueState.Success,
                        content: new Text({ text: mensaje }),
                        beginButton: new Button({
                            type: ButtonType.Emphasized,
                            text: "OK",
                            press: function () {
                                this.oSuccessMessageDialog.close();
                                this.oSuccessMessageDialog = null;
                                if (navTo) {
                                    this.setRouterNavTo(routeApp);
                                }
                            }.bind(this)
                        })
                    });
                }
                this.oSuccessMessageDialog.open();
            },

            onMessageDialogPress: function (titulo, mensaje, type, navTo, routeApp, exit) {
                if (!this.oMessageDialog) {
                    this.oMessageDialog = new Dialog({
                        type: DialogType.Message,
                        title: titulo,
                        state: type,
                        content: new Text({ text: mensaje }),
                        beginButton: new Button({
                            type: ButtonType.Emphasized,
                            text: "OK",
                            press: function () {
                                this.oMessageDialog.close();
                                this.oMessageDialog = null;
                                if (navTo && exit) {
                                    this.onPressExit("RouteApp");
                                } else if (navTo && !exit) {
                                    this.setRouterNavTo(routeApp);
                                }

                            }.bind(this)
                        })
                    });
                }
                this.oMessageDialog.open();
            },
            onPressExitBack: function () {
                let mensaje = this.getResourceBundle().getText("TitleCancel");
                let title = this.getResourceBundle().getText("TitleViewMain");

                this.onMessageDialogPress(title, mensaje, CoreLibrary.ValueState.Information, true, "RouteApp", true);

            },
            deleteItemTable: function (idTable, oModel) {
                let indice = [];
                let modelI18n = this.getResourceBundle();
                let oTable = this.getView().byId(idTable);
                let detailIvent = this.getView().getModel(oModel).getData();
                let selectedRowData = oTable.getSelectedContexts();
                let SelectedRowData2 = oTable.getSelectedItems();

                if (selectedRowData.length === 0) {
                    MessageBox.information(modelI18n.getText("deleteSelec"));
                    return;
                } else {
                    //Obtener los registros iniciales
                    for (let i = 0; i < SelectedRowData2.length; i++) {
                        let oThisObj = selectedRowData[i].getObject();
                        indice.push({ oThisObj });
                    }

                    //Eliminar registro seleccionado
                    for (let i = 0, len = indice.length; i < len; i++) {
                        let oThisObj = indice[i].oThisObj
                        let index = $.map(detailIvent.SolicBaja.DetailSolBajaSet, function (obj2, index) {
                            if (obj2 === oThisObj) {
                                return index;
                            }
                        });
                        if (index) {
                            detailIvent.SolicBaja.DetailSolBajaSet.splice(index, 1);
                        }
                    }

                    this.getView().getModel(oModel).setData(detailIvent);
                    this.getView().getModel(oModel).refresh()
                    this.removeItemSelections(idTable);

                }
            },
            removeItemSelections: function (idTable) {
                let oTable = this.getView().byId(idTable);
                if (oTable) {
                    oTable.removeSelections();
                }
            },

            //***Match Codes:
            onValueHelpRespBaj: function () {
                if (!this._oDialogRespon) {
                    this._oDialogRespon = sap.ui.xmlfragment("centria.net.fisbactivos.view.dialog.PopupResponsables", this);
                    this.getView().addDependent(this._oDialogRespon);
                }
                this._oDialogRespon.open();
            },
            onHandleSelectResp: function (oEvent) {
                this._F4SetResultSelected(oEvent, "solicBajaMain", "Respon");
            },
            onHandleSearchResp: function (oEvent) {
                this._searchPopupDialog(oEvent, "Name1Text");
            },
            onHandleClosePopup: function () {
                if (this._oDialogRespon) {
                    this._oDialogRespon.destroy();
                    this._oDialogRespon = null;
                }

                if (this._oDialogActiv) {
                    this._oDialogActiv.destroy();
                    this._oDialogActiv = null
                }

                this._oDialogRespon = null;
                this._oDialogActiv = null;
            },
            /**
             * Esta Función muestra el Popup de Inventario
             */
            onValueHelpIdIvent: function () {
                if (!this._oDialogActiv) {
                    this._oDialogActiv = sap.ui.xmlfragment("centria.net.fisbactivos.view.dialog.PopupActivos", this);
                    this.getView().addDependent(this._oDialogActiv);
                }

                let modelMain = this.getView().getModel();
                let idTableActiv = this.getById("DialogClientActiv");
                if (idTableActiv) {
                    idTableActiv.setModel(modelMain);
                }
                this._oDialogActiv.open();

            },
            onHandleSelectActiv: function (oEvent) {
                this._F4SetResultSelected(oEvent, "detailProdAdd", "Activ");
            },
            onHandleSearchActiv: function (oEvent) {
                this._searchPopupDialog(oEvent, "Txt50");
            },
            onPressDialogCancel: function () {
                this._oDialog.close();
                this.clearModelItemDetailAdd();
            },
            onHandleCloseHpActivos: function () {
                if (this._oDialogActiv) {
                    this._oDialogActiv.destroy();
                }
                this._oDialogActiv = null;
            },
            /**
             * Esta función invoca Button "Crear nueva entrada"
             */
            openDialogAddItem: function () {
                let oModelMain = this.getView().getModel();
                let oModelAuth = this.getView().getModel("AuthSolBaj");

                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment("centria.net.fisbactivos.view.dialog.DetailItemSolBaj", this);
                    this.getView().addDependent(this._oDialog);
                }
                let modelItemAdd = this.getView().getModel("detailProdAdd");
                let idFormItemAdd = sap.ui.getCore().byId("FormDetailItem");//this.getById("FormDetailItem");
                if (idFormItemAdd) {
                    //idFormItemAdd.setModel(modelItemAdd);
                    idFormItemAdd.setModel(oModelMain);//+
                    //idFormItemAdd.setModel(oModelAuth);//+
                }
                //Actualizar Textos
                if (this._flagEditItem) {
                    this._setTextBtnEditItem();
                    this.activeFieldTipBaja();//+
                } else {
                    this._setTextBtnAddItem();
                }
                //this._oDialog.update();//+
                this._oDialog.open();
            },
            /**
             *  Esta función invoca Button "Añadir" del dialogo "DetailItemSolBaj.fragment"
             */
            onPressDialogAddItem: function () {
                let oModelAux = this.getViewModel("detailProdAdd");
                let oModeloMain = this.getViewModel("solicBajaMain");

                //Validar los campos obligatorios.
                if (this.checkFormLog) {
                    let validOK = this.checkFormLog.checkFieldsDetailItem(oModelAux, this.getResourceBundle());
                    if (!validOK) {
                        return;
                    }
                }
                //Agregar los datos
                if (this.detailItemLogic) {
                    this.detailItemLogic.addItemDialogModel(oModelAux, oModeloMain, true, this._flagEditItem, this.getView());
                }
                this.clearModelItemDetailAdd();
                this._oDialog.close();
                this.removeItemSelections("DetailSolBaj");//+add

                //Refrescar datos
                oModeloMain.updateBindings(true);
                oModeloMain.refresh();
            },
            onPressDialogModifItem: function () {

            },
            openDialogModifItem: function (idTable, oModel) {
                let oModelAux = this.getViewModel("detailProdAdd");
                let indice = [];
                let modelI18n = this.getResourceBundle();
                let oTable = this.getView().byId(idTable);
                let selectedRowData = oTable.getSelectedContexts();
                let SelectedRowData2 = oTable.getSelectedItems();

                if (selectedRowData.length === 0) {
                    MessageBox.information(modelI18n.getText("modifSelec"));
                    return;
                } else if (selectedRowData.length > 1) {
                    MessageBox.information(modelI18n.getText("modifSelecItems"));
                    return;
                } else {
                    //Obtener el resgistro Seleccionado
                    for (let i = 0; i < SelectedRowData2.length; i++) {
                        let itemSelec = selectedRowData[i].getObject();
                        indice.push({ itemSelec });
                    }
                    if (indice) {
                        this.detailItemLogic.setItemModifSelected(indice[0].itemSelec, oModelAux);
                        this._flagEditItem = true;
                        this.openDialogAddItem();
                    }
                }

            },
            _setTextBtnEditItem: function () {
                sap.ui.getCore().byId("btnItemAdd").setText(this.getResourceBundle().getText("ModifItem"));
                sap.ui.getCore().byId("btnItemAdd").setIcon("sap-icon://edit");
                sap.ui.getCore().byId("FormDetailItem").setTitle(this.getResourceBundle().getText("titleModifItem"));

            },
            _setTextBtnAddItem: function () {
                sap.ui.getCore().byId("btnItemAdd").setText(this.getResourceBundle().getText("addItem"));
                sap.ui.getCore().byId("btnItemAdd").setIcon("sap-icon://add");
                sap.ui.getCore().byId("FormDetailItem").setTitle(this.getResourceBundle().getText("titleAddItem"));
            },
            /**
             * Esta función se activa al cerrar el Diálogo.- "DetailItemSolBaj.fragment"
             */
            onDialogAftercloseDetailItem: function () {
                sap.ui.getCore().getElementById('DialogDetailItem').destroy();
                if (this._oDialog.destroy) {
                    this._oDialog.destroy();
                }
                this._oDialog = null;
                this._flagEditItem = null;
            },
            onPressExit: function (Route) {
                //Clear Variables
                this._ClearAllObjects();

                //Back
                let oHistory = History.getInstance();
                let sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    this.setRouterNavTo(Route);
                }
            },
            messageConfirm: function (text) {
                return new Promise(function (resolve, reject) {
                    sap.m.MessageBox.confirm(
                        text, {
                        onClose: function (oAction) {
                            if (oAction === sap.m.MessageBox.Action.OK) {
                                resolve(true);
                            }
                            else {
                                resolve(false);
                            }
                        }
                    }
                    );
                });
            },
            _ClearAllObjects: function () {
                this.clearModelSolicBaja();
                this.clearModelItemDetailAdd();
                this.clearModelStatusBtn();
                this._clearTextInputs();
                this.clearModelStatusAproba();//+
            },
            _clearTextInputs: function () {

                let respBaja = this.byId("TxtRespBaja");
                if (respBaja) {
                    respBaja.setDescription("");
                }
            },
            _F4SetResultSelected: function (oEvent, oModelInput, field) {
                let oModel = this.getViewModel(oModelInput);
                // reset the filter
                let oBinding = oEvent.getSource().getBinding("items");
                oBinding.filter([]);

                //Traer el objeto Press Item o Click
                const aContexts = oEvent.getParameter("selectedContexts")

                if (aContexts && aContexts.length) {
                    // SET INPUT TEXT VALUE //
                    switch (field) {
                        case "Respon":
                            if (oModel.getData()) {
                                oModel.getData().SolicBaja.RespBaja = aContexts[0].getObject().Partner;
                                this.byId("TxtRespBaja").setDescription(aContexts[0].getObject().Name1Text);
                            }
                            break;
                        case "Activ":
                            oModel.setProperty("/Detail/NumIvent", aContexts[0].getObject().Invnr);
                            oModel.setProperty("/Detail/DesInvent", aContexts[0].getObject().Txt50);
                            oModel.setProperty("/Detail/SerInvent", aContexts[0].getObject().SerInvent);
                            oModel.setProperty("/Detail/CodActfijo", aContexts[0].getObject().Anln1);
                            oModel.setProperty("/Detail/CecoAct", aContexts[0].getObject().Kostl);
                            //let valorNeto = parseFloat(aContexts[0].getObject().ValorNeto);
                            //if (valorNeto) {
                            //    oModel.setProperty("/Detail/ValorNeto", aContexts[0].getObject().ValorNeto);
                            //}

                            //Obtener el Precio Neto
                            this.getPriceNeto(oModel,aContexts[0].getObject().Anln1,aContexts[0].getObject().Anln2);

                            break;
                        default:
                            break;
                    }
                    oModel.updateBindings(true);
                    oModel.refresh();
                }
                //Destruir el dialogo
                this.onHandleClosePopup();
            },
            _searchPopupDialog: function (oEvent, field) {
                let sValue = oEvent.getParameter("value");
                let cadena = String(sValue)
                let valueLower = cadena.toLowerCase();
                let valueUpper = cadena.toUpperCase();

                let oFilter = new Filter({
                    filters: [new Filter(field, FilterOperator.Contains, sValue),
                              new Filter(field, FilterOperator.Contains, valueLower),
                              new Filter(field, FilterOperator.Contains, valueUpper)]
                });

                let oBinding2 = oEvent.getSource().getBinding("items");
                oBinding2.filter([oFilter]);
            },
            getPdfContent: async function (idPdf, sPath) {
                let oPdfViewer = this.getView().byId(idPdf);
                let sServiceURL = this.getView().getModel().sServiceUrl;
                let sSource = sServiceURL + sPath;

                oPdfViewer.setSource(sSource);
            },
            onPressAddAdjunt: function () {
                let lineData = { RutaArhivo: "" };
                let dataModelMain = this.getView().getModel("solicBajaMain");
                let odataAdjuntos = this.getView().getModel("solicBajaMain").getData();

                if (odataAdjuntos.SolicBaja) {
                    odataAdjuntos.SolicBaja.AdjuntoSolBajaSet.push(lineData);
                }
                if (dataModelMain) {
                    dataModelMain.updateBindings(true);
                    dataModelMain.refresh();
                }
                this.removeItemSelections("DetailAdjunt");
            },
            onLinkPressAdjuntos: function () {

            },
            _activeFormEdit: function (active) {
                let modelForm = this.getViewModel("statusForm");
                if (modelForm) {
                    modelForm.setProperty("/Status/ActiveEditForm", active);
                    modelForm.updateBindings(true);
                    modelForm.refresh();
                }
            },
            onDeleteItemAdjunt: function (oEvent) {
                let oTable = this.getView().byId("DetailAdjunt");
                let oModelMain = this.getViewModel("solicBajaMain");
                let detailAdjunt = this.getView().getModel("solicBajaMain").getData();

                if (oTable) {
                    let sPath = oEvent.getSource().getParent().getBindingContextPath();
                    if (sPath) {
                        //Eliminar de la tabla:
                        //oTable.removeItem(oEvent.getSource().getParent());
                        let cadRes = sPath.split("/");
                        if (cadRes) {
                            //Actualizar el modelo
                            let idDelete = parseInt(cadRes[cadRes.length - 1]);
                            detailAdjunt.SolicBaja.AdjuntoSolBajaSet.splice(idDelete, 1);
                        }

                    }
                    oModelMain.updateBindings(true);
                    oModelMain.refresh();
                }
            },
            setInitTabView: function () {
                //Inicializar TAB View
                let tabIni = this.getView().byId("idTabBarHeader");
                if (tabIni) {
                    tabIni.setSelectedKey("tabHeader");
                }
            },
            setModelAuthorization: function (btnFlg, setRespon) {
                let oModel = this.getView().getModel();
                this._getDataAuthorization(oModel, "/AuthorizationSet", btnFlg, setRespon);
            },
            _getDataAuthorization: async function (oModel, entity, btnFlg, setRespon) {
                let filtersData = [];
                this.clearModelAuthorization();

                filtersData.push(new Filter("Bukrs", FilterOperator.EQ, ""));

                let oData = await this.oDataServSolBaj.readEntityOdataFilter(oModel, entity, filtersData);
                if (oData.results[0]) {
                    console.log(oData);
                    let modelAuth = this.getView().getModel("authSolBaj");
                    if (modelAuth) {
                        modelAuth.setProperty("/AuthorizationSet", oData.results[0]);
                        modelAuth.updateBindings(true);
                        modelAuth.refresh();
                    }
                    if (btnFlg) {
                        this.setTextBtnAprob(oData.results[0]);//+ 
                    }
                    if (setRespon) {
                        this.setTextRespons(oData.results[0]);//+ 
                    }
                }
            },
            onSelectedTipBaja: function (oEvent) {
                let oSourceSelect = oEvent.getSource();
                if (oEvent) {
                    let dataSelect = oSourceSelect.getSelectedItem().mProperties;
                    if (dataSelect) {
                        if (dataSelect.key = "4")  //otros
                        {

                        }
                    }
                }
            },
            getAuthData: function () {
                let modelAuth = this.getView().getModel("authSolBaj");
                if (modelAuth) {
                    let odataAuth = modelAuth.getData();
                    if (odataAuth.AuthorizationSet) {
                        return odataAuth.AuthorizationSet;
                    }
                }
            },
            setTextBtnAprob: function (odataAuth) {
                let i18nText = this.getResourceBundle();
                let btnAprob = this.getView().byId("btnAprob");
                if (odataAuth) {
                    if (odataAuth.FlgAprResponbaja === true) {
                        btnAprob.setText(i18nText.getText("AprParc"));
                    } else {
                        btnAprob.setText(i18nText.getText("Aprobar"));
                    }
                }
            },
            setTextRespons: function (odataAuth) {
                let modelSolBaj = this.getView().getModel("solicBajaMain");
                let textRespons = this.getView().byId("TxtRespBaja");
                if (odataAuth) {
                    if (modelSolBaj) {
                        modelSolBaj.setProperty("/SolicBaja/RespBaja2", odataAuth.RespBaja);
                        modelSolBaj.updateBindings(true);
                        modelSolBaj.refresh();
                    }


                    textRespons.setDescription(odataAuth.NameRespBaja);
                }
            },
            onChangeSelectTbaj: function (oEvent) {
                let oSource = oEvent.getSource();
                let ItemSelected = oSource.getSelectedItem().mProperties;
                if (ItemSelected.key) {
                    this.SetChangeTipoBaja(ItemSelected);
                    if (ItemSelected.key === '6') //Opción Otros
                    {
                        this.setTextOtrosTipoBaja(true);
                    } else {
                        this.setTextOtrosTipoBaja(false);
                    }
                }
            },
            SetChangeTipoBaja: function (ItemSelected) {
                let modelItemAdd = this.getView().getModel("detailProdAdd");
                if (modelItemAdd) {
                    modelItemAdd.setProperty("/Detail/TipoBaja", ItemSelected.text);
                    modelItemAdd.updateBindings(true);
                    modelItemAdd.refresh();
                }

            },
            setTextOtrosTipoBaja: function (confirm) {
                sap.ui.getCore().byId("LblTipBaja").setVisible(confirm);
                sap.ui.getCore().byId("TxtTipBaja").setVisible(confirm);
                if (!confirm) {
                    sap.ui.getCore().byId("TxtTipBaja").setValue("");
                }

            },
            activeFieldTipBaja: function () {
                let oModelAux = this.getViewModel("detailProdAdd");
                let oDataAux = oModelAux.getData();
                if (oDataAux.Detail) {
                    if (oDataAux.Detail.IdTipBaja === '6') {
                        sap.ui.getCore().byId("LblTipBaja").setVisible(true);
                        sap.ui.getCore().byId("TxtTipBaja").setVisible(true);
                        sap.ui.getCore().byId("LblSelectTipBaja").setVisible(true);
                        sap.ui.getCore().byId("SelectTipBaja").setVisible(true);
                    }
                }
            },
            performInitFecha: function () {
                let modelSBajaMain = this.getView().getModel("solicBajaMain");
                if (modelSBajaMain) {
                    //let date = DateFormat.getDateInstance({pattern: "dd/MM/YYYY"}).format(new Date());
                    //let date = new Date();

                    let date = new Date();
                    let now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
                                           date.getUTCDate(), date.getUTCHours(),
                                           date.getUTCMinutes(), date.getUTCSeconds());
                    let dateResult = new Date(now_utc);

                    console.log(new Date(now_utc));
                    console.log(date.toISOString());


                    modelSBajaMain.setProperty("/SolicBaja/FecSolic", dateResult);
                    modelSBajaMain.updateBindings(true);
                    modelSBajaMain.refresh();
                }

            },
            getFechaParse: function () {
                let DateConvert;
                let dateInput = new Date();
                // timezoneOffset is in hours convert to milliseconds
                var TZOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;

                let dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: "dd/MM/yyyy"
                });

                let dateStr = dateFormat.format(new Date(dateInput.getTime() + TZOffsetMs));
                let parsedDate = new Date(dateFormat.parse(dateStr).getTime() - TZOffsetMs); //1354665600000  
                DateConvert = "\/Date(" + parsedDate + ")\/";

                return DateConvert;
            },
            onNavLinkAdjunt: function (url) {
                if (url) {
                    window.open(url, "_blank");
                }
            },
            getPriceNeto: async function (oModelDetail,idAnln1,idAnln2) {
                let valorNeto = 0;
                let oMainModel = this.getView().getModel();
                let dataAuth = this.getAuthData();
                let path = `/Activos_SHSet(Bukrs='${dataAuth.Bukrs}',Anln1='${idAnln1}',Anln2='${idAnln2}')`;
                try {
                    let rptaService = await await this.oDataServSolBaj.readEntityOdataKey(oMainModel,path);
                    if (rptaService) {
                        let valuePrice = rptaService.ValorNeto;
                            valorNeto  = parseFloat(valuePrice).toFixed(3);
                        if (valorNeto) 
                        {
                            oModelDetail.setProperty("/Detail/ValorNeto", valorNeto);
                        }else{
                            oModelDetail.setProperty("/Detail/ValorNeto", null);
                        }
                    }
                } catch (error) {
                }
            },
            setButtonActionDisabled: function(confirm)
            {
                let btnAprob = this.getView().byId("btnAprob");
                if (btnAprob) {
                    btnAprob.setEnabled(confirm);
                }
                let btnReject = this.getView().byId("btnReject");
                if (btnReject) {
                    btnReject.setEnabled(confirm);
                }
            }
        })
    });