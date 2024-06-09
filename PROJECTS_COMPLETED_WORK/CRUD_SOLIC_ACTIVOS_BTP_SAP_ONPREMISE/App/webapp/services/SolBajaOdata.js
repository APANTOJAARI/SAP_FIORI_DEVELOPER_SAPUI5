sap.ui.define(["sap/ui/base/Object", "sap/ui/model/Filter"
            ,"sap/base/Log","sap/m/MessageBox"], function (Object,Filter,Log,MessageBox) {
    "use strict";
    let _this;

    let instance;
    let services = Object.extend("centria.net.fisbactivos.SolBajaOData",
        {
            constructor: function () {
                _this = this;
            },
            /**
             * Esta función llama a la función POST - CREATE del Odata - Cabecera
             * @param { typeof object } oModel
             * @param { typeof object } inputDataBody
             */
            createSolicBaja: function (oModel,inputDataBody) {
                if (oModel) {
                    sap.ui.core.BusyIndicator.show(0);
                    oModel.create("/HeaderSolBajaSet", inputDataBody, {
                        success: function (data) {
                            sap.ui.core.BusyIndicator.hide();
                        }.bind(this),
                        error: function (e) {
                            sap.ui.core.BusyIndicator.hide();
                        }.bind(this)
                    });
                }
            },
            createSolicBajaProm: function(oModel,entidad,inputDataBody){
                return new Promise( function (fulfilled,rejected ) {
                    oModel.metadataLoaded().then(function () {
                        sap.ui.core.BusyIndicator.show(0);
                        oModel.create(entidad,inputDataBody, {
                            success: function (data) {
                                sap.ui.core.BusyIndicator.hide();
                                fulfilled(data);
                            },
                            error: function (error) {
                                sap.ui.core.BusyIndicator.hide();
                                rejected(error);
                            }
                        })
                    })
                })
            },
            createSolicBajaAdjuntos: function(oModel,entidad,inputDataBody){
                return new Promise( function (fulfilled,rejected ) {
                    oModel.metadataLoaded().then(function () {
                        sap.ui.core.BusyIndicator.show(0);
                        oModel.create(entidad,inputDataBody, {
                            success: function (data) {
                                sap.ui.core.BusyIndicator.hide();
                                fulfilled(data);
                            },
                            error: function (error) {
                                sap.ui.core.BusyIndicator.hide();
                                rejected(error);
                            }
                        })
                    })
                })
            },

            updateSolicBajaProm: function(oModel,path,bodyInput)
            {
            return new Promise( function (fulfilled,rejected ) {
                    oModel.metadataLoaded().then(function () {
                        sap.ui.core.BusyIndicator.show(0);
                        oModel.create(path, bodyInput,{
                            success: function (data) {
                                sap.ui.core.BusyIndicator.hide();
                                fulfilled(data);
                                console.log(data);
                            },
                            error: function (error) {
                                sap.ui.core.BusyIndicator.hide();
                                rejected(error);
                                console.log(error);
                            }
                        })
                    })
                }) 
            },
            readEntityOdataKey: function(oModel,path) 
            {
                return new Promise( function (fulfilled,rejected ) {
                    oModel.metadataLoaded().then(function () {
                        sap.ui.core.BusyIndicator.show(0);
                        oModel.read(path, {
                            success: function (data) {
                                sap.ui.core.BusyIndicator.hide();
                                fulfilled(data);
                            },
                            error: function (error) {
                                sap.ui.core.BusyIndicator.hide();
                                rejected(error);
                            }
                        })
                    })
                })  
            },
            readEntityOdataFilter: function(oModel,entitySet,valuesFilter)
            {
                return new Promise( function (fulfilled,rejected ) {
                    oModel.metadataLoaded().then(function () {
                        sap.ui.core.BusyIndicator.show(0);
                        oModel.read(entitySet, {
                            filters: valuesFilter,
                            success: function (data) {
                                sap.ui.core.BusyIndicator.hide();
                                fulfilled(data);
                            },
                            error: function (error) {
                                sap.ui.core.BusyIndicator.hide();
                                rejected(error);
                            }
                        })
                    })
                })  
                
            }
        });

    return {
        getInstance: function () {
            if (!instance) {
                instance = new services
            }
            return instance;
        }
    }
});