sap.ui.define(["sap/ui/base/Object", "sap/ui/model/Filter", "sap/m/Dialog", "sap/m/DialogType", "sap/m/List",
    "sap/m/StandardListItem", "sap/m/Button", "sap/m/MessageBox",],
    function (Object, Filter, Dialog, DialogType, List, StandardListItem, Button, MessageBox) {
        "use strict";
        let _this;
        let instance;
        let logValid = Object.extend("centria.net.fisbactivos.controller.logica.ValidacionesSolBaja",
            {
                constructor: function () {
                    _this = this;
                },
                checkValidacionForm: function (oViewMain, i18nText) {
                    let oModelLog = oViewMain.getModel("logSolBaj");
                    let oModelSolicBaj = oViewMain.getModel("solicBajaMain");
                    //Validar el Modelo Local
                    let odataSolic = oModelSolicBaj.getData();
                    if (odataSolic) {
                        this._validModelSolic(odataSolic, oModelLog, i18nText);
                    }

                    //Verificar el Log
                    if (oModelLog) {
                        oModelLog.updateBindings(true);
                        oModelLog.refresh();
                    }

                    let OdataLog = oModelLog.getData();
                    if (OdataLog.Log.length > 0) {
                        this._viewLogDisplay(oViewMain, oModelLog, i18nText);
                        return false;
                    } else {
                        return true;
                    }
                },
                _validModelSolic: function (odataSolic, oModelLog, i18nText) {
                    //Validar Cabecera
                    if (odataSolic.SolicBaja) {
                        if (!odataSolic.SolicBaja.FecSolic) {
                            this._setLogLine(oModelLog, "E", i18nText.getText("msgLog2"));
                        }
                        if (!odataSolic.SolicBaja.RespBaja2) {
                            this._setLogLine(oModelLog, "E", i18nText.getText("messageResp2"));
                        }
                    }
                    //Validar el Detalle
                    if (odataSolic.SolicBaja.DetailSolBajaSet) {
                        if (odataSolic.SolicBaja.DetailSolBajaSet.length === 0) {
                            this._setLogLine(oModelLog, "E", i18nText.getText("msgLog1"));
                        }
                    }
                },
                _setLogLine: function (oModelLog, type, message, results) {
                    let dataLog = oModelLog.getData();
                    let lineData = [];

                    if (message && !results) {
                        lineData.push({ Type: type, Message: message });
                        if (dataLog.Log.length === 0) {
                            oModelLog.setProperty("/Log", lineData);
                            oModelLog.refresh();
                        } else {
                            dataLog.Log.push({ Type: type, Message: message });
                            oModelLog.refresh();
                        }
                        //OdataLog.Log.push(lineData); 
                    } else {
                        if (results) {
                            oModelLog.setProperty("/Log", results);
                            oModelLog.refresh();
                        }
                    }
                },
                _viewLogDisplay: function (oViewMain, oModelLog, i18nText) {
                    if (!this.oResizableDialog) {
                        this.oResizableDialog = new Dialog({
                            title: i18nText.getText("titleLog"),
                            contentWidth: "550px",
                            contentHeight: "300px",
                            resizable: true,
                            content: new List({
                                items: {
                                    path: "logSolBaj>/Log",
                                    template: new StandardListItem({
                                        title: "{logSolBaj>Message}",
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
                                    this.oResizableDialog = null;
                                    this.clearModelLog(oModelLog);
                                }.bind(this)
                            })
                        });

                        //to get access to the controller's model
                        oViewMain.addDependent(this.oResizableDialog);
                    }
                    this.oResizableDialog.open();

                },
                clearModelLog: function (oLogModel) {
                    if (oLogModel) {
                        oLogModel.setProperty("/Log", {});
                        oLogModel.updateBindings(true);
                        oLogModel.refresh();
                    }
                },
                checkFieldsDetailItem: function (oModelProdAdd, i18nText) {
                    if (oModelProdAdd) {
                        let odataInvent = oModelProdAdd.getData();
                        //Verificar los campos
                        if (!odataInvent.Detail.NumIvent) {
                            this.showMessageError(i18nText.getText("msgLog4"));
                            return false;
                        } else if (!odataInvent.Detail.MarcaAct) {
                            this.showMessageError(i18nText.getText("msgLog5"));
                            return false;
                        } else if (!odataInvent.Detail.ModeloAct) {
                            this.showMessageError(i18nText.getText("msgLog6"));
                            return false;
                        } else if (!odataInvent.Detail.Motivbaja) {
                            this.showMessageError(i18nText.getText("msgLog9"));
                            return false;
                        }

                        //Validar campos de motivo de Baja
                        let selectTipoBaja = sap.ui.getCore().byId("SelectTipBaja").getVisible();
                        if (selectTipoBaja) {
                            if (!odataInvent.Detail.IdTipBaja || odataInvent.Detail.IdTipBaja === '0') {
                                this.showMessageError(i18nText.getText("msgLog7"));
                                return false;
                            }
                            let textOtros = sap.ui.getCore().byId("TxtTipBaja").getVisible();
                            if (textOtros) {
                                if (!odataInvent.Detail.oportsTbaja) {
                                    this.showMessageError(i18nText.getText("msgLog8"));
                                    return false;
                                }
                            }
                        }
                    }
                    return true;
                },
                showMessageError: function (messageText) {
                    MessageBox.error(messageText);
                },
                validacionRolResponBaja: function (dataAuth, oModelMain, i18nText) {
                    let rpta = true;
                    let odataMain = oModelMain.getData();
                    if (dataAuth) {
                        if (dataAuth.FlgAprResponbaja === true && odataMain.SolicBaja.DetailSolBajaSet) {
                            //Validar que el tipo de baja este lleno
                            for (let index = 0; index < odataMain.SolicBaja.DetailSolBajaSet.length; index++) {
                                if (odataMain.SolicBaja.DetailSolBajaSet[index].TipoBaja === '' ||
                                    odataMain.SolicBaja.DetailSolBajaSet[index].TipoBaja === undefined) {
                                    this.showMessageError(i18nText.getText("msgLog10"));
                                    rpta = false;
                                    break;
                                }
                            }
                        }
                    }
                    return rpta;
                },
                validarAdjuntos: function (oModelMain, i18nText) {
                    let rpta = true;
                    let odataMain = oModelMain.getData();
                    if (odataMain) {
                        //Validar los adjuntos
                        if (odataMain.SolicBaja.AdjuntoSolBajaSet.length === 0) {
                            this.showMessageError(i18nText.getText("msgLog11"));
                            rpta = false;
                        }
                        for (let index = 0; index < odataMain.SolicBaja.AdjuntoSolBajaSet.length; index++) {
                            if (odataMain.SolicBaja.AdjuntoSolBajaSet[index].RutaArhivo === '' ||
                                odataMain.SolicBaja.AdjuntoSolBajaSet[index].RutaArhivo === undefined) {
                                this.showMessageError(i18nText.getText("msgLog12"));
                                rpta = false;
                                break;
                            }
                        }
                    }
                    return rpta;
                }
            });

        return {
            getInstance: function () {
                if (!instance) {
                    instance = new logValid
                }
                return instance;
            }
        }
    });