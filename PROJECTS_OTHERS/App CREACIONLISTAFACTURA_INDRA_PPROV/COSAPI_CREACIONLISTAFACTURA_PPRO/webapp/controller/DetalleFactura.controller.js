sap.ui.define([
	"./Base.controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	'sap/ui/core/BusyIndicator',
	"sap/ui/model/Filter",
], function(
	Controller,JSONModel,MessageBox,BusyIndicator,Filter
) {
	"use strict";
	let rucProveedor='',rutaInicial,carpetaDMS={},aAdjunto=[],aSustentoAntiguo,numFactura,sociedad,oEventRoute,pathGeneral,documentoSeleccionado
	let that
	return Controller.extend("ns.cosapi.creacionlistadofactura.controller.DetalleFactura", {
		onInit: function () {		
			that = this
			rutaInicial = "/apidms/browser/"; //despliegue			
			//rutaInicial ="/browser/"; //Local	
			this.onObtenerRepositorios();
			this.onObtenerSociedades();
			this.onObtenerClaseDocumento();
			this.getRouter().getRoute("ViewDetalleFactura").attachMatched(this._onRouteMatched,this)	
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
		onObtenerDetraccion: async function(){
			let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
			try {
				let oModel = this.getOwnerComponent().getModel();
				const detraccion = await this.readEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaIndicadorRetencionSet", []);
				oModel.setProperty("/Detraccion", detraccion.results)
			} catch (error) {
				MessageBox.error("Error al obtener estados")
			}
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
		onBack:function(){
			this.onNavBack();
		},
		_onRouteMatched:async function(oEvent){
			BusyIndicator.show();
			if(oEvent != undefined || oEvent!= null){
				oEventRoute= oEvent;
			}
			this.onLimpiarValores();
			await this.getInfoUser();
			let oModelUserData = this.getOwnerComponent().getModel("userData");
			rucProveedor = oModelUserData.getProperty("/userId")
			let oModelUser = this.getOwnerComponent().getModel();
			let oFila = oModelUser.getProperty("/oFilaSeleccionada");			
			let oArgs;
			oArgs= oEventRoute.getParameter("arguments");
			console.log(oArgs);
			this.byId("idPageDetalleFactura").setTitle("Preliminar: " + oArgs.preliminar);
			var oModel = this.getOwnerComponent().getModel();
			let aSolicitudes = oModel.getProperty("/aSolPreregistro")
			// if(aSolicitudes == undefined){
			// 	this.onNavto("RouteHome")
			// 	return false;
			// }
			
			//seteo cabecera
			let resultado;
			if(oFila != undefined && oFila != ''){
				resultado = oFila;			
			}else if(aSolicitudes != undefined && aSolicitudes != ''){
				const aResultado = aSolicitudes.filter(item => item.Invoicedocnumber === oArgs.preliminar);
				resultado = aResultado[0];
			}else{
				this.onNavto("RouteHome")
				return false;
			}
			if(rucProveedor == ""){
				rucProveedor = resultado.Stcd1;
			}
			let aSerCorre = resultado.Seriecorrelativo.split("-");
			numFactura= resultado.Seriecorrelativo;
			let oFactura = {
				serieFactura :aSerCorre[0] + "-" +  aSerCorre[1],
				correlativo:aSerCorre[2],
				fechaConta:this.onFormatoStringFecha(resultado.Fecontabilidadfac),
				fechaEmision:this.onFormatoStringFecha(resultado.Feemision),
				importe:resultado.Precioincluigv,
				moneda:resultado.Moneda,
				impuestos:resultado.Impuesto,
				claseDoc:resultado.Clasedocumento,
				condicionesPago:resultado.Condpagodescrip,
				indicadorImpuestos:resultado.Descripindimpuesto,
				detraccion:resultado.CodigoDe,
				fielCumplimiento:resultado.CodigoFc,
				fondoGarantia:resultado.CodigoFg,
				retencion:resultado.CodigoRe,
				rxh:resultado.CodigoRh,
				montoporHonorarios:resultado.Montobaserh,
				montoFondoGarantia:resultado.Montobasefg,
				montoBaseDE:resultado.Montobasede,
				Textopsdtsbasicos:resultado.Textopsdtsbasicos,
				Motivorechazodisconforme: resultado.Motivorechazodisconforme
			}
			let documentoObs;
			documentoSeleccionado=resultado;
			oModel.setProperty("/oFacturaDet", oFactura)
			//seteo posiciones
			oModel.setProperty("/ListaConformidadesDet", resultado.ConsultaRegFacturasDetSet.results)
			if(resultado.Clasedocumento == "01"){
				oModel.setProperty("/VisibleFactura", false)
				oModel.setProperty("/VisibleRxh", false)
				setTimeout(function() {
					that.onTipoDoc1();
					
				}, 500); // Supo
				
			}else if(resultado.Clasedocumento == "02"){
				oModel.setProperty("/VisibleFactura", false)
				oModel.setProperty("/VisibleRxh", false)
				setTimeout(function() {
					that.onTipoDoC2();					
				}, 500); // Supo
				
				
			}
			//obtengo documento
			let itemsUploadSet = [];
			sociedad = resultado.Sociedad
			let path = "FACTURAS/" + rucProveedor + "/" + resultado.Sociedad + "/" + resultado.Seriecorrelativo;
			pathGeneral =path;
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
					if(oFile.FileName.indexOf("SUS-") !== -1){
						aSustentoAntiguo=oFile;
						documentoObs=oFile.FileName;
					}
				});
				if(resultado.Codigoestado == "05"){
					this.onSeteoVistaObservado(resultado,true,documentoObs);
				}else{
					this.onSeteoVistaObservado(resultado,false,documentoObs);
				}
				var aEmpty = [];
				let oView = this.getView();
				var oModelEmpty = new JSONModel(aEmpty);
				oView.byId("UploadSet").setModel(oModelEmpty);
				var oModelDocumentosDMS = new JSONModel(itemsUploadSet);
				oView.byId("UploadSet").setModel(oModelDocumentosDMS);
				console.log(adjuntos);
			} catch (error) {
				BusyIndicator.hide();
				var aEmpty = [];
				let oView = this.getView();
				var oModelEmpty = new JSONModel(aEmpty);
				oView.byId("UploadSet").setModel(oModelEmpty);
				if(resultado.Codigoestado == "05"){
					this.onSeteoVistaObservado(resultado,true,documentoObs);
				}else{
					this.onSeteoVistaObservado(resultado,false,documentoObs);
				}
			}
			BusyIndicator.hide();
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
		onLimpiarValores:function(){
			rucProveedor='',numFactura="",aAdjunto=[],sociedad=null
			this.byId("idFileUploaderSUS").setValue("");	
		},
		onSeteoVistaObservado: function(oFila,estado,name){
			var oModel = this.getOwnerComponent().getModel();
			oModel.setProperty("/visibleObs", estado)
			this.byId("idMessageObsAdj").setText("Se modificara el documento "+ name)
			// this.byId("idMessageObs").setVisible(estado);

		},
		onActualizarSustento:async function(){		
			BusyIndicator.show();
			try {
				if (aSustentoAntiguo) {
					let form = this.onFormDataDelete(aSustentoAntiguo.objectId);
					let res2 = await this.onEliminarDoc(form,aSustentoAntiguo.FileName);
				}
				//Creo documentos
				let aErrores = await this.guardarDocumentosAdjuntos();
				if(aErrores.length == 0){
					this.onActualizarMarcadoObs();
					
				}else{
					let texto = "<ul>"
					aErrores.forEach(element => {
						texto = texto + "<li>" + element.message + "</li>"
					});
					texto = texto + "</ul>";
					MessageBox.error("Error actualizando el sustento", {
						title: "Factura creada con errores en documentos subidos",
						id: "messageBoxFinal",
						details: texto,
						contentWidth: "350px",
						styleClass: sResponsivePaddingClasses
					});
				}
				this._onRouteMatched();
				BusyIndicator.hide();
			} catch (error) {
				BusyIndicator.hide();
				MessageBox.error("Hubo un error al momento actualizar  el sustento")
			}
		},
		onActualizarMarcadoObs:async function(){
			BusyIndicator.show();
			try {
				let oDato = {           
					"Proveedor":documentoSeleccionado.Proveedor, //+@MODIFY
					"Sociedad":sociedad,
					"Ejercicio":documentoSeleccionado.Ejercicio,
					"Seriecorrelativo":numFactura,
					"Invoicedocnumber":documentoSeleccionado.Invoicedocnumber,
					}
				let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
				const oActualizar = await this.createEntity(ZMMGS_PRE_REG_FACT_SRV, "/DocumentoActualizadoSet ", oDato);
				MessageBox.success("Se actualizo el sustento");
				BusyIndicator.hide();
			} catch (error) {
				BusyIndicator.hide();
				MessageBox.error("Ocurrio un error al momento de actualizar el sustento en el marcado")
			}
			
		},
		//Función para guardas los nuevos documentos
		guardarDocumentosAdjuntos: function () {
			let that = this;			
			let oResult = {
				type: "S",
				message: "",
			};
			let aErrores= [];
			//let sociedad = this.byId("IdSociedades").getSelectedKey();
			let idRepositorioDMS = carpetaDMS.Repositoryid;
			return new Promise(function (resolve, reject) {
				BusyIndicator.show(0);
				if (aAdjunto.length == 0) {
					MessageBox.error(that.onOntenerTextoi18n("subirAdjuntos"));
					BusyIndicator.hide();
					return;
				}				
				for (let i = 0; i < aAdjunto.length; i++) {
					let oItemAdjunto = aAdjunto[i];
					let oRequestOption = construirFormData(oItemAdjunto);

					fetch(that._getAppModulePath() + rutaInicial + idRepositorioDMS + "/root/FACTURAS/" + rucProveedor + "/" + sociedad + "/" + numFactura, oRequestOption)
						.then(response => response.text())
						.then(result => {
							console.log(result);
							BusyIndicator.hide();
							if (i == aAdjunto.length - 1) {
								resolve(aErrores);
							}
						}).catch(error => {
							oResult.type = "E";
							oResult.message = JSON.stringify(error)
							aErrores.push(oResult);
							BusyIndicator.hide();
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
		onEliminarDoc: function (form,path) {
			let that = this;
			return new Promise((resolve, reject) => {
				$.ajax({
					url: that._getAppModulePath() + rutaInicial + carpetaDMS.Repositoryid + "/root", //+ pathGeneral +"/"+ path,
					type: "POST",
					"mimeType": "multipart/form-data",
					"contentType": false,
					"data": form,
					"processData": false
					, success: resolve,
				})
			});
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
		onFormDataDelete: function (id) {
			var formdata = new FormData();
			formdata.append("cmisaction", "delete");
			formdata.append("objectId", id);
			formdata.append("allVersions", "true");
			return formdata;
		},
		onGuardarSustento:function(event){
			const files = event.getParameter("files");
			const fileUploader = event.getSource();
			if (files.length > 0) {
				aAdjunto.push({"identificador":"CDR","file":files[0]});	
			}
		},
		onDownloadSelectedButton: function () {
			var oUploadSet = this.byId("UploadSet");

			oUploadSet.getItems().forEach(function (oItem) {
				if (oItem.getListItem().getSelected()) {
					oItem.download(true);
				}
			});
		},
		onFormatoStringFecha:function(fechaString){
			const año = fechaString.slice(0, 4);
			const mes = fechaString.slice(4, 6) - 1; // Restamos 1 porque los meses en JavaScript van de 0 a 11
			const dia = fechaString.slice(6, 8);
			const fecha = new Date(año, mes, dia);
			return fecha;
		},
        onListaConformidades:function(){
			var aListaConformidades=[
				{
					"Conformidad":"5000200001",
					"HojaEntrada":"",
					"NotaEntrega":"0001-000010",
					"fechaConta":"31.02.2024",
					"Descripcion":"30000000 - Acido muriatico(Litro)",
					"CantEntrega":"1.0 ST",
					"Importe":"100,00 PEN",
					"OrdenCompra":"45000000001",
					"Comprobante":"01-555555555-000000",
					"Ejercicio":"2023",
					"Motivo":"",
					"FechaRegistro":""
				},
				{
					"Conformidad":"5000200002",
					"HojaEntrada":"",
					"NotaEntrega":"0001-000010",
					"fechaConta":"31.02.2024",
					"Descripcion":"30000000 - Acido muriatico(Litro)",
					"CantEntrega":"1.0 ST",
					"Importe":"100,00 PEN",
					"OrdenCompra":"45000000008",
					"Comprobante":"01-555555555-000000",
					"Ejercicio":"2023",
					"Motivo":"",
					"FechaRegistro":""
				},
				{
					"Conformidad":"5000200003",
					"HojaEntrada":"",
					"NotaEntrega":"0001-000010",
					"fechaConta":"31.02.2024",
					"Descripcion":"30000000 - Acido muriatico(Litro)",
					"CantEntrega":"1.0 ST",
					"Importe":"100,00 PEN",
					"OrdenCompra":"45000000003",
					"Comprobante":"01-555555555-000000",
					"Ejercicio":"2023",
					"Motivo":"",
					"FechaRegistro":""
				}
			]
			var oModel = this.getOwnerComponent().getModel();
			oModel.setProperty("/ListaConformidades", aListaConformidades)
		},
		onObtenerRepositorios:function(){
			//  carpetaDMS.Repositoryid = "2ac5f6e5-9f27-4c41-8e73-9191cf7a90be";//QAS
			    carpetaDMS.Repositoryid = "0687b0df-65d8-45b5-802c-a5e76db45277";//PRD
		},
		onGetDocumentsDMS: function (path) {
			return new Promise((resolve, reject) => {
				//carpetaDMS.Repositoryid = "eba59dfd-09f1-4526-a822-722759c5f6a0";
				$.ajax({
					url: this._getAppModulePath() + rutaInicial + carpetaDMS.Repositoryid + "/root/" + path,
					contentType: "application/json"
					, success: resolve,
					error: function () {
						resolve({objects: []})
					}
				})
			});
		},
	});
});