sap.ui.define([
    //"sap/ui/core/mvc/Controller"
    "centria/net/fisbactivos/controller/BaseController",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "centria/net/fisbactivos/services/SolBajaOdata",
    "centria/net/fisbactivos/controller/logica/DetailSolBaja",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/library",
    "sap/m/MessageBox",
    "sap/ushell/ui5service/ShellUIService",
    "centria/net/fisbactivos/controller/logica/ValidacionesSolBaja",
    "centria/net/fisbactivos/controller/logica/Aprobaciones",
    "centria/net/fisbactivos/utils/excelUtils",
    "sap/ui/core/format/DateFormat"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, MessageToast, Fragment, SolBajaOdata, ItemDetLogic, Filter, FilterOperator, CoreLibrary, MessageBox,
        ShellUIService, ValidacionesSolBaja, Aprobaciones, excelUtils, DateFormat) {
        "use strict";

        return BaseController.extend("centria.net.fisbactivos.controller.SBDetails", {
            onInit: function () {

                //Inicializar el oRouter
                let oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("RouteSBajDetails").attachPatternMatched(this._onObjectMatched, this);

                //Inicializar instancias
                this.oDataServSolBaj = SolBajaOdata.getInstance();
                this.detailItemLogic = ItemDetLogic.getInstance();
                this.checkFormLog = ValidacionesSolBaja.getInstance();
                this.aprSolBaj = Aprobaciones.getInstance();

                //Inicializar modelos:

                let dataModelAddDetail = this.getOwnerComponent().getModel("DetProdAdd");
                this.getView().setModel(dataModelAddDetail, "detailProdAdd");

                //Modelo Principal de Solicitud de Baja
                let dataModelSolBaja = this.getOwnerComponent().getModel("SolicitudBaja");
                this.getView().setModel(dataModelSolBaja, "solicBajaMain");

                //Modelo de Status de los botones
                let modelbuttons = this.getOwnerComponent().getModel("StatusForm");
                this.getView().setModel(modelbuttons, "statusForm");

                //Modelo Status de formulario
                let logForms = this.getOwnerComponent().getModel("LogSolBaj");
                this.getView().setModel(logForms, "logSolBaj");

                //Modelo Autorizaciones
                let modelAuth = this.getOwnerComponent().getModel("AuthSolBaj");
                this.getView().setModel(modelAuth, "authSolBaj");

                //Modelo Aprobaciones
                let modelStat = this.getOwnerComponent().getModel("StatSolBaj");
                this.getView().setModel(modelStat, "statSolBaj");

                //Inicializar BACK del Launchpad
                this.oShellUIService = new ShellUIService({
                    scopeObject: this.getOwnerComponent(),
                    scopeType: "component"
                });
                this.oShellUIService.setBackNavigation(this._navBackDetails.bind(this));
            },
            _navBackDetails: function () {
                this.onPressExit("RouteApp");
            },
            _getDataSolicBaja: async function (oModel, sPath, oModelAux) {
                let oData = await this.oDataServSolBaj.readEntityOdataKey(oModel, sPath);
                if (oData && oModelAux) {
                    oModelAux.setProperty("/SolicBaja", {});
                    oModelAux.setData
                        ({
                            SolicBaja: oData
                        });

                    this._setFechaSolicConvert(oData.FecSolic, oModelAux);//+Fecha Solic

                    this._getDataSolicBajaDetail(oModel, oModelAux, "/DetailSolBajaSet");
                    this._getDataSolicBajaDetail(oModel, oModelAux, "/AdjuntoSolBajaSet");
                    this._getDataStatusAprob(oModel, oModelAux, '/StatusAprobSet');
                }
            },
            _getDataSolicBajaDetail: async function (oModel, oModelAux, entity) {
                let filtersData = [];

                filtersData.push(new Filter("Bukrs", FilterOperator.EQ, oModelAux.getData().SolicBaja.Bukrs));
                filtersData.push(new Filter("IdSolic", FilterOperator.EQ, oModelAux.getData().SolicBaja.IdSolic));

                let oData = await this.oDataServSolBaj.readEntityOdataFilter(oModel, entity, filtersData);
                if (oData.results && oModelAux) {
                    let path = `/SolicBaja${entity}`;
                    oModelAux.setProperty(path, oData.results);
                }

            },
            _getDataStatusAprob: async function (oModel, oModelAux, entity) {
                let filtersData = [];
                let modelAprob = this.getView().getModel("statSolBaj");

                filtersData.push(new Filter("Bukrs", FilterOperator.EQ, oModelAux.getData().SolicBaja.Bukrs));
                filtersData.push(new Filter("IdSolic", FilterOperator.EQ, oModelAux.getData().SolicBaja.IdSolic));

                let oData = await this.oDataServSolBaj.readEntityOdataFilter(oModel, entity, filtersData);
                if (oData.results && oModelAux) {
                    if (modelAprob) {
                        modelAprob.setProperty("/Status", oData.results);
                        modelAprob.setData({ Status: oData.results });
                        modelAprob.updateBindings(true);
                        modelAprob.refresh();
                    }
                }
            },
            _onObjectMatched: function (oEvent) {

                //Inicializar Modelo
                this._ClearAllObjects();
                this.onHandleClosePopup();

                //Obtener los datos
                let oModelMain = this.getAppModel();
                let oModelAuxSolic = this.getViewModel("solicBajaMain");

                let pathSelected = oEvent.getParameter("arguments");
                let spath = `/${pathSelected.inventPath}`;
                this._spath = spath;

                //Set de los datos
                this._getDataSolicBaja(oModelMain, spath, oModelAuxSolic);

                oModelAuxSolic.updateBindings(true);
                oModelAuxSolic.refresh();

                //Validaciones
                //this._activeBtnEdit(true);
                this._activeFormEdit(false);
                this._activeBtnSave(false);

                this.removeItemSelections("DetailSolBaj");
                this.setInitTabView();

                //Actualizar autorizaciones Add
                this.setModelAuthorization(true);
                this.setButtonActionDisabled(true);//+
            },
            onSaveSolBaja: function () {
                //Verificar las validaciones
                this.clear_ModelLogAux();
                let i18nText = this.getResourceBundle();
                let runEjecutar = this.checkFormLog.checkValidacionForm(this.getView(), i18nText);

                if (runEjecutar) {
                    MessageBox.confirm(this.getResourceBundle().getText("TitDialog1"), {
                        onClose: function (sAction) {
                            if (sAction === MessageBox.Action.OK) {
                                this._saveModifAcceptOK();
                            }
                        }.bind(this)
                    });
                }
            },
            onSaveSolBajaAnex: async function () {
                let oModelMain = this.getAppModel();
                let i18nText = this.getResourceBundle();
                let oModelAuxSolic = this.getViewModel("solicBajaMain");
                let ODataAuxSolic = oModelAuxSolic.getData();

                let confirmOK = await this.messageConfirm(i18nText.getText("TitDialog1"));
                if (confirmOK) {
                    //verificar Rol
                    let validOk = this.checkFormLog.validarAdjuntos(oModelAuxSolic, i18nText);
                    if (validOk) {
                        oModelAuxSolic.setProperty("/SolicBaja/FlgAnexoUpd", true);
                        oModelAuxSolic.updateBindings(true);
                        oModelAuxSolic.refresh();

                        let rptaService = await this.oDataServSolBaj.createSolicBajaAdjuntos(oModelMain, "/HeaderSolBajaSet", ODataAuxSolic.SolicBaja);
                        if (rptaService) {
                            let titleMsg = i18nText.getText("Adjunt1");
                            let cadena = i18nText.getText("Adjunt2");
                            this.onSuccessMessageDialogPress(titleMsg, cadena, true, "RouteApp");
                        } else {
                            MessageBox.error(i18nText.getText("messageAdj"));
                        }
                    }
                }
            },
            _saveModifAcceptOK: async function () {
                let oModelMain = this.getAppModel();
                let oModelAuxSolic = this.getViewModel("solicBajaMain");
                let ODataAuxSolic = oModelAuxSolic.getData();
                let modelI18n = this.getResourceBundle();

                this._refreshFieldLog(oModelAuxSolic);

                let rptaService = await this.oDataServSolBaj.updateSolicBajaProm(oModelMain, "/HeaderSolBajaSet", ODataAuxSolic.SolicBaja);
                if (rptaService.MessageSolBajaSet.results.length === 0) {
                    let titleMsg = this.getResourceBundle().getText("tituloCreate");
                    let messageUpdate = this.getResourceBundle().getText("messageUpdate");
                    let cadena = `${messageUpdate} ${ODataAuxSolic.SolicBaja.IdSolic}`;
                    this.onSuccessMessageDialogPress(titleMsg, cadena, true);

                    //Actualizar form
                    this._activeFormEdit(false);
                    this._activeBtnSave(false);

                } else {
                    //Mostrar mensaje de Error
                    if (rptaService.MessageSolBajaSet.results) {
                        if (rptaService.MessageSolBajaSet.results.length > 0) {
                            let oModelLog = this.getView().getModel("logSolBaj");
                            this.checkFormLog._setLogLine(oModelLog, "", "", rptaService.MessageSolBajaSet.results);
                            this.checkFormLog._viewLogDisplay(this.getView(), oModelLog, modelI18n);
                        }
                    }
                }
            },
            onAddIvent: function () {
                this.openDialogAddItem();
            },
            onDeleteDetailIvent: function () {
                this.deleteItemTable("DetailSolBaj", "solicBajaMain");
            },
            onEditSolBaja: function () {
                let btnSave = this.getView().byId("btnSave");
                if (btnSave) {
                    if (!btnSave.getVisible()) {
                        this._activeBtnSave(true);
                        this._activeFormEdit(true);
                    } else {
                        this._activeBtnSave(false);
                        this._activeFormEdit(false);
                    }
                }
            },
            onModifItem: function () {
                this.openDialogModifItem("DetailSolBaj", "solicBajaMain");
            },
            _activeBtnEdit: function (active) {
                let modelButtons = this.getViewModel("statusForm");
                modelButtons.setProperty("/Status/BtnEditEnable", active);
                modelButtons.updateBindings(true);
                modelButtons.refresh();
            },
            _activeBtnSave: function (active) {
                let modelButtons = this.getViewModel("statusForm");
                modelButtons.setProperty("/Status/BtnCrearEnable", active);
                modelButtons.updateBindings(true);
                modelButtons.refresh();
            },
            _refreshFieldLog: function (oModelAux) {
                if (oModelAux) {
                    oModelAux.setProperty("/SolicBaja/MessageSolBajaSet", []);
                    oModelAux.updateBindings(true);
                    oModelAux.refresh();
                }

            },
            onTabBar: function (oEvent) {
                let tabKey = oEvent.getSource().getSelectedKey();
                switch (tabKey) {
                    case "TabPdf":
                        let pathResult = this._spath.replace("HeaderSolBajaSet", "getPDFSet");
                        pathResult = pathResult + '/$value';
                        this.getPdfContent("pdfView", pathResult);
                        break;
                    default:
                        break;
                }
            },
            onAprobSolBaja: async function () {
                let i18nText = this.getResourceBundle();
                let dataAuth = this.getAuthData();
                let oModelAuxSolic = this.getViewModel("solicBajaMain");
                let text = this.getResourceBundle();
                //Confirmar Ejecución
                let confirmOK = await this.messageConfirm(text.getText("TitDialog1"));
                if (confirmOK) {
                    //verificar Rol
                    let rptaRolOk = this.checkFormLog.validacionRolResponBaja(dataAuth, oModelAuxSolic, i18nText);
                    if (rptaRolOk) {
                        this._refreshFieldLog(oModelAuxSolic);

                        let rpta = this.aprSolBaj.setUpdateSolBaj(true, false, this.getView(), this.oDataServSolBaj, i18nText, dataAuth);
                        if (rpta) {
                            this._refreshModelSolBaj();
                            this.setButtonActionDisabled(false);//+
                        } else {
                            MessageBox.error(i18nText.getText("messageErrAp"));
                        }
                    }
                }
            },
            onRechaSolBaja: async function () {
                let i18nText = this.getResourceBundle();
                let dataAuth = this.getAuthData();
                let oModelAuxSolic = this.getViewModel("solicBajaMain");
                let confirmOK = await this.messageConfirm(i18nText.getText("TitDialog1"));

                this._refreshFieldLog(oModelAuxSolic);
                if (confirmOK) {
                    let rpta = this.aprSolBaj.setUpdateSolBaj(false, true, this.getView(), this.oDataServSolBaj, i18nText, dataAuth);
                    if (rpta) {
                        this.clearModelSolicBaja();
                        this._refreshModelSolBaj();
                        this.setButtonActionDisabled(false);//+
                    } else {
                        MessageBox.error(i18nText.getText("messageErrRe"));
                    }
                }
            },
            _refreshModelSolBaj: function () {
                let oModelAuxSolic = this.getViewModel("solicBajaMain");
                let oModelMain = this.getAppModel();
                if (oModelAuxSolic) {
                    this.clearModelSolicBaja();
                    this._getDataSolicBaja(oModelMain, this._spath, oModelAuxSolic);
                    oModelAuxSolic.updateBindings(true);
                    oModelAuxSolic.refresh();
                }
            },
            onExcelDownload: async function () {
                // Remove any existing DOM artifacts...
                let domHyperlink = document.getElementById("domHyperlink");
                if (domHyperlink) domHyperlink.remove();

                // Set busy indicator to true
                this.getView().setBusy(true);
                // Create DOM table
                // Populate and format DOM table with data
                let oModelMain = this.getView().getModel();
                let oModelSolBaj = this.getView().getModel("solicBajaMain");
                let odataSolBaj = oModelSolBaj.getData();
                let i18nText = this.getResourceBundle();

                let table = await excelUtils.createDOMTable(this, oModelMain, odataSolBaj, i18nText);
                // Write DOM table to Excel
                excelUtils.writeToExcel(table, odataSolBaj.SolicBaja.IdSolic);
                // Set busy indicator to false
                this.getView().setBusy(false);
            },
            _setFechaSolicConvert: function (valueDate, oModelAux) {
                if (valueDate) {
                    let TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
                    let fechaSolicStr = new Date(valueDate.getTime() + TZOffsetMs);
                    if (oModelAux) {
                        oModelAux.setProperty("/SolicBaja/FecSolic", fechaSolicStr);
                    }
                }
            }

        });
    });