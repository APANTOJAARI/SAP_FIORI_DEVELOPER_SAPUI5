sap.ui.define([
    "./BaseController",
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
	"sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, jQuery, MessageToast, Log, JSONModel, Device, DateFormat, integrationLibrary, UI5Date, Engine, 
        SelectionController, SortController, GroupController, FilterController, MetadataHelper, Sorter, ColumnListItem, 
        Text, coreLibrary, ColumnWidthController, Filter, MessageBox) {
        "use strict";

		let that,
          oModelPreRegProv;
		//Varibales dms
		let rutaInicial = "/apidms/browser/"; //despliegue
		//let rutaInicial ="/browser/";           //Local
		let Repositoryid = "";
		let bHayDocumento = false;

        return BaseController.extend("ns.cosapi.aprobacionsolppro.controller.DetalleProveedor", {
            onInit: function () {
				that = this;
				oModelPreRegProv = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_PROV_SRV");
                this.getRouter().getRoute("DetalleProveedor").attachPatternMatched(this._onObjectMatched, this)
            },

			_onObjectMatched: async function () {
				sap.ui.core.BusyIndicator.show(0)
				this.inciarModelosArrays()
				if (this.getOwnerComponent().getModel("oViewProveedor") == undefined) {
					sap.ui.core.BusyIndicator.hide()
					this.onNavBack()
				}
				Repositoryid = this.onObtenerRepositorioId()
				let oViewProveedor = this.getOwnerComponent().getModel("oViewProveedor").getData()
				let oNewMmodeloProveedor = this.formatoModelSAPtoBtp(oViewProveedor)
				this.setModel(new JSONModel(oNewMmodeloProveedor), "oProveedor")

				this.getView().getModel("ListaReferencias").setProperty("/data", oViewProveedor.ReferenciasFinDetSet.results )
				this.getView().getModel("ListaLineaProducto").setProperty("/data", oNewMmodeloProveedor.LineaProducto.LineaProductoDetSet)
				this.getView().getModel("ListaPrincClientes").setProperty("/data", oNewMmodeloProveedor.ExpClienteCab.ExpPrincClientesDetSet)
				this.getView().getModel("ListaLinNegocio").setProperty("/data", oNewMmodeloProveedor.LineaNegocio.LineaNegocioDetSet)

				//await this.obtenerDocumentos()
				this.byId("iconTabBar").setSelectedKey("Contacto")
				var oModelUser = this.getOwnerComponent().getModel("userData");
				oModelUser.setProperty("/Validacion", oViewProveedor.Validacion);

				this._getListaPaises()
				//this._getListaGrupos()
				//this._getListaCategoria()
				this._getListaMoneda()
				this._getListaNombreBanco()
				this._getListaTipoPlanes()
				this._getListaTipoCuenta()
				//this._getListaEspecialidad()
				await this._obtenerDocumentosCertificados()
				sap.ui.core.BusyIndicator.hide()
			},

			inciarModelosArrays: function () {
				let oDataRef = { data: [] };
		
				let oModelReferencia = this.getView().getModel("ListaReferencias");
				if (!oModelReferencia) {
					oModelReferencia = new sap.ui.model.json.JSONModel(oDataRef);
					this.getView().setModel(oModelReferencia, "ListaReferencias");
				} else {
					this.getView().setModel(oModelReferencia, "ListaReferencias");
				}
		
				let oDataLineaProducto = { data: [] };
    
				let oModelLineaProducto = this.getView().getModel("ListaLineaProducto");
				if (!oModelLineaProducto) {
					oModelLineaProducto = new sap.ui.model.json.JSONModel(oDataLineaProducto);
					this.getView().setModel(oModelLineaProducto, "ListaLineaProducto");
				} else {
					this.getView().setModel(oModelLineaProducto, "ListaLineaProducto");
				}
		
				let oDataPrinClientes = { data: [] };
		
				let oModelPrinClientes = this.getView().getModel("ListaPrincClientes");
				if (!oModelPrinClientes) {
					oModelPrinClientes = new sap.ui.model.json.JSONModel(oDataPrinClientes);
					this.getView().setModel(oModelPrinClientes, "ListaPrincClientes");
				} else {
					this.getView().setModel(oModelPrinClientes, "ListaPrincClientes");
				}

				let oDataLineaNegocio = { data: [] };
    
				let oModelLineaNegocio = this.getView().getModel("ListaLinNegocio");
				if (!oModelLineaNegocio) {
					oModelLineaNegocio = new sap.ui.model.json.JSONModel(oDataLineaNegocio);
					this.getView().setModel(oModelLineaNegocio, "ListaLinNegocio");
				} else {
					this.getView().setModel(oModelLineaNegocio, "ListaLinNegocio");
				}
		
				//Iniciar modelo de documentos y certificaciones
				let aDocumentos = {
					brochure: [],
					balance: [],
					estado: [],
					certificado_tributaria: [],
					celula: [],
					certificado_cuenta: [],
					certificado_iso: [],
					legajo: [],
					terminos: [],
					sistema: []
				}
				this.setModel(new JSONModel(aDocumentos), "aDocumentos")
			},

			onNavBack: function () {
                this.getRouter().navTo("RouteHome");
			},

			onChangePais: async function (oEvent) {
				let sKey = this.byId("cboMainPais").getSelectedKey()
				let filters = []
				filters.push(new Filter("Land1", "EQ", `${sKey}`))
	  
				try {
					let oModel = this.getOwnerComponent().getModel()
					const aListaRegiones = await this.readEntity(oModelPreRegProv, "/ConsultaRegionDepartamentoSet", {filters})
					oModel.setProperty("/RegionDptp", aListaRegiones.results)
					if ( aListaRegiones.results.length == 0 ) {
						this.byId("cboMainRegionDpto").setSelectedKey("")
						this.byId("cboMainCiudad").setSelectedKey("")
					} else {
						this.byId("cboMainRegionDpto").fireChange()
					}
				} catch (error) {
					MessageBox.error(JSON.parse(error.responseText).error.message.value)
					console.log("Funcion onChangePais: " + error)
				}
			},
	
			onChangeRegion: async function (oEvent) {
				let sKey =  this.byId("cboMainRegionDpto").getSelectedKey(),
					sKeyPais = this.byId("cboMainPais").getSelectedKey()
				let filters = []
				filters.push(new Filter("Region", "EQ", `${sKey}`))
				filters.push(new Filter("Pais", "EQ", `${sKeyPais}`))
				
				try {
					let oModel = this.getOwnerComponent().getModel()
					const aListaCiudades = await this.readEntity(oModelPreRegProv, "/ConsultaRegDepCiudadSet", {filters})
					oModel.setProperty("/Ciudad", aListaCiudades.results)
					if ( aListaCiudades.results.length == 0 ) {
						this.byId("cboMainCiudad").setSelectedKey("")
					}
				} catch (error) {
					MessageBox.error(JSON.parse(error.responseText).error.message.value)
					console.log("Funcion onChangeRegion: " + error)
				}
			},

			//Obtener documento existente
			obtenerDocumentos: function () {
				return new Promise(async (resolve,reject) => {
					let oViewProveedor = this.getOwnerComponent().getModel("oViewProveedor").getData()
	  
					try {
					
						$.ajax({
							url: that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oViewProveedor.Taxnumxl,
							type: "GET",
							"mimeType": "multipart/form-data",
							"contentType": false,
							"processData": false,
							success: function (data) {
								let aObjects = JSON.parse(data).objects.filter( oPos => oPos.object.properties["cmis:objectTypeId"].value != 'cmis:folder' )
								if (aObjects.length == 0) {
									bHayDocumento = false
									resolve(true)
								} else {
									let oReturn = encontrarArchivoActual(aObjects)
									if (oReturn) {
										let sUrl = that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oViewProveedor.Taxnumxl + "/" + aObjects[0].object.properties["cmis:name"].value
										var oViewModel = that.getView().getModel();
										oViewModel.setProperty("/Source", sUrl );
										oViewModel.setProperty("/Title", aObjects[0].object.properties["cmis:name"].value);
										oViewModel.setProperty("/Height", "600px");
										bHayDocumento = true
									} else {
										bHayDocumento = false
									}
								}
								
								resolve(true)
							},
							error: function (error) {
								let oError = JSON.parse(error.responseText)
								if ( oError.exception = "objectNotFound" ) {
									bHayDocumento = false
									resolve(false)
								}
								resolve(false)
							}
						})

					} catch (error) {
						sap.ui.core.BusyIndicator.hide()
						MessageBox.error(JSON.parse(error.responseText).error.message.value)
					}
				});
	  
				function encontrarArchivoActual(objetos) {
					return objetos.reduce(function(objetoMayor, objetoActual) {
						return new Date(objetoMayor.object.properties["cmis:creationDate"].value) > new Date(objetoMayor.object.properties["cmis:creationDate"].value) ? objetoActual : objetoMayor;
					});
				}
			},
			//Obtener el ID del repostiorio
			onObtenerRepositorioId: function() {
				//return "0687b0df-65d8-45b5-802c-a5e76db45277";//PRD
				return "2ac5f6e5-9f27-4c41-8e73-9191cf7a90be";  //QAS
			},

			//Funciones para obtener los DOCUMENTOS Y CERTIFICACIONES
			//Documentos y certificaciones
			// BROCHURE
			// BALANCE
			// ESTADO
			// CERTIFICADO_TRIBUTARIA
			// CELULA
			// CERTIFICADO_CUENTA
			// CERTIFICADO_ISO
			_obtenerDocumentosCertificados: async function () {
				let bBROCHURE = await that._buscarFolderDocumentacion("BROCHURE", "/brochure")
				let bBALANCE = await that._buscarFolderDocumentacion("BALANCE", "/balance")
				let bESTADO = await that._buscarFolderDocumentacion("ESTADO", "/estado")
				let bCERTIFICADO_TRIBUTARIA = await that._buscarFolderDocumentacion("CERTIFICADO_TRIBUTARIA", "/certificado_tributaria")
				let bCELULA = await that._buscarFolderDocumentacion("CELULA", "/celula")
				let bCERTIFICADO_CUENTA = await that._buscarFolderDocumentacion("CERTIFICADO_CUENTA", "/certificado_cuenta")
				let bCERTIFICADO_ISO = await that._buscarFolderDocumentacion("CERTIFICADO_ISO", "/certificado_iso")
				let bLEGAJO = await that._buscarFolderDocumentacion("LEGAJO", "/legajo")
				let bTERMINOS = await that._buscarFolderDocumentacion("TERMINOS", "/terminos")
				let bSISTEMA = await that._buscarFolderDocumentacion("SISTEMA", "/sistema")
			},
	
			//Buscar Folder Terminos
			_buscarFolderDocumentacion: function (sNombreCarpeta, sProperty) {
				let that = this;
				let oProveedor = this.getModel("oProveedor").getProperty("/DatosGeneral")
				
				return new Promise((resolve, reject) => {
					$.ajax({
						url: that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oProveedor.Taxnumxl + "/" + sNombreCarpeta,
						type: "GET",
						"mimeType": "multipart/form-data",
						"contentType": false,
						"processData": false,
						success: async function (data) {
							sap.ui.core.BusyIndicator.hide()
							let aObjects = JSON.parse(data).objects
							if (aObjects.length > 0) {
								for ( let i = 0; i < aObjects.length; i++ ) {
									let oObject = aObjects[i]
									let sUrl = that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oProveedor.Taxnumxl + "/" + sNombreCarpeta + "/" + oObject.object.properties["cmis:name"].value
									let aBrochure = that.getModel("aDocumentos").getProperty(sProperty) 
									let aFiles = aBrochure.concat([
										{
											name: oObject.object.properties["cmis:name"].value,
											url: sUrl,
											File: null,
											dms: true,
											fecha_creacion: that.formatoFechaMilenio(oObject.object.properties["cmis:creationDate"].value)
										}
									]);
									that.getModel("aDocumentos").setProperty(sProperty, aFiles);
								}
							} else {

							}
							resolve(true)
						},
						error: function (error) {
							resolve(false)
						},
					})
				});
			},

			_getAppModulePath: function () {  
				const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
				const appPath = appId.replaceAll(".", "/");
				return jQuery.sap.getModulePath(appPath);
			},

			completarCamposCalidad: function (aDatos) {
				if (aDatos.length > 0) {
				  let oGestionCalidad = aDatos[0]
					if ( oGestionCalidad.SisGesCal == "X" ) {
						this.byId("gestioncalidadFragment--rbgPregunta1").setSelectedIndex(0)
					} else {
						this.byId("gestioncalidadFragment--rbgPregunta1").setSelectedIndex(1)
					}
	  
					if ( oGestionCalidad.SisAsCal == "X" ) {
						this.byId("gestioncalidadFragment--rbgPregunta2").setSelectedIndex(0)
					} else {
						this.byId("gestioncalidadFragment--rbgPregunta2").setSelectedIndex(1)
					}
	  
					if ( oGestionCalidad.SisConCal == "X" ) {
						this.byId("gestioncalidadFragment--rbgPregunta3").setSelectedIndex(0)
					} else {
						this.byId("gestioncalidadFragment--rbgPregunta3").setSelectedIndex(1)
					}
	  
					if ( oGestionCalidad.SisGesAl == "1" ) {
						this.byId("gestioncalidadFragment--rbgPregunta4").setSelectedIndex(0)
					} else {
						this.byId("gestioncalidadFragment--rbgPregunta4").setSelectedIndex(1)
					}
	  
					if ( oGestionCalidad.CerIso == "X" ) {
						this.byId("gestioncalidadFragment--rbgISO").setSelectedIndex(0)
					} else {
						this.byId("gestioncalidadFragment--rbgISO").setSelectedIndex(1)
					}
	  
					if ( oGestionCalidad.EntCerPg == "X" ) {
						this.byId("gestioncalidadFragment--rbgPregunta5").setSelectedIndex(0)
					} else {
						this.byId("gestioncalidadFragment--rbgPregunta5").setSelectedIndex(1)
					}
	  
					if ( oGestionCalidad.EntCalProd == "X" ) {
						this.byId("gestioncalidadFragment--rbgPregunta6").setSelectedIndex(0)
					} else {
						this.byId("gestioncalidadFragment--rbgPregunta6").setSelectedIndex(1)
					}
	  
					if ( oGestionCalidad.SubProcAct == "X" ) {
						this.byId("gestioncalidadFragment--rbgPregunta7").setSelectedIndex(0)
						this.byId("gestioncalidadFragment--txtPregunta7Cal").setVisible(true)
					} else {
						this.byId("gestioncalidadFragment--rbgPregunta7").setSelectedIndex(1)
						this.byId("gestioncalidadFragment--txtPregunta7Cal").setVisible(false)
					}
				}
			  },
	
			/****************************************************/
			/** Funciones para obtener datos de los despegables */
			/****************************************************/
			_getListaPaises: async function(){
				try {
					let oModel = this.getOwnerComponent().getModel()
					const aListaPaises = await this.readEntity(oModelPreRegProv, "/ConsultaPaisesSet", {})
					oModel.setSizeLimit(9000);
					oModel.setProperty("/Paises", aListaPaises.results)
					console.log(aListaPaises);
				} catch (error) {
					sap.ui.core.BusyIndicator.hide()
					console.log("Funcion _getListaPaises: " + error)
				}
			},
	
			_getListaGrupos: async function(){
				try {
					let oModel = this.getOwnerComponent().getModel()
					const aListaGrupos = await this.readEntity(oModelPreRegProv, "/ConsultaGruposSet", {})
					oModel.setSizeLimit(9000);
					oModel.setProperty("/Grupos", aListaGrupos.results)
				} catch (error) {
					sap.ui.core.BusyIndicator.hide()
					console.log("Funcion _getListaGrupos: " + error)
				}
			},
	
			_getListaCategoria: async function(){
				try {
					let oModel = this.getOwnerComponent().getModel()
					const aListaCategoria = await this.readEntity(oModelPreRegProv, "/ConsultaCategoriasSet", {})
					oModel.setSizeLimit(9000);
					oModel.setProperty("/Categorias", aListaCategoria.results)
				} catch (error) {
					sap.ui.core.BusyIndicator.hide()
					console.log("Funcion _getListaCategoria: " + error)
				}
			},
	
			_getListaNombreBanco: async function(){
				try {
					let oModel = this.getOwnerComponent().getModel()
					const aListaNombreBanco = await this.readEntity(oModelPreRegProv, "/ConsultaNombreBancoSet", {})
					oModel.setSizeLimit(9000);
					oModel.setProperty("/NombreBancos", aListaNombreBanco.results)
				} catch (error) {
					sap.ui.core.BusyIndicator.hide()
					console.log("Funcion _getListaNombreBanco: " + error)
				}
			},
	
			_getListaMoneda: async function(){
				try {
					let oModel = this.getOwnerComponent().getModel()
					const aListaMoneda = await this.readEntity(oModelPreRegProv, "/ConsultaMonedaSet", {})
					oModel.setSizeLimit(9000);
					oModel.setProperty("/Moneda", aListaMoneda.results)
				} catch (error) {
					sap.ui.core.BusyIndicator.hide()
					console.log("Funcion _getListaMoneda: " + error)
				}
			},
	
			_getListaTipoPlanes: async function(){
				try {
					let oModel = this.getOwnerComponent().getModel()
					const aListaTipoPlanes = await this.readEntity(oModelPreRegProv, "/ConsultaPlanesDeSaludSet", {})
					oModel.setSizeLimit(9000);
					oModel.setProperty("/TipoPlanes", aListaTipoPlanes.results)
				} catch (error) {
					sap.ui.core.BusyIndicator.hide()
					console.log("Funcion _getListaTipoPlanes: " + error)
				}
			},
	
			_getListaTipoCuenta: async function(){
				try {
					let oModel = this.getOwnerComponent().getModel()
					const aListaTipoCuenta = await this.readEntity(oModelPreRegProv, "/ConsultaTipoCuentaBancSet", {})
					oModel.setSizeLimit(9000);
					oModel.setProperty("/TipoCuenta", aListaTipoCuenta.results)
					that.byId("cboMainPais").fireChange()
				} catch (error) {
					sap.ui.core.BusyIndicator.hide()
					console.log("Funcion _getListaTipoCuenta: " + error)
				}
			},

			_getListaEspecialidad: async function(){
				try {
					let oModel = this.getOwnerComponent().getModel()
					const aListaEspecialidad = await this.readEntity(oModelPreRegProv, "/ConsultaEspecialidadSet", {})
					oModel.setSizeLimit(9000);
					oModel.setProperty("/Especialidad", aListaEspecialidad.results)
				} catch (error) {
					console.log("Funcion _getListaEspecialidad: " + error)
				}
			},
	  
			formatoMoneda: function (sMonedaSo, sMonedaDo) {
				if (sMonedaSo === "X") {
					return "S/"
				}
	  
				if (sMonedaDo === "X") {
					return "USD"
				}
				return ""
			},

			formatoMonedaLP: function (sMonedaSo, sMonedaDo, sMonto) {
				if (sMonedaSo === "X") {
					return "S/ " + sMonto
				}
	  
				if (sMonedaDo === "X") {
					return sMonto + " USD"
				}
	  
				return ""
			}

		});
	});
