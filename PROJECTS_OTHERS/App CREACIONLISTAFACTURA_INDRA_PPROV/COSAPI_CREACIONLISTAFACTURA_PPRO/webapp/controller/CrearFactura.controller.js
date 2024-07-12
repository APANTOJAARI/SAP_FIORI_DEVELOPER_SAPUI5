sap.ui.define([
	"./Base.controller",
	'sap/m/Token',
	"sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/json/JSONModel",
], function(
	Controller,
	Token,
	MessageBox,
	Filter,
	FilterOperator,
	DateFormat,
	JSONModel
) {
	"use strict";
	let rutaInicial="",rucProveedor='',carpetaDMS={},numFactura,respuestasDMS = [],aAdjunto=[],respuestFactura,oEventRoute,oTipoOC="";
	let sResponsivePaddingClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer";
	let that;
	return Controller.extend("ns.cosapi.creacionlistadofactura.controller.CrearFactura", {
		/**
		 * @override
		 */
		onInit: function() {
			that = this;
			  rutaInicial = "/apidms/browser/"; //despliegue
			//rutaInicial = "/apidms/"; //despliegue			
			//rutaInicial ="/browser/";// browser//Local
			var oView = this.getView();
			this.getRouter().getRoute("ViewCrearFactura").attachMatched(this._onRouteMatched,this)	
			//this.onListaConformidades();
			this.onObtenerSociedades();
			this.onObtenerMoneda();
			//this.onObtenerDetraccion();
			this.onObtenerClaseDocumento();			
			var oMultiInput1 = oView.byId("idOrdenesCompra");
			oMultiInput1.setTokens([]);
			// add validator
			var fnValidator = function(args){
				var text = args.text;

				return new Token({key: text, text: text});
			};

			oMultiInput1.addValidator(fnValidator);
		},
		onChangeClaseDocumento:function(e){
			let clasedoc = this.byId("idClaseDocumento").getSelectedKey();
			let oModel = this.getOwnerComponent().getModel();
			if(clasedoc == "01"){
				oModel.setProperty("/tipoDoc",false)
				oModel.setProperty("/tipoDocFile",true)
			}else if(clasedoc == "02"){
				oModel.setProperty("/tipoDoc",true)
				oModel.setProperty("/tipoDocFile",true)
			}else{
				oModel.setProperty("/tipoDocFile",false)
			}
			
			
		},
		onObtenerMoneda:function(){
			let oModel = this.getOwnerComponent().getModel();
			let aMonedas = [
				{
					Key:"USD",
					Desc:"USD"
				},
				{
					Key:"PEN",
					Desc:"PEN"
				}
			]
			oModel.setProperty("/Moneda",aMonedas)
		},
		onObtenerRepositorios:function(){
			 //carpetaDMS.Repositoryid = "2ac5f6e5-9f27-4c41-8e73-9191cf7a90be";//QAS
			   carpetaDMS.Repositoryid = "0687b0df-65d8-45b5-802c-a5e76db45277";//PRD
		},
		onSetformularioFactura:function(){
			let oFactura = {
				serieFactura :"",
				correlativo:"",
				fechaConta:new Date(),
				fechaEmision:"",
				importe:"",
				moneda:"",
				impuestos:"",
				claseDoc:"",
				condicionesPago:"",
				indicadorImpuestos:"",
				detraccion:"",
				Textocabpsdetalle:"",
				Textopsdtsbasicos:"",
				retencion:"",
				fielCumplimiento:"",
				fondoGarantia:"",
				rxh:""
			}
			let oModel = this.getOwnerComponent().getModel();	
			oModel.setProperty("/oFactura", oFactura)
		},
		onLimpiarBusqueda:function(){
			this.byId("IdSociedades").setSelectedKey("");
			this.byId("idFechas").setValue("");
			var oMultiInput1 = this.byId("idOrdenesCompra");
			oMultiInput1.setTokens([]);
		},
		_onRouteMatched:async function(oEvent){
			if(oEvent != undefined || oEvent!= null){
				oEventRoute= oEvent;
			}
			
			this.onClaseDocumentoValidacion();			
			this.onLimpiarValores();
			await this.getInfoUser();
			this.onSetformularioFactura();
			this.onObtenerRepositorios();
			let oModelUser = this.getOwnerComponent().getModel("userData");
			let ruc = oModelUser.getProperty("/userId")
			
			let oArgs;
			oArgs= oEventRoute.getParameter("arguments");
			console.log(oArgs);
			if(ruc == ""){
				oModelUser.setProperty("/userId",oArgs.bussinesPartner);   
				ruc = oModelUser.getProperty("/userId")
			}
			this.byId("idPageCrearFactura").setTitle("Proveedor: " + ruc);
			this.onSetformularioFactura();
			let oModel = this.getOwnerComponent().getModel();
			let mensaje ="<p>Adjuntar el sustento en el siguiente orden</p>"+ 
						"<p><strong>a)&nbsp;&nbsp;Materiales</strong></p>"+
						"<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>1.-</strong> factura ( y NC informativa)</p>"+
						"<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>2.-</strong> GR</p>"+
						"<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>3.-</strong> HEM</p>"+
						"<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>4.-</strong> ORDEN DE COMPRA (OC)</p>"+
						"<p> </p>"+
						"<p><strong>b)&nbsp;&nbsp;Servicios y Subcontratación</strong></p>"+ 
						"<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>1.-</strong> factura (y NC informativa)</p>"+
						"<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>2.-</strong> valorizaicon y/o conformidad de servicio</p>"+
						"<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>3.-</strong> HES</p>"+
						"<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>4.-</strong> ORDEN DE SERVICIO (OS)</p>"+
						"<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>5.-</strong> Sustentos adicionales</p>";
			oModel.setProperty("/HTML",mensaje)
			oModel.setProperty("/ListaConformidades",[])
			rucProveedor= ruc
			numFactura=""
			respuestasDMS = []
			aAdjunto=[]
			respuestFactura
			oModel.setProperty("/VisibleFactura", false)
			oModel.setProperty("/VisibleRxh", false)
		},
		onClaseDocumentoValidacion:function(){
			let oModel = this.getOwnerComponent().getModel();
			oModel.setProperty("/tipoDoc",false)
			oModel.setProperty("/tipoDocFile",false)
		},
		onBack:function(){
			this.onNavBack();
		},
		onListaConformidades:async function(){
			let parameters={}
			let filterList=[]
			let sSociedad = this.byId("IdSociedades").getSelectedKey();
			let oFechas = this.byId("idFechas");
			let aOrdenesCompra = this.byId("idOrdenesCompra").getTokens();
			let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
			filterList.push(new Filter("Stcd1","EQ",rucProveedor))
			if(sSociedad != ""){
				filterList.push(new Filter("Bukrs","EQ",sSociedad))
			}
			if(oFechas.getDateValue() != null || oFechas.getSecondDateValue() != null){
				filterList.push(new Filter("Fechacontabilizacion","EQ",this.formatearFechas(oFechas.getDateValue(),oFechas.getSecondDateValue())))
			}
			if(aOrdenesCompra.length != 0){
				aOrdenesCompra.forEach(element => {
					filterList.push(new Filter("Ordendecompra","EQ",element.getKey()))
				});
			}
			
			parameters.filters = filterList
			try {
				let oModel = this.getOwnerComponent().getModel();
				const aListaConformidades = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ListaPreregistroFacturaSet", parameters);
				oModel.setProperty("/ListaConformidades", aListaConformidades.results)
			} catch (error) {
				MessageBox.error("Error al obtener estados")
			}
			
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
		onIrVistaOc:function(e){
			let oFila = e.getSource().getBindingContext().getObject()
			this.onNavto("ViewOrdenCompra",{ordenCompra:oFila.Ebeln})
		},
		//Filtros Conformidades
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
		onObtenerDetraccion: async function(sociedad,ruc){
			let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
			try {
				let parameters = {};
				let filterList=[]
				if(sociedad != ""){
					filterList.push(new Filter("Sociedad","EQ",sociedad))
				}
				filterList.push(new Filter("Stcd1","EQ",ruc))
				parameters.filters = filterList
				let oModel = this.getOwnerComponent().getModel();
				const detraccion = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaIndicadorDetraccionSet", parameters);
				oModel.setProperty("/Detraccion", detraccion.results)
			} catch (error) {
				MessageBox.error("Error al obtener Detraccion")
			}
		},
		onObtenerRetencion: async function(sociedad,ruc){
			let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
			try {
				let parameters = {};
				let filterList=[]
				if(sociedad != ""){
					filterList.push(new Filter("Sociedad","EQ",sociedad))
				}
				filterList.push(new Filter("Stcd1","EQ",ruc))
				parameters.filters = filterList
				let oModel = this.getOwnerComponent().getModel();
				const retencion = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaIndicadorRetencionSet", parameters);
				oModel.setProperty("/Retención", retencion.results)
			} catch (error) {
				MessageBox.error("Error al obtener Retencion")
			}
		},
		onChangeSociedad: function(e){
			// let sociedad = this.byId("IdSociedades").getSelectedKey();
			// let oModelUser = this.getOwnerComponent().getModel("userData");
			// let ruc = oModelUser.getProperty("/userId")
			// this.onObtenerDetraccion(sociedad,ruc);
			// this.onObtenerRetencion(sociedad,ruc);
		},
		onObtenerClaseDocumento: async function(){
			let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
			try {
				let oModel = this.getOwnerComponent().getModel();
				const claseDocumento = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaClaseDocumentoSet", []);
				oModel.setProperty("/ClaseDocumento", claseDocumento.results)
			} catch (error) {
				MessageBox.error("Error al obtener clases de documentos")
			}
		},
		onCrearFactura: async function(){

			
			let oBusyDialog = new sap.m.BusyDialog({
				title: "Cargando",
				text: "Por favor espere...",
				showCancelButton: false
			});

			//sap.ui.core.BusyIndicator.show(0)
			oBusyDialog.open();  //+@INSERT

			let oModel = this.getOwnerComponent().getModel();
			let oTable = this.byId("idTableConformidades");
			let filasSeleccionadas = [];
			if(oTable.getSelectedIndices().length == 0){
				//sap.ui.core.BusyIndicator.hide();
				oBusyDialog.close(); //+@INSERT
				MessageBox.error("Debe seleccionar alguna conformidad para poder crear la factura")
				return false;
			}
			
			if(this.byId("idFileUploaderCdr").getValue() == ""){
				//sap.ui.core.BusyIndicator.hide();
				oBusyDialog.close(); //+@INSERT
				MessageBox.error("Debe agregar el PDF de la factura en la sección de documentos")
				return false;
			}
			// if(this.byId("idFileUploaderPDF").getValue() == ""){
			// 	sap.ui.core.BusyIndicator.hide();
			// 	MessageBox.error("Debe agregar el PDF de la factura en la sección de documentos")
			// 	return false;
			// }
			// Obtener la tabla por su ID
			// Obtener los índices de las filas seleccionadas
			let aSelectedIndices = oTable.getSelectedIndices();
			// Iterar sobre los índices de las filas seleccionadas para obtener los datos
			let sociedad = "";
			aSelectedIndices.forEach(function (iIndex) {
				sociedad = oTable.getContextByIndex(iIndex).getObject().Bukrs;
				let oFila = { 
					"Nroconformidad":oTable.getContextByIndex(iIndex).getObject().Parteingreso, 
					"Posicion":oTable.getContextByIndex(iIndex).getObject().Ebelp, 
					"Ordendecompra":oTable.getContextByIndex(iIndex).getObject().Ebeln
				}			
				filasSeleccionadas.push(oFila);
			});
			//Se obtiene los datos de la factura
			let oFactura = oModel.getProperty("/oFactura");
			if(numFactura == "" || numFactura == undefined){
				//sap.ui.core.BusyIndicator.hide();
				oBusyDialog.close(); //+@INSERT
				MessageBox.error("Debe subir el XML antes de continuar con la creación")
				return false;
			}
			if(oFactura.fechaConta == undefined || oFactura.fechaConta == "" || oFactura.fechaConta == null){
				//sap.ui.core.BusyIndicator.hide();
				oBusyDialog.close(); //+@INSERT
				MessageBox.error("Debe ingresar la fecha de contabilización para continuar con la creación de la factura")
				return false;
			}
			let oModelUser = this.getOwnerComponent().getModel("userData");
			let ruc = oModelUser.getProperty("/userId")
			let email = oModelUser.getProperty("/email")
			let sEnvio = { 
				"Stcd1":rucProveedor, 
				"Sociedad":sociedad, 
				"Nroseriecorrelativo":numFactura, 
				"Filtrofechacontab":"", 
				"Importemasigvxml":oFactura.importe, 
				"Impuestoxml":oFactura.impuestos, 
				"Monedaxml":oFactura.monedaImporte, 
				"Fechaemision":this.onFormatearFecha(oFactura.fechaEmision), 
				"Fechacontabilizacion":this.onFormatearFecha(oFactura.fechaConta), 
				"Clasedocumento":oFactura.claseDoc, 
				"CodigoFc":oFactura.fielCumplimiento,
				"CodigoFg":oFactura.fondoGarantia,
				"CodigoRe":oFactura.retencion,
				"CodigoDe":oFactura.detraccion,
				"CodigoRh":oFactura.rxh,
				"Montobasefc":oFactura.Montobasefc,
				"Montobasede":oFactura.montoBaseDE,
				"Montobasefg":oFactura.montoFondoGarantia,
				"Montobaserh":oFactura.montoporHonorarios,
				"Usuariolog":ruc, 
				"Correonombrelog":email,
				"Textopsdtsbasicos" :oFactura.Textopsdtsbasicos,
				"Textocabpsdetalle":"",
				"PreliminarConformidadesSet":filasSeleccionadas, 
				"PreliminarErroresSet":[] 
			} 
			try {				
				let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
				const oCrearFactura = await this.createEntity(ZMMGS_PRE_REG_FACT_SRV, "/PreliminarCabeceraSet", sEnvio);
				if(oCrearFactura.Codigo == "500"){
					let texto = "<ul>"
					oCrearFactura.PreliminarErroresSet.results.forEach(element => {
						texto = texto + "<li>" + element.Mensaje + "</li>"
					});
					texto = texto + "</ul>";
					MessageBox.error(oCrearFactura.Mensaje, {
						title: "Error",
						id: "messageBoxId2",
						details: texto,
						contentWidth: "250px",
						styleClass: sResponsivePaddingClasses
					});
					//this._onRouteMatched()
					//sap.ui.core.BusyIndicator.hide();
					oBusyDialog.close(); //+@INSERT
					return false;
				}else{
					//sap.ui.core.BusyIndicator.hide();
					oBusyDialog.close(); //+@INSERT
					respuestFactura = oCrearFactura;
					this.onGuardarDMS(sociedad);
				}
				
				//MessageBox.success("Se creo la factura correctamente");
			} catch (error) {
				//sap.ui.core.BusyIndicator.hide();
				oBusyDialog.close(); //+@INSERT
				//MessageBox.error("Ocurrio un error al obtener la factura")
				console.error("Error - Function: Create Factura");
				console.error(error);
				MessageBox.error("Estimado proveedor, favor volver a intentarlo en unos minutos");
			}
			

			//this.guardarDocumentosAdjuntos();
			//this.onBack();
		},
		onSelectionConformidad:function(e){
			console.log(e);
			let seleccionado = e.getParameters().rowIndex;
			let fila = this.byId("idTableConformidades").getContextByIndex(seleccionado).getObject();
			if(this.byId("idTableConformidades").getSelectedIndices().length > 0){
				if(oTipoOC != ""){
					if(fila.Detraccionretencion != oTipoOC){

						MessageBox.error("No se puede seleccionar un tipo de conformidad distinta a la que ya esta seleccionada");
						this.byId("idTableConformidades").clearSelection(seleccionado);
						return false;
					}
					if(fila.Detraccionretencion == "Retención"){							
						this.byId("idDetraccionForm").setVisible(false);
						this.byId("idRetencionForm").setVisible(true);
					}else{
						this.byId("idDetraccionForm").setVisible(true);
						this.byId("idRetencionForm").setVisible(false);			
					}
				}else{
					if(fila.Detraccionretencion == "Retención"){		
						oTipoOC="Retención"
						this.byId("idDetraccionForm").setVisible(false);
						this.byId("idRetencionForm").setVisible(true);
					}else{
						oTipoOC="Detracción"
						this.byId("idDetraccionForm").setVisible(true);
						this.byId("idRetencionForm").setVisible(false);			
					}
				}
				
			}else{
				oTipoOC="";
				this.byId("idDetraccionForm").setVisible(false);
				this.byId("idRetencionForm").setVisible(false);
			}
			
		},
		onGuardarPDF:function(event){
			const files = event.getParameter("files");
			const fileUploader = event.getSource();
			if (files.length > 0) {
				aAdjunto.push({"identificador":"PDF","file":files[0]});	
			}
		},
		onGuardarGuiaRemision:function(event){
			const files = event.getParameter("files");
			const fileUploader = event.getSource();
			if (files.length > 0) {
				aAdjunto.push({"identificador":"GuiaRemision","file":files[0]});	
			}
		},
		onGuardarCdr:function(event){
			const files = event.getParameter("files");
			const fileUploader = event.getSource();
			if (files.length > 0) {
				aAdjunto.push({"identificador":"CDR","file":files[0]});	
			}

			const uniqueFiles = {};
			const result = aAdjunto.filter(item => {
				if (uniqueFiles[item.file.name]) {
					return false;
				} else {
					uniqueFiles[item.file.name] = true;
					return true;
				}
			});

			aAdjunto = result
		},
		onImportarArchivoXml: async function (event) {
			try {
				const files = event.getParameter("files");
                const fileUploader = event.getSource();
				let clasedoc = this.byId("idClaseDocumento").getSelectedKey();
                if (files.length > 0) {
                    const file = files[0];
                    const dataXml = await this._readFiles(file);
					// if (!dataXml.attacheddocument.attachment.externalreference.description.invoice && !dataXml.invoice && !dataXml.attacheddocument.attachment.externalreference.description) {//dataXml.invoice
                    //     MessageBox.error(`El archivo xml no cumple con el formato requerido`);
                    //     fileUploader.setValue("");
                    //     return;
                    // }
					let id = clasedoc + "-" + dataXml.invoice["id"];
					numFactura = id
					if(dataXml.invoice){
						//guardado de documento xml para enviarlo al dms					
						aAdjunto.push({"identificador":"xml","file":files[0]});	
						const uniqueFiles = {};
						const result = aAdjunto.filter(item => {
							if (uniqueFiles[item.file.name]) {
								return false;
							} else {
								uniqueFiles[item.file.name] = true;
								return true;
							}
						});

						aAdjunto = result
						//					
						
						let monto =null;
						let impuestos=null;
						// if(dataXml.invoice["paymentterms"] != undefined || dataXml.invoice["paymentterms"] != null){
						// 	monto = dataXml.invoice["paymentterms"].amount
						// }
						if(dataXml.invoice["delivery"]!= undefined || dataXml.invoice["delivery"] != null){
							if (dataXml.invoice["delivery"].legalmonetarytotal) {
								monto = dataXml.invoice["delivery"].legalmonetarytotal.payableamount
							}else {
								monto = dataXml.invoice["legalmonetarytotal"].payableamount
							}

							if (dataXml.invoice["delivery"].taxtotal) {
								impuestos = dataXml.invoice["delivery"].taxtotal.taxamount
							} else {
								impuestos = dataXml.invoice["taxtotal"].taxamount
							}
						}
						if(dataXml.invoice["expirydate"]!= undefined || dataXml.invoice["expirydate"] != null){
							monto = dataXml.invoice["expirydate"].legalmonetarytotal.payableamount
							impuestos = dataXml.invoice["expirydate"].taxtotal.taxamount
						}
						if(dataXml.invoice["legalmonetarytotal"]!= undefined || dataXml.invoice["legalmonetarytotal"] != null){
							monto = dataXml.invoice["legalmonetarytotal"].payableamount
						}
						if(dataXml.invoice["taxtotal"]!= undefined || dataXml.invoice["taxtotal"] != null){
							impuestos = dataXml.invoice["taxtotal"].taxamount 
						}													
						let oFactura = {}
						if(clasedoc == "01"){
							if(monto == null || impuestos==null)	{
								MessageBox.error("El formato del XML no es el correcto");
								return false;
							}
							oFactura = {
								serieFactura :id.split("-")[0] + "-" +id.split("-")[1],
								correlativo:id.split("-")[2],
								fechaConta:new Date(),
								fechaEmision: fechaLocal(dataXml.invoice["issuedate"]), //new Date(dataXml.invoice["issuedate"]),
								importe:monto,
								monedaImporte:dataXml.invoice["documentcurrencycode"],
								monedaImpuesto:dataXml.invoice["documentcurrencycode"],
								impuestos:impuestos,
								claseDoc:dataXml.invoice["invoicetypecode"],
								condicionesPago:this.byId("idCondicionesPago").getValue(),
								indicadorImpuestos:this.byId("idIndicadorImpuestos").getValue(),
								detraccion:this.byId("idDetraccion").getSelectedKey()
							}
						}else if(clasedoc == "02"){
							oFactura = {
								serieFactura :id.split("-")[0] + "-" +id.split("-")[1],
								correlativo:id.split("-")[2],
								fechaConta:new Date(),
								fechaEmision: fechaLocal(dataXml.invoice["issuedate"]), //new Date(dataXml.invoice["issuedate"]),
								importe:"",
								moneda:"",
								monedaImporte:"",
								monedaImpuesto:"",
								impuestos:"",
								claseDoc:"02",
								condicionesPago:this.byId("idCondicionesPago").getValue(),
								indicadorImpuestos:this.byId("idIndicadorImpuestos").getValue(),
								detraccion:this.byId("idDetraccion").getSelectedKey()
							}
						}else{
							MessageBox.error("El formato del XML no es el correcto");
							return false;
						}
						
						let oModel = this.getOwnerComponent().getModel();
						oModel.setProperty("/oFactura", oFactura)
						if(oFactura.claseDoc == "01"){
							oModel.setProperty("/VisibleFactura", false)
							oModel.setProperty("/VisibleRxh", false)
							that.onTipoDoc1();
						}else if(oFactura.claseDoc == "02"){
							oModel.setProperty("/VisibleFactura", false)
							oModel.setProperty("/VisibleRxh", false)
							that.onTipoDoc2();
						}
						//this.onGuardarXML(file);
					}
				}
			} catch (error) {
				MessageBox.error("El formato del XML no es el correcto");
			}

			function fechaLocal (fecha) {
				let [year, month, day] = fecha.split('-').map(Number);
				let date = new Date(year, month - 1, day);
				return date
			}
		},
		onTipoDoc1:async function(){
			try {
				let detraccion = await this.onObtenerTiposRet("01","DE","/Detraccion");
				let retencion = await this.onObtenerTiposRet("01","RE","/Retención");
				let fielCumplimiento = await this.onObtenerTiposRet("01","FC","/FIelCumplimiento");
				let fondoGarantia = await this.onObtenerTiposRet("01","FG","/FondoGarantia");
			} catch (error) {
				MessageBox.error("Error al obtener Retencion")
			}
		},
		onTipoDoc2:async function(){
			try {
				let rxh = await this.onObtenerTiposRet("02","RH","/Rxh");				
			} catch (error) {
				MessageBox.error("Error al obtener Retencion")
			}
		},
		onObtenerTiposRet: async function(claseDoc,Indicador,modelo){
			let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
			try {
				let parameters = {};
				let filterList=[]				
				filterList.push(new Filter("Clasedocumento","EQ",claseDoc))
				filterList.push(new Filter("Indicador","EQ",Indicador))
				parameters.filters = filterList
				let oModel = this.getOwnerComponent().getModel();
				const retencion = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaRetencionPorClaseDocSet", parameters);
				oModel.setProperty(modelo, retencion.results)
			} catch (error) {
				MessageBox.error("Error al obtener Retencion")
			}
		},
		_readFiles: async function (file) {
            const resolveImport = (evt) => {
                //const objData = this._xmlToJson(evt.target.result);
                const content = evt.target.result;
                const withoutBom = this._removeBom(content);
                const objData = this._xmlToJson(withoutBom);
                return objData;
            };

            const rejectImport = (error) => error;

            const dataFile = new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = resolve;
                reader.onerror = reject;
                reader.readAsBinaryString(file);
            });

            return await dataFile.then(resolveImport, rejectImport);
        },
		_removeBom: function (content) {
            return content.replace(/^\ï»¿/, ''); //Remove Bom
        },
		_xmlToJson: function (xml) {
            const roots = $(xml);
            const root = roots[roots.length - 1];
            const json = {};
            this._parse(root, json);
            console.log(json);
            return json;
        },
		_parse: function (node, j) {
            var nodeName = node.nodeName.replace(/^.+:/, '').toLowerCase();
            var cur = null;
            var that = this;
            var text = $(node).contents().filter(function (x) {
                return this.nodeType === 3;
            });

            if (text[0] && text[0].nodeValue.trim()) {
                //el nodo description contiene CDATA con tag Invoice que tiene la info de factura
                //se ajustó la lógica para extraer el valor correctamente
                if (nodeName.includes("description")) {
                    cur = {};
                    $.each(node.attributes, function () {
                        if (this.name.indexOf('xmlns:') !== 0) {
                            cur[this.name.replace(/^.+:/, '')] = this.value;
                        }
                    });
                    $.each(node.children, function () {
                        that._parse(this, cur);
                    });
                }
                else {
                    cur = text[0].nodeValue;
                }

            } else {

                cur = {};
                $.each(node.attributes, function () {
                    if (this.name.indexOf('xmlns:') !== 0) {
                        cur[this.name.replace(/^.+:/, '')] = this.value;
                    }
                });
                $.each(node.children, function () {
                    that._parse(this, cur);
                });
            }

            j[nodeName] = cur;
        },
		onGuardarDMS: async function(sociedad){
			sap.ui.core.BusyIndicator.show(0);
			let that = this;
			//let sociedad = this.byId("IdSociedades").getSelectedKey();
			let ruta ="FACTURAS";
			let formAdjunto;
			//Creo folder de RUC
			try {				
				formAdjunto = that.onFormDataFolder(rucProveedor);
				let res1 = await that.onCreateCarpetasDMS(formAdjunto, "/" + ruta);
				//let res1 = this.onCrearAdjuntoFolder(rucProveedor,ruta);
				respuestasDMS.push(res1);
			} catch (error) {
				respuestasDMS.push(JSON.parse(error.responseText).exception);
			}
			//CREO folder de sociedad
			try {								
				ruta = ruta + "/"+ rucProveedor
				formAdjunto = that.onFormDataFolder(sociedad);
				let res2 = await that.onCreateCarpetasDMS(formAdjunto, "/" + ruta);
				respuestasDMS.push(res2);
			} catch (error) {
				respuestasDMS.push(JSON.parse(error.responseText).exception);
			}
			
			//CREO folder de num factura
			try {
				ruta = ruta  + "/" + sociedad
				formAdjunto = that.onFormDataFolder(numFactura);
				let res3 =  await that.onCreateCarpetasDMS(formAdjunto, "/" + ruta);
				respuestasDMS.push(res3);
				
			} catch (error) {
				respuestasDMS.push(JSON.parse(error.responseText).exception);
			}
			console.log(respuestasDMS);
			//Creo documentos
			let aErrores = await this.guardarDocumentosAdjuntos(sociedad);
			if(aErrores.length == 0){
				MessageBox.success(respuestFactura.Mensaje);
				sap.ui.core.BusyIndicator.hide();
			}else{
				let texto = "<ul>"
				aErrores.forEach(element => {
					texto = texto + "<li>" + element.message + "</li>"
				});
				texto = texto + "</ul>";
				MessageBox.error(respuestFactura.Mensaje, {
					title: "Factura creada con errores en documentos subidos",
					id: "messageBoxFinal",
					details: texto,
					contentWidth: "350px",
					styleClass: sResponsivePaddingClasses
				});
				sap.ui.core.BusyIndicator.hide();
			}
			this._onRouteMatched();
			
		},
		onCrearAdjuntoFolder: async function (nombre,ruta) {
			let that = this;
				let formAdjunto = that.onFormDataFolder(nombre);
				let respuesta = {
					tipo :"",
					res :""
				}
				try {
					let resCreaCarpeta = await that.onCreateCarpetasDMS(formAdjunto, "/" + ruta);
					respuesta.tipo = 0
					respuesta.res = resCreaCarpeta
					return 	respuesta;
				} catch (error) {
					sap.ui.core.BusyIndicator.hide();
					if (JSON.parse(error.responseText).exception == "nameConstraintViolation") {
						respuesta.tipo = 0
						respuesta.res = "nameConstraintViolation"
						return respuesta;
					} else {
						respuesta.tipo = 0
						respuesta.res = JSON.parse(error.responseText).exception;
						return respuesta
					}
				}
		},
		//Crea carpetas en DMS
		onCreateCarpetasDMS: function (form, rutaCont) {
			let that = this;
		return new Promise((resolve, reject) => {

			$.ajax({
				url: that._getAppModulePath() + rutaInicial + carpetaDMS.Repositoryid + "/root/"+ rutaCont,
				type: "POST",
				"mimeType": "multipart/form-data",
				"contentType": false,
				"data": form,
				"processData": false
				, success: resolve,
				error: reject
			})
		});
		},

		onFormDataFolder: function (nombre) {
			var formOrden = new FormData();
			formOrden.append("cmisaction", "createFolder");
			formOrden.append("propertyId[0]", "cmis:name");
			formOrden.append("propertyValue[0]", nombre);
			formOrden.append("propertyId[1]", "cmis:objectTypeId");
			formOrden.append("propertyValue[1]", "cmis:folder");
			formOrden.append("succinct", "true");
			return formOrden;
		},

		//Obtiene los textos de los archivos i18n
		onOntenerTextoi18n: function (texto) {
			return oI18n.getText(texto);
		},
		//Función para guardas los nuevos documentos
		guardarDocumentosAdjuntos: function (sociedad) {
			let that = this;			
			let oResult = {
				type: "S",
				message: "",
			};
			let aErrores= [];
			//let sociedad = this.byId("IdSociedades").getSelectedKey();
			let idRepositorioDMS = carpetaDMS.Repositoryid;
			return new Promise(function (resolve, reject) {
				sap.ui.core.BusyIndicator.show(0);
				if (aAdjunto.length == 0) {
					MessageBox.error(that.onOntenerTextoi18n("subirAdjuntos"));
					sap.ui.core.BusyIndicator.hide();
					return;
				}				
				for (let i = 0; i < aAdjunto.length; i++) {
					let oItemAdjunto = aAdjunto[i];
					let oRequestOption = construirFormData(oItemAdjunto);

					fetch(that._getAppModulePath() + rutaInicial + idRepositorioDMS + "/root/FACTURAS/" + rucProveedor + "/" + sociedad + "/" + numFactura, oRequestOption)
						.then(response => response.text())
						.then(result => {
							console.log(result);
							sap.ui.core.BusyIndicator.hide();
							if (i == aAdjunto.length - 1) {
								resolve(aErrores);
							}
						}).catch(error => {
							oResult.type = "E";
							oResult.message = JSON.stringify(error)
							aErrores.push(oResult);
							sap.ui.core.BusyIndicator.hide();
							//resolve(oResult);
						});
				}

			});
			//construye formdata para file
			function construirFormData(oFile) {
				let file= oFile.file
				let sName = that.formatoNombreArchivo(file.name)
				if(oFile.identificador == "CDR"){
					sName = "SUS-" + sName;
				}
				var myHeaders = new Headers();
				var formdata = new FormData();
				formdata.append("cmisaction", "createDocument");
				formdata.append("propertyId[0]", "cmis:name");				
				formdata.append("propertyValue[0]", sName);
				formdata.append("propertyId[1]", "cmis:objectTypeId");
				formdata.append("propertyValue[1]", "cmis:document");
				formdata.append("filename", sName);
				formdata.append("_charset", "UTF-8");
				formdata.append("includeAllowableActions", "False");
				formdata.append("succinct", "true");
				formdata.append("media", file, sName);

				var requestOptions = {
					method: 'POST',
					headers: myHeaders,
					body: formdata,
					redirect: 'follow'
				};

				return requestOptions;
			}
		},
		onSubirDocumento: async function () {

			try {
				var res = await that.guardarDocumentosAdjuntos();
				MessageBox.success(that.onOntenerTextoi18n("exitoSubiradjuntos"));
				that.onIrDetalleDocumentos("Recarga");
			} catch (error) {
				MessageBox.error(res.message);
			}

		},
		formatoNombreArchivo: function (sFile) {
			var textoCodificado = encodeURIComponent(sFile);
			var sNombre = decodeURIComponent(textoCodificado);
			var reemplazos = {
				'Ã': 'A', 'À': 'A', 'Á': 'A', 'Ä': 'A', 'Â': 'A',
				'È': 'E', 'É': 'E', 'Ë': 'E', 'Ê': 'E',
				'Ì': 'I', 'Í': 'I', 'Ï': 'I', 'Î': 'I',
				'Ò': 'O', 'Ó': 'O', 'Ö': 'O', 'Ô': 'O',
				'Ù': 'U', 'Ú': 'U', 'Ü': 'U', 'Û': 'U',
				'ã': 'a', 'à': 'a', 'á': 'a', 'ä': 'a', 'â': 'a',
				'è': 'e', 'é': 'e', 'ë': 'e', 'ê': 'e',
				'ì': 'i', 'í': 'i', 'ï': 'i', 'î': 'i',
				'ò': 'o', 'ó': 'o', 'ö': 'o', 'ô': 'o',
				'ù': 'u', 'ú': 'u', 'ü': 'u', 'û': 'u',
				'Ñ': 'N', 'ñ': 'n',
				'Ç': 'c', 'ç': 'c'
			};
			var textoNormalizado = sNombre.replace(/[ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç]/g, function (match) {
				return reemplazos[match];
			});
			return textoNormalizado;
		},
		onLimpiarValores:function(){
			rucProveedor='',numFactura="",respuestasDMS = [],aAdjunto=[],respuestFactura=null;
			this.byId("idFileUploaderXML").setValue("");
			this.byId("idFileUploaderPDF").setValue("");
			this.byId("idFileUploaderGuiaRemision").setValue("");
			this.byId("idFileUploaderCdr").setValue("");
			this.byId("IdSociedades").setSelectedKey("");
			this.byId("idFechas").setValue("");
			var oMultiInput1 = this.byId("idOrdenesCompra");
			oMultiInput1.setTokens([]);
		},
		handleUploadComplete:function(event){
			const files = event.getParameter("files");
			const fileUploader = event.getSource();
		},
		onTest:function(){
			this.byId("idFileUploaderPDF").setValue("");
		}
	});
});