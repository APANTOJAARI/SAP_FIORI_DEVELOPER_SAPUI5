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
	'sap/ui/model/Filter'
], function(
	Controller,
	UIComponent, integrationLibrary, UI5Date, Engine, 
    SelectionController, SortController, GroupController, FilterController, MetadataHelper, Sorter, ColumnListItem, 
    Text, coreLibrary, ColumnWidthController, Filter
) {
	"use strict";

	return Controller.extend("ns.cosapi.actualizacionproveedor.controller.BaseController", {

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

        formatoModelSAPtoBtp: function (oPreRegistro) {
            let oReturn = {
                DatosGeneral: {
                    "Pais": oPreRegistro.Land1,
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
                    "Ort02Text" : oPreRegistro.Ort02Text,  //+@INSERT
                },
                LineaNegocio: {
                    "Taxnumxl": oPreRegistro.Taxnumxl,
                    "Matkl": oPreRegistro.Matkl,
                    "Bklas": oPreRegistro.Bklas
                },
                CuentaBancaria: { CuentasBancariasDetSet: deleteField(oPreRegistro.CuentasBancariasDetSet.results) },
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
                    //Tiposdeplanes: oPreRegistro.Tiposdeplanes,
                    SistemaGestionDetSet: deleteField(oPreRegistro.SistemaGestionDetSet.results) 
                },
                LineaProducto: {},
                RefFinanciera: { RegistroRefeFinanLogSet: [] },
                Ejecutivos: {},
                GestionCalidad: {},
                ExpClienteCab: {},
                SistemaSeguridad: {}
            };

            if (oPreRegistro.ContactoComercialDetSet.results == 0) {
                oReturn.ContactoGeneral = {
                    ContactoComercialDetSet: [{Nombrepos: "1"},{Nombrepos: "2"},{Nombrepos: "3"}]
                }
            }
            /* -@DELETE - Ya no será estático los registros
            if (oPreRegistro.CuentasBancariasDetSet.results == 0) {
                oReturn.CuentaBancaria = {
                    CuentasBancariasDetSet: [{Bancopos: "1"},{Bancopos: "2"},{Bancopos: "3"}]
                }
            }*/

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

            if (oPreRegistro.Noaplicarefefinanc == "X") {
                this.byId("NoAplicaCheckBox").setSelected(true)
                this.byId("btnAgregarRF").setEnabled(false)
            }

            if ( oPreRegistro.EjecutivosEmpresaDetSet.results.length == 0 ) {
                oReturn.Ejecutivos = { RegistroEjecEmpresaLogSet: [{}] }
            } else {
                oReturn.Ejecutivos = { RegistroEjecEmpresaLogSet: deleteField(oPreRegistro.EjecutivosEmpresaDetSet.results) }
            }

            if ( oPreRegistro.ExpPrincClientesDetSet.results.length == 0 ) {
                oReturn.ExpClienteCab = { ExpPrincClientesDetSet: [] }
            } else {
                oReturn.ExpClienteCab = { ExpPrincClientesDetSet: deleteField(oPreRegistro.ExpPrincClientesDetSet.results) }
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
            
            // if ( oPreRegistro.Seguridadsalud == "X" ) {
            //     this.byId("SiCheckBox").setSelectedIndex(0)
            //     oReturn.SistemaGestion.Seguridadsalud = 0
            // } else {
            //     oReturn.SistemaGestion.Seguridadsalud = 1
            // }

            //Sistema Gestión de Calidad
            if ( oPreRegistro.SistemasCalidadDetSet.results.length == 0 ) {
                oReturn.GestionCalidad = { RegistroGesCalDetSet: [{}] }
            } else {
                oReturn.GestionCalidad = { RegistroGesCalDetSet: deleteField(oPreRegistro.SistemasCalidadDetSet.results) }
                
                let oGestionCalidad = oPreRegistro.SistemasCalidadDetSet.results[0]

                if ( oGestionCalidad.SisGesCal == "X" ) {
                    this.byId("rbgPregunta1").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta1").setSelectedIndex(1)
                }

                if ( oGestionCalidad.SisAsCal == "X" ) {
                    this.byId("rbgPregunta2").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta2").setSelectedIndex(1)
                }

                if ( oGestionCalidad.SisConCal == "X" ) {
                    this.byId("rbgPregunta3").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta3").setSelectedIndex(1)
                }

                if ( oGestionCalidad.SisGesAl == "1" ) {
                    this.byId("rbgPregunta4").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta4").setSelectedIndex(1)
                }

                if ( oGestionCalidad.CerIso == "X" ) {
                    this.byId("rbgISO").setSelectedIndex(0)
                } else {
                    this.byId("rbgISO").setSelectedIndex(1)
                }

                if ( oGestionCalidad.EntCerPg == "X" ) {
                    this.byId("rbgPregunta5").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta5").setSelectedIndex(1)
                }

                if ( oGestionCalidad.EntCalProd == "X" ) {
                    this.byId("rbgPregunta6").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta6").setSelectedIndex(1)
                }

                if ( oGestionCalidad.SubProcAct == "X" ) {
                    this.byId("rbgPregunta7").setSelectedIndex(0)
                    this.byId("txtPregunta7Cal").setVisible(true)
                } else {
                    this.byId("rbgPregunta7").setSelectedIndex(1)
                    this.byId("txtPregunta7Cal").setVisible(false)
                }

                //Agregar los nuevos campos +@INSERT
                
            }

            //Sistema Gestión de Seguridad
            if ( oPreRegistro.SistemaGestionSeguridadDetSet.results.length != 0 ) {
                let oSistemasSeguridad = oPreRegistro.SistemaGestionSeguridadDetSet.results[0]
                oReturn.SistemaSeguridad = oSistemasSeguridad
                delete oReturn.SistemaSeguridad.Id
                delete oReturn.SistemaSeguridad["__metadata"]

                if ( oReturn.SistemaSeguridad.SistGestSeguSaludTrab == "X") {
                    this.byId("rbgPregunta1SS").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta1SS").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.SistGestAmbi == "X") {
                    this.byId("rbgPregunta2SS").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta2SS").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.ComiSeguSaludTrab == "X") {
                    this.byId("rbgPregunta3SS").setSelectedIndex(0)
                    this.byId("hbAdjunto").setVisible(true)
                } else {
                    this.byId("rbgPregunta3SS").setSelectedIndex(1)
                    this.byId("hbAdjunto").setVisible(false)
                }

                if ( oReturn.SistemaSeguridad.RegiEstaSeguSalud == "X") {
                    this.byId("rbgPregunta4SS").setSelectedIndex(0)
                    //this.byId("txtPregunta4SS").setVisible(true)
                } else {
                    this.byId("rbgPregunta4SS").setSelectedIndex(1)
                    //this.byId("txtPregunta4SS").setVisible(false)
                }

                if ( oReturn.SistemaSeguridad.ReglInteSst == "X") {
                    this.byId("rbgPregunta5SS").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta5SS").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.PlanGestResiSoli == "X") {
                    this.byId("rbgPregunta6SS").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta6SS").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.PlanSst == "X") {
                    this.byId("rbgPregunta1CC").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta1CC").setSelectedIndex(1)
                }
                if ( oReturn.SistemaSeguridad.PlanRespEmer == "X") {
                    this.byId("rbgPregunta2CC").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta2CC").setSelectedIndex(1)
                }
                if ( oReturn.SistemaSeguridad.PlanCapa == "X") {
                    this.byId("rbgPregunta3CC").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta3CC").setSelectedIndex(1)
                }
                if ( oReturn.SistemaSeguridad.ProcTrabSegu == "X") {
                    this.byId("rbgPregunta4CC").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta4CC").setSelectedIndex(1)
                }
                if ( oReturn.SistemaSeguridad.MatrIperc == "X") {
                    this.byId("rbgPregunta5CC").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta5CC").setSelectedIndex(1)
                }
                
                // if ( oReturn.Cuenalguplanes == "X") {
                //     this.byId("rbgPregunta7SS").setSelectedIndex(0)
                //     this.byId("hbAdjunto7SS").setVisible(true)
                // } else {
                //     this.byId("rbgPregunta7SS").setSelectedIndex(1)
                //     this.byId("hbAdjunto7SS").setVisible(false)
                // }

                //+Agregar los nuevos campos +@INSERT

                if ( oReturn.SistemaSeguridad.InfoAudiMintra == "X") {
                    this.byId("rbgPregunta5_1CC").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta5_1CC").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.PlanAccAudi == "X") {
                    this.byId("rbgPregunta5_2CC").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta5_2CC").setSelectedIndex(1)
                }

                if ( oReturn.SistemaSeguridad.ResoAudiMintra == "X") {
                    this.byId("rbgPregunta5_3CC").setSelectedIndex(0)
                } else {
                    this.byId("rbgPregunta5_3CC").setSelectedIndex(1)
                }
                
            }

            oReturn.DatosGeneral.Pais = oPreRegistro.Land1

            return oReturn;

            function deleteField (aDatos) {
                for ( let i = 0; i < aDatos.length; i++ ) {
                    delete aDatos[i]["__metadata"]
                    delete aDatos[i]["ConsultaTablaProv"]
                    delete aDatos[i]["Id"]
                }
                return aDatos
            }
        },

        _validarInput: function (aInputs) {
            let isdValid = true

            for (let  i = 0; i < aInputs.length; i++) {
                let sInput = this.byId(aInputs[i]).getValue()
                if (sInput.length <= 0) {
                    this.byId(aInputs[i]).setValueState(sap.ui.core.ValueState.Error);
                    this.byId(aInputs[i]).setValueStateText( this.getView().getModel("i18n").getResourceBundle().getText("completeField") );
                    isdValid = false
                } else {
                    this.byId(aInputs[i]).setValueState(sap.ui.core.ValueState.None);
                    this.byId(aInputs[i]).setValueStateText("");
                }
            }
            return isdValid
        },

        _validarComboBox: function (aSelects) {
            let isdValid = true

            for (let  i = 0; i < aSelects.length; i++) {
                let sSelect = this.byId(aSelects[i]).getSelectedKey()
                if (sSelect.length <= 0) {
                    this.byId(aSelects[i]).setValueState(sap.ui.core.ValueState.Error);
                    this.byId(aSelects[i]).setValueStateText( this.getView().getModel("i18n").getResourceBundle().getText("completeField") );
                    isdValid = false
                } else {
                    this.byId(aSelects[i]).setValueState(sap.ui.core.ValueState.None);
                    this.byId(aSelects[i]).setValueStateText("");
                }
            }

            return isdValid
        },

        _validarRadioButton: function (aRadioButton) {
            let isdValid = true
            
            for (let  i = 0; i < aRadioButton.length; i++) {
                let sSelect = this.byId(aRadioButton[i]).getSelectedIndex()
                if (sSelect == -1) {
                    this.byId(aRadioButton[i]).setValueState(sap.ui.core.ValueState.Error);
                    //this.byId(aRadioButton[i]).setValueStateText("Completar este campo");
                    isdValid = false
                } else {
                    this.byId(aRadioButton[i]).setValueState(sap.ui.core.ValueState.None);
                    //this.byId(aRadioButton[i]).setValueStateText("");
                }
            }

            return isdValid
        },

        formaterMoney: function (numeroString) {
            let numero = parseFloat(numeroString);
            if (isNaN(numero)) {
                return "Formato inválido";
            }

            return numero.toLocaleString('es-PE', {
                style: 'currency',
                currency: 'PEN'
            });
        },

        formatoFechaMilenio: function (fechaEnMilisegundos) {
            var fecha = new Date(fechaEnMilisegundos);
            
            var dia = fecha.getDate();
            var mes = fecha.getMonth() + 1;
            var año = fecha.getFullYear();
            
            var fechaFormateada = (dia < 10 ? '0' : '') + dia + '.' + (mes < 10 ? '0' : '') + mes + '.' + año;
            
            return fechaFormateada
        },

        formatoCorreo: function (correo) {
            // Expresión regular para validar un correo electrónico
            var expresionRegular = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return expresionRegular.test(correo);
        },

        obtenerFechaActual: function () {
            var fechaActual = new Date();

            var dia = fechaActual.getDate();
            var mes = fechaActual.getMonth() + 1;
            var año = fechaActual.getFullYear();
            
            var fechaActualFormateada = (dia < 10 ? '0' : '') + dia + '.' + (mes < 10 ? '0' : '') + mes + '.' + año;
            
            return fechaActualFormateada
        }

	});
});