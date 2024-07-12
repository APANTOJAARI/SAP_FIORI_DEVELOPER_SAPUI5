sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/UIComponent",
        "sap/ui/core/routing/History"
    ],
    function (Controller,
        UIComponent,
        History) {
        "use strict";

        return Controller.extend("ns.cosapi.creacionlistadofactura.controller.Base", {
            onInit: function () {

            },
            getRouter: function () {
                return UIComponent.getRouterFor(this);
            },
            onNavto: function (viewRoute, param = null) {
                this.getRouter().navTo(viewRoute, param);
            },
            onNavBack: function () {
                let oHistory, sPreviewHash;
                oHistory = History.getInstance();
                sPreviewHash = oHistory.getPreviousHash();
                if (sPreviewHash != undefined) {
                    window.history.go(-1);
                } else {
                    this.getRouter().navTo("RouteHome");
                }
            },

            _getOnlyAppModulePath: function () {
                const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                const appPath = appId.replaceAll(".", "/");
                return jQuery.sap.getModulePath(appPath);
            },


            _getAppModulePath: function () {

                let sPathReturn = "";

                const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                const appPath = appId.replaceAll(".", "/");
                const appPathPortal = jQuery.sap.getModulePath(appPath);
                if (appPathPortal !== ".") {
                    sPathReturn = appPathPortal + "./sap/opu/odata/sap/ZMMGS_PRE_REG_PROV_SRV"
                } else {
                    sPathReturn = "./sap/opu/odata/sap/ZMMGS_PRE_REG_PROV_SRV";
                }
                return sPathReturn;

            },
            readEntity: async function (entidad) {
                let oOData = { path: this._getAppModulePath(), format: "$format=json" };
                var settings = {
                    "url": oOData.path + entidad + "?" + oOData.format,
                    "method": "GET",
                    "timeout": 0,
                };
                return new Promise((resolve, reject) => {
                    $.ajax(settings)
                        .done(response => {
                            resolve(response);
                        })
                        .fail((xhr, textStatus, errorThrown) => {
                            reject(errorThrown);
                        });
                });
            },
            // createEntity: async function(entidad,datos){

            //   let oOData = {path : this._getAppModulePath(), format : "$format=json"};
            //   let token = await this.getToken(entidad); 
            //   return new Promise((resolve, reject) => {
            //     $.ajax({
            //       url: oOData.path + "/ConsultaPaisesSet" + "?" + oOData.format,
            //       type: "GET",

            //       beforeSend: function(xhr) {
            //           xhr.setRequestHeader("X-CSRF-Token", "Fetch");
            //           xhr.setRequestHeader("Accept", "application/json");
            //       },
            //       success: function(data, textStatus, XMLHttpRequest) {            
            //         var token = XMLHttpRequest.getResponseHeader("X-CSRF-Token");
            //         $.ajax({
            //             url: oOData.path + entidad,
            //             type: "POST",
            //             contentType: "application/json",
            //             data: JSON.stringify(datos),
            //             beforeSend: function(xhr) {
            //                 xhr.setRequestHeader("X-CSRF-Token", token);
            //                 xhr.setRequestHeader("Accept", "application/json");
            //             },
            //             success: function(response,data,success) {
            //               resolve(response);
            //             },
            //             error: function(myJqXHR, txtStatus, errorThrown) {
            //               reject(errorThrown);
            //             }
            //         });
            //       },
            //       error: function(jqXHR, textStatus, errorThrown) {
            //         reject(errorThrown);
            //       }
            //   });
            //   });           
            // },

            getToken: async function (entidad) {
                let oOData = { path: this._getAppModulePath(), format: "$format=json" };

                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: oOData.path + entidad + "?" + oOData.format,
                        type: "GET",
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader("X-CSRF-Token", "Fetch");
                            xhr.setRequestHeader("Accept", "application/json");
                            xhr.setRequestHeader("withCredentials", "true");     //+@INSERT
                        },
                        success: function (data, textStatus, XMLHttpRequest) {
                            var token = XMLHttpRequest.getResponseHeader("X-CSRF-Token");
                            if (token) {
                                resolve(token);
                            } else {
                                reject("No se pudo obtener el token CSRF");
                            }
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            reject(errorThrown);
                        }
                    });
                });
            },

            createEntity: async function (entidad, datos) {
                let oOData = { path: this._getAppModulePath(), format: "$format=json" };
                let token;
                let that = this;

                try {
                   // token = await this.getToken(entidad);   //-@DELETE 
                } catch (error) {
                    throw new Error("Error obteniendo el token CSRF: " + error);
                }

                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: oOData.path + entidad,
                        type: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(datos),
                        beforeSend: function (xhr) {
                            //xhr.setRequestHeader("X-CSRF-Token", token);                 //-@DELETE
                            xhr.setRequestHeader("Accept", "application/json");
                            //xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");  //-@DELETE
                            xhr.setRequestHeader("Accept", "*/*");                         //+@INSERT
                           //xhr.setRequestHeader("withCredentials", "true");              //+@INSERT
                            xhr.setRequestHeader("X-Requested-With", "X");                 //+@INSERT
                        },
                        success: function (response, data, success) {
                            let dataRe = that.formatoSAP(success.responseText)
                            resolve(dataRe);
                        },
                        error: function (myJqXHR, txtStatus, errorThrown) {
                            if (myJqXHR.status === 403) { // Forbidden, likely CSRF token invalid
                                that.getToken(entidad)
                                    .then(newToken => {
                                        // Retry the request with the new token
                                        return $.ajax({
                                            url: oOData.path + entidad,
                                            type: "POST",
                                            contentType: "application/json",
                                            data: JSON.stringify(datos),
                                            beforeSend: function (xhr) {
                                                //xhr.setRequestHeader("X-CSRF-Token",newToken );              //-@DELETE      
                                                xhr.setRequestHeader("Accept", "application/json");            //-@DELETE
                                                //xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");  //+@INSERT
                                                xhr.setRequestHeader("Accept", "*/*");                         //+@INSERT
                                                xhr.setRequestHeader("X-Requested-With", "X");                 //+@INSERT
                                            },
                                            success: function (response, data, success) {
                                                let dataRe = that.formatoSAP(success.responseText)
                                                resolve(dataRe);
                                            },
                                            error: function (myJqXHR, txtStatus, errorThrown) {
                                                reject(errorThrown);
                                            }
                                        });
                                    })
                                    .catch(error => {
                                        reject("Error obteniendo el nuevo token CSRF: " + error);
                                    });
                            } else {
                                reject(errorThrown);
                            }
                        }
                    });
                });
            },

            _approvePreRegistro: async function (entidad, datos) {
                let oOData = { path: this._getAppModulePath(), format: "$format=json" };
                let token;
                let that = this;

                try {
                  //  token = await this.getToken(entidad);                              //-@DELETE
                } catch (error) {
                    throw new Error("Error obteniendo el token CSRF: " + error);
                }

                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: oOData.path + entidad,
                        type: "POST",
                        contentType: "application/json",
                        data: JSON.stringify(datos),
                        beforeSend: function (xhr) {
                           //xhr.setRequestHeader("X-CSRF-Token", token);                 //-@DELETE
                            xhr.setRequestHeader("Accept", "application/json");
                           //xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");  //-@DELETE
                            xhr.setRequestHeader("Accept", "*/*");                        //+@INSERT
                            xhr.setRequestHeader("X-Requested-With", "X");                //+@INSERT
                        },
                        success: function (response, data, success) {
                            resolve(response);
                        },
                        error: function (myJqXHR, txtStatus, errorThrown) {
                            if (myJqXHR.status === 403) {
                                that.getToken(entidad)
                                    .then(newToken => {
                                        return $.ajax({
                                            url: oOData.path + entidad,
                                            type: "POST",
                                            contentType: "application/json",
                                            data: JSON.stringify(datos),
                                            beforeSend: function (xhr) {
                                              //xhr.setRequestHeader("X-CSRF-Token", newToken);                //-@DELETE
                                                xhr.setRequestHeader("Accept", "application/json");
                                              //  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");  //-@DELETE
                                                xhr.setRequestHeader("Accept", "*/*");                         //+@INSERT
                                               
                                                xhr.setRequestHeader("X-Requested-With", "X");                //+@INSERT
                                            },
                                            success: function (response, data, success) {
                                                resolve(response);
                                            },
                                            error: function (myJqXHR, txtStatus, errorThrown) {
                                                reject(errorThrown);
                                            }
                                        });
                                    })
                                    .catch(error => {
                                        reject("Error obteniendo el nuevo token CSRF: " + error);
                                    });
                            } else {
                                reject(errorThrown);
                            }
                        }
                    });
                });
            },

            getBaseURL: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                return appModulePath;
            },

            _validarExisteEmailOrNif: function (value, parametro) {
                return new Promise((resolve, reject) => {

                    let that = this;
                    let xhr = new XMLHttpRequest();
                    xhr.withCredentials = true;
                    xhr.addEventListener("readystatechange", function () {
                        if (this.readyState === 4) {
                            var userData = JSON.parse(this.responseText);
                            sap.ui.core.BusyIndicator.hide()
                            if (userData.totalResults == 0) {
                                resolve(false)
                            } else {
                                resolve(true)
                            }
                        }
                    });
                    let url = "";
                    url = this.getBaseURL() + `/scim/Users?filter=${parametro} eq \"` + value + "\"";
                    xhr.open("GET", url, false);
                    xhr.send();

                });
            },

            formatoSAP: function (xmlString) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlString, "application/xml");

                const entry = {
                    id: xmlDoc.getElementsByTagName('id')[0].textContent,
                    title: xmlDoc.getElementsByTagName('title')[0].textContent,
                    updated: xmlDoc.getElementsByTagName('updated')[0].textContent,
                    category: {
                        term: xmlDoc.getElementsByTagName('category')[0].getAttribute('term'),
                        scheme: xmlDoc.getElementsByTagName('category')[0].getAttribute('scheme')
                    },
                    link: {
                        href: xmlDoc.getElementsByTagName('link')[0].getAttribute('href'),
                        rel: xmlDoc.getElementsByTagName('link')[0].getAttribute('rel'),
                        title: xmlDoc.getElementsByTagName('link')[0].getAttribute('title')
                    },
                    d: {
                        Codigo: xmlDoc.getElementsByTagName('d:Codigo')[0].textContent,
                        Stcdt: xmlDoc.getElementsByTagName('d:Stcdt')[0].textContent,
                        Nombrecomercial: xmlDoc.getElementsByTagName('d:Nombrecomercial')[0].textContent,
                        Direccion: xmlDoc.getElementsByTagName('d:Direccion')[0].textContent,
                        Id: xmlDoc.getElementsByTagName('d:Id')[0].textContent,
                        FechaInAct: xmlDoc.getElementsByTagName('d:FechaInAct')[0].textContent,
                        Mensaje: xmlDoc.getElementsByTagName('d:Mensaje')[0].textContent,
                        Land1: xmlDoc.getElementsByTagName('d:Land1')[0].textContent,
                        Taxnumxl: xmlDoc.getElementsByTagName('d:Taxnumxl')[0].textContent,
                        Name1: xmlDoc.getElementsByTagName('d:Name1')[0].textContent,
                        Name2: xmlDoc.getElementsByTagName('d:Name2')[0].textContent,
                        Name3: xmlDoc.getElementsByTagName('d:Name3')[0].textContent,
                        Name4: xmlDoc.getElementsByTagName('d:Name4')[0].textContent,
                        Representante: xmlDoc.getElementsByTagName('d:Representante')[0].textContent,
                        Identificacion: xmlDoc.getElementsByTagName('d:Identificacion')[0].textContent,
                        Telefono: xmlDoc.getElementsByTagName('d:Telefono')[0].textContent,
                        Correo: xmlDoc.getElementsByTagName('d:Correo')[0].textContent,
                        Codigoestado: xmlDoc.getElementsByTagName('d:Codigoestado')[0].textContent,
                        Usuario: xmlDoc.getElementsByTagName('d:Usuario')[0].textContent,
                        Correonombre: xmlDoc.getElementsByTagName('d:Correonombre')[0].textContent
                    }
                };

                return entry
            },
            getTokenNew: async function (entidad) {

                let oOData = { path: this._getAppModulePath(), format: "$format=json" };

                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: oOData.path + entidad + "?" + oOData.format,
                        type: "GET",
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader("X-CSRF-Token", "Fetch");
                            xhr.setRequestHeader("Accept", "application/json");
                        },
                        success: function (data, textStatus, XMLHttpRequest) {
                            let oDataResult = { tokenId: "", cookie: "" };
                            var token = XMLHttpRequest.getResponseHeader("X-CSRF-Token");
                            if (token) {
                                oDataResult.tokenId = token;
                                let cookieSso = XMLHttpRequest.getResponseHeader("cookie_sso");
                                let cookieIdSession = XMLHttpRequest.getResponseHeader("cookie_id_session");

                                if (cookieSso != undefined && cookieSso != "" &&
                                    cookieIdSession != undefined && cookieIdSession != "") {
                                    oDataResult.cookie = cookieSso + cookieIdSession;
                                } else if ((cookieSso == undefined || cookieSso == "") && (cookieIdSession != undefined && cookieIdSession != "")) {
                                    oDataResult.cookie = cookieIdSession;
                                } else {
                                    oDataResult.cookie = cookieSso;
                                }
                                resolve(oDataResult);
                            } else {
                                reject("No se pudo obtener el token CSRF");
                            }
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            reject(errorThrown);
                        }
                    });
                });
            },

            _getBrowserLang: function () {
                return navigator.language.substring(0,2) || navigator.userLanguage || "es"; // "en" es el valor por defecto
             },
             getResourceBundle : function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },

        });
    }
);