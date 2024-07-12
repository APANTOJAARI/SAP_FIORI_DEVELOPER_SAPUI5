sap.ui.define([
    "./Base.controller",    
	"sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,MessageBox,JSONModel,Device) {
        "use strict";

        const repositoryId = "2ac5f6e5-9f27-4c41-8e73-9191cf7a90be";//DEV
        //const repositoryId = "0687b0df-65d8-45b5-802c-a5e76db45277"//PRD
        const rutaDMS = "/apidms/browser";
        let that;

        let sGrupoId = "bf8c3fcf-ce0e-4e5f-a772-427f97d992cb" //QAS
        //let sGrupoId = "" //PRD

        return Controller.extend("ns.cosapi.preregistroproveedor.controller.Home", {
            onInit: function () {    
                that = this     
                this.onValMovil();       
                this.onListaPaises();
                this.onListaTipoDocumento();
                this.ontListaSucursal();//+@INSERT
                this.onInicioModelos();
                jQuery.sap.includeScript({
                    url: "https://www.google.com/recaptcha/api.js"
                })
            },
            onAfterRendering: function() {
                var self = this;
                // Crear un elemento <script> para cargar la API de reCAPTCHA
                var script = document.createElement('script');
                script.src = 'https://www.google.com/recaptcha/api.js';
                script.async = true;
                script.defer = true;
                // Agregar el elemento <script> al DOM para cargar la API de reCAPTCHA
                document.head.appendChild(script);
            },
            validateCapture: function () {
                if (grecaptacha.getResponse().length == 0) {
                    sap.m.MessageToast.show("Confirm");
                    return;
                }
                return true;
            },
            onValMovil:function(){
                let flexBox = this.byId("idFlexBox");
                let vBox = this.byId("idVBox");
                if (Device.system.phone || Device.system.tablet) {     
                    flexBox.setDirection("Column")
                    vBox.setWidth("90%")
                } else {  
                    flexBox.setDirection("Row")
                    vBox.setWidth("50%")
                }
            },
            onInicioModelos:function(){
                let oPreRegistro = {
                    "Land1" : "",
                    "Taxnumxl" : "",
                    "Stcdt" : "",
                    "Name1" : "",
                    "Name2" : "",
                    "Name3" : "",
                    "Name4" : "",
                    "Representante" : "",
                    "Identificacion" : "",
                    "Telefono" : "",
                    "Correo" : "",
                    "Codigoestado":"01",
                    "Usuario":"",
                    "Correonombre":"",
                    "FechaInAct": "",
                    "Direccion": "",
                    "Nombrecomercial": ""
                }                
                let oModel = this.getOwnerComponent().getModel()
                oModel.setProperty("/PreRegistro",oPreRegistro)
            },
            onListaPaises: async function(){
                //let ZMMGS_PRE_REG_PROV_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_PROV_SRV");
                let oModel = this.getOwnerComponent().getModel();
                try {
                    const listaPaises = await this.readEntity("/ConsultaPaisesSet");
                    //oModel.setSizeLimit(9000);
                    oModel.setProperty("/Paises", listaPaises["d"].results)

                } catch (error) {

                    MessageBox.error(error)
                    
                }
            },
            onListaTipoDocumento:async function(){
                //let ZMMGS_PRE_REG_PROV_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_PROV_SRV");
                let oModel = this.getOwnerComponent().getModel();
                try {
                    const listaTiposDocumento = await this.readEntity("/ConsultaTipoDocumentoSet");
                    oModel.setProperty("/TiposDocumento", listaTiposDocumento["d"].results)
                } catch (error) {
                    MessageBox.error(error)                    
                }
            },
            onGuardarPreRegistro: async function() {
                const bundle = this.getResourceBundle();
                async function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }
                //Validación del reCaptcha
                if (grecaptcha.getResponse().length === 0) {
                    MessageBox.error(bundle.getText("completeCaptcha"));
                    return;
                }

                //Validar si ha seleccionado Perú
                if (this.byId("txtRazonSocial").getValue() == "" && !this.byId("txtRazonSocial").getEditable()) {
                    this.byId("txtNif").setValueState("Error")
                    this.byId("txtNif").setValueStateText(bundle.getText("completeNIFVal"))
                    MessageBox.error(bundle.getText("completeNIF"))
                    return;
                }

                //Validar que el correo electrónico no exista
                sap.ui.core.BusyIndicator.show(0)
                let bValidateCorreo = await this._validarExisteEmailOrNif(this.byId("txtCorreoCorporativo").getValue(), "emails.value")

                if (bValidateCorreo) {
                    MessageBox.error(bundle.getText("mailExiste"));
                    sap.ui.core.BusyIndicator.hide()
                    return;
                } else {
                    this.byId("txtCorreoCorporativo").setValueState("None")
                    sap.ui.core.BusyIndicator.hide()
                }

                //Validar que el correo electrónico no exista
                sap.ui.core.BusyIndicator.show(0)
                let bValidateNif = await this._validarExisteEmailOrNif(this.byId("txtNif").getValue(), "userName")

                if (bValidateNif) {
                    MessageBox.error(bundle.getText("nifExiste", [this.byId("txtNif").getValue()]));
                    this.byId("txtNif").setValueState("Error")
                    sap.ui.core.BusyIndicator.hide()
                    return;
                } else {
                    this.byId("txtNif").setValueState("None")
                    sap.ui.core.BusyIndicator.hide()
                }

                let oBusyDialog = new sap.m.BusyDialog({
                    title: bundle.getText("cargando"),
                    text: bundle.getText("espere"),
                    showCancelButton: false
                });
                oBusyDialog.open();                            
                let aJsonEnvio = this.getOwnerComponent().getModel().getProperty("/PreRegistro");
                this.onCambiarEstadoNeutro();
                let oRespuesta = this.onValidarFormulario(aJsonEnvio);
                if(!oRespuesta.estado){
                    oBusyDialog.close();        
                    return;
                }

                //Validación solo para Perú
                if (aJsonEnvio.Land1 == "PE") {
                    let sNif = aJsonEnvio.Taxnumxl,
                        oValidateDocument = {}
                    if (aJsonEnvio.Stcdt == "PE2") { //dni
                        oValidateDocument = await this.validarDNI(sNif);
                    } else if (aJsonEnvio.Stcdt == "PE1") { //ruc/pasaporte
                        oValidateDocument = await this.validarRuc(sNif);
                    }

                    if (oValidateDocument.type == "E") {
                        MessageBox.error(oValidateDocument.message.toUpperCase())
                        oBusyDialog.close()
                        return
                    }
                }

                let sRazonSocial = aJsonEnvio.Name1.trim();
                let aPartes = this.separarStringEnPartes(sRazonSocial,40);
                for (var i = 0; i < aPartes.length; i ++) {
                    if(i==0){
                        aJsonEnvio.Name1 = aPartes[0];
                    }
                    if(i==1){
                        aJsonEnvio.Name2 = aPartes[1];
                    }
                    if(i==2){
                        aJsonEnvio.Name3 = aPartes[2];
                    }
                    if(i==3){
                        aJsonEnvio.Name4 = aPartes[3];
                    }
                }
                aJsonEnvio.Correonombre            = aJsonEnvio.Correo;
                aJsonEnvio.Usuario                 = aJsonEnvio.Taxnumxl;
                aJsonEnvio.Ejecutarsucursalcosapi  = this.byId("slSucursal").getSelectedKey();//+@INSERT
                try {
                    const oCrearPreregistro = await this.createEntity("/PreRegistroSet", aJsonEnvio);
                    
                    await delay(2000);
                    let oSendData = { 
                        "Taxnumxl": aJsonEnvio.Taxnumxl,
                        "Codigoestado": "02",
                        "Usuario": "",
                        "Correonombre": ""
                    }
                    const oAprroveRegistro = await this._approvePreRegistro("/LogPPSet", oSendData);
                    const oCreateUser = await that.createUserBtp(aJsonEnvio);
                    if(oCrearPreregistro.d.Codigo == "200"){
                        oBusyDialog.close();
                        MessageBox.success(oCrearPreregistro.d.Mensaje);
                        this.byId("txtRazonSocial").setEditable(true)
                        grecaptcha.reset();
                        this.onInicioModelos();
                    }else{
                        oBusyDialog.close();
                        MessageBox.error(oCrearPreregistro.d.Mensaje);
                    }
                    
                } catch (error) {
                    oBusyDialog.close();
                    grecaptcha.reset();
                    MessageBox.error(bundle.getText("errorToken"))                    
                }
            },
            onValidarCorreo:function(oEvent){
                var sValue = oEvent.getParameter("value");
                var oRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
                // Acceder al control Input por su ID
                var oInput = this.byId("txtCorreoCorporativo");
    
                if (oRegex.test(sValue)) {
                    oInput.setValueState(sap.ui.core.ValueState.None);
                } else {
                    oInput.setValueState(sap.ui.core.ValueState.Error);
                    const bundle = this.getResourceBundle();
                    oInput.setValueStateText(bundle.getText("mailValido"));
                }
            },
            onValidarFormulario:function(aJsonEnvio){
                const bundle = this.getResourceBundle();
                let oRespuesta = {}
                oRespuesta.mensaje="Ingrese un Valor";
                oRespuesta.estado = true;
                let comboPais = this.byId("cboMainPais");
                let comboTipoDocumento = this.byId("idcboTiposDocumento");
                let nif = this.byId("txtNif");
                let razonSocial = this.byId("txtRazonSocial");
                let representatLegal = this.byId("txtRepresentanteLegal");
                let identificacion = this.byId("txtIdentificacion");
                let correoCorporativo = this.byId("txtCorreoCorporativo");
                let telefono = this.byId("txtTelefono");
                let sucursal = this.byId("slSucursal");

                if(aJsonEnvio.Land1 == ""){
                    this.onSeteoEstado(comboPais,"Error",bundle.getText("errorSelectPais"));
                    oRespuesta.estado = false;
                }
                if(aJsonEnvio.Stcdt == ""){
                    this.onSeteoEstado(comboTipoDocumento,"Error",bundle.getText("errorSelectTipoDoc"));
                    oRespuesta.estado = false;
                }
                if(aJsonEnvio.Taxnumxl.trim() == ""){
                    this.onSeteoEstado(nif,"Error",bundle.getText("errorSelectTipoDoc"));
                    oRespuesta.estado = false;
                }
                if(aJsonEnvio.Name1.trim() == ""){
                    this.onSeteoEstado(razonSocial,"Error",bundle.getText("errorSelectRazonSocial"));
                    oRespuesta.estado = false;
                }
                if(aJsonEnvio.Representante.trim() == ""){
                    this.onSeteoEstado(representatLegal,"Error",bundle.getText("errorSelectRepresentante"));
                    oRespuesta.estado = false;
                }
                if(aJsonEnvio.Identificacion.trim() == ""){
                    this.onSeteoEstado(identificacion,"Error",bundle.getText("errorSelectIdentif"));
                    oRespuesta.estado = false;
                }
                if(aJsonEnvio.Correo.trim() == ""){
                    this.onSeteoEstado(correoCorporativo,"Error",bundle.getText("errorSelectmaill"));
                    oRespuesta.estado = false;
                }
                if(aJsonEnvio.Telefono.trim() == ""){
                    this.onSeteoEstado(telefono,"Error",bundle.getText("errorSelectTelefono"));
                    oRespuesta.estado = false;
                }
                if(correoCorporativo.getValueState() == "Error"){
                    oRespuesta.estado = false;
                }

                if (sucursal.getSelectedKey() == "" || sucursal.getSelectedKey() == undefined ) {
                    this.onSeteoEstado(sucursal,"Error",bundle.getText("sucursalSelec"));
                    oRespuesta.estado = false;
                }

                if(oRespuesta.estado){
                    oRespuesta.mensaje ="";
                }            
                return oRespuesta;
            },
            onSeteoEstado:function(objeto,estado,texto){                
                objeto.setValueState(estado);
                objeto.setValueStateText(texto);
            },
            onCambiarEstadoNeutro:function(){
                let comboPais = this.byId("cboMainPais");
                let comboTipoDocumento = this.byId("idcboTiposDocumento");
                let nif = this.byId("txtNif");
                let razonSocial = this.byId("txtRazonSocial");
                let representatLegal = this.byId("txtRepresentanteLegal");
                let identificacion = this.byId("txtIdentificacion");
                
                let telefono = this.byId("txtTelefono");
                let sucursal = this.byId("slSucursal");//+@INSERT

                this.onSeteoEstado(comboPais,"None","");
                this.onSeteoEstado(comboTipoDocumento,"None","");
                this.onSeteoEstado(nif,"None","");
                this.onSeteoEstado(razonSocial,"None","");
                this.onSeteoEstado(representatLegal,"None","");
                this.onSeteoEstado(identificacion,"None","");
                
                this.onSeteoEstado(telefono,"None","");
                this.onSeteoEstado(sucursal,"None","");//+@INSERT
            },
            separarStringEnPartes:function(str, tamano) {
                var partes = [];
                for (var i = 0; i < str.length; i += tamano) {
                    partes.push(str.substring(i, i + tamano));
                }
                return partes;
            },
            onIrLogin:function(){
                window.open('https://dev-f074wlvi.launchpad.cfapps.us10.hana.ondemand.com/site/portalProveedores', '_blank');
            },

            validarNif: async function (oEvent) {
                sap.ui.core.BusyIndicator.show(0)
                const bundle = this.getResourceBundle();
                let sNif = this.byId("txtNif").getValue(),
                    sTipoDoc = this.byId("idcboTiposDocumento").getSelectedKey(),
                    sPais = this.byId("cboMainPais").getSelectedKey()

                this.byId("txtEstadoRazonSocial").setText("")
                this.byId("txtEstadoRazonSocial").setState("None")

                if (sNif.length == 0) {
                    this.byId("txtNif").setValueState("Error")
                    this.byId("txtNif").setValueStateText(bundle.getText('completeNIF'))
                    sap.ui.core.BusyIndicator.hide()
                    return
                } else {
                    this.byId("txtNif").setValueState("None")
                    this.byId("txtNif").setValueStateText("")
                }

                if (sTipoDoc.length == 0) {
                    this.byId("idcboTiposDocumento").setValueState("Error")
                    this.byId("idcboTiposDocumento").setValueStateText(bundle.getText('errorSelectTipoDoc'))
                    sap.ui.core.BusyIndicator.hide()
                    return
                } else {
                    this.byId("idcboTiposDocumento").setValueState("None")
                    this.byId("idcboTiposDocumento").setValueStateText("")
                }

                if (sPais.length == 0) {
                    this.byId("cboMainPais").setValueState("Error")
                    this.byId("cboMainPais").setValueStateText(bundle.getText('errorSelectPais'))
                    sap.ui.core.BusyIndicator.hide()
                    return
                } else {
                    this.byId("cboMainPais").setValueState("None")
                    this.byId("cboMainPais").setValueStateText("")
                }

                //Validación solo para Perú
                if (sPais == "PE") {
                    let oValidateDocument = {}

                    if (sTipoDoc == "PE2") { //dni
                        oValidateDocument = await this.validarDNI(sNif);
                    } else if (sTipoDoc == "PE1") { //ruc/pasaporte
                        oValidateDocument = await this.validarRuc(sNif);
                    }

                    if (oValidateDocument.type == "E") {
                        MessageBox.error(oValidateDocument.message.toUpperCase())
                        this.byId("txtNif").setValueState("Error")
                        this.byId("txtRazonSocial").setValue("")
                    } else {
                        this.byId("txtRazonSocial").setValue(oValidateDocument.data.razonSocial)
                        if (oValidateDocument.data.direccion) {
                            this.getOwnerComponent().getModel().setProperty("/PreRegistro/Direccion", oValidateDocument.data.direccion.substring(0, 35).trim())
                            
                        }
                        if (oValidateDocument.data.fec_actividad) {
                            this.getOwnerComponent().getModel().setProperty("/PreRegistro/FechaInAct", oValidateDocument.data.fec_actividad)
                        }
                        if (oValidateDocument.data.nombre_comercial) {
                            this.getOwnerComponent().getModel().setProperty("/PreRegistro/Nombrecomercial", oValidateDocument.data.nombre_comercial)
                        }
                        if (oValidateDocument.data.condicion == "HABIDO" && oValidateDocument.data.estado == "ACTIVO") {
                            this.byId("txtNif").setValueState("Success")
                            this.byId("txtEstadoRazonSocial").setText(oValidateDocument.data.condicion)
                            this.byId("txtEstadoRazonSocial").setState("Success")
                        } else {
                            this.byId("txtEstadoRazonSocial").setText(oValidateDocument.data.condicion)
                            this.byId("txtEstadoRazonSocial").setState("Error")
                        }
                        
                    }
                } else {
                    this.byId("txtNif").setValueState("None")
                    this.byId("txtNif").setValueStateText("")
                }
                sap.ui.core.BusyIndicator.hide()
            },

            changePais: function () {
                if (this.byId("cboMainPais").getSelectedKey() == "PE") {
                    this.byId("txtRazonSocial").setEditable(false)
                    if (this.byId("txtNif").getValue() !== "") {
                        this.byId("txtNif").fireChange();
                    }
                } else {
                    this.byId("txtRazonSocial").setEditable(true)
                    this.byId("cboMainPais").setValueState("None")
                    this.byId("cboMainPais").setValueStateText("")
                    this.byId("txtNif").setValue("")
                    this.byId("txtRazonSocial").setValue("")
                    this.byId("txtEstadoRazonSocial").setText("")
                    this.byId("txtEstadoRazonSocial").setState("None")
                    this.byId("txtNif").setValueState("None")                    
                }
                    
            },
            
            changeTipoDoc: function () {
                if (this.byId("txtNif").getValue() !== "") {
                    this.byId("txtNif").fireChange();
                }
            },

            validarDNI: async function (sDni) {
                return new Promise(async (resolve,reject) => {
                    // Datos
                    var token = 'apis-token-7995.8AnfWmuPPQZwDqqbabyPvjn9ykTmYLDO'
                    var dni = sDni
                    let oReturn = {
                        type: 'S',
                        message: '',
                    }
                    
                    // Iniciar llamada a API
                    var xhr = new XMLHttpRequest();
                    
                    // Configurar la solicitud
                    xhr.open('GET', this.getBaseURL() + '/v2/reniec/dni?numero=' + dni);
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                    
                    // Configurar la devolución de llamada cuando se complete la solicitud
                    xhr.onload = function() {
                        if (xhr.status === 200) {
                            // La solicitud fue exitosa
                            var response = JSON.parse(xhr.responseText);
                            resolve(oReturn);
                            console.log(response); // Mostrar la respuesta en la consola
                        } else {
                            // La solicitud falló
                            console.error('Error al obtener los datos de la API');
                            oReturn.type = "E"
                            oReturn.message = JSON.parse(xhr.responseText).message
                            resolve(oReturn)
                        }
                    };
                    
                    // Manejar errores de red
                    xhr.onerror = function() {
                        console.error('Error de red al intentar acceder a la API');
                    };
                    
                    // Enviar la solicitud
                    xhr.send();
                });
                
            },

            validarRuc: function(sRuc){
                return new Promise(async (resolve,reject) => {
                
                    //let sRuc = "20605507396"
                    let oReturn = {
                        type: 'S',
                        message: '',
                        data: null
                    }
                    var sr =
                        '<?xml version="1.0" encoding="UTF-8"?>' +
                        '<soapenv:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ruc="http://ws.insite.pe/sunat/ruc.php?wsdl">' +
                            '<soapenv:Header/>' +
                            '<soapenv:Body>' +
                                '<ruc:consultaRUC soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
                                    `<ruc xsi:type="xsd:string">${sRuc}</ruc>` +
                                    '<username xsi:type="xsd:string">wvelille@cosapi.com.pe</username>' +
                                    '<hash xsi:type="xsd:string">SPF-29D-83J-F8T</hash>' +
                                    '<tracking xsi:type="xsd:string"/>' +
                                '</ruc:consultaRUC>' +
                            '</soapenv:Body>' +
                        '</soapenv:Envelope>';
                
                    $.ajax({
                        url: this.getBaseURL() + '/sunat/ruc.php',
                        method: "POST",
                        data: sr,
                        headers: {
                            "Accept": "*/*",
                            "Content-Type": "text/xml"
                        },
                        success: function(oSuccess){
                            // Obtener el contenido del elemento <return>
                            var xmlDoc = oSuccess;
                            var returnContent = xmlDoc.getElementsByTagName("return")[0].textContent;
                        
                            // Procesar la cadena de texto obtenida para extraer los datos clave-valor
                            var keyValuePairs = returnContent.split("|");
                            var result = {};
                        
                            keyValuePairs.forEach(function(pair) {
                                var keyValue = pair.split("=");
                                var key = keyValue[0];
                                var value = keyValue[1];
                                result[key] = value;
                            });
                        
                            // Ahora puedes acceder a los datos que necesitas en el objeto 'result'
                            if (keyValuePairs[0] == "") {
                                oReturn.type = "E"
                                oReturn.message = "Por favor, revisar las credenciales al consumir la API"
                                
                            } else {
                                if (result.status_id != 1) {
                                    oReturn.type = "E"
                                    oReturn.message = result.status_msg
                                } else {
                                    oReturn.data = result
                                    oReturn.data.razonSocial = result.n1_alias
                                    oReturn.data.direccion = result.n2_dir_fiscal
                                    oReturn.data.condicion = result.n1_condicion
                                    oReturn.data.estado = result.n1_estado
                                    oReturn.data.fec_actividad = result.n2_init_actv ? result.n2_init_actv.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$1.$2.$3") : ""                                    
                                    oReturn.data.nombre_comercial = result.n2_nom_comer
                                }
                            }
                            resolve(oReturn);
                            //resolve(oReturn);                            
                        }.bind(this),
                        error: function(oError){
                            console.error("Error:", oError);
                            oReturn.type = "E"
                            oReturn.message = "Hubo un error al enviar los datos a la API."
                        }
                    });
                });
            },

            createUserBtp: function (oUser) {
                let usuario = {
                    "externalId": oUser.Taxnumxl,
					"schemas": [
					   "urn:ietf:params:scim:schemas:core:2.0:User",
					   "urn:ietf:params:scim:schemas:extension:sap:2.0:User",
					   "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"
					],
					"userName": oUser.Taxnumxl,
					"password": "CosapiUser01!*",
					"name": {
					   "familyName": oUser.Taxnumxl,
					   "givenName": oUser.Name1,
					   "formatted": oUser.Taxnumxl
					},
					"displayName": oUser.Name1,
					"nickName": oUser.Taxnumxl,
					"userType": "Employee",
					"preferredLanguage": "Spanish",
					"locale": "ES",
					"active": true,
					"emails": [
					   {
						  "type": "work",
						  "value": oUser.Correo,
						  "primary": true
					   }
					],
					"phoneNumbers": [
					   {
						  "type": "work",
						  "value": oUser.Telefono,
						  "primary": true
					   }
					],
					"urn:ietf:params:scim:schemas:extension:sap:2.0:User": {
					   "sendMail": false,
					   "mailVerified": true,
					   "status": "active",
					   "contactPreferences": {
						  "email": "yes",
						  "telephone": "yes"
					   },
					   "emails": [
						  {
							 "type": "work",
							 "value": oUser.Correo,
							 "primary": true,
							 "verified": true
						  }
					   ],
					   "phoneNumbers": [
						  {
							 "type": "work",
							 "value": oUser.Telefono,
							 "primary": true
						  }
					   ]
					}
				};
				usuario = JSON.stringify(usuario);
				let oResult = {
					success: false,
					mensaje: ""
				};
				// Creacion de usuario.
                let sUrl = that.getBaseURL() + "/scim/Users";
				return new Promise(function (resolve, reject) {
					$.ajax({
						type: "POST",
						data: usuario,
						async: false,
						url: sUrl,
						contentType: "application/scim+json",
						success: async function (data, textStatus, xhr) {
                            console.log(data);
							if (textStatus == "success") {
								let oData = {
									"schemas": [
										"urn:ietf:params:scim:api:messages:2.0:PatchOp"
									],
									"Operations": [
									{
										"op": "add",
										"path": "members",
										"value": [
											{
												"value": data.id
											}
										]
									}
									]
								}
								$.ajax({
									type: "PATCH",
									data: JSON.stringify(oData),
									async: false,
									url: that.getBaseURL() + "/scim/Groups/" + sGrupoId,
									contentType: "application/scim+json",
									success: async function (data, textStatus, xhr) {
										oResult.success = true;
										resolve(oResult)
									},
									error: function (error) {
										console.log(error);
										oResult.success = false;
										resolve(oResult)
									}
								});
							} else {
								oResult.success = false;
								resolve(oResult)
							}
							
						},
						error: function (error) {
							console.log(error);
							oResult.success = false;
							if ( error.responseText.indexOf("exists") >= 0 && error.responseText.indexOf("email") >= 0 ) {
								oResult.mensaje = "El correo electrónico del proveedor ya existe. Por favor, comunicarse con administración."
							} else if ( error.responseText.indexOf("exists") >= 0 && error.responseText.indexOf("name") >= 0 ) {
								oResult.mensaje = "El Nif del proveedor ya existe. Por favor, comunicarse con administración."
							} else {
								oResult.mensaje = error.responseText;
							}
                            resolve(oResult)
						}

					});
				});
            },
            onSelectSucursal: function(oEvent)
            {   
                let oSource = oEvent.getSource();
                if (oSource) {
                    oSource.setValueState(sap.ui.core.ValueState.None);
                }
            },
            ontListaSucursal: async function()
            {
                let oModel = this.getOwnerComponent().getModel();
                try {
                    const listaTiposDocumento = await this.readEntity("/ConsultaSucursalesCOSAPISet");
                    oModel.setProperty("/Sucursal", listaTiposDocumento["d"].results) 
                } catch (error) {
                    console.error(error);                   
                }
            },

            onIrTerminos: async function(){
                
                const lang = await this._getBrowserLang();
                const url = this._getOnlyAppModulePath() + `${rutaDMS}/${repositoryId}/root/PROVEEDOR/MANUAL/${lang.toUpperCase()}/`;
                const docs = await this._getDocumentsDMS(url);
                for (let i = 0; i < docs.objects.length; i++) {
                    const doc = docs.objects[i];
                    const rutaDoc = url + doc.object.properties["cmis:name"].value;
                    window.open(rutaDoc, '_blank');           
                }
            },

            /**
             * Metodo para obtener promesa API DMS
             * @param {*} url 
             * @returns 
             */
            _getDocumentsDMS: function (url) {
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: url,
                        contentType: "application/json",
                        success: resolve,
                        error: reject
                    })
                });
            },
        });
    });
