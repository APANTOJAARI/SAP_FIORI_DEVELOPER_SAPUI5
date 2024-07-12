sap.ui.define([
    "./BaseController",
	"sap/m/MessageToast",
	"sap/base/Log",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/m/MessageBox",
	"sap/ui/core/Element",
	"sap/ui/layout/HorizontalLayout",
	"sap/ui/layout/VerticalLayout",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Label",
	"sap/m/library",
	"sap/m/Text",
	"sap/m/TextArea"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, MessageToast, Log, JSONModel, Device, MessageBox, Element, HorizontalLayout, 
		VerticalLayout, Dialog, Button, Label, mobileLibrary, Text, TextArea) {
        "use strict";
		
		let ButtonType = mobileLibrary.ButtonType;
		let DialogType = mobileLibrary.DialogType;

		let that,
			oModelPreRegProv
        return BaseController.extend("ns.cosapi.aprobacionsolppro.controller.DetallePreRegistro", {
            onInit: function () {
                that = this
				oModelPreRegProv = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_PROV_SRV")
            },

			onNavBack: function () {
                this.getRouter().navTo("RouteHome");
			},

			onAprobar: function () {
				that._approvePreRegistro()
			},
			
            _approvePreRegistro: async function () {
                let oPreRegistro = this.getModel("oSolPreRegistro").getData()
				let oSendData = { 
					"Taxnumxl": oPreRegistro.Taxnumxl,
					"Codigoestado": "02",
					"Usuario": "",
					"Correonombre": ""
				}
                try {
                    const oResultData = await this.createEntity(oModelPreRegProv, "/LogPPSet", oSendData)
                    
                    if (oResultData.Codigo == "500") {
                        MessageBox.error(oResultData.Mensaje)
                    } else {
						//Creacion de usuario IAS
						let oValidate = await that.createUserBtp(oPreRegistro);
						if (!oValidate.success) {
						    MessageBox.error(oValidate.mensaje)
						} else {
							MessageBox.success(oResultData.Mensaje ,{
								onClose: function () {
									that.onNavBack()
								}
							})
						}
                   }
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                }
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
					   "givenName": oUser.Fullname,
					   "formatted": oUser.Taxnumxl
					},
					"displayName": oUser.Fullname,
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
									url: that.getBaseURL() + "/scim/Groups/bf8c3fcf-ce0e-4e5f-a772-427f97d992cb",
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

			onRechazar: function () {
				if (!this.oSubmitDialog) {
					this.oSubmitDialog = new Dialog({
						type: DialogType.Message,
						state: "Error",
						title: "Rechazar",
						content: [
							new Label({
								text: "¿Desea rechazar esta solicitud?",
								labelFor: "submissionNote"
							}),
							new TextArea("submissionNote", {
								width: "100%",
								placeholder: "Agregar Motivo (requerido)",
								liveChange: function (oEvent) {
									var sText = oEvent.getParameter("value");
									this.oSubmitDialog.getBeginButton().setEnabled(sText.length > 0);
								}.bind(this)
							})
						],
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "Aceptar",
							enabled: false,
							press: function () {
								var sText = Element.getElementById("submissionNote").getValue();
								this.oSubmitDialog.close();
								that._declinePreRegistro(sText);
							}.bind(this)
						}),
						endButton: new Button({
							text: "Cancelar",
							press: function () {
								this.oSubmitDialog.close();
							}.bind(this)
						})
					});
				}
	
				this.oSubmitDialog.open();
			},

			_declinePreRegistro: async function (sMessage) {
				let oPreRegistro = this.getModel("oSolPreRegistro").getData()
				let oSendData = { 
					"Taxnumxl": oPreRegistro.Taxnumxl,
					"Codigoestado": "03",
					"Motivorechazo": sMessage, 
					"Usuario": "",
					"Correonombre": ""
				}
                try {
                    const oResultData = await this.createEntity(oModelPreRegProv, "/LogPPSet", oSendData)
                    
                    if (oResultData.Codigo == "500") {
                        MessageBox.error(oResultData.Mensaje)
                    } else {
						MessageBox.success(oResultData.Mensaje ,{
							onClose: function () {
								that.onNavBack()
							}
						})
                    }
                    console.log(oResultData)
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                }
			}
        });
    });
