sap.ui.define([
    "./BaseController",
	"sap/ui/thirdparty/jquery",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/base/Log",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/core/format/DateFormat",
	"sap/ui/integration/library",
	"sap/ui/core/date/UI5Date",
    'sap/m/p13n/Engine',
	'sap/m/p13n/SelectionController',
	'sap/m/p13n/SortController',
	'sap/m/p13n/GroupController',
	'sap/m/p13n/FilterController',
	'sap/m/p13n/MetadataHelper',
	'sap/ui/model/Sorter',
	'sap/m/ColumnListItem',
	'sap/m/Text',
	'sap/ui/core/library',
	'sap/m/table/ColumnWidthController',
	'sap/ui/model/Filter',
    'sap/ui/model/BindingMode',
    'sap/viz/ui5/format/ChartFormatter',
    'sap/viz/ui5/api/env/Format'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, jQuery, MessageToast, MessageBox, Log, JSONModel, Device, DateFormat, integrationLibrary, UI5Date, Engine, 
        SelectionController, SortController, GroupController, FilterController, MetadataHelper, Sorter, ColumnListItem, 
        Text, coreLibrary, ColumnWidthController, Filter, BindingMode, ChartFormatter, Format) {
        "use strict";
        let that,
            oModelRegProveepCrud,
            oModelPreRegProv;

        let aProveedoresD = [],
            aCantEstadosD = [],
            aActualizacionD = []

        return BaseController.extend("ns.cosapi.aprobacionsolppro.controller.Home", {

            //Configuración Donuts
            dataPath : "ns/cosapi/aprobacionsolppro/model",
            settingsModel : {
                dataset : {
                    name: "Dataset",
                    defaultSelected : 1,
                    values : [{
                        name : "Small",
                        value : "/small.json"
                    },{
                        name : "Medium",
                        value : "/medium.json"
                    }]
                },
                series : {
                    name : "Series",
                    defaultSelected : 0,
                    enabled : false,
                    values : [{
                        name : "1 Series"
                    }, {
                        name : '2 Series'
                    }]
                },
                dataLabel : {
                    name : "Value Label",
                    defaultState : false
                },
                axisTitle : {
                    name : "Axis Title",
                    defaultState : false,
                    enabled : false
                }
            },
            settingsModelColumn : {
                dataset : {
                    name: "Dataset",
                    defaultSelected : 1,
                    values : [{
                        name : "Small",
                        value : "/betterSmall.json"
                    },{
                        name : "Medium",
                        value : "/betterMedium.json"
                    },{
                        name : "Large",
                        value : "/betterLarge.json"
                    }]
                },
                series : {
                    name : "Series",
                    defaultSelected : 0,
                    values : [{
                        name : "1 Series",
                        value : ["Estado"]
                    }, {
                        name : '2 Series',
                        value : ["Estado", "Cost"]
                    }]
                },
                dataLabel : {
                    name : "Value Label",
                    defaultState : true
                },
                axisTitle : {
                    name : "Axis Title",
                    defaultState : false
                },
                dimensions: {
                    Small: [{
                        name: 'Seasons',
                        value: "{Seasons}"
                    }],
                    Medium: [{
                        name: 'Week',
                        value: "{Week}"
                    }],
                    Large: [{
                        name: 'Week',
                        value: "{Week}"
                    }]
                },
                measures: [{
                   name: 'Estado',
                   value: '{Estado}'
                },{
                   name: 'Cost',
                   value: '{Cost}'
                }]
            },
            oVizFrame : null,
            oVizFrameColumn : null,

            onInit: function () {
                that = this;
                oModelRegProveepCrud = this.getOwnerComponent().getModel("ZMMGS_REGPROVEEPP_CRUD_SRV");
                oModelPreRegProv = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_PROV_SRV");

                let cardManifests = new JSONModel(),
                    date = DateFormat.getDateInstance({style: "long"}).format(UI5Date.getInstance());

                this.byId("sideNavigation").setExpanded(false);
                this.getView().setModel(cardManifests, "manifests");
                this.getView().setModel(new JSONModel({
                    date: date,
                    widthFlex: "21%",
                    widthFlexPre: "14%",
                    isPhone: Device.system.phone,
                    iColumn: Device.system.desktop ? 2 : 4,
                    BusquedaAct: {},
                    BusquedaPro: {},
                    BusquedaPre: {}
                }));
                this.getView().setModel(new JSONModel({}), "datos")

                if (Device.system.phone || Device.system.tablet) {
                    let sSystem = Device.system.phone ? "Phone" : "Tablet";
                    this.byId("sideNavigation").setExpanded(false);
                    this.onScreenSizeChanged({name: sSystem});
                }

                Device.media.attachHandler(this.onScreenSizeChanged, this);
                //cardManifests.loadData(sap.ui.require.toUrl("ns/cosapi/aprobacionsolppro/model/cardManifests.json"));

                let sSystem = Device.system.desktop ? "Desktop" : "Phone";
                
                this.oColumnas = this.obtenerColumnas(sSystem);

                //Solicitudes de hoy
                let oSolicitudesHoy = new JSONModel(sap.ui.require.toUrl("ns/cosapi/aprobacionsolppro/model/solicitudeshoy.json"));
			    this.getView().setModel(oSolicitudesHoy, "oSolicitudesHoy");

                //Lista de proveedores
                let oListaProveedor = new JSONModel(sap.ui.require.toUrl("ns/cosapi/aprobacionsolppro/model/solicitudeshoy.json"));
			    this.getView().setModel(oListaProveedor, "oListaProveedor");
                this._getListaPaises()
                this._getListaCategoria()
                this._getListaGrupos()
                this.getRouter().getRoute("RouteHome").attachPatternMatched(this._onObjectMatched, this)
            },

            _onObjectMatched: async function () {
                await this.getCantSolicitudes()
                this._getListaEstado()
                this._getListaValidacion()
                this._getListaTipoProveedor()
                await this._getSolicitudPreRegistro([])
                await this._getSolicitudActualizar([])
                await this._getListaProveedor([])
                let oReturn = this.buildFormatoDashBoard(aProveedoresD, aCantEstadosD, aActualizacionD)
                this.getView().getModel("manifests").setData(oReturn)
            },

            onSearchPreRegistro: function () {
                let busqueda = this.getView().getModel().getProperty("/BusquedaPre"),
                filterList = [],
                filters = []

                if (busqueda.ruc) {
                    if(busqueda.ruc) filterList.push(new Filter("Taxnumxl","EQ",busqueda.ruc))
                } else if (busqueda.razonsocial) {
                    if(busqueda.razonsocial) filterList.push(new Filter("Taxnumxl","EQ",busqueda.razonsocial))
                }
                
                if(busqueda.validacion) filterList.push(new Filter("Validacion","EQ",busqueda.validacion))
                if(busqueda.pais) filterList.push(new Filter("Pais","EQ",busqueda.pais))

                if(busqueda.estado)  {
                    let aFilterEstado = []
                    if (busqueda.estado.length !== 0) {
                        busqueda.estado.map(estado => {
                            aFilterEstado.push(new Filter("Descripcioncodigoestado","EQ",estado))
                        })

                        filters.push(new Filter({
                            filters: aFilterEstado,
                            and: false
                        }))
                    }
                }

                if ( busqueda.fechaInicio && busqueda.fechaFin ) {
                    let sFecha = busqueda.fechaInicio + "-" + busqueda.fechaFin
                    filterList.push(new Filter("Fechacreacion","EQ",sFecha))
                } else if ( busqueda.fechaInicio && !busqueda.fechaFin ) {
                    let sFecha = busqueda.fechaInicio + "-" +busqueda.fechaInicio
                    filterList.push(new Filter("Fechacreacion","EQ",sFecha))
                } else if ( !busqueda.fechaInicio && busqueda.fechaFin ) {
                    let sFecha = busqueda.fechaFin + "-" + busqueda.fechaFin
                    filterList.push(new Filter("Fechacreacion","EQ",sFecha))
                }
                
                let filterCodEstado = [
                    new Filter("Codigoestado","EQ","01"),
                    new Filter("Codigoestado","EQ","03")
                ]
                filterList.push(new Filter({
                    filters: filterCodEstado,
                    and: false
                }))

                if(filterList.length > 0) {
                    filters.push(new Filter({
                        filters: filterList,
                        and: true
                    }))
                }

                that._getSolicitudPreRegistro(filters)

                function getKeyTipoProv (sText) {
                    let sReturn = ""
                    switch (sText) {
                        case "Bienes":
                            sReturn = "Tprovbienes"
                            break
                        case "Servicios":
                            sReturn = "Tprovservicios"
                            break
                        case "Subcontratista":
                            sReturn = "Tprovsubcontratista"
                            break
                    }
                    return sReturn
                }
            },

            _getSolicitudPreRegistro: async function(filters){
                if (filters.length === 0) {
                    let filterList = [];
                    let filterCodEstado = [
                        new Filter("Codigoestado","EQ","01"),
                        new Filter("Codigoestado","EQ","03")
                    ]
                    filterList.push(new Filter({
                        filters: filterCodEstado,
                        and: false
                    }))

                    if(filterList.length > 0) {
                        filters.push(new Filter({
                            filters: filterList,
                            and: true
                        }))
                    }
                }
                
                const parameters = {
                    filters: filters,
                    urlParameters: {
                        "$expand":"ContactoComercialDetSet,InformacionContableDetSet,ExpPrincClientesDetSet,SistemaGestionDetSet,CuentasBancariasDetSet"
                    }
                }

                return new Promise(async(resolve,reject) => {
                    try {

                        const aSolicitudPreRegistro = await that.readEntity(oModelRegProveepCrud, '/ConsultaTablaProvSet', parameters)
                        this.getView().setModel(new JSONModel(aSolicitudPreRegistro.results), "aSolPreregistro");
                        resolve(true)
                    } catch (error) {
                        reject(false)
                        console.log("_getSolicitudPreRegistro" + error)

                    }
                });
                

            },

            onCleanFilterPreRegistro: function () {
                this.getView().getModel().setProperty("/BusquedaPre", {})
                this.byId("preRegistroFragment--mcbRazonSocial").setSelectedItem([]);
                that._getSolicitudPreRegistro([]);
            },

            onCleanFilterActualizacion: function () {
                this.getView().getModel().setProperty("/BusquedaAct", {})
                this.byId("actualizacionragment--mcbRazonSocial").setSelectedItem([]);
                that._getSolicitudActualizar([]);
            },

            // *********************************
            //Funciones fragment Actualizacion
            // *********************************
            getCantSolicitudes: async function () {
                return new Promise(async(resolve,reject) => {
                    try {
                        const cantSolicitudes = await that.readEntity(oModelRegProveepCrud, "/ConsultaSolicitudesSet", {});
                        let oHeaderInicio = {
                            cantEnRegistro: cantSolicitudes.results[0].Cantidad,
                            cantBaseDatos: cantSolicitudes.results[1].Cantidad,
                            cantApto: cantSolicitudes.results[2].Cantidad,
                            cantRechazadas: cantSolicitudes.results[3].Cantidad,
                            cantProveedor: cantSolicitudes.results[4].Cantidad,
                            cantBloqueado: cantSolicitudes.results[5].Cantidad
                        };

                        let total = oHeaderInicio.cantEnRegistro +
                            oHeaderInicio.cantBaseDatos +
                            oHeaderInicio.cantApto +
                            oHeaderInicio.cantProveedor +
                            oHeaderInicio.cantBloqueado +
                            oHeaderInicio.cantRechazadas;

                        oHeaderInicio.total = total
                        this.setModel(new JSONModel(oHeaderInicio), "oHeaderInicio");
                        aCantEstadosD = oHeaderInicio
                        resolve(true)
                    } catch (error) {
                        reject(false)
                        console.log("Funcion getCantSolicitudes: " + error);
                    }
                });
            },

            onSelectSide: function(oEvent) {
                let navCon = this.byId("navCon");
                let sKey = oEvent.getParameter("item").getTarget();
                if (sKey) {
                    navCon.to(this.byId(sKey), "flip");
                }
                
                switch (sKey) {
                    case "PreRegistro":
                        this.setIdFragment("preRegistroFragment--");
                        this.setIdTable("preRegistroTable");
                        this.setsModelo("aSolPreregistro");
                        this.setaMetadataHelper(this.oColumnas.aPreRegistro);
                        
                        var onIrDetailPreRegistro = function(oEvent) {
                            let oObject = oEvent.getSource().getBindingContext("aSolPreregistro").getObject();
                            this.getOwnerComponent().setModel(new JSONModel(oObject), "oSolPreRegistro");
                            this.getRouter().navTo("DetallePreRegistro");
                        }.bind(this);
                        
                        this.setGlobalFunction(onIrDetailPreRegistro);

                        this._registerForP13n();
                        break;
                    case "Actualizacion":
                        this.setIdFragment("actualizacionragment--");
                        this.setIdTable("actualizacionTable");
                        this.setsModelo("aActualizacion");
                        this.setaMetadataHelper(this.oColumnas.aActualizacion);
                        
                        var onIrDetailActualizacion = function(oEvent) {
                            let oActualizacion = oEvent.getSource().getBindingContext("aActualizacion").getObject();
                            this.getOwnerComponent().setModel(new JSONModel(oActualizacion), "oActualizacion");
                            this.getRouter().navTo("DetalleActualizacion");
                        }.bind(this);
                        
                        this.setGlobalFunction(onIrDetailActualizacion);
                        
                        this._registerForP13n();
                        //this.cargarListaActualizacion();
                        break;
                    case "Proveedor":
                        this.setIdFragment("proveedorFragment--");
                        this.setIdTable("proveedorTable");
                        this.setsModelo("aProveedores");
                        this.setaMetadataHelper(this.oColumnas.aProveedor);
                        
                        var onIrDetailProveedor = function(oEvent) {
                            let oProveedor = oEvent.getSource().getBindingContext("aProveedores").getObject();
                            this.getOwnerComponent().setModel(new JSONModel(oProveedor), "oViewProveedor");
                            this.getRouter().navTo("DetalleProveedor");
                        }.bind(this);
                        
                        this.setGlobalFunction(onIrDetailProveedor);

                        this._registerForP13n();
                        break;
                }
            },

            onStyleMenu: function() {
                let oSideNavigation = this.byId("sideNavigation"),
                    bExpanded = oSideNavigation.getExpanded();
    
                oSideNavigation.setExpanded(!bExpanded);

                if (bExpanded) {
                    this.byId("ctlMenu").setSrc("sap-icon://indent");
                } else {
                    this.byId("ctlMenu").setSrc("sap-icon://outdent");
                }                
            },

            onScreenSizeChanged: function(oEvent) {
                let sCurrentMedia;
                if (oEvent.name) {
                    sCurrentMedia = oEvent.name
                } else {
                    sCurrentMedia =  oEvent.getParameter("name")
                }

                //let oFlexBox = this.getView().byId("homeFragment--tuFlexBoxId");
                if (sCurrentMedia === "Phone" || sCurrentMedia === "Tablet") {
                    //oFlexBox.setDirection("Column");
                    this.getView().getModel().setProperty("/widthFlex", "100%");
                    //this.byId("preRegistroFragment--vBoxCardPreRegistro").setVisible(false);
                } else {
                    //oFlexBox.setDirection("Row");
                    this.getView().getModel().setProperty("/widthFlex", "21%");
                }
            },
            
            formatEstados: function (sValue) {
                if (sValue == "EN REGISTRO") {
                    return "Warning";
                } else if (sValue == "BASE DE DATOS") {
                    return "Warning";
                } else if (sValue == "RECHAZADO") {
                    return "Error";
                } else if (sValue == "POTENCIAL") {
                    return "Warning";
                } else if (sValue == "APTO") {
                    return "Success";
                } else if (sValue == "PROVEEDOR") {
                    return "Success";
                } else if (sValue == "BLOQUEADO") {
                    return "Information";
                } else {
                    return "None";
                }
            },

            activeObjectStatus: function (sValue) {
                if (sValue == "RECHAZADO") {
                    return true
                } else {
                    return false
                }
            },

            onVerMotivoRechazo: async function (oEvent, sContext) {
                try {
                    let oObject = oEvent.getSource().getBindingContext(sContext).getObject()
                    let filters = []

                    filters.push(new Filter("Taxnumxl", "EQ", `${oObject.Taxnumxl}`))
                    filters.push(new Filter("Motivorechazo", "EQ", 'X'))

                    const aMotivo = await this.readEntity(oModelPreRegProv, "/HistorialDeEstadosSet", {filters})
                    let oMotivo = aMotivo.results[0]
                    MessageBox.error(formatoMensaje(oMotivo.Fecha, oMotivo.Hora, oMotivo.Motivorechazo),{
                        title: oMotivo.Codigodescripcion,
                    })
                } catch (error) {
                    console.log("Funcion onVerMotivoRechazo: " + error)
                }

                function formatoFecha (sValue) {
                    var anio = sValue.substring(0, 4);
                    var mes = sValue.substring(4, 6);
                    var dia = sValue.substring(6, 8);
                    
                    return `${dia}-${mes}-${anio}`;
                }

                function formatoHora (sValue) {
                    var horas = sValue.substring(0, 2);
                    var minutos = sValue.substring(2, 4);
                    var segundos = sValue.substring(4, 6);

                    return `${horas}:${minutos}:${segundos}`;
                }

                function formatoMensaje (Fecha, Hora, Motivo) {
                    let sMensaje = ""

                    sMensaje = "Fecha: " + formatoFecha(Fecha) + "\n" + "Hora: " + formatoHora(Hora) + "\n" + "Motivo: " + Motivo

                    return sMensaje
                }
            },

            onIrDetailPreRegistro: function (oEvent) {
                let oObject = oEvent.getSource().getBindingContext("aSolPreregistro").getObject();
                this.getOwnerComponent().setModel(new JSONModel(oObject), "oSolPreRegistro");
                that.getRouter().navTo("DetallePreRegistro");
            },

            // *********************************
            //Funciones fragment Actualizacion
            // *********************************
            onIrDetailActualizacion: function (oEvent) {
                let oActualizacion = oEvent.getSource().getBindingContext("aActualizacion").getObject();
                this.getOwnerComponent().setModel(new JSONModel(oActualizacion), "oActualizacion");
                this.getRouter().navTo("DetalleActualizacion");
            },
            
            cargarListaActualizacion: function () {
                let oModel = new JSONModel(sap.ui.require.toUrl("ns/cosapi/aprobacionsolppro/model/actualizacion.json"));
                //this.getOwnerComponent().setModel(oModel, "aActualizacion");
                this.getView().setModel(oModel, "aActualizacion");
            },
            
            onSearchActualizar: function () {
                let busqueda = this.getView().getModel().getProperty("/BusquedaAct"),
                filterList = [],
                filters = []

                if (busqueda.ruc) {
                    if(busqueda.ruc) filterList.push(new Filter("Taxnumxl","EQ",busqueda.ruc))
                } else if (busqueda.razonsocial) {
                    if(busqueda.razonsocial) filterList.push(new Filter("Taxnumxl","EQ",busqueda.razonsocial))
                }
                
                if(busqueda.validacion) filterList.push(new Filter("Validacion","EQ",busqueda.validacion))
                if(busqueda.pais) filterList.push(new Filter("Pais","EQ",busqueda.pais))
                if(busqueda.ort01) filterList.push(new Filter("Ort01","EQ",busqueda.ort01))
                if(busqueda.grupo) filterList.push(new Filter("Matkl","EQ",busqueda.grupo))
                if(busqueda.categoria) filterList.push(new Filter("Bklas","EQ",busqueda.categoria))

                if(busqueda.TipoProveedor)  {
                    if (busqueda.TipoProveedor.length !== 0) {
                        busqueda.TipoProveedor.map(tipoproveedor => {
                            filterList.push(new Filter(getKeyTipoProv(tipoproveedor),"EQ","X"))
                        })
                    }
                }

                if(busqueda.estado)  {
                    let aFilterEstado = []
                    if (busqueda.estado.length !== 0) {
                        busqueda.estado.map(estado => {
                            aFilterEstado.push(new Filter("Descripcioncodigoestado","EQ",estado))
                        })

                        filters.push(new Filter({
                            filters: aFilterEstado,
                            and: false
                        }))
                    }
                }

                if ( busqueda.fechaInicio && busqueda.fechaFin ) {
                    let sFecha = busqueda.fechaInicio + "-" + busqueda.fechaFin
                    filterList.push(new Filter("Fechacreacion","EQ",sFecha))
                } else if ( busqueda.fechaInicio && !busqueda.fechaFin ) {
                    let sFecha = busqueda.fechaInicio + "-" +busqueda.fechaInicio
                    filterList.push(new Filter("Fechacreacion","EQ",sFecha))
                } else if ( !busqueda.fechaInicio && busqueda.fechaFin ) {
                    let sFecha = busqueda.fechaFin + "-" + busqueda.fechaFin
                    filterList.push(new Filter("Fechacreacion","EQ",sFecha))
                }
                
                let filterCodEstado = [
                    new Filter("Codigoestado","EQ","01"),
                    new Filter("Codigoestado","EQ","02"),
                    new Filter("Codigoestado","EQ","04"),
                    new Filter("Codigoestado","EQ","05"),
                    new Filter("Codigoestado","EQ","06"),
                    new Filter("Codigoestado","EQ","07"),
                    new Filter("Codigoestado","EQ","08")
                ]
                filterList.push(new Filter({
                    filters: filterCodEstado,
                    and: false
                }))

                if(filterList.length > 0) {
                    filters.push(new Filter({
                        filters: filterList,
                        and: true
                    }))
                }

                that._getSolicitudActualizar(filters)

                function getKeyTipoProv (sText) {
                    let sReturn = ""
                    switch (sText) {
                        case "Bienes":
                            sReturn = "Tprovbienes"
                            break
                        case "Servicios":
                            sReturn = "Tprovservicios"
                            break
                        case "Subcontratista":
                            sReturn = "Tprovsubcontratista"
                            break
                    }
                    return sReturn
                }
            },

            _getSolicitudActualizar: async function(filters){
                if (filters.length === 0) {
                    let filterList = [];
                    let filterCodEstado = [
                        new Filter("Codigoestado","EQ","01"),
                        new Filter("Codigoestado","EQ","02"),
                        new Filter("Codigoestado","EQ","04"),
                        new Filter("Codigoestado","EQ","05"),
                        new Filter("Codigoestado","EQ","06"),
                        new Filter("Codigoestado","EQ","07"),
                        new Filter("Codigoestado","EQ","08")
                    ]
                    filterList.push(new Filter({
                        filters: filterCodEstado,
                        and: false
                    }))

                    if(filterList.length > 0) {
                        filters.push(new Filter({
                            filters: filterList,
                            and: true
                        }))
                    }
                }
                
                const parameters = {
                    filters: filters,
                    urlParameters: {
                        "$expand":"ContactoComercialDetSet,InformacionContableDetSet,ExpPrincClientesDetSet,SistemaGestionDetSet,CuentasBancariasDetSet,ReferenciasFinDetSet,SistemasCalidadDetSet,EjecutivosEmpresaDetSet,SistemaGestionSeguridadDetSet,LineaNegocioDetSet,LineaProductoDetSet"
                    }
                }
                
                return new Promise(async(resolve,reject) => {
                    try {
                        const aSolicitudPreRegistro = await that.readEntity(oModelRegProveepCrud, '/ConsultaTablaProvSet', parameters)
                        this.getView().setModel(new JSONModel(aSolicitudPreRegistro.results), "aActualizacion");
                        aActualizacionD = aSolicitudPreRegistro.results
                        resolve(true)
                    } catch (error) {
                        console.log("_getSolicitudActualizar" + error)
                        reject(true)
                    }
                });

            },
            onCleanFilterActualizar: function () {
                this.getView().getModel().setProperty("/Busqueda", {})
                this.byId("actualizacionragment--mcbRazonSocial").setSelectedItem([]);
                that._getSolicitudActualizar([]);
            },

            // *********************************
            //Funciones fragment Proveedor
            // *********************************
            onIrDetailProveedor: function (oEvent) {
                let oProveedor = oEvent.getSource().getBindingContext("aProveedores").getObject();
                this.getOwnerComponent().setModel(new JSONModel(oProveedor), "oViewProveedor");
                this.getRouter().navTo("DetalleProveedor");
            },

            onSearchProveedor: function () {
                let busqueda = this.getView().getModel().getProperty("/BusquedaPro"),
                filterList = [],
                filters = []
                
                if (busqueda.ruc) {
                    if(busqueda.ruc) filterList.push(new Filter("Taxnumxl","EQ",busqueda.ruc))
                } else if (busqueda.razonsocial) {
                    if(busqueda.razonsocial) filterList.push(new Filter("Taxnumxl","EQ",busqueda.razonsocial))
                }
                
                if(busqueda.validacion) filterList.push(new Filter("Validacion","EQ",busqueda.validacion))
                if(busqueda.pais) filterList.push(new Filter("Pais","EQ",busqueda.pais))
                if(busqueda.ort01) filterList.push(new Filter("Ort01","EQ",busqueda.ort01))
                if(busqueda.grupo) filterList.push(new Filter("Matkl","EQ",busqueda.grupo))
                if(busqueda.categoria) filterList.push(new Filter("Bklas","EQ",busqueda.categoria))

                if(busqueda.TipoProveedor)  {
                    if (busqueda.TipoProveedor.length !== 0) {
                        busqueda.TipoProveedor.map(tipoproveedor => {
                            filterList.push(new Filter(getKeyTipoProv(tipoproveedor),"EQ","X"))
                        })
                    }
                }

                if ( busqueda.fechaInicio && busqueda.fechaFin ) {
                    let sFecha = busqueda.fechaInicio + "-" + busqueda.fechaFin
                    filterList.push(new Filter("Fechacreacion","EQ",sFecha))
                } else if ( busqueda.fechaInicio && !busqueda.fechaFin ) {
                    let sFecha = busqueda.fechaInicio + "-" +busqueda.fechaInicio
                    filterList.push(new Filter("Fechacreacion","EQ",sFecha))
                } else if ( !busqueda.fechaInicio && busqueda.fechaFin ) {
                    let sFecha = busqueda.fechaFin + "-" + busqueda.fechaFin
                    filterList.push(new Filter("Fechacreacion","EQ",sFecha))
                }

                filterList.push(new Filter("Versololosdebp","EQ","X"))

                let filterCodEstado = [
                    new Filter("Codigoestado","EQ","04"),
                    new Filter("Codigoestado","EQ","05"),
                    new Filter("Codigoestado","EQ","06")
                ]
                filterList.push(new Filter({
                    filters: filterCodEstado,
                    and: false
                }))

                if(filterList.length > 0) {
                    filters.push(new Filter({
                        filters: filterList,
                        and: true
                    }))
                }

                that._getListaProveedor(filters)

                function getKeyTipoProv (sText) {
                    let sReturn = ""
                    switch (sText) {
                        case "Bienes":
                            sReturn = "Tprovbienes"
                            break
                        case "Servicios":
                            sReturn = "Tprovservicios"
                            break
                        case "Subcontratista":
                            sReturn = "Tprovsubcontratista"
                            break
                    }
                    return sReturn
                }
            },

            _getListaProveedor: async function(filters){
                if (filters.length == 0) {
                    filters.push(new Filter("Versololosdebp","EQ","X"))
                }

                const parameters = {
                    filters: filters,
                    urlParameters: {
                        "$expand":"ContactoComercialDetSet,InformacionContableDetSet,ExpPrincClientesDetSet,SistemaGestionDetSet,CuentasBancariasDetSet,ReferenciasFinDetSet,SistemasCalidadDetSet,EjecutivosEmpresaDetSet,SistemaGestionSeguridadDetSet,LineaNegocioDetSet,LineaProductoDetSet"
                    }
                }

                return new Promise(async(resolve,reject) => {
                    try {
                        const aListaProveedor = await that.readEntity(oModelRegProveepCrud, '/ConsultaTablaProvSet', parameters)
                        this.getView().setModel(new JSONModel(aListaProveedor.results), "aProveedores");
                        aProveedoresD = aListaProveedor.results
                        resolve(true)
                    } catch (error) {
                        reject(false)
                        console.log("_getListaProveedor" + error)
                    }
                });

            },

            onCleanFilterProveedor: function () {
                this.getView().getModel().setProperty("/BusquedaPro", {})
                this.byId("proveedorFragment--mcbRazonSocial").setSelectedItem([]);
                that._getListaProveedor([]);
            },

            onActionProveedor: function (oEvent) {
                let sId = oEvent.getParameter("parameters").name;
                let oProveedor = this.getView().getModel("aProveedores").getData().find( oPos=> oPos.Numerodebp == sId );
                this.getOwnerComponent().setModel(new JSONModel(oProveedor), "oViewProveedor");
                this.getRouter().navTo("DetalleProveedor");
            },

            onActionSolicitud: function (oEvent) {
                let sId = oEvent.getParameter("parameters").name;
                let oActualizacion = this.getView().getModel("aActualizacion").getData().find( oPos=> oPos.Taxnumxl == sId );
                this.getOwnerComponent().setModel(new JSONModel(oActualizacion), "oActualizacion");
                this.getRouter().navTo("DetalleActualizacion");
            },

            //Función para guardar la Información Contable
            onSaveInfoContable: async function (oEvent) {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/InformacionContable");
                
                oProveedor.Taxnumxl = oPreRegistro.Taxnumxl
                
                try {
                    const oResultCreateProveedor = await this.createEntity(oModelRegProveepCrud, "/InformacionContableCabSet", oProveedor)
                    
                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje);
                    }
                } catch (error) {
                    console.log("onSaveInfoContable" + error)
                    return "Error"
                }
            },

            /****************************************************/
            /** Funciones para obtener datos de los despegables */
            /****************************************************/
            _getListaEstado: async function(){
                try {
                    let oModel = this.getView().getModel()
                    const aListaEstado = await this.readEntity(oModelPreRegProv, "/ConsultaEstadosProvSet", {})
                    oModel.setProperty("/Estado", aListaEstado.results)
                } catch (error) {
                    console.log("Funcion _getListaEstado: " + error)
                }
            },

            _getListaValidacion: async function(){
                try {
                    let oModel = this.getView().getModel()
                    const aListaValidacion = await this.readEntity(oModelPreRegProv, "/ConsultaValidacionSet", {})
                    oModel.setProperty("/Validacion", aListaValidacion.results)
                } catch (error) {
                    console.log("Funcion _getListaValidacion: " + error)
                }
            },

            _getListaTipoProveedor: async function(){
                try {
                    let oModel = this.getView().getModel()
                    const aListaTipoProveedor = await this.readEntity(oModelPreRegProv, "/ConsultaTipoProveedorSet", {})
                    oModel.setProperty("/TipoProveedor", aListaTipoProveedor.results)
                } catch (error) {
                    console.log("Funcion _getListaTipoProveedor: " + error)
                }
            },

            _getListaPaises: async function(){
                try {
                    let oModel = this.getView().getModel("datos")
                    const aListaPaises = await this.readEntity(oModelPreRegProv, "/ConsultaPaisesSet", {})
                    oModel.setSizeLimit(9000);
                    oModel.setProperty("/Paises", aListaPaises.results)
                } catch (error) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(error)
                    console.log("Funcion _getListaPaises: " + error)
                }
            },

            onChangePais: async function (oEvent, sId) {
                let sKey = this.byId(sId + "--cboMainPais").getSelectedKey()
                let filters = []
                filters.push(new Filter("Land1", "EQ", `${sKey}`))

                try {
                    let oModel = this.getView().getModel("datos")
                    const aListaRegiones = await this.readEntity(oModelPreRegProv, "/ConsultaRegionDepartamentoSet", {filters})
                    oModel.setProperty("/RegionDptp", aListaRegiones.results)
                    if ( aListaRegiones.results.length == 0 ) {
                        this.byId(sId + "--cboMainRegionDpto").setSelectedKey("")
                    }
                } catch (error) {
                    MessageBox.error(error)
                    console.log("Funcion onChangePais: " + error)
                }
            },

            _getListaCategoria: async function(){
                try {
                    let oModel = this.getView().getModel("datos")
                    const aListaCategoria = await this.readEntity(oModelPreRegProv, "/ConsultaCategoriasSet", {})
                    oModel.setSizeLimit(9000);
                    oModel.setProperty("/Categorias", aListaCategoria.results)
                } catch (error) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(error)
                    console.log("Funcion _getListaCategoria: " + error)
                }
            },

            _getListaGrupos: async function(){
                try {
                    let oModel = this.getView().getModel("datos")
                    const aListaGrupos = await this.readEntity(oModelPreRegProv, "/ConsultaGruposSet", {})
                    oModel.setSizeLimit(9000);
                    oModel.setProperty("/Grupos", aListaGrupos.results)
                } catch (error) {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error(error)
                    console.log("Funcion _getListaGrupos: " + error)
                }
            },

            onSearchNifRazonSocial: function(event){
                const value = event.getParameter("suggestValue"),
                    input = event.getSource(),
                    options = {
                        input,
                        field:"Nifrazonsocial",
                        value: value,
                        property:"RazonSocial"
                    };
                if(value){
                    that._getFiltrosService(options);
                }
            },

            _getFiltrosService: async function(options){
                const filters = []
                if(options.field){
                    filters.push(new Filter(options.field,"EQ",options.value))
                }
                options.input.setBusy(true)
                const provisiones = await this.readEntity(oModelPreRegProv, `/ConsultaNifRazonSocialSet`, {filters})
                this.getView().getModel().setProperty(`/${options.property}`, provisiones.results)
                options.input.setBusy(false);
            },
            
            //Donuts
            dataSort: function(dataset) {
                //let data sorted by revenue
                if (dataset && dataset.hasOwnProperty("milk")) {
                    var arr = dataset.milk;
                    arr = arr.sort(function (a, b) {
                        return b.Revenue - a.Revenue;
                    });
                }
            },
            onAfterRendering : function(){
                // var datasetRadioGroup = this.getView().byId('homeFragment--datasetRadioGroup');
                // datasetRadioGroup.setSelectedIndex(this.settingsModel.dataset.defaultSelected);

                // var seriesRadioGroup = this.getView().byId('homeFragment--seriesRadioGroup');
                // seriesRadioGroup.setSelectedIndex(this.settingsModel.series.defaultSelected);
                // seriesRadioGroup.setEnabled(this.settingsModel.series.enabled);

                // var axisTitleSwitch = this.getView().byId('homeFragment--axisTitleSwitch');
                // axisTitleSwitch.setEnabled(this.settingsModel.axisTitle.enabled);
            },
            onDatasetSelected : function(oEvent){
                var datasetRadio = oEvent.getSource();
                if (this.oVizFrame && datasetRadio.getSelected()){
                    var bindValue = datasetRadio.getBindingContext().getObject();
                    var dataModel = new JSONModel(this.dataPath + bindValue.value);
                    this.oVizFrame.setModel(dataModel);
                    var that = this;
                    this.oVizFrame.getModel().attachRequestCompleted(function() {
                        that.dataSort(this.getData());
                    });
                }
            },
            onDataLabelChanged : function(oEvent){
                if (this.oVizFrame){
                    this.oVizFrame.setVizProperties({
                        plotArea: {
                            dataLabel: {
                                visible: oEvent.getParameter('state')
                            }
                        }
                    });
                }
            }

        });
    });
