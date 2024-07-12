sap.ui.define([
    "./Base.controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,JSONModel,MessageBox,Filter,FilterOperator,DateFormat,Fragment) {
        "use strict";
        let rucProveedor='20307214386',rutaInicial,carpetaDMS={}
        return Controller.extend("ns.cosapi.reportecontabilidad.controller.Home", {
            onInit: async function () {
                rutaInicial = "/apidms/browser/"; //despliegue			
			    //rutaInicial ="/browser/"; //Local	
                await this.getInfoUser();
                this.onObtenerRepositorios();
                this._onListaFacturas();
                this.onObtenerEstados();
                this.onObtenerSociedades();
            },
            _onListaFacturas:async function(){
                //filtros
                    let sSociedad = this.byId("IdSociedadesFiltros").getSelectedKey();
                    let secuencia = this.byId("idSecuenciaPreRegistro").getValue();
                    let serie = this.byId("idSerieCorrelativo").getValue();
                    let rucfiltro = this.byId("idRuc").getValue();
                    let oFechas = this.byId("idFechaContabilizacion");
                    let oFechasEmi = this.byId("idFechaEmision");
                    let oEstados = this.byId("idEstadosFiltro");
                    let filterList =[];
                    if(sSociedad != ""){
                        filterList.push(new Filter("Sociedad","EQ",sSociedad))
                    }
                    if(secuencia != ""){
                        filterList.push(new Filter("Factura","EQ",secuencia))
                    }
                    if(serie != ""){
                        filterList.push(new Filter("Xblnr","EQ",serie))
                    }
                    if(rucfiltro != ""){
                        filterList.push(new Filter("Stcd1","EQ",rucfiltro))
                    }
                    if(oFechas.getDateValue() != null || oFechas.getSecondDateValue() != null){
                        filterList.push(new Filter("Fechaconta","EQ",this.formatearFechas(oFechas.getDateValue(),oFechas.getSecondDateValue())))
                    }
                    if(oFechasEmi.getDateValue() != null || oFechasEmi.getSecondDateValue() != null){
                        filterList.push(new Filter("Fechaemision","EQ",this.formatearFechas(oFechasEmi.getDateValue(),oFechasEmi.getSecondDateValue())))
                    }
                    if(oEstados.getSelectedKeys().length>0){
                        let aFilterTemp = []
                        oEstados.getSelectedKeys().forEach(element => {
                            aFilterTemp.push(new Filter("Estado","EQ",element))
                        });                    
                        var filtroCombinado = new Filter({
                            filters: aFilterTemp,
                            and: false // Usar 'and: false' para combinar los filtros con 'or'
                        });
                        filterList.push(filtroCombinado);
                    }
                    
                    //filterList.push(new Filter("Filas","EQ",5))
                    let oModelUser = this.getOwnerComponent().getModel("userData");
                    let ruc = oModelUser.getProperty("/userId")
                    //filterList.push(new Filter("Stcd1","EQ",ruc))
                    const parameters = {
                        filters: filterList
                        // urlParameters: {
                        //     "$expand":"ConsultaRegFacturasDetSet"
                        // }
                    };
                    let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                    try {
                        let oModel = this.getOwnerComponent().getModel();
                        const facturasMini = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ReporteContabilidadSet", parameters);
                        let respuesta = facturasMini.results;
                        if(respuesta.length==0){
                            MessageBox.warning("No se encontraron resultados con los filtros enviados");
                            return false;
                        }
                        respuesta.forEach(element => {
                            switch (element.Codigoestado) {
                                case "01":
                                    element.Estatus = sap.ui.core.ValueState.Warning;
                                    break;
                                case "02":
                                case "04":
                                case "05":
                                    element.Estatus = sap.ui.core.ValueState.Success;
                                    break;
                                case "03":
                                    element.Estatus = sap.ui.core.ValueState.Error;
                                    break;
                                default:
                                    element.Estatus = sap.ui.core.ValueState.None; // Valor predeterminado si no coincide con ningún caso
                                    break;
                            }
                        });
                        oModel.setProperty("/ListaFacturas", respuesta)
                    } catch (error) {
                        MessageBox.error("Error al obtener Facturas Mini")
                    }  
                },
                formatearFechas: function(fechaInicio, fechaFin) {
                    // Formatear las fechas
                    var dateFormat = DateFormat.getDateInstance({
                        pattern: "yyyy.MM.dd"
                    });
                    var fechaInicioFormateada = dateFormat.format(fechaInicio);
                    var fechaFinFormateada = dateFormat.format(fechaFin);
        
                    // Crear la cadena de texto con el formato deseado
                    var resultado = fechaInicioFormateada + "-" + fechaFinFormateada;
        
                    // Retornar el resultado
                    return resultado;
                },
            onObtenerEstados:async function(){
                let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                try {
                    let oModel = this.getOwnerComponent().getModel();
                    let oModelUser = this.getOwnerComponent().getModel("userData");
                    let ruc = oModelUser.getProperty("/userId")
                    let filterList =[];
                    filterList.push(new Filter("Stcd1","EQ",ruc))
                    const parameters = {
                        filters: filterList,
                        urlParameters: {}
                    };
                    const estadosSolicitudes = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaSolicitudesSet", parameters);
                    oModel.setProperty("/EstadosSolicitudes", estadosSolicitudes.results)
                } catch (error) {
                    MessageBox.error("Error al obtener estados")
                }
            },
            onObtenerSociedades:async function(){
                let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                try {
                    let oModel = this.getOwnerComponent().getModel();
                    const sociedades = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaSociedadesSet", []);
                    oModel.setProperty("/Sociedades", sociedades.results)
                } catch (error) {
                    MessageBox.error("Error al obtener estados")
                }
            },
            formatEstados: function (sValue) {
                if (sValue == "01") {
                    return "Information";
                } else if (sValue == "02" || sValue == "03") {
                    return "Success";
                } else  if (sValue == "05") {
                    return "Warning";
                }  else {
                    return "Error";
                }                
            },
            onObtenerMostrarDocumentos: async function(e){
                //
                let resultado = e.getSource().getBindingContext().getObject();
                if (!this.oMPDialog) {
                    this.oMPDialog = this.loadFragment({
                        name: "ns.cosapi.reportecontabilidad.fragment.Documentos"
                    });
                }
                this.oMPDialog.then(function (oDialog) {
                    this.oDialog = oDialog;
                    this.oDialog.open();
                
                }.bind(this));
                       
                //obtengo documento
                let itemsUploadSet = [];
                let path = "FACTURAS/" + resultado.Stcd1 + "/" + resultado.Sociedad + "/" + resultado.Xblnr;
                try {
                    let adjuntos = await this.onGetDocumentsDMS(path);
                    $.each(adjuntos.objects, (idx, value) => {
                        var oFile = {
                            "FileName": value.object.properties["cmis:name"].value,
                            "objectId": value.object.properties["cmis:objectId"].value,
                            "Type": value.object.properties["cmis:contentStreamMimeType"].value,
                            "Ruta": this._getAppModulePath() + rutaInicial + carpetaDMS.Repositoryid + "/root/" + path +"/" + value.object.properties["cmis:name"].value
                        }
                        itemsUploadSet.push(oFile);
                    });
                    var aEmpty = [];
                    let oView = this.getView();
                    var oModelEmpty = new JSONModel(aEmpty);
                    oView.byId("UploadSet").setModel(oModelEmpty);
                    var oModelDocumentosDMS = new JSONModel(itemsUploadSet);
                    oView.byId("UploadSet").setModel(oModelDocumentosDMS);
                    console.log(adjuntos);
                } catch (error) {
                    var aEmpty = [];
                    let oView = this.getView();
                    var oModelEmpty = new JSONModel(aEmpty);
                    oView.byId("UploadSet").setModel(oModelEmpty);
                }
            },
            _getAppModulePath: function () {
                const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                const appPath = appId.replaceAll(".", "/");
                return jQuery.sap.getModulePath(appPath);
            },
            onObtenerRepositorios:function(){
                carpetaDMS.Repositoryid = "2ac5f6e5-9f27-4c41-8e73-9191cf7a90be";//QAS
			    //carpetaDMS.Repositoryid = "0687b0df-65d8-45b5-802c-a5e76db45277";//PRD
            },
            _closeDialog: function () {
                this.oDialog.close();
            },
            onDownloadSelectedButton: function () {
                var oUploadSet = this.byId("UploadSet");
    
                oUploadSet.getItems().forEach(function (oItem) {
                    if (oItem.getListItem().getSelected()) {
                        oItem.download(true);
                    }
                });
            },
            onGetDocumentsDMS: function (path) {
                return new Promise((resolve, reject) => {
                    //carpetaDMS.Repositoryid = "eba59dfd-09f1-4526-a822-722759c5f6a0";
                    $.ajax({
                        url: this._getAppModulePath() + rutaInicial + carpetaDMS.Repositoryid + "/root/" + path,
                        contentType: "application/json"
                        , success: resolve,
                        error: reject
                    })
                });
            },

            onLimpiarFiltros: function () {
                this.byId("IdSociedadesFiltros").setSelectedKey();
                this.byId("idSecuenciaPreRegistro").setValue();
                this.byId("idSerieCorrelativo").setValue();
                this.byId("idRuc").setValue();
                this.byId("idFechaContabilizacion").setValue();
                this.byId("idFechaEmision").setValue();
                this.byId("idEstadosFiltro").setSelectedKeys([]);
                this._onListaFacturas();
            },

            onVerificarSunat: async function (oEvent) {
                sap.ui.core.BusyIndicator.show(0);
                let oObject = oEvent.getSource().getBindingContext().getObject()
                let bSelected = oEvent.getSource().getSelected()
                let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                let oData = {
                    "Proveedor": oObject.Lifnr,
                    "Sociedad": oObject.Sociedad,
                    "Ejercicio": oObject.Ejercicio,
                    "Seriecorrelativo": oObject.Xblnr,
                    "ConformeSunat": bSelected ? "X" : ""
                }
			    const oCrearFactura = await this.createEntity(ZMMGS_PRE_REG_FACT_SRV, "/RegistroConformidadSunatSet", oData);

                if (oCrearFactura.Codigo == "500") {
                    MessageBox.error(oCrearFactura.Mensaje)
                } else {
                    MessageBox.success(oCrearFactura.Mensaje)
                }
                sap.ui.core.BusyIndicator.hide(0);
                console.log(oCrearFactura)
            },

            formatoVerificarSunat: function (sValue) {
                if (!sValue) {
                    return false
                }
                return true
            }
        });
    });
