sap.ui.define([
	"./Base.controller",
	"sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/json/JSONModel",
	"sap/m/Dialog",
    "sap/m/library",
    "sap/m/Label",
    "sap/m/TextArea",
    "sap/m/Button",
    "sap/ui/core/Element",
	'sap/ui/core/BusyIndicator',
], function(
	Controller,MessageBox,
	Filter,
	FilterOperator,
	DateFormat,
	JSONModel,Dialog,mobileLibrary,Label,TextArea,Button,Element,BusyIndicator
) {
	"use strict";
	let rucProveedor='',rutaInicial,carpetaDMS={}
	let ButtonType = mobileLibrary.ButtonType;
    let DialogType = mobileLibrary.DialogType;
	return Controller.extend("ns.cosapi.contabilizarfacturas.controller.DetalleFactura", {
		onInit: function () {		
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
			let that = this
			await this.getInfoUser();
			let oModelUserData = this.getOwnerComponent().getModel("userData");
			rucProveedor = oModelUserData.getProperty("/userId")
			let oModelUser = this.getOwnerComponent().getModel();
			let oFila = oModelUser.getProperty("/oFilaSeleccionada");
			if(oFila == undefined){
				this.onNavto("RouteHome")
				return false;
			}
			if(oFila.Codigoestado != "01"){
				this.byId("idEstado").setVisible(false);				
			}else{
				this.byId("idEstado").setVisible(true);
			}
			if(oFila.Codigoestado == "05"){
				this.byId("idMotivoObservado").setVisible(true);
				this.byId("idMotivoRechazo").setVisible(false);
				this.byId("idTextObservado").setEnabled(false);
				this.byId("idTextoCabecera").setEnabled(false);
			}else if(oFila.Codigoestado == "04"){
				this.byId("idMotivoObservado").setVisible(false);
				this.byId("idMotivoRechazo").setVisible(true);
				this.byId("idTextoCabecera").setEnabled(false);
			}else{
				this.byId("idMotivoObservado").setVisible(true);
				this.byId("idTextObservado").setEnabled(true);
				this.byId("idMotivoRechazo").setVisible(false);
				this.byId("idTextoCabecera").setEnabled(true);
			}
			let oArgs;
			oArgs= oEvent.getParameter("arguments");
			console.log(oArgs);
			this.byId("idPageDetalleFactura").setTitle("Preliminar: " + oArgs.preliminar);
			var oModel = this.getOwnerComponent().getModel();
			let aSolicitudes = oModel.getProperty("/aSolPreregistro")
			const aResultado = aSolicitudes.filter(item => item.Invoicedocnumber === oArgs.preliminar);
			//seteo cabecera
			let resultado = aResultado[0];
			if(rucProveedor == ""){
				rucProveedor = resultado.Stcd1;
			}
			let aSerCorre = resultado.Seriecorrelativo.split("-");
			// this.onObtenerDetraccion(resultado.Sociedad,rucProveedor);
			// this.onObtenerRetencion(resultado.Sociedad,rucProveedor);
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
				Textocabpsdetalle:resultado.Textocabpsdetalle,
				detraccion:resultado.CodigoDe,
				fielCumplimiento:resultado.CodigoFc,
				fondoGarantia:resultado.CodigoFg,
				retencion:resultado.CodigoRe,
				Montobasefc:resultado.Montobasefc,
				rxh:resultado.CodigoRh,
				montoporHonorarios:resultado.Montobaserh,
				montoFondoGarantia:resultado.Montobasefg,
				montoBaseDE:resultado.Montobasede,
				Motivorechazodisconforme:resultado.Motivorechazodisconforme,
				Textopsdtsbasicos:resultado.Textopsdtsbasicos
			}
			if(resultado.Clasedocumento == "01"){
				oModel.setProperty("/VisibleFactura", false)
				oModel.setProperty("/VisibleRxh", false)
				setTimeout(function() {
					that.onTipoDoc1();
					
				}, 1000); // Supo
				
			}else if(resultado.Clasedocumento == "02"){
				oModel.setProperty("/VisibleFactura", false)
				oModel.setProperty("/VisibleRxh", false)
				setTimeout(function() {
					that.onTipoDoc2();					
				}, 1000); // Supo
				
				
			}	
			oModel.setProperty("/oFacturaDet", oFactura)
			//seteo posiciones
			oModel.setProperty("/ListaConformidadesDet", resultado.ConsultaRegFacturasDetSet.results)
			//obtengo documento
			let itemsUploadSet = [];
			let path = "FACTURAS/" +  rucProveedor + "/" + resultado.Sociedad + "/" + resultado.Seriecorrelativo;
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
			carpetaDMS.Repositoryid = "2ac5f6e5-9f27-4c41-8e73-9191cf7a90be";//QAS
			//carpetaDMS.Repositoryid = "0687b0df-65d8-45b5-802c-a5e76db45277";//PRD
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
		onContabilizar:async function(){
			BusyIndicator.show();
			let oModelUser = this.getOwnerComponent().getModel();
			let oFila = oModelUser.getProperty("/oFilaSeleccionada")
			try {
				let oModelUser = this.getOwnerComponent().getModel("userData");
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
				let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
				const oContabilizar = await this.createEntity(ZMMGS_PRE_REG_FACT_SRV, "/PreliminarContabilizadoSet", oDato);
			if(oContabilizar.Codigo == "500"){
				MessageBox.error(oContabilizar.Mensaje)
				BusyIndicator.hide();
				return false;
			}else{
				BusyIndicator.hide();
				MessageBox.success("Se contabilizo el documento preliminar"  +oFila.Invoicedocnumber  + " correctamente")
			}
			} catch (error) {
				BusyIndicator.hide();
				MessageBox.error("Ocurrio un error al momento de contabilizar")
			}                            
        },
		onPreRechazo:function(){
            if (!this.oSubmitDialogRechazo) {
                this.oSubmitDialogRechazo = new Dialog({
                  type: DialogType.Message,
                  state: "Error",
                  title: "Rechazar",
                  content: [
                    new Label({
                      text: "Desea rechazar esta solicitud?",
                      labelFor: "submissionNoteDet"
                    }),
                    new TextArea("submissionNoteDet", {
                      width: "100%",
                      placeholder: "Agregar Motivo (requerido)",
                      liveChange: function (oEvent) {
                        var sText = oEvent.getParameter("value");
                        this.oSubmitDialogRechazo.getBeginButton().setEnabled(sText.length > 0);
                      }.bind(this)
                    })
                  ],
                  beginButton: new Button({
                    type: ButtonType.Emphasized,
                    text: "Aceptar",
                    enabled: false,
                    press: function () {
                      var sText = Element.getElementById("submissionNoteDet").getValue();
                      this.oSubmitDialogRechazo.close();
                      this.onRechazar(sText);
                    }.bind(this)
                  }),
                  endButton: new Button({
                    text: "Cancelar",
                    press: function () {
                      this.oSubmitDialogRechazo.close();
                    }.bind(this)
                  })
                });
              }
        
              this.oSubmitDialogRechazo.open();
        },
        onRechazar: async function(text){
			BusyIndicator.show();
            let oModelUser = this.getOwnerComponent().getModel();            
                let oFila = oModelUser.getProperty("/oFilaSeleccionada")
                if(oFila.Codigoestado != "01"){
                    MessageBox.error("Solo se puede contabilizar facturas en estado PRE-REGISTRO")
                    return;
                }
                try {
                    let oModelUser = this.getOwnerComponent().getModel("userData");
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
                    let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                    const oContabilizar = await this.createEntity(ZMMGS_PRE_REG_FACT_SRV, "/PreliminarEliminadoSet ", oDato);
                if(oContabilizar.Codigo == "500"){
                    MessageBox.error(oContabilizar.Mensaje)
					BusyIndicator.hide();
					return false;
				}else{
					BusyIndicator.hide();
					MessageBox.success("Se rechazo el documento preliminar"  +oFila.Invoicedocnumber  + " correctamente")                    
				}
                } catch (error) {
					BusyIndicator.hide();
                    MessageBox.error("Ocurrio un error al momento de rechazar")
                }         
        },
		onObservar:async function(){
			BusyIndicator.show();
			let oModelUser = this.getOwnerComponent().getModel();               
                let oFila = oModelUser.getProperty("/oFilaSeleccionada")
				let texto = this.byId("idTextObservado").getValue();
                if(oFila.Codigoestado != "01"){
					BusyIndicator.hide();
                    MessageBox.error("Solo se puede Observar facturas en estado PRE-REGISTRO")
                    return;
                }
				if(texto == ""){
					BusyIndicator.hide();
					MessageBox.error("Ingrese un motivo para poder observar la factura")
                    return;
				}
                try {
                    let oModelUser = this.getOwnerComponent().getModel("userData");
                    let name = oModelUser.getProperty("/userAndName")
                    let email = oModelUser.getProperty("/email")                       
                    let oDato = {               
                        "Proveedor":oFila.Proveedor,                    
                        "Sociedad":oFila.Sociedad,                    
                        "Ejercicio":oFila.Ejercicio,                
                        "Seriecorrelativo":oFila.Seriecorrelativo,                    
                        "Usuariolog":name,                    
                        "Correonombrelog":email,
                        "Motivorechazo": texto
                        }					
                    let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
                    const oContabilizar = await this.createEntity(ZMMGS_PRE_REG_FACT_SRV, "/PreliminarObservadoSet ", oDato);
                if(oContabilizar.Codigo == "500"){
                    MessageBox.error(oContabilizar.Mensaje)
					BusyIndicator.hide();
					return false;
				}else{
					BusyIndicator.hide();
					MessageBox.success("Se observo el documento preliminar"  +oFila.Invoicedocnumber  + " correctamente")                    
				}
                } catch (error) {
					BusyIndicator.hide();
                    MessageBox.error("Ocurrio un error al momento de observar el documento")
                }
                   
		},
		onActualizar:async function(){
			BusyIndicator.show();
			let oModelUser = this.getOwnerComponent().getModel();               
			let oFila = oModelUser.getProperty("/oFilaSeleccionada")
			let Datos = oModelUser.getProperty("/oFacturaDet")
			if(oFila.Codigoestado != "01"){
				BusyIndicator.hide();
				MessageBox.error("Solo se puede Actualizar facturas en estado PRE-REGISTRO")
				return;
			}
			try {
				let oModelUser = this.getOwnerComponent().getModel("userData");
				let name = oModelUser.getProperty("/userAndName")
				let email = oModelUser.getProperty("/email")                       
				let oDato = {           
					"Proveedor":oFila.Proveedor,                
					"Sociedad":oFila.Sociedad,                    
					"Ejercicio":oFila.Ejercicio,                
					"Seriecorrelativo":oFila.Seriecorrelativo,         
					"Fecontabilidadfac":this.onFormatearFecha(Datos.fechaConta),        
					"Textopsdtsbasicos":Datos.Textopsdtsbasicos,
					"Fechabasepspago":oFila.Fechabasepspago,
					"Asignacionpsdetalle":"",
					"Textocabpsdetalle":oFila.Textocabpsdetalle,
					"CodigoFc":Datos.fielCumplimiento, 
					"CodigoFg":Datos.fondoGarantia, 
					"CodigoRe":Datos.retencion, 
					"CodigoDe":Datos.detraccion,
					"Montobasefc":Datos.Montobasefc,
					"Montobasede":Datos.montoBaseDE,
					"Montobasefg":Datos.montoFondoGarantia,
					"Montobaserh":Datos.montoporHonorarios,
					"CodigoRh":Datos.rxh 
					}
				let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
				const oContabilizar = await this.createEntity(ZMMGS_PRE_REG_FACT_SRV, "/PreliminarActualizadoSet ", oDato);
			if(oContabilizar.Codigo == "500"){
				MessageBox.error(oContabilizar.Mensaje)
				BusyIndicator.hide();
				return false;
			}else{
				BusyIndicator.hide();
				MessageBox.success("Se actualizo el documento preliminar"  +oFila.Invoicedocnumber  + " correctamente")                    
			}
			} catch (error) {
				BusyIndicator.hide();
				MessageBox.error("Ocurrio un error al momento de actualizar el documento")
			}
		},
		onFormatearFecha:function(fecha){
			let año = fecha.getFullYear();
  
			// Los métodos getMonth() y getDate() devuelven valores de 0 a 11 para los meses y de 1 a 31 para los días, respectivamente.
			// Si necesitas que el mes y el día tengan siempre dos dígitos, puedes agregar un 0 delante si son menores que 10.
			let mes = (fecha.getMonth() + 1 < 10 ? '0' : '') + (fecha.getMonth() + 1);
			let día = (fecha.getDate() < 10 ? '0' : '') + fecha.getDate();
  
			// Concatenar los componentes de la fecha en el formato deseado
			let fechaFormateada = año + mes + día;
  
			return fechaFormateada;
		  },

	});
});