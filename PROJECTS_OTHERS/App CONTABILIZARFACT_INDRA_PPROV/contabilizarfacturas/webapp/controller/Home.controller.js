sap.ui.define([
	"./Base.controller",
	"sap/ui/thirdparty/jquery",
	"sap/m/MessageToast",
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
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/library",
    "sap/m/Label",
    "sap/m/TextArea",
    "sap/m/Button",
    "sap/ui/core/Element",
], function(
	Controller, jQuery, MessageToast, Log, JSONModel, Device, DateFormat, integrationLibrary, UI5Date, Engine, 
	SelectionController, SortController, GroupController, FilterController, MetadataHelper, Sorter, ColumnListItem, 
	Text, coreLibrary, ColumnWidthController, Filter,MessageBox,Dialog,mobileLibrary,Label,TextArea,Button,Element
) {
	"use strict";
    let ButtonType = mobileLibrary.ButtonType;
    let DialogType = mobileLibrary.DialogType;
	let sIdTablePreRegistro = "",
	sIdFragmentPreRegistro = "";
	let that;
	return Controller.extend("ns.cosapi.contabilizarfacturas.controller.ListaFactura", {
		onInit:async function () {    
            that=this;     
            that.getRouter().getRoute("RouteHome").attachMatched(that._onRouteMatched,that)            
		 },
         _onRouteMatched:async function(){
            that=this;
            await that.getInfoUser();
            that._onListaFacturas();
            that.onObtenerEstados();
            that.onObtenerSociedades();
            sIdTablePreRegistro = "persoTable"; //Id de la tabla
			sIdFragmentPreRegistro = "" //Si tu vista tiene fragment, colocar el Id	
			that._registerForP13n(); //Función principal para activar las config de la tabla
         },
        onObtenerEstados:async function(){
            let ZMMGS_PRE_REG_FACT_SRV = that.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
            try {
                let oModel = that.getOwnerComponent().getModel();
                let oModelUser = that.getOwnerComponent().getModel("userData");
                let ruc = oModelUser.getProperty("/userId")
                let filterList =[];
                filterList.push(new Filter("Stcd1","EQ",ruc))
                const parameters = {
                    filters: filterList,
                    urlParameters: {}
                };
                const estadosSolicitudes = await that.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaSolicitudesSet", parameters);
                oModel.setProperty("/EstadosSolicitudes", estadosSolicitudes.results)
            } catch (error) {
                MessageBox.error("Error al obtener estados")
            }
        },
          _onListaFacturas:async function(){
            //filtros
                let sSociedad = that.byId("IdSociedadesFiltros").getSelectedKey();
                let serie = that.byId("idSerieCorrelativo").getValue();
                let rucfiltro = that.byId("idRuc").getValue();
                let oFechas = that.byId("idFechaContabilizacion");
                let oFechasEmi = that.byId("idFechaEmision");
                let oEstados = that.byId("idEstadosFiltro");
                let idSecuencia = that.byId("idSecuencia").getValue();
                let filterList =[];
                if(sSociedad != ""){
                    filterList.push(new Filter("Sociedad","EQ",sSociedad))
                }
                if(serie != ""){
                    filterList.push(new Filter("Seriecorrelativo","EQ",serie))
                }
                if(rucfiltro != ""){
                    filterList.push(new Filter("Stcd1","EQ",rucfiltro))
                }
                if(idSecuencia != ""){
                    filterList.push(new Filter("Invoicedocnumber","EQ",idSecuencia))
                }
                if(oFechas.getDateValue() != null || oFechas.getSecondDateValue() != null){
                    filterList.push(new Filter("Rangofechacontabilizacion","EQ",that.formatearFechas(oFechas.getDateValue(),oFechas.getSecondDateValue())))
                }
                if(oFechasEmi.getDateValue() != null || oFechasEmi.getSecondDateValue() != null){
                    filterList.push(new Filter("Rangofechaemision","EQ",that.formatearFechas(oFechasEmi.getDateValue(),oFechasEmi.getSecondDateValue())))
                }
                if(oEstados.getSelectedKeys().length>0){
                    let aFilterTemp = []
                    oEstados.getSelectedKeys().forEach(element => {
                        aFilterTemp.push(new Filter("Codigoestado","EQ",element))
                    });                    
                    var filtroCombinado = new Filter({
                        filters: aFilterTemp,
                        and: false // Usar 'and: false' para combinar los filtros con 'or'
                    });
                    filterList.push(filtroCombinado);
                }
                
                //filterList.push(new Filter("Filas","EQ",5))
                let oModelUser = that.getOwnerComponent().getModel("userData");
                let ruc = oModelUser.getProperty("/userId")
                filterList.push(new Filter("Stcd1","EQ",ruc))
                const parameters = {
                    filters: filterList,
                    urlParameters: {
                        "$expand":"ConsultaRegFacturasDetSet"
                    }
                };
                let ZMMGS_PRE_REG_FACT_SRV = that.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                try {
                    let oModel = that.getOwnerComponent().getModel();
                    const facturasMini = await that.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaRegFacturasCabSet", parameters);
                    let respuesta = facturasMini.results;
                    respuesta.forEach(element => {
                        switch (element.Codigoestado) {
                            case "01":
                                element.Estatus = sap.ui.core.ValueState.Warning;
                                break;
                            case "02":
                            case "03":
                            case "05":
                                element.Estatus = sap.ui.core.ValueState.Success;
                                break;
                            case "04":
                                element.Estatus = sap.ui.core.ValueState.Error;
                                break;
                            default:
                                element.Estatus = sap.ui.core.ValueState.None; // Valor predeterminado si no coincide con ningún caso
                                break;
                        }
                    });
                    oModel.setProperty("/aSolPreregistro", respuesta)
                } catch (error) {
                    MessageBox.error("Error al obtener Facturas Mini")
                }  
            },
            onLimpiarFiltros:function(){
                that.byId("IdSociedadesFiltros").setSelectedKey("");
                that.byId("idSerieCorrelativo").setValue();
                that.byId("idFechaContabilizacion").setValue("");
                that.byId("idRuc").setValue();
                that.byId("idFechaEmision").setValue("");
                that.byId("idEstadosFiltro").setSelectedKeys();
            },
            formatearFechas: function(fechaInicio, fechaFin) {
                // Formatear las fechas
                var dateFormat = DateFormat.getDateInstance({
                    pattern: "yyyyMMdd"
                });
                var fechaInicioFormateada = dateFormat.format(fechaInicio);
                var fechaFinFormateada = dateFormat.format(fechaFin);
    
                // Crear la cadena de texto con el formato deseado
                var resultado = fechaInicioFormateada + "-" + fechaFinFormateada;
    
                // Retornar el resultado
                return resultado;
            },
            onObtenerSociedades:async function(){
                let ZMMGS_PRE_REG_FACT_SRV = that.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                try {
                    let oModel = that.getOwnerComponent().getModel();
                    const sociedades = await that.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaSociedadesSet", []);
                    oModel.setProperty("/Sociedades", sociedades.results)
                } catch (error) {
                    MessageBox.error("Error al obtener estados")
                }
            },
		     // *********************************
            //  Inicio - Funciones fragment Pre Registro
            // *********************************
            _registerForP13n: function() {
                let oTable = that.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
    
                that.oMetadataHelper = new MetadataHelper([
                    {
                        key: "numCorrelativo_col",
                        label: "Número Correlativo",
                        path: "Seriecorrelativo"
                    },
                    {
                        key: "invoiceNumber_col",
                        label: "Secuencia de Pre-Registro",
                        path: "Invoicedocnumber"
                    },
                    {
                        key: "serie_col",
                        label: "Sociedad",
                        path: "Sociedad"
                    },
                    {
                        key: "fechaCon_col",
                        label: "Fecha Contabilización",
                        path: "Fecontabilidadfac"
                    },
                    {
                        key: "fechaEmi_col",
                        label: "Fecha Emisión",
                        path: "Feemision"
                    },
                    {
                        key: "importeigv_col",
                        label: "Importe + IGV",
                        path: "Precioincluigv"
                    },
                    {
                        key: "impuestos_col",
                        label: "Impuestos",
                        path: "Impuesto"
                    },
                    {
                        key: "claseDocumento_col",
                        label: "Clase Documento",
                        path: "Clasedocumento"
                    },
                    {
                        key: "condicionesPago_col",
                        label: "Condiciones Pago",
                        path: "Condpagodescrip"
                    },
                    {
                        key: "indicadorImpuestos_col",
                        label: "Indicador Impuestos",
                        path: "Descripindimpuesto"
                    }
                    ,
                    {
                        key: "detraccion_col",
                        label: "Detracción",
                        path: "Detraccion"
                    },
                    {
                        key: "estado_col",
                        label: "Estado",
                        path: "Descripcioncodigoestado"
                    }
                ]);
    
                Engine.getInstance().register(oTable, {
                    helper: that.oMetadataHelper,
                    controller: {
                        Columns: new SelectionController({
                            targetAggregation: "columns",
                            control: oTable
                        }),
                        Sorter: new SortController({
                            control: oTable
                        }),
                        Groups: new GroupController({
                            control: oTable
                        }),
                        ColumnWidth: new ColumnWidthController({
                            control: oTable
                        }),
                        Filter: new FilterController({
                            control: oTable
                        })
                    }
                });
    
                Engine.getInstance().attachStateChange(that.handleStateChange.bind(that));
            },
    
            openPersoDialog: function(oEvt) {
                that._openPersoDialog(["Columns", "Sorter", "Groups", "Filter"], oEvt.getSource());
            },
    
            _openPersoDialog: function(aPanels, oSource) {
                let oTable = that.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
    
                Engine.getInstance().show(oTable, aPanels, {
                    contentHeight: aPanels.length > 1 ? "50rem" : "35rem",
                    contentWidth: aPanels.length > 1 ? "45rem" : "32rem",
                    source: oSource || oTable
                });
            },
    
            _getKey: function(oControl) {
                return that.getView().getLocalId(oControl.getId());
            },
    
            handleStateChange: function(oEvt) {
                const oTable = that.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
                const oState = oEvt.getParameter("state");
    
                if (!oState) {
                    return;
                }
    
                //Update the columns per selection in the state
                that.updateColumns(oState);
    
                //Create Filters & Sorters
                const aFilter = that.createFilters(oState);
                const aGroups = that.createGroups(oState);
                const aSorter = that.createSorters(oState, aGroups);
    
                const aCells = oState.Columns.map(function(oColumnState) {
                    let sKey = "";
                    if (oColumnState.key.indexOf("--") > 0) {
                        sKey = oColumnState.key.split("--")[1];
                    } else {
                        sKey = oColumnState.key;
                    }
                    if(oColumnState.key == "estado_col"){
                        return new sap.m.ObjectStatus({
                            text: "{" + that.oMetadataHelper.getProperty(sKey).path + "}",
                            state: {
                                path: "Codigoestado",
                                formatter: function(sEstado) {                                  
                                    return that.formatEstados(sEstado);
                                }.bind(that)
                            }
                        });
                    }else{
                        return new Text({
                            text: "{" + that.oMetadataHelper.getProperty(sKey).path + "}"
                        });
                    }
                    
                }.bind(that));
    
                //rebind the table with the updated cell template
                oTable.bindItems({
                    templateShareable: false,
                    path: '/aSolPreregistro',
                    sorter: aSorter.concat(aGroups),
                    filters: aFilter,
                    // template: new ColumnListItem({
                    //     cells: aCells
                    // })
                    template: new ColumnListItem({
                        type: "Navigation",
                        cells: aCells,
                        highlight: {
                            path: 'Codigoestado',
                            formatter: that.formatEstados
                        },
                        press: that.onIrDetailListaFacturas
                    })
                });
                
    
            },
			onIrDetailListaFacturas:function(e){
                var oFila = e.getSource().getBindingContext().getObject();
                let oModel = that.getOwnerComponent().getModel();
                oModel.setProperty("/oFilaSeleccionada", oFila)
                that.onNavto("ViewDetalleFactura",{preliminar:oFila.Invoicedocnumber})
			},
            createFilters: function(oState) {
                const aFilter = [];
                Object.keys(oState.Filter).forEach((sFilterKey) => {
                    const filterPath = that.oMetadataHelper.getProperty(sFilterKey).path;
    
                    oState.Filter[sFilterKey].forEach(function(oConditon) {
                        aFilter.push(new Filter(filterPath, oConditon.operator, oConditon.values[0]));
                    });
                });
    
                that.byId(sIdFragmentPreRegistro + "filterInfo").setVisible(aFilter.length > 0);
    
                return aFilter;
            },
    
            createSorters: function(oState, aExistingSorter) {
                const aSorter = aExistingSorter || [];
                oState.Sorter.forEach(function(oSorter) {
                    const oExistingSorter = aSorter.find(function(oSort) {
                        let sKey = "";
                        if (oSorter.key.indexOf("--") > 0) {
                            sKey = oSorter.key.split("--")[1];
                        } else {
                            sKey = oSorter.key;
                        }
                        return oSort.sPath === that.oMetadataHelper.getProperty(sKey).path;
                    }.bind(that));
    
                    if (oExistingSorter) {
                        oExistingSorter.bDescending = !!oSorter.descending;
                    } else {
                        let sKey = "";
                        if (oSorter.key.indexOf("--") > 0) {
                            sKey = oSorter.key.split("--")[1];
                        } else {
                            sKey = oSorter.key;
                        }
                        
                        aSorter.push(new Sorter(that.oMetadataHelper.getProperty(sKey).path, oSorter.descending));
                    }
                }.bind(that));
    
                oState.Sorter.forEach(function(oSorter) {
                    let sKey = "";
                    if (oSorter.key.indexOf("--") > 0) {
                        sKey = oSorter.key;
                    } else {
                        sKey = sIdFragmentPreRegistro + oSorter.key;
                    }
                    const oCol = that.byId(sKey);
                    if (oSorter.sorted !== false) {
                        oCol.setSortIndicator(oSorter.descending ? coreLibrary.SortOrder.Descending : coreLibrary.SortOrder.Ascending);
                    }
                }.bind(that));
    
                return aSorter;
            },
    
            createGroups: function(oState) {
                const aGroupings = [];
                oState.Groups.forEach(function(oGroup) {
                    let sKey = "";
                    if (oGroup.key.indexOf("--") > 0) {
                        sKey = oGroup.key.split("--")[1];
                    } else {
                        sKey = oGroup.key;
                    }
                    aGroupings.push(new Sorter(that.oMetadataHelper.getProperty(sKey).path, false, true));
                }.bind(that));
    
                oState.Groups.forEach(function(oSorter) {
                    let sKey = "";
                    if (oSorter.key.indexOf("--") > 0) {
                        sKey = oSorter.key;
                    } else {
                        sKey = sIdFragmentPreRegistro + oSorter.key;
                    }
                    
                    const oCol = that.byId(sKey);
                    oCol.data("grouped", true);
                }.bind(that));
    
                return aGroupings;
            },
    
            updateColumns: function(oState) {
                let sIdFragment = "preRegistroFragment";
                let oTable = that.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
    
                oTable.getColumns().forEach(function(oColumn, iIndex) {
                    oColumn.setVisible(false);
                    oColumn.setWidth(oState.ColumnWidth[that._getKey(oColumn)]);
                    oColumn.setSortIndicator(coreLibrary.SortOrder.None);
                    oColumn.data("grouped", false);
                }.bind(that));
    
                oState.Columns.forEach(function(oProp, iIndex) {
                    let sKey = "";
                    if (oProp.key.indexOf("--") > 0) {
                        sKey = oProp.key;
                    } else {
                        sKey = sIdFragmentPreRegistro + oProp.key;
                    }
                    
                    let oCol = that.byId(sKey);
                    oCol.setVisible(true);
    
                    oTable.removeColumn(oCol);
                    oTable.insertColumn(oCol, iIndex);
                }.bind(that));
            },
    
            beforeOpenColumnMenu: function(oEvt) {
                const oMenu = that.byId(sIdFragmentPreRegistro + "menu");
                const oColumn = oEvt.getParameter("openBy");
                const oSortItem = oMenu.getQuickActions()[0].getItems()[0];
                const oGroupItem = oMenu.getQuickActions()[1].getItems()[0];
    
                oSortItem.setKey(that._getKey(oColumn));
                oSortItem.setLabel(oColumn.getHeader().getText());
                oSortItem.setSortOrder(oColumn.getSortIndicator());
    
                oGroupItem.setKey(that._getKey(oColumn));
                oGroupItem.setLabel(oColumn.getHeader().getText());
                oGroupItem.setGrouped(oColumn.data("grouped"));
            },
    
            onColumnHeaderItemPress: function(oEvt) {
                const oColumnHeaderItem = oEvt.getSource();
                let sPanel = "Columns";
                if (oColumnHeaderItem.getIcon().indexOf("group") >= 0) {
                    sPanel = "Groups";
                } else if (oColumnHeaderItem.getIcon().indexOf("sort") >= 0) {
                    sPanel = "Sorter";
                } else if (oColumnHeaderItem.getIcon().indexOf("filter") >= 0) {
                    sPanel = "Filter";
                }
    
                that._openPersoDialog([sPanel]);
            },
    
            onFilterInfoPress: function(oEvt) {
                that._openPersoDialog(["Filter"], oEvt.getSource());
            },
    
            onSort: function(oEvt) {
                const oSortItem = oEvt.getParameter("item");
                const oTable = that.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
                const sAffectedProperty = oSortItem.getKey();
                const sSortOrder = oSortItem.getSortOrder();
    
                //Apply the state programatically on sorting through the column menu
                //1) Retrieve the current personalization state
                Engine.getInstance().retrieveState(oTable).then(function(oState) {
    
                    //2) Modify the existing personalization state --> clear all sorters before
                    oState.Sorter.forEach(function(oSorter) {
                        oSorter.sorted = false;
                    });
    
                    if (sSortOrder !== coreLibrary.SortOrder.None) {
                        oState.Sorter.push({
                            key: sAffectedProperty,
                            descending: sSortOrder === coreLibrary.SortOrder.Descending
                        });
                    }
    
                    //3) Apply the modified personalization state to persist it in the VariantManagement
                    Engine.getInstance().applyState(oTable, oState);
                });
            },
    
            onGroup: function(oEvt) {
                const oGroupItem = oEvt.getParameter("item");
                const oTable = that.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
                const sAffectedProperty = oGroupItem.getKey();
    
                //1) Retrieve the current personalization state
                Engine.getInstance().retrieveState(oTable).then(function(oState) {
    
                    //2) Modify the existing personalization state --> clear all groupings before
                    oState.Groups.forEach(function(oSorter) {
                        oSorter.grouped = false;
                    });
    
                    if (oGroupItem.getGrouped()) {
                        oState.Groups.push({
                            key: sAffectedProperty
                        });
                    }
    
                    //3) Apply the modified personalization state to persist it in the VariantManagement
                    Engine.getInstance().applyState(oTable, oState);
                });
            },
    
            onColumnMove: function(oEvt) {
                const oDraggedColumn = oEvt.getParameter("draggedControl");
                const oDroppedColumn = oEvt.getParameter("droppedControl");
    
                if (oDraggedColumn === oDroppedColumn) {
                    return;
                }
    
                const oTable = that.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
                const sDropPosition = oEvt.getParameter("dropPosition");
                const iDraggedIndex = oTable.indexOfColumn(oDraggedColumn);
                const iDroppedIndex = oTable.indexOfColumn(oDroppedColumn);
                const iNewPos = iDroppedIndex + (sDropPosition == "Before" ? 0 : 1) + (iDraggedIndex < iDroppedIndex ? -1 : 0);
                const sKey = that._getKey(oDraggedColumn);
    
                Engine.getInstance().retrieveState(oTable).then(function(oState) {
    
                    const oCol = oState.Columns.find(function(oColumn) {
                        return oColumn.key === sKey;
                    }) || {
                        key: sKey
                    };
                    oCol.position = iNewPos;
    
                    Engine.getInstance().applyState(oTable, {
                        Columns: [oCol]
                    });
                });
            },
    
            onColumnResize: function(oEvt) {
                const oColumn = oEvt.getParameter("column");
                const sWidth = oEvt.getParameter("width");
                const oTable = that.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
    
                const oColumnState = {};
                oColumnState[that._getKey(oColumn)] = sWidth;
    
                Engine.getInstance().applyState(oTable, {
                    ColumnWidth: oColumnState
                });
            },
    
            onClearFilterPress: function(oEvt) {
                const oTable = that.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
                Engine.getInstance().retrieveState(oTable).then(function(oState) {
                    for (let sKey in oState.Filter) {
                        oState.Filter[sKey].map((condition) => {
                            condition.filtered = false;
                        });
                    }
                    Engine.getInstance().applyState(oTable, oState);
                });
            },

            // *********************************
            //  Fin - Funciones fragment Pre Registro
            // *********************************
		onBack:function(){
			that.onNavBack();
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
        onContabilizar:async function(){
            let oTable = that.byId("persoTable").getSelectedItems();
            if(oTable.length>=0){                
                let oFila = oTable[0].getBindingContext().getObject();
                if(oFila.Codigoestado != "01" && oFila.Codigoestado != "05"){
                    MessageBox.error("Solo se puede contabilizar facturas en estado PRE-REGISTRO u Observado")
                    return;
                }
                try {
                    let oModelUser = that.getOwnerComponent().getModel("userData");
                let name = oModelUser.getProperty("/userAndName")
                let email = oModelUser.getProperty("/email")                       
                let oDato = {
                    "Docpreliminar":oFila.Invoicedocnumber,                    
                    "Fiscalyear":oFila.Fiscalyear,                    
                    "Proveedor":oFila.Proveedor,                    
                    "Sociedad":oFila.Sociedad,                    
                    "Ejercicio":oFila.Ejercicio,                
                    "Seriecorrelativo":oFila.Seriecorrelativo,                    
                    "Usuariolog":name,                    
                    "Correonombrelog":email,                    
                    }
                let ZMMGS_PRE_REG_FACT_SRV = that.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                const oContabilizar = await that.createEntity(ZMMGS_PRE_REG_FACT_SRV, "/PreliminarContabilizadoSet", oDato);
                if(oContabilizar.Codigo == "500"){
                    MessageBox.error(oContabilizar.Mensaje)
					return false;
				}else{
					MessageBox.success("Se contabilizo el documento preliminar"  +oFila.Invoicedocnumber  + " correctamente")
				}
                } catch (error) {
                    MessageBox.error("Ocurrio un error al momento de contabilizar")
                }
                
            }else{
                MessageBox.error("Seleccione una fila para contabilizar")
            }            
        },
        onPreRechazo:function(){
            let oTable = that.byId("persoTable").getSelectedItems();
            if(oTable.length>=0){                
            let oFila = oTable[0].getBindingContext().getObject();
            if(oFila.Codigoestado != "01" && oFila.Codigoestado != "05"){
                MessageBox.error("Solo se puede contabilizar facturas en estado PRE-REGISTRO u Observado")
                return;
            }
            if (!that.oSubmitDialogRechazo) {
                that.oSubmitDialogRechazo = new Dialog({
                  type: DialogType.Message,
                  state: "Error",
                  title: "Rechazar",
                  content: [
                    new Label({
                      text: "Desea rechazar esta solicitud?",
                      labelFor: "submissionNote"
                    }),
                    new TextArea("submissionNote", {
                      width: "100%",
                      placeholder: "Agregar Motivo (requerido)",
                      liveChange: function (oEvent) {
                        var sText = oEvent.getParameter("value");
                        that.oSubmitDialogRechazo.getBeginButton().setEnabled(sText.length > 0);
                      }.bind(that)
                    })
                  ],
                  beginButton: new Button({
                    type: ButtonType.Emphasized,
                    text: "Aceptar",
                    enabled: false,
                    press: function () {
                      var sText = Element.getElementById("submissionNote").getValue();
                      that.oSubmitDialogRechazo.close();
                      that.onRechazar(sText);
                    }.bind(that)
                  }),
                  endButton: new Button({
                    text: "Cancelar",
                    press: function () {
                      that.oSubmitDialogRechazo.close();
                    }.bind(that)
                  })
                });
              }
        
              that.oSubmitDialogRechazo.open();
            }
        },
        onRechazar: async function(text){
            let oTable = that.byId("persoTable").getSelectedItems();
            if(oTable.length>=0){                
                let oFila = oTable[0].getBindingContext().getObject();
                try {
                    let oModelUser = that.getOwnerComponent().getModel("userData");
                    let name = oModelUser.getProperty("/userAndName")
                    let email = oModelUser.getProperty("/email")                       
                    let oDato = {
                        "Docpreliminar":oFila.Invoicedocnumber,                    
                        "Fiscalyear":oFila.Fiscalyear,                    
                        "Proveedor":oFila.Proveedor,                    
                        "Sociedad":oFila.Sociedad,                    
                        "Ejercicio":oFila.Ejercicio,                
                        "Seriecorrelativo":oFila.Seriecorrelativo,                    
                        "Usuariolog":name,                    
                        "Correonombrelog":email,
                        "Motivorechazo":text                 
                        }
                    let ZMMGS_PRE_REG_FACT_SRV = that.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                    const oContabilizar = await that.createEntity(ZMMGS_PRE_REG_FACT_SRV, "/PreliminarEliminadoSet ", oDato);
                if(oContabilizar.Codigo == "500"){
                    MessageBox.error(oContabilizar.Mensaje)
					return false;
				}else{
					MessageBox.success("Se rechazo el documento preliminar"  +oFila.Invoicedocnumber  + " correctamente")
                    that._onListaFacturas();
				}
                } catch (error) {
                    MessageBox.error("Ocurrio un error al momento de rechazar")
                }
                
            }else{
                MessageBox.error("Seleccione una fila para rechazar")
            }             
        },

        onLimpiarFiltros: function () {
            that.byId("IdSociedadesFiltros").setSelectedKey();
            that.byId("idSerieCorrelativo").setValue();
            that.byId("idSecuencia").setValue();
            that.byId("idRuc").setValue();
            that.byId("idFechaContabilizacion").setValue();
            that.byId("idFechaEmision").setValue();
            that.byId("idEstadosFiltro").setSelectedKeys([]);
            that._onListaFacturas()
        }
	});
});