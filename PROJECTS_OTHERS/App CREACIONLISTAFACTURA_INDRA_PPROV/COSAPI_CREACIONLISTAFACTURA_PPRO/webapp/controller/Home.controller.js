sap.ui.define([
    "./Base.controller",
    'sap/viz/ui5/controls/common/feeds/AnalysisObject', 
    'sap/suite/ui/commons/ChartContainerContent', 
    'sap/viz/ui5/controls/VizFrame', 
    'sap/ui/model/json/JSONModel', 'sap/viz/ui5/data/FlattenedDataset', 
    'sap/viz/ui5/controls/common/feeds/FeedItem', 'sap/m/Label',"sap/m/MessageBox","sap/ui/model/Filter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, AnalysisObject, ChartContainerContent, VizFrame, JSONModel, 
        FlattenedDataset, FeedItem, Label,MessageBox,Filter) {
        "use strict";
        let datatest ={
            "businessData": []
        }
        return Controller.extend("ns.cosapi.creacionlistadofactura.controller.Home", {
            _constants: {
                sampleName: "sap/suite/ui/commons/sample/ChartContainerActions",
                chartContainerId: "chartContainer",
                vizFrames: {
                    config: {
                        height: "400px",
                        width: "80%",
                        uiConfig: {
                            applicationSet: "fiori"
                        }
                    },
                    country: {
                        icon: "sap-icon://vertical-bar-chart",
                        title: "Bar Chart",
                        dataPath: datatest,
                        dataset: {
                            dimensions: [{
                                name: "Estado",
                                value: "{Estado}"
                            }
                            
                        ],
                            measures: [{
                                name: "Monto",
                                value: "{Monto}"
                            },
                            {
                                name: "Estado",
                                value: "{Estado}"
                            }],
                            data: {
                                path: "/businessData"
                            }
                        },
                        feedItems: [{
                            uid: "primaryValues",
                            type: "Measure",
                            values: [ "Monto" ]
                        }, {
                            uid: "axisLabels",
                            type: "Dimension",
                            values: []
                        }],
                        analysisObjectProps: {
                            uid: "Estado",
                            type: "Dimension",
                            name: "Estado"
                        },
                        vizType: "column"
                    }
                }
            },
            onInit: async function () {                   
                this.getRouter().getRoute("RouteHome").attachMatched(this._onRouteMatched,this)	                     
            },
            _onRouteMatched:async function(){
                await this.getInfoUser();      
                let oModelUser = this.getOwnerComponent().getModel("userData");                
                let admin = oModelUser.getProperty("/esAprobador")
                if(admin){
                    let oModel = this.getOwnerComponent().getModel();
                    oModel.setProperty("/adminVisible",true);
                    this.byId("idPanelProveedor").setVisible(false);
                    this.byId("idBtnCrearFactura").setVisible(false);
                }else{
                    let oModel = this.getOwnerComponent().getModel();
                    this.byId("idPanelProveedor").setVisible(true);
                    oModel.setProperty("/adminVisible",false);
                    this.byId("idBtnCrearFactura").setVisible(true);
                    this.onObtenerDatsProveedor();
                    this.onObtenerEstados();
                    this._onListaFacturasMini();                    
                }                
              
            },
            onAsignarRuc:async function(){
               try {
                let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                let oModelUser = this.getOwnerComponent().getModel("userData");
                let ruc = this.byId("idRuc").getValue();                
                let filterList =[];
                filterList.push(new Filter("Taxnumxl","EQ",ruc))
                const parameters = {
                    filters: filterList,
                    urlParameters: {}
                };
                const oProveedor = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ValidacionNifSet", parameters);
                if( oProveedor.results.length >0 ){
                    if(oProveedor.results[0].Codigo=="500"){
                        oModelUser.setProperty("/userId","");
                        MessageBox.error(oProveedor.results[0].Mensaje);
                    }else{
                        oModelUser.setProperty("/userId",ruc);
                        this.byId("idRazonSocialHome").setValue(oProveedor.results[0].Nombrecompleto);
                        this.byId("idBP").setValue(oProveedor.results[0].Partner);                        
                        this.onObtenerEstados();
                        this._onListaFacturasMini();
                    }                    
                }else{
                    MessageBox.error("No se obtuvo respuesta del servicio para validar el ruc")
                }
               } catch (error) {
                    MessageBox.error("Hubo un error validando el ruc")
               }
                
            },
            onIrDetailListaFacturas:function(e){
                var oFila = e.getSource().getBindingContext().getObject();
                let oModel = this.getOwnerComponent().getModel();
                oModel.setProperty("/oFilaSeleccionada", oFila)
                let data = ""
                oModel.setProperty("/aSolPreregistro", data)
                this.onNavto("ViewDetalleFactura",{preliminar:oFila.Invoicedocnumber})
			},
            onObtenerDatsProveedor:async function(){
                let oModelUser = this.getOwnerComponent().getModel("userData");
                let ruc = oModelUser.getProperty("/userId")
                let ZMMGS_REGPROVEEPP_CRUD_SRV = this.getOwnerComponent().getModel("ZMMGS_REGPROVEEPP_CRUD_SRV");
                try {
                    let filterList =[];
                    filterList.push(new Filter("Taxnumxl","EQ",ruc))
                    const parameters = {
                        filters: filterList,
                        urlParameters: {
                            "$expand":"ContactoComercialDetSet,InformacionContableDetSet,ExpPrincClientesDetSet,SistemaGestionDetSet"
                        }
                    };
                    let oModel = this.getOwnerComponent().getModel();
                    const oProveedor = await this.readEntity(ZMMGS_REGPROVEEPP_CRUD_SRV, "/ConsultaTablaProvSet", parameters);
                    if( oProveedor.results.length >0 ){
                        oModel.setProperty("/oProveedor", oProveedor.results[0])
                    }else{

                    }
                } catch (error) {
                    MessageBox.error("Error al obtener Facturas Mini")
                }  
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
                    estadosSolicitudes.results.forEach(element => {
                        datatest.businessData.push({
                            "Estado": element.Descripcion,
                            "revenue": 0,
                            "Monto": element.Montototal
                        });
                    });
                    
                    this._onIniciarGrafico();
                } catch (error) {
                    MessageBox.error("Error al obtener estados")
                }
            },
            _onIniciarGrafico:function(){
                var oCountryVizFrame = this._constants.vizFrames.country;
                var oAnalysisObject = new AnalysisObject(oCountryVizFrame.analysisObjectProps);
                var aValues = oCountryVizFrame.feedItems[1].values;
                if (aValues.length === 0) {
                    aValues.push(oAnalysisObject);
                }
    
                var oContent = new ChartContainerContent({
                    icon: oCountryVizFrame.icon,
                    title: oCountryVizFrame.title
                });
                oContent.setContent(this._createVizFrame(this._constants.vizFrames.country));
                var oChartContainer = this.getView().byId(this._constants.chartContainerId);
                oChartContainer.addContent(oContent);
    
                //ChartContainerSelectionDetails._initializeSelectionDetails(oContent);
                oChartContainer.updateChartContainer();
            },
            _createVizFrame: function(vizFrameConfig) {
                var oVizFrame = new VizFrame(this._constants.vizFrames.config);
                var oDataPath = sap.ui.require.toUrl(this._constants.sampleName + vizFrameConfig.dataPath);
                var oModel = new JSONModel(datatest);
                var oDataSet = new FlattenedDataset(vizFrameConfig.dataset);
    
                oVizFrame.setDataset(oDataSet);
                oVizFrame.setModel(oModel);
                this._addFeedItems(oVizFrame, vizFrameConfig.feedItems);
                var customColors = [
                    "#0000ff", // azul
                    "#00ff00", // verde
                    "#ff0000", // rojo
                    "#00ff00", // verde
                    "#0000ff", // azul
                    "#0000ff", // azul
                    "#0000ff", // azul
                    // Añade más colores si lo necesitas
                ];
                oVizFrame.setVizProperties({
                    plotArea: {
                        dataLabel: {
                            visible: true
                        },
                        colorPalette: customColors // Aplica el conjunto de colores personalizado
                    },
                    title: {
                        visible: true,
                        text: "Montos de Facturas" // Cambia esto por el título deseado
                    }
                });
                oVizFrame.setVizType(vizFrameConfig.vizType);
                return oVizFrame;
            },
            _addFeedItems: function(vizFrame, feedItems) {
                for (let i = 0; i < feedItems.length; i++) {
                    vizFrame.addFeed(new FeedItem(feedItems[i]));
                }
            },
            _onListaFacturasMini:async function(){
                let oModel = this.getOwnerComponent().getModel();
                let oModelUser = this.getOwnerComponent().getModel("userData");
                let ruc = oModelUser.getProperty("/userId")
                let filterList =[];
                filterList.push(new Filter("Filas","EQ",5))
                // let filter1 = new Filter("Codigoestado","EQ","01")
                // let filter2 = new Filter("Codigoestado","EQ","02")
                // var filtroCombinado = new Filter({
                //     filters: [filter1, filter2],
                //     and: false // Usar 'and: false' para combinar los filtros con 'or'
                // });
                // filterList.push(filtroCombinado);
                filterList.push(new Filter("Stcd1","EQ",ruc))
                const parameters = {
                    filters: filterList,
                    urlParameters: {
                        "$expand":"ConsultaRegFacturasDetSet"
                    }
                };
                let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                try {

                    const facturasMini = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaRegFacturasCabSet", parameters);
                    let respuesta = facturasMini.results;
                    respuesta.forEach(element => {
                        switch (element.Codigoestado) {
                            case "01":
                                element.Estatus = sap.ui.core.ValueState.Information;
                                break;
                            case "02":
                            case "03":
                                element.Estatus = sap.ui.core.ValueState.Success;
                                break;
                            case "05":
                                element.Estatus = sap.ui.core.ValueState.Warning;
                                break;
                            default:
                                element.Estatus = sap.ui.core.ValueState.Error; // Valor predeterminado si no coincide con ningún caso
                                break;
                        }
                    });
                    oModel.setProperty("/ListaFacturasMini", respuesta)
                } catch (error) {
                    MessageBox.error("Error al obtener Facturas Mini")
                }  
            },
            onIrCrearFactura:function(){
                
                let oModelUser = this.getOwnerComponent().getModel("userData");
			    let ruc = oModelUser.getProperty("/userId")
                if(ruc == ""){
                    MessageBox.error("Ingrese un ruc valido para poder continuar")
                }
                this.onNavto("ViewCrearFactura",{bussinesPartner:ruc})
            },
            onIrListaFacturas:function(){
                let oModel = this.getOwnerComponent().getModel();
                let oFila = "";
                oModel.setProperty("/oFilaSeleccionada", oFila)
                this.onNavto("ViewListaFactura")
            }

        });
    });
