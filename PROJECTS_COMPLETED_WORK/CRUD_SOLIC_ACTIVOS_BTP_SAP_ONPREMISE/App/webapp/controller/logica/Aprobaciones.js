sap.ui.define(["sap/ui/base/Object", "sap/ui/model/Filter", "sap/m/Dialog", "sap/m/DialogType", "sap/m/List",
    "sap/m/StandardListItem", "sap/m/Button", "sap/m/MessageBox",],
    function (Object, Filter, Dialog, DialogType, List, StandardListItem, Button, MessageBox) {
        "use strict";
        let _this;
        let instance;
        let logValid = Object.extend("centria.net.fisbactivos.controller.logica.Aprobaciones",
            {
                constructor: function () {
                    _this = this;
                },
                setUpdateSolBaj: function (aprobar, rechazar, oView, services, i18nText, dataAuth) {
                    if (aprobar) {
                        return this._setReleaseSolic(oView, services, i18nText, dataAuth);

                    } else if (rechazar) {
                        return this._setRejectSolic(oView, services, i18nText, dataAuth);
                    }
                },
                _setReleaseSolic: function (oView, services, i18nText, dataAuth) {
                    if (oView) {
                        let bodyInput = this._setPropertyFlg(oView,true,true,false);
                        let idMessage;
                        if (bodyInput.FlgNiv1Aprob === true && bodyInput.FlgNiv2Aprob === false 
                            && bodyInput.FlgNiv3Aprob === false ) 
                        {
                            idMessage = "messageAprPar";
                        }else if ( bodyInput.FlgNiv2Aprob === true || bodyInput.FlgNiv3Aprob === true ){
                            idMessage = "messageAprOk";
                        }else{
                            idMessage = "messageUpdate";
                        }
                        
                        return this._setSendAprSolBaja(services,oView,bodyInput,i18nText,idMessage);  
                    }
                },
                _setRejectSolic: function (oView, services, i18nText, dataAuth) {
                    if (oView) {
                        let bodyInput = this._setPropertyFlg(oView,true,false,true);
                        return this._setSendAprSolBaja(services,oView,bodyInput,i18nText,"messageRecha");  
                    }
                },
                _setPropertyFlg: function (oView, actionOk, aprob, rech) {
                    if (oView) {
                        let oModelSolBaj = oView.getModel("solicBajaMain");
                        if (oModelSolBaj) {
                            oModelSolBaj.setProperty("/SolicBaja/FlgActionApr", actionOk);
                            oModelSolBaj.setProperty("/SolicBaja/FlgApro", aprob);
                            oModelSolBaj.setProperty("/SolicBaja/FlgRech", rech);

                            let bodyInput = oModelSolBaj.getData();
                            oModelSolBaj.updateBindings(true);
                            oModelSolBaj.refresh();

                            return bodyInput.SolicBaja;
                        }
                    }
                },
                _setSendAprSolBaja: async function(services,oView,dataUpdate,i18nText,idmsg)
                {
                    let oModelMain  =  oView.getModel();
                    let rptaService = await services.updateSolicBajaProm(oModelMain, "/HeaderSolBajaSet",dataUpdate); 
                    if (rptaService.MessageSolBajaSet.results.length === 0) 
                    {   
                        let messageUpdate = i18nText.getText(idmsg);
                        let cadena = `${messageUpdate} ${rptaService.IdSolic}`;
                        this.showMessage("S",cadena);
                        return true; 

                    }else{
                        //Error
                        return false; 
                    }
                },
                showMessage: function(type,messageText)
                {
                    switch (type) {
                        case "E":
                            MessageBox.error(messageText);        
                            break;
                        case "S":
                            MessageBox.success(messageText);        
                            break;   
                        default:
                            break;
                    }  
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