sap.ui.define([
    //sap/ui/core/mvc/Controller",
    "centria/net/fisbactivos/controller/BaseController",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "centria/net/fisbactivos/services/SolBajaOdata",
    "centria/net/fisbactivos/controller/logica/DetailSolBaja",
    "sap/ui/core/library",
    "sap/m/MessageBox",
    "sap/ushell/ui5service/ShellUIService",
    "centria/net/fisbactivos/controller/logica/ValidacionesSolBaja",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, MessageToast, Fragment, SolBajaOdata, ItemDetLogic, CoreLibrary, MessageBox, ShellUIService,
        ValidacionesSolBaja) {
        "use strict";

        return BaseController.extend("centria.net.fisbactivos.controller.SBCreate", {
            onInit: function () {

                //Inicializar instancias
                this.oDataServSolBaj = SolBajaOdata.getInstance();
                this.detailItemLogic = ItemDetLogic.getInstance();
                this.checkFormLog = ValidacionesSolBaja.getInstance();

                //Inicializar modelos:

                let dataModelAddDetail = this.getOwnerComponent().getModel("DetProdAdd");
                this.getView().setModel(dataModelAddDetail, "detailProdAdd");

                //Modelo Principal de Solicitud de Baja
                let dataModelSolBaja = this.getOwnerComponent().getModel("SolicitudBaja");
                this.getView().setModel(dataModelSolBaja, "solicBajaMain");

                //Modelo Status de formulario
                let modelbuttons = this.getOwnerComponent().getModel("StatusForm");
                this.getView().setModel(modelbuttons, "statusForm");

                //Modelo Status de formulario
                let logForms = this.getOwnerComponent().getModel("LogSolBaj");
                this.getView().setModel(logForms, "logSolBaj");

                //Modelo Autorizaciones
                let modelAuth = this.getOwnerComponent().getModel("AuthSolBaj");
                this.getView().setModel(modelAuth, "authSolBaj");

                this._activeFormEdit(true);

                //Inicializar BACK del Launchpad
                this.oShellUIService = new ShellUIService({
                    scopeObject: this.getOwnerComponent(),
                    scopeType: "component"
                });
                this.oShellUIService.setBackNavigation(this._navBackCreate.bind(this));

                //Activate Event Pattern Matched
                const auxRoute = this.getOwnerComponent().getRouter().getRoute("RouteSBajCreate");
                auxRoute.attachPatternMatched(this._createPatternMatched, this);
            },
            _createPatternMatched: function () {
                //Clear Variables
                this._ClearAllObjects();
                this._activeFormEdit(true);
                
                //Actualizar autorizaciones
                this.setModelAuthorization(false,true);
                //Inicializar Fecha
                this.performInitFecha();
                this.setInitTabView();
            },
            _navBackCreate: function () {
                this.onPressExit("RouteApp");
            },
            onBeforeRendering: function () {
            },
            /**
             * Esta función envía y registra las solicitud en el sistema SAP onPremise
             */
            onSaveSolBaja: async function () {

                //Verificar las validaciones
                this.clear_ModelLogAux();
                let i18nText = this.getResourceBundle();
                let runEjecutar = this.checkFormLog.checkValidacionForm(this.getView(), i18nText);

                if (runEjecutar) {
                    MessageBox.confirm(this.getResourceBundle().getText("TitDialog1"), {
                        onClose: function (sAction) {
                            if (sAction === MessageBox.Action.OK) {
                                this._saveAcceptOK();
                            }
                        }.bind(this)
                    });
                }
            },
            _saveAcceptOK: async function () {
                let oModelMain = this.getAppModel();
                let modelI18n = this.getResourceBundle();

                //Pasar los datos
                let oModelAuxSolic = this.getViewModel("solicBajaMain");
                let ODataAuxSolic = oModelAuxSolic.getData();
                let rptaService = await this.oDataServSolBaj.createSolicBajaProm(oModelMain, "/HeaderSolBajaSet", ODataAuxSolic.SolicBaja);
                if (rptaService) {
                    if (rptaService.IdSolic) {
                        //Limpiar los modelos
                        this.clearModelItemDetailAdd();
                        this.clearModelSolicBaja();

                        //Mensaje
                        let titleMsg = modelI18n.getText("tituloCreate");
                        let msgView = `${modelI18n.getText("msgOkSolBaj")} ${rptaService.IdSolic}`;

                        this.onSuccessMessageDialogPress(titleMsg, msgView, true, "RouteApp");

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
                }
            },
            /**
             * Esta función agregar nuevas entradas en la tabla de detalle inventario
             */
            onAddIvent: function (oEvent) {
                this.openDialogAddItem();
            },
            onDeleteDetailIvent: function () {
                this.deleteItemTable("DetailSolBaj", "solicBajaMain");
            },
            onModifItem: function () {
                this.openDialogModifItem("DetailSolBaj", "solicBajaMain");
            }
        });
    });
