sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
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
    'sap/m/ObjectStatus'
], function(
	Controller,
	UIComponent, integrationLibrary, UI5Date, Engine, 
    SelectionController, SortController, GroupController, FilterController, MetadataHelper, Sorter, ColumnListItem, 
    Text, coreLibrary, ColumnWidthController, Filter, ObjectStatus
) {
	"use strict";

	return Controller.extend("ns.cosapi.aprobacionsolppro.controller.BaseController", {

        getRouter : function () {
            return UIComponent.getRouterFor(this);
        },
        	/**
	 * Convenience method for getting the view model by name.
	 * @public
	 * @param {string} [sName] the model name
	 * @returns {sap.ui.model.Model} the model instance
	 */
        getModel : function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel : function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle : function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        readEntity: function(odataModel,path,parameters){
            return new Promise((resolve,reject) => {
                odataModel.read(path,{
                    filters: parameters.filters,
                    urlParameters: parameters.urlParameters,
                    success: resolve,
                    error: reject
                });
            });
        },

        createEntity:function(odataModel,path,data){
            return new Promise((resolve,reject)=>{
                odataModel.create(path,data,{
                    success:resolve,
                    error:reject
                });
            });
        },

        updateEntity:function(odataModel,path,data){
            return new Promise((resolve,reject)=>{
                odataModel.update(path,data,{
                    success:resolve,
                    error:reject
                });
            });
        },
        deleteEntity:function(odataModel,path,data){
            return new Promise((resolve,reject)=>{
                odataModel.remove(path,{
                    success:resolve,
                    error:reject
                });
            });
        },
        callFunction: function(odataModel,path,parameters){
            return new Promise((resolve,reject) => {
                odataModel.callFunction(path,{
                    urlParameters: parameters,
                    success: resolve,
                    error: reject
                });
            });
        },

        _formatDate: function(date){
            if(date !== "" && date && date instanceof Date) return date.toISOString().split("T")[0]
            else return date
        },

        _formatDateCierre: function(date){
            date.setDate(date.getDate() + 1);
            if(date !== "" && date && date instanceof Date) return date.toISOString().split("T")[0]
            else return date
        },

        _excelDateToJSDate: function(date){
            return new Date(Date.UTC(0, 0, date - 1));
        },

        getBaseURL: function () {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            var appModulePath = jQuery.sap.getModulePath(appPath);
            return appModulePath;
        },

        sIdFragment: null,
        sIdTable: null,
        aMetadataHelper: null,
        sModelo: null,
        globalFunction: null,

        // Método para establecer la variable global desde otros controladores
        setIdFragment: function(value) {
            this.sIdFragment = value;
        },
        setIdTable: function(value) {
            this.sIdTable = value;
        },
        setaMetadataHelper: function(value) {
            this.aMetadataHelper = value;
        },
        setsModelo: function(value) {
            this.sModelo = value;
        },
        setGlobalFunction: function(fn) {
            this.globalFunction = fn;
        },

        // *********************************
        //  Inicio - Funciones fragment Pre Registro
        // *********************************
        _registerForP13n: function() {
            let oTable = this.byId(this.sIdFragment + this.sIdTable);

            this.oMetadataHelper = new MetadataHelper(this.aMetadataHelper);
            
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
            let oTable = this.byId(this.sIdFragment + this.sIdTable);

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
            const oTable = this.byId(this.sIdFragment + this.sIdTable);
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

                if (sKey == "estado_col") {
                    return new ObjectStatus({
                        text: "{" + this.sModelo + ">" + this.oMetadataHelper.getProperty(sKey).path + "}",
                        state: {
                            path: this.sModelo + ">" + this.oMetadataHelper.getProperty(sKey).path,
                            formatter: this.formatEstados.bind(this)
                        }
                    });
                } else {
                    return new Text({
                        text: "{" + this.sModelo + ">" + this.oMetadataHelper.getProperty(sKey).path + "}"
                    });
                }
                
            }.bind(this));

            if (this.sModelo == "aProveedores") {
                oTable.bindItems({
                    templateShareable: false,
                    path: this.sModelo + '>/',
                    sorter: aSorter.concat(aGroups),
                    filters: aFilter,
                    template: new ColumnListItem({
                        type: "Navigation",
                        cells: aCells,
                        press: this.globalFunction
                    })
                });
            } else {
                oTable.bindItems({
                    templateShareable: false,
                    path: this.sModelo + '>/',
                    sorter: aSorter.concat(aGroups),
                    filters: aFilter,
                    template: new ColumnListItem({
                        type: "Navigation",
                        cells: aCells,
                        highlight: {
                            path: this.sModelo + '>estado',
                            formatter: this.formatEstados
                        },
                        press: this.globalFunction
                    })
                });
            }
            

        },

        createFilters: function(oState) {
            const aFilter = [];
            Object.keys(oState.Filter).forEach((sFilterKey) => {
                const filterPath = this.oMetadataHelper.getProperty(sFilterKey).path;

                oState.Filter[sFilterKey].forEach(function(oConditon) {
                    aFilter.push(new Filter(filterPath, oConditon.operator, oConditon.values[0]));
                });
            });

            this.byId(this.sIdFragment + "filterInfo").setVisible(aFilter.length > 0);

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
                    sKey = this.sIdFragment + oSorter.key;
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
                    sKey = this.sIdFragment + oSorter.key;
                }
                
                const oCol = this.byId(sKey);
                oCol.data("grouped", true);
            }.bind(this));

            return aGroupings;
        },

        updateColumns: function(oState) {
            let oTable = this.byId(this.sIdFragment + this.sIdTable);

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
                    sKey = this.sIdFragment + oProp.key;
                }
                
                let oCol = this.byId(sKey);
                oCol.setVisible(true);

                oTable.removeColumn(oCol);
                oTable.insertColumn(oCol, iIndex);
            }.bind(this));
        },

        beforeOpenColumnMenu: function(oEvt) {
            const oMenu = this.byId(this.sIdFragment + "menu");
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
            const oTable = this.byId(this.sIdFragment + this.sIdTable);
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
            const oTable = this.byId(this.sIdFragment + this.sIdTable);
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

            const oTable = this.byId(this.sIdFragment + this.sIdTable);
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
            const oTable = this.byId(this.sIdFragment + this.sIdTable);

            const oColumnState = {};
            oColumnState[this._getKey(oColumn)] = sWidth;

            Engine.getInstance().applyState(oTable, {
                ColumnWidth: oColumnState
            });
        },

        onClearFilterPress: function(oEvt) {
            const oTable = this.byId(this.sIdFragment + this.sIdTable);
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

        obtenerColumnas: function (sTipo) {
            let oColumnas = {
                aPreRegistro : null,
                aActualizacion: null,
                aProveedor: null
            }

            if (sTipo === "Desktop") {
                oColumnas.aPreRegistro = [
                    {
                        key: "pais_col",
                        label: "País",
                        path: "Land1des"
                    },
                    {
                        key: "tipodocumento_col",
                        label: "Tipo Documento",
                        path: "Stcdtdescrip"
                    },
                    {
                        key: "nif_col",
                        label: "NIF",
                        path: "Taxnumxl"
                    },
                    {
                        key: "razonsocial_col",
                        label: "Razón Social",
                        path: "Fullname"
                    },
                    {
                        key: "representante_col",
                        label: "Representante Legal",
                        path: "Representante"
                    },
                    {
                        key: "identificacion_col",
                        label: "Identificación",
                        path: "Identificacion"
                    },
                    {
                        key: "correoelectronico_col",
                        label: "Correo Corporativo",
                        path: "Correo"
                    },
                    {
                        key: "telefono_col",
                        label: "Teléfono",
                        path: "Telefono"
                    },
                    {
                        key: "estado_col",
                        label: "Estado",
                        path: "Descripcioncodigoestado"
                    }
                ];

                oColumnas.aActualizacion = [
                    {
                        key: "pais_col",
                        label: "País",
                        path: "Land1des"
                    },
                    {
                        key: "fecregistro_col",
                        label: "Fecha Fin Registro",
                        path: "Fecharegistro"
                    },
                    {
                        key: "tipodocumento_col",
                        label: "Tipo Documento",
                        path: "Stcdtdescrip"
                    },
                    {
                        key: "nif_col",
                        label: "NIF",
                        path: "Taxnumxl"
                    },
                    {
                        key: "razonsocial_col",
                        label: "Razón Social",
                        path: "Fullname"
                    },
                    {
                        key: "representante_col",
                        label: "Representante Legal",
                        path: "Representante"
                    },
                    {
                        key: "identificacion_col",
                        label: "Identificación",
                        path: "Identificacion"
                    },
                    {
                        key: "correoelectronico_col",
                        label: "Correo Corporativo",
                        path: "Correo"
                    },
                    {
                        key: "telefono_col",
                        label: "Teléfono",
                        path: "Telefono"
                    },
                    {
                        key: "estado_col",
                        label: "Estado",
                        path: "Descripcioncodigoestado"
                    }
                ];

                oColumnas.aProveedor = [
                    {
                        key: "codigobp_col",
                        label: "Cod. BP",
                        path: "Numerodebp"
                    },
                    {
                        key: "nif_col",
                        label: "NIF",
                        path: "Taxnumxl"
                    },
                    {
                        key: "razonsocial_col",
                        label: "Razón Social",
                        path: "Fullname"
                    },
                    {
                        key: "nombrecomercial_col",
                        label: "Nombre Comercial",
                        path: "Nombrecomercial"
                    },
                    {
                        key: "pais_col",
                        label: "País",
                        path: "Land1des"
                    },
                    {
                        key: "identificacion_col",
                        label: "Identificación",
                        path: "Identificacion"
                    },
                    {
                        key: "correoelectronico_col",
                        label: "Correo Corporativo",
                        path: "Correo"
                    },
                    {
                        key: "telefono_col",
                        label: "Teléfono",
                        path: "Telefono"
                    }
                ];
            } else {
                oColumnas.aPreRegistro = [
                    {
                        key: "pais_col",
                        label: "País",
                        path: "pais"
                    },
                    {
                        key: "fecregistro_col",
                        label: "Fecha Fin Registro",
                        path: "Fecharegistro"
                    },
                    {
                        key: "tipodocumento_col",
                        label: "Tipo Documento",
                        path: "tipodocumento"
                    },
                    {
                        key: "nif_col",
                        label: "NIF",
                        path: "nif"
                    },
                    {
                        key: "razonsocial_col",
                        label: "Razón Social",
                        path: "razonsocial"
                    },
                    {
                        key: "estado_col",
                        label: "Estado",
                        path: "estado"
                    }
                ];

                oColumnas.aActualizacion = [
                    {
                        key: "pais_col",
                        label: "País",
                        path: "pais"
                    },
                    {
                        key: "tipodocumento_col",
                        label: "Tipo Documento",
                        path: "tipo_documento"
                    },
                    {
                        key: "nif_col",
                        label: "NIF",
                        path: "nif"
                    },
                    {
                        key: "razonsocial_col",
                        label: "Razón Social",
                        path: "razon_social"
                    },
                    {
                        key: "estado_col",
                        label: "Estado",
                        path: "estado"
                    }
                ];

                oColumnas.aProveedor = [
                    {
                        key: "nif_col",
                        label: "NIF",
                        path: "nif"
                    },
                    {
                        key: "razonsocial_col",
                        label: "Razón Social",
                        path: "razon_social"
                    },
                    {
                        key: "pais_col",
                        label: "País",
                        path: "pais"
                    }
                ];

            }
            return oColumnas;
        },

        //Función para el formato modelo de los datos de solicitud proveedor
        formatoModelSAPtoBtp: function (oPreRegistro) {
            let oReturn = {
                DatosGeneral: { 
                    "Land1": oPreRegistro.Land1,
                    "Taxnumxl": oPreRegistro.Taxnumxl,
                    "Fechaconstitucion": oPreRegistro.Fechaconstitucion == "00000000" ? "" : oPreRegistro.Fechaconstitucion,
                    "Nombrecomercial": oPreRegistro.Nombrecomercial,
                    "Stras": oPreRegistro.Stras,
                    "Pais": oPreRegistro.Pais,
                    "Ort01": oPreRegistro.Ort01,
                    "Ort02": oPreRegistro.Ort02,
                    "Pfach": oPreRegistro.Pfach,
                    "Paginaweb": oPreRegistro.Paginaweb,
                    "Tprovbienes": false,
                    "Tprovservicios": false,
                    "Tprovsubcontratista": false,
                    "Noaplicarefefinanc": oPreRegistro.Noaplicarefefinanc == "X" ? true : false,
                    "Ort02Text" : oPreRegistro.Ort02Text,                             //+@INSERT
                    "Ejecutarsucursalcosapi" : oPreRegistro.Ejecutarsucursalcosapi,   //+@INSERT
                    "Provsincronizacion": oPreRegistro.Provsincronizacion,            //+@INSERT
                    "Flagactivereferfinan" : oPreRegistro.Flagactivereferfinan,       //+@INSERT
                    "Tprovbienes": oPreRegistro.Tprovbienes, //+@INSERT
                    "Tprovservicios": oPreRegistro.Tprovservicios, //+@INSERT
                    "Tprovsubcontratista": oPreRegistro.Tprovsubcontratista, //+@INSERT         
                },
                LineaNegocio: {
                    "Taxnumxl": oPreRegistro.Taxnumxl,
                    "Matkl": oPreRegistro.Matkl,
                    "Bklas": oPreRegistro.Bklas
                },
                CuentaBancaria: { CuentasBancariasDetSet: deleteField(oPreRegistro.CuentasBancariasDetSet.results.filter(oPos => oPos.Taxnumxl == oPreRegistro.Taxnumxl)) },
                ContactoGeneral: { ContactoComercialDetSet: deleteField(oPreRegistro.ContactoComercialDetSet.results) },
                InformacionContable: { 
                    Importactcorr: oPreRegistro.Importactcorr,
                    Importpascorr: oPreRegistro.Importpascorr,
                    Importpastotal: oPreRegistro.Importpastotal,
                    Patrimonioneto: oPreRegistro.Patrimonioneto,
                    InformacionContableDetSet: deleteField(oPreRegistro.InformacionContableDetSet.results) 
                },
                Experiencia: { ExpPrincClientesDetSet: deleteField(oPreRegistro.ExpPrincClientesDetSet.results) },
                SistemaGestion: {
                    Tiposdeplanes: oPreRegistro.Tiposdeplanes,
                    SistemaGestionDetSet: deleteField(oPreRegistro.SistemaGestionDetSet.results.filter(oPos => oPos.Taxnumxl == oPreRegistro.Taxnumxl)) 
                },
                LineaProducto: {},
                RefFinanciera: { RegistroRefeFinanLogSet: [] },
                ExpClienteCab: {}
            };

            if (!oPreRegistro.RegistroRefeFinancierasSet || oPreRegistro.RegistroRefeFinancierasSet.results == 0) {
                oReturn.RefFinanciera = { RegistroRefeFinanLogSet: [] }
            }

            if ( oPreRegistro.EjecutivosEmpresaDetSet.results.length == 0 ) {
                oReturn.Ejecutivos = { RegistroEjecEmpresaLogSet: [{}] }
            } else {
                oReturn.Ejecutivos = { RegistroEjecEmpresaLogSet: deleteField(oPreRegistro.EjecutivosEmpresaDetSet.results) }
            }

            if ( oPreRegistro.LineaNegocioDetSet.results.length == 0 ) {
                oReturn.LineaNegocio = { LineaNegocioDetSet: [] }
            } else {
                oReturn.LineaNegocio = { LineaNegocioDetSet: deleteField(oPreRegistro.LineaNegocioDetSet.results) }
            }

            if ( oPreRegistro.LineaProductoDetSet.results.length == 0 ) {
                oReturn.LineaProducto = { LineaProductoDetSet: [] }
            } else {
                oReturn.LineaProducto = { LineaProductoDetSet: deleteField(oPreRegistro.LineaProductoDetSet.results) }
            }

            if ( oPreRegistro.ExpPrincClientesDetSet.results.length == 0 ) {
                oReturn.ExpClienteCab = { ExpPrincClientesDetSet: [] }
            } else {
                oReturn.ExpClienteCab = { ExpPrincClientesDetSet: deleteField(oPreRegistro.ExpPrincClientesDetSet.results) }
            }

            if (oPreRegistro.ContactoComercialDetSet.results == 0) {
                oReturn.ContactoGeneral = {
                    ContactoComercialDetSet: [{Nombrepos: "1"},{Nombrepos: "2"},{Nombrepos: "3"}]
                }
            }

            /** Eliminar esta opción de Bancos -@DELETE
             * 
            if (oPreRegistro.CuentasBancariasDetSet.results == 0) {
                oReturn.CuentaBancaria = {
                    CuentasBancariasDetSet: [{Bancopos: "1"},{Bancopos: "2"},{Bancopos: "3"}]
                }
            }
            */

            if (oPreRegistro.InformacionContableDetSet.results == 0) {
                oReturn.InformacionContable.InformacionContableDetSet = [{Aniopos: "1"},{Aniopos: "2"},{Aniopos: "3"}]
            }
            
            if (oPreRegistro.ExpPrincClientesDetSet.results == 0) {
                oReturn.Experiencia = {
                    ExpPrincClientesDetSet: [{Nifpos: "1"},{Nifpos: "2"},{Nifpos: "3"}]
                }
            }
            
            if (oPreRegistro.SistemaGestionDetSet.results == 0) {
                oReturn.SistemaGestion.SistemaGestionDetSet = [{Aniopos: "1"},{Aniopos: "2"},{Aniopos: "3"}]
            }

            if ( oPreRegistro.Tprovbienes == "X") {
                oReturn.DatosGeneral.Tprovbienes = true
            }

            if ( oPreRegistro.Tprovservicios == "X") {
                oReturn.DatosGeneral.Tprovservicios = true
            }

            if ( oPreRegistro.Tprovsubcontratista == "X") {
                oReturn.DatosGeneral.Tprovsubcontratista = true
            }
            
            if ( oPreRegistro.Seguridadsalud == "X" ) {
                //this.byId("SiCheckBox").setSelectedIndex(0)
                oReturn.SistemaGestion.Seguridadsalud = 0
            } else {
                oReturn.SistemaGestion.Seguridadsalud = 1
            }

            //Sistema Gestión de Calidad
            if ( oPreRegistro.SistemasCalidadDetSet.results.length == 0 ) {
                oReturn.GestionCalidad = { RegistroGesCalDetSet: [{}] }
            } else {
                oReturn.GestionCalidad = { RegistroGesCalDetSet: deleteField(oPreRegistro.SistemasCalidadDetSet.results) }
                
                let oGestionCalidad = oPreRegistro.SistemasCalidadDetSet.results[0]
            }

            //Sistema Gestión de Seguridad
            if ( oPreRegistro.SistemaGestionSeguridadDetSet.results.length != 0 ) {
                let oSistemasSeguridad = oPreRegistro.SistemaGestionSeguridadDetSet.results[0]
                oReturn.SistemaSeguridad = oSistemasSeguridad
                delete oReturn.SistemaSeguridad.Id
                delete oReturn.SistemaSeguridad["__metadata"]

                if ( oReturn.SistemaSeguridad.SistGestSeguSaludTrab == "X") {
                    this.byId("sistemagestFragment--rbgPregunta1SS").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta1SS").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.SistGestAmbi == "X") {
                    this.byId("sistemagestFragment--rbgPregunta2SS").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta2SS").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.ComiSeguSaludTrab == "X") {
                    this.byId("sistemagestFragment--rbgPregunta3SS").setSelectedIndex(0)
                    this.byId("sistemagestFragment--hbAdjunto").setVisible(true)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta3SS").setSelectedIndex(1)
                    this.byId("sistemagestFragment--hbAdjunto").setVisible(false)
                }

                if ( oReturn.SistemaSeguridad.RegiEstaSeguSalud == "X") {
                    this.byId("sistemagestFragment--rbgPregunta4SS").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta4SS").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.ReglInteSst == "X") {
                    this.byId("sistemagestFragment--rbgPregunta5SS").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta5SS").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.PlanGestResiSoli == "X") {
                    this.byId("sistemagestFragment--rbgPregunta6SS").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta6SS").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.PlanSst == "X") {
                    this.byId("sistemagestFragment--rbgPregunta1CC").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta1CC").setSelectedIndex(1)
                }
                if ( oReturn.SistemaSeguridad.PlanRespEmer == "X") {
                    this.byId("sistemagestFragment--rbgPregunta2CC").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta2CC").setSelectedIndex(1)
                }
                if ( oReturn.SistemaSeguridad.PlanCapa == "X") {
                    this.byId("sistemagestFragment--rbgPregunta3CC").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta3CC").setSelectedIndex(1)
                }
                if ( oReturn.SistemaSeguridad.ProcTrabSegu == "X") {
                    this.byId("sistemagestFragment--rbgPregunta4CC").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta4CC").setSelectedIndex(1)
                }
                if ( oReturn.SistemaSeguridad.MatrIperc == "X") {
                    this.byId("sistemagestFragment--rbgPregunta5CC").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta5CC").setSelectedIndex(1)
                }

                //+@Agregar los nuevos campos +@INSERT
                if ( oReturn.SistemaSeguridad.InfoAudiMintra == "X") {
                    this.byId("sistemagestFragment--rbgPregunta5_1CC").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta5_1CC").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.PlanAccAudi == "X") {
                    this.byId("sistemagestFragment--rbgPregunta5_2CC").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta5_2CC").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.ResoAudiMintra == "X") {
                    this.byId("sistemagestFragment--rbgPregunta5_3CC").setSelectedIndex(0)
                } else {
                    this.byId("sistemagestFragment--rbgPregunta5_3CC").setSelectedIndex(1)
                }

            }

            return oReturn;

            function deleteField (aDatos) {
                if (aDatos) {
                    for ( let i = 0; i < aDatos.length; i++ ) {
                        delete aDatos[i]["__metadata"]
                    }
                    return aDatos
                } else {
                    return []
                }
            }
        },

        //Funciones de validación
        formatoFechaMilenio: function (fechaEnMilisegundos) {
            var fecha = new Date(fechaEnMilisegundos);
            
            var dia = fecha.getDate();
            var mes = fecha.getMonth() + 1;
            var año = fecha.getFullYear();
            
            var fechaFormateada = (dia < 10 ? '0' : '') + dia + '.' + (mes < 10 ? '0' : '') + mes + '.' + año;
            
            return fechaFormateada
        },
        
        obtenerFechaActual: function () {
            var fechaActual = new Date();

            var dia = fechaActual.getDate();
            var mes = fechaActual.getMonth() + 1;
            var año = fechaActual.getFullYear();
            
            var fechaActualFormateada = (dia < 10 ? '0' : '') + dia + '.' + (mes < 10 ? '0' : '') + mes + '.' + año;
            
            return fechaActualFormateada
        },

        formatFechaString: function (sValue) {
            if (!sValue) {
                return ""
            }
            var anio = sValue.substring(0, 4);
            var mes = sValue.substring(4, 6);
            var dia = sValue.substring(6, 8);
            
            return `${dia}.${mes}.${anio}`;
        },

        //Formato para el dashboard
        buildFormatoDashBoard: function (aProveedoresD, oCantEstadosD, aActualizacionD) {
            let oReturn = {
                "stackedColumn": {
                    "sap.app": {
                        "id": "sample.CardsLayout.model.Analytical",
                        "type": "card"
                    },
                    "sap.card": {
                        "type": "Analytical",
                        "header": {
                            "type": "Numeric",
                            "data": {
                                "json": {
                                    "n": "38"
                                }
                            },
                            "title": "Total de Solicitudes",
                            "mainIndicator": {
                                "number": "{n}",
                                "unit": "{u}",
                                "trend": "{trend}",
                                "state": "{valueColor}"
                            }
                        },
                        "content": {
                            "chartType": "StackedColumn",
                            "legend": {
                                "visible": true,
                                "position": "Bottom",
                                "alignment": "Left"
                            },
                            "plotArea": {
                                "dataLabel": {
                                    "visible": false,
                                    "showTotal": false
                                },
                                "categoryAxisText": {
                                    "visible": false
                                },
                                "valueAxisText": {
                                    "visible": false
                                }
                            },
                            "title": {
                                "visible": false
                            },
                            "measureAxis": "valueAxis",
                            "dimensionAxis": "categoryAxis",
                            "data": {
                                "json": {
                                    "list": []
                                },
                                "path": "/list"
                            },
                            "dimensions": [
                                {
                                    "label": "Categories",
                                    "value": "{Category}"
                                }
                            ],
                            "measures": [
                                {
                                    "label": "Total Solicitudes",
                                    "value": "{Total}"
                                }
                            ]
                        }
                    }
                },
                "donut": {
                    "sap.app": {
                        "id": "sample.CardsLayout.model.donut",
                        "type": "card"
                    },
                    "sap.card": {
                        "type": "Analytical",
                        "header": {
                            "title": "Proveedores por Países"
                        },
                        "content": {
                            "chartType": "Donut",
                            "legend": {
                                "visible": true,
                                "position": "Bottom",
                                "alignment": "Left"
                            },
                            "plotArea": {
                                "dataLabel": {
                                    "visible": true,
                                    "showTotal": true
                                }
                            },
                            "title": {
                                "visible": false
                            },
                            "measureAxis": "size",
                            "dimensionAxis": "color",
                            "data": {
                                "json": {
                                    "measures": []
                                },
                                "path": "/measures"
                            },
                            "dimensions": [{
                                "label": "Measure Name",
                                "value": "{measureName}"
                            }],
                            "measures": [{
                                "label": "Value",
                                "value": "{value}"
                            }]
                        }
                    }
                },
                "list1": {
                    "sap.app": {
                        "id": "sample.CardsLayout.model.list",
                        "type": "card"
                    },
                    "sap.card": {
                        "type": "List",
                        "header": {
                            "title": "Lista de Proveedores"
                        },
                        "content": {
                            "data": {
                                "json": []
                            },
                            "item": {
                                "icon": {
                                    "src": "{icon}"
                                },
                                "title": {
                                    "value": "{name}"
                                },
                                "description": {
                                    "value": "{description}"
                                },
                                "info": {
                                    "value": "{info}",
                                    "state": "{infoState}"
                                },
                                "actions": [
                                    {
                                        "type": "Navigation",
                                        "parameters": {
                                            "name": "{info}"
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                "list2": {
                    "sap.app": {
                        "id": "sample.CardsLayout.model.list2",
                        "type": "card"
                    },
                    "sap.card": {
                        "type": "List",
                        "header": {
                            "title": "Solicitudes de Hoy",
                            "icon": {
                                "src": "sap-icon://insurance-life"
                            }
                        },
                        "content": {
                            "data": {
                                "json": []
                            },
                            "item": {
                                "icon": {
                                    "src": "{icon}"
                                },
                                "title": {
                                    "value": "{name}"
                                },
                                "description": {
                                    "value": "{description}"
                                },
                                "info": {
                                    "value": "{info}",
                                    "state": "{infoState}"
                                },
                                "actions": [
                                    {
                                        "type": "Navigation",
                                        "parameters": {
                                            "name": "{name}"
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }

            let aStackedColumn = [
                {
                    "Category": "EN REGISTRO",
                    "Revenue": 431000.22,
                    "Cost": 230000.00,
                    "Target": 500000.00,
                    "Budget": 210000.00,
                    "Total": oCantEstadosD.cantEnRegistro,
                    "color": "#bcbdff" 
                },
                {
                    "Category": "BASE DE DATOS",
                    "Revenue": 431000.22,
                    "Cost": 230000.00,
                    "Target": 500000.00,
                    "Budget": 210000.00,
                    "Total": oCantEstadosD.cantBaseDatos,
                    "color": "#bcbdff" 
                },
                {
                    "Category": "APTO",
                    "Revenue": 431000.22,
                    "Cost": 230000.00,
                    "Target": 500000.00,
                    "Budget": 210000.00,
                    "Total": oCantEstadosD.cantApto,
                    "color": "#bcbdff" 
                },
                {
                    "Category": "RECHAZADO",
                    "Revenue": 431000.22,
                    "Cost": 230000.00,
                    "Target": 500000.00,
                    "Budget": 210000.00,
                    "Total": oCantEstadosD.cantRechazadas,
                    "color": "#bcbdff" 
                },
                {
                    "Category": "PROVEEDOR",
                    "Revenue": 431000.22,
                    "Cost": 230000.00,
                    "Target": 500000.00,
                    "Budget": 210000.00,
                    "Total": oCantEstadosD.cantProveedor,
                    "color": "#bcbdff" 
                },
                {
                    "Category": "BLOQUEADO",
                    "Revenue": 431000.22,
                    "Cost": 230000.00,
                    "Target": 500000.00,
                    "Budget": 210000.00,
                    "Total": oCantEstadosD.cantBloqueado,
                    "color": "#bcbdff" 
                }
            ]

            let iPeru = aProveedoresD.filter( oPos => oPos.Land1 == 'PE' ).length,
                iChile = aProveedoresD.filter( oPos => oPos.Land1 == 'CL' ).length,
                iOtros = aProveedoresD.filter( oPos => oPos.Land1 !== 'CL' && oPos.Land1 !== 'PE' ).length

            let aDonuts = [
                {
                    "measureName": "Perú",
                    "value": iPeru
                },
                {
                    "measureName": "Chile",
                    "value": iChile
                },
                {
                    "measureName": "Otros",
                    "value": iOtros
                }
            ]

            let aFourProveedores = aProveedoresD.slice(-4);
            let aProveedors = []

            for ( let i = 0; i < aFourProveedores.length; i++ ) {
                let oProveedor = aFourProveedores[i]
                let oSol = {
                    "name": oProveedor.Name1,
                    "icon": "sap-icon://supplier",
                    "description": oProveedor.Stras,
                    "info": oProveedor.Numerodebp,
                    "infoState": "None"
                }
                aProveedors.push(oSol)
            }

            let aFourSolicitud = aActualizacionD.slice(-3);
            let aSolicitudes = []

            for ( let i = 0; i < aFourSolicitud.length; i++ ) {
                let oProveedor = aFourSolicitud[i]
                let oSol = {
                    "name": oProveedor.Taxnumxl,
                    "icon": "sap-icon://activity-individual",
                    "description": oProveedor.Name1,
                    "info": oProveedor.Descripcioncodigoestado,
                    "infoState": "None"
                }
                aSolicitudes.push(oSol)
            }
            
            oReturn.stackedColumn["sap.card"]["content"]["data"]["json"]["list"] = aStackedColumn
            oReturn.stackedColumn["sap.card"]["header"]["data"]["json"].n = oCantEstadosD.total
            oReturn.donut["sap.card"]["content"]["data"]["json"]["measures"] = aDonuts
            oReturn.list1["sap.card"]["content"]["data"]["json"] = aProveedors
            oReturn.list2["sap.card"]["content"]["data"]["json"] = aSolicitudes

            return oReturn
        }

	});
});