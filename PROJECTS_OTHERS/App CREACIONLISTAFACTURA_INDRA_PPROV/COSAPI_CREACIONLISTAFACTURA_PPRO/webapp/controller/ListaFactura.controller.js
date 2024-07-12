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
], function(
	Controller, jQuery, MessageToast, Log, JSONModel, Device, DateFormat, integrationLibrary, UI5Date, Engine, 
	SelectionController, SortController, GroupController, FilterController, MetadataHelper, Sorter, ColumnListItem, 
	Text, coreLibrary, ColumnWidthController, Filter,
) {
	"use strict";
	let sIdTablePreRegistro = "",
	sIdFragmentPreRegistro = "";
	let that;
	return Controller.extend("ns.cosapi.creacionlistadofactura.controller.ListaFactura", {
		onInit: function () {            			
            this.getRouter().getRoute("ViewListaFactura").attachMatched(this._onRouteMatched,this)		
		 },
         _onRouteMatched:async function(oEvent){
			await this.getInfoUser();
            this._onListaFacturas();
            this.onObtenerEstados();
            this.onObtenerSociedades();
            sIdTablePreRegistro = "persoTable"; //Id de la tabla
			sIdFragmentPreRegistro = "" //Si tu vista tiene fragment, colocar el Id	
			this._registerForP13n(); //Función principal para activar las config de la tabla
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
          _onListaFacturas:async function(){
            //filtros
                let sSociedad = this.byId("IdSociedadesFiltros").getSelectedKey();
                let serie = this.byId("idSerieCorrelativo").getValue();
                let oFechas = this.byId("idFechaContabilizacion");
                let oEstados = this.byId("idEstadosFiltro");
                let filterList =[];
                if(sSociedad != ""){
                    filterList.push(new Filter("Sociedad","EQ",sSociedad))
                }
                if(serie != ""){
                    filterList.push(new Filter("Seriecorrelativo","EQ",serie))
                }
                if(oFechas.getDateValue() != null || oFechas.getSecondDateValue() != null){
                    filterList.push(new Filter("Rangofechacontabilizacion","EQ",this.formatearFechas(oFechas.getDateValue(),oFechas.getSecondDateValue())))
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
                let oModelUser = this.getOwnerComponent().getModel("userData");
                let ruc = oModelUser.getProperty("/userId")
                filterList.push(new Filter("Stcd1","EQ",ruc))
                const parameters = {
                    filters: filterList,
                    urlParameters: {
                        "$expand":"ConsultaRegFacturasDetSet"
                    }
                };
                let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                try {
                    let oModel = this.getOwnerComponent().getModel();
                    const facturasMini = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaRegFacturasCabSet", parameters);
                    let respuesta = facturasMini.results;
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
                    oModel.setProperty("/aSolPreregistro", respuesta)
                } catch (error) {
                    MessageBox.error("Error al obtener Facturas Mini")
                }  
            },
            onLimpiarFiltros:function(){
                this.byId("IdSociedadesFiltros").setSelectedKey("");
                this.byId("idSerieCorrelativo").setValue();
                this.byId("idFechaContabilizacion").setValue("");
                this.byId("idEstadosFiltro").setSelectedKeys();
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
                let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                try {
                    let oModel = this.getOwnerComponent().getModel();
                    const sociedades = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaSociedadesSet", []);
                    oModel.setProperty("/Sociedades", sociedades.results)
                } catch (error) {
                    MessageBox.error("Error al obtener estados")
                }
            },
		     // *********************************
            //  Inicio - Funciones fragment Pre Registro
            // *********************************
            _registerForP13n: function() {
                let oTable = this.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
    
                this.oMetadataHelper = new MetadataHelper([
                    {
                        key: "numCorrelativo_col",
                        label: "Número Correlativo",
                        path: "Seriecorrelativo"
                    },
                    {
                        key: "serie_col",
                        label: "Serie",
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
                    helper: this.oMetadataHelper,
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
    
                Engine.getInstance().attachStateChange(this.handleStateChange.bind(this));
            },
    
            openPersoDialog: function(oEvt) {
                this._openPersoDialog(["Columns", "Sorter", "Groups", "Filter"], oEvt.getSource());
            },
    
            _openPersoDialog: function(aPanels, oSource) {
                let oTable = this.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
    
                Engine.getInstance().show(oTable, aPanels, {
                    contentHeight: aPanels.length > 1 ? "50rem" : "35rem",
                    contentWidth: aPanels.length > 1 ? "45rem" : "32rem",
                    source: oSource || oTable
                });
            },
    
            _getKey: function(oControl) {
                return this.getView().getLocalId(oControl.getId());
            },
    
            handleStateChange: function(oEvt) {
                const oTable = this.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
                const oState = oEvt.getParameter("state");
    
                if (!oState) {
                    return;
                }
    
                //Update the columns per selection in the state
                this.updateColumns(oState);
    
                //Create Filters & Sorters
                const aFilter = this.createFilters(oState);
                const aGroups = this.createGroups(oState);
                const aSorter = this.createSorters(oState, aGroups);
    
                const aCells = oState.Columns.map(function(oColumnState) {
                    let sKey = "";
                    if (oColumnState.key.indexOf("--") > 0) {
                        sKey = oColumnState.key.split("--")[1];
                    } else {
                        sKey = oColumnState.key;
                    }
                    if(oColumnState.key == "estado_col"){
                        return new sap.m.ObjectStatus({
                            text: "{" + this.oMetadataHelper.getProperty(sKey).path + "}",
                            state: {
                                path: "Codigoestado",
                                formatter: function(sEstado) {                                  
                                    return this.formatEstados(sEstado);
                                }.bind(this)
                            }
                        });
                    }else{
                        return new Text({
                            text: "{" + this.oMetadataHelper.getProperty(sKey).path + "}"
                        });
                    }
                    
                }.bind(this));
    
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
                            formatter: this.formatEstados
                        },
                        press: this.onIrDetailListaFacturas
                    })
                });
                
    
            },
			onIrDetailListaFacturas:function(e){
                var oFila = e.getSource().getBindingContext().getObject();
                this.onNavto("ViewDetalleFactura",{preliminar:oFila.Invoicedocnumber})
			},
            createFilters: function(oState) {
                const aFilter = [];
                Object.keys(oState.Filter).forEach((sFilterKey) => {
                    const filterPath = this.oMetadataHelper.getProperty(sFilterKey).path;
    
                    oState.Filter[sFilterKey].forEach(function(oConditon) {
                        aFilter.push(new Filter(filterPath, oConditon.operator, oConditon.values[0]));
                    });
                });
    
                this.byId(sIdFragmentPreRegistro + "filterInfo").setVisible(aFilter.length > 0);
    
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
                        return oSort.sPath === this.oMetadataHelper.getProperty(sKey).path;
                    }.bind(this));
    
                    if (oExistingSorter) {
                        oExistingSorter.bDescending = !!oSorter.descending;
                    } else {
                        let sKey = "";
                        if (oSorter.key.indexOf("--") > 0) {
                            sKey = oSorter.key.split("--")[1];
                        } else {
                            sKey = oSorter.key;
                        }
                        
                        aSorter.push(new Sorter(this.oMetadataHelper.getProperty(sKey).path, oSorter.descending));
                    }
                }.bind(this));
    
                oState.Sorter.forEach(function(oSorter) {
                    let sKey = "";
                    if (oSorter.key.indexOf("--") > 0) {
                        sKey = oSorter.key;
                    } else {
                        sKey = sIdFragmentPreRegistro + oSorter.key;
                    }
                    const oCol = this.byId(sKey);
                    if (oSorter.sorted !== false) {
                        oCol.setSortIndicator(oSorter.descending ? coreLibrary.SortOrder.Descending : coreLibrary.SortOrder.Ascending);
                    }
                }.bind(this));
    
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
                    aGroupings.push(new Sorter(this.oMetadataHelper.getProperty(sKey).path, false, true));
                }.bind(this));
    
                oState.Groups.forEach(function(oSorter) {
                    let sKey = "";
                    if (oSorter.key.indexOf("--") > 0) {
                        sKey = oSorter.key;
                    } else {
                        sKey = sIdFragmentPreRegistro + oSorter.key;
                    }
                    
                    const oCol = this.byId(sKey);
                    oCol.data("grouped", true);
                }.bind(this));
    
                return aGroupings;
            },
    
            updateColumns: function(oState) {
                let sIdFragment = "preRegistroFragment";
                let oTable = this.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
    
                oTable.getColumns().forEach(function(oColumn, iIndex) {
                    oColumn.setVisible(false);
                    oColumn.setWidth(oState.ColumnWidth[this._getKey(oColumn)]);
                    oColumn.setSortIndicator(coreLibrary.SortOrder.None);
                    oColumn.data("grouped", false);
                }.bind(this));
    
                oState.Columns.forEach(function(oProp, iIndex) {
                    let sKey = "";
                    if (oProp.key.indexOf("--") > 0) {
                        sKey = oProp.key;
                    } else {
                        sKey = sIdFragmentPreRegistro + oProp.key;
                    }
                    
                    let oCol = this.byId(sKey);
                    oCol.setVisible(true);
    
                    oTable.removeColumn(oCol);
                    oTable.insertColumn(oCol, iIndex);
                }.bind(this));
            },
    
            beforeOpenColumnMenu: function(oEvt) {
                const oMenu = this.byId(sIdFragmentPreRegistro + "menu");
                const oColumn = oEvt.getParameter("openBy");
                const oSortItem = oMenu.getQuickActions()[0].getItems()[0];
                const oGroupItem = oMenu.getQuickActions()[1].getItems()[0];
    
                oSortItem.setKey(this._getKey(oColumn));
                oSortItem.setLabel(oColumn.getHeader().getText());
                oSortItem.setSortOrder(oColumn.getSortIndicator());
    
                oGroupItem.setKey(this._getKey(oColumn));
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
    
                this._openPersoDialog([sPanel]);
            },
    
            onFilterInfoPress: function(oEvt) {
                this._openPersoDialog(["Filter"], oEvt.getSource());
            },
    
            onSort: function(oEvt) {
                const oSortItem = oEvt.getParameter("item");
                const oTable = this.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
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
                const oTable = this.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
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
    
                const oTable = this.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
                const sDropPosition = oEvt.getParameter("dropPosition");
                const iDraggedIndex = oTable.indexOfColumn(oDraggedColumn);
                const iDroppedIndex = oTable.indexOfColumn(oDroppedColumn);
                const iNewPos = iDroppedIndex + (sDropPosition == "Before" ? 0 : 1) + (iDraggedIndex < iDroppedIndex ? -1 : 0);
                const sKey = this._getKey(oDraggedColumn);
    
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
                const oTable = this.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
    
                const oColumnState = {};
                oColumnState[this._getKey(oColumn)] = sWidth;
    
                Engine.getInstance().applyState(oTable, {
                    ColumnWidth: oColumnState
                });
            },
    
            onClearFilterPress: function(oEvt) {
                const oTable = this.byId(sIdFragmentPreRegistro + sIdTablePreRegistro);
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
			this.onNavBack();
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
	});
});