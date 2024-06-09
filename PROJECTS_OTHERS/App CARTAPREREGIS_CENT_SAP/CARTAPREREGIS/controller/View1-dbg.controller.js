sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/BusyIndicator",
	'sap/m/SearchField',
	'sap/ui/model/type/String',
	'sap/m/Token',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"./utilities",
	"../services/oData",
	"../services/Xsjs",
	"../model/models"
], function (Controller, Fragment, JSONModel, Busy, SearchField, typeString, Token, Filter, FilterOperator, MessageBox, Utilities, oData,
	XsjsService,
	Models) {
	"use strict";
	var sFragmentGlobal = "1";
	var objectSlected = {};

	// var sFragmentName = "";
	return Controller.extend("com.centria.CartaPreregistro.controller.View1", {

		onInit: async function () {

			var self = this;
			self.aTokens = "";
			var oJson = {
				"InpSociedad": "",
				"InpRuc": "",
				"InpAtte": "",
				"InpImporte": "",
				"InpFecRegistro": null,
				"InpFecConta": null,
				"InpCuentaCargo": "",
				"inputClaBanAbonar": "",
				"inputCuentaAbono": "",
				"inputCuentaDepPla": "",
				"inputFecApe": null,
				"inputPlazo": "",
				"inputFecVen": null,
				"inputTasa": "",
				"inputIntereses": "",
				"inputClaBanOrigen": "",
				"inputComision": "",
				"inputSocBen": "",
				"inputClaBanDestino": "",
				"inputCodLiq": "",
				"inputPais": "",
				"inputCIF": "",
				"inputBanFinal": "",
				"inputNCuen": "",
				"inputIBAN": "",
				"inputSwiftBic": "",
				"inputABA": "",
				"inputBanIntermediario": "",
				"inputCuentaIntermediario": "",
				"inputSwiftIntermediario": "",
				"inputImportDolar": "",
				"inputTipCambio": "",
				"inputContrValor": "",
				"inputBancoDestino1": "",
				"inputBancoDestino2": "",
				"inputCuentaCCI": "",
				"inputProveedor": "",
				"inputPortador": "",
				"inputDNI": "",
				"inputClaBanCargar": ""
			};
			this.getView().setModel(new JSONModel(oJson), "oModelDataGlobal");
			this.getView().setModel(new JSONModel({}), "TablaManProvExtModel");

			this.getView().setModel(new JSONModel({
				editable: true
			}), "oModelEditForm");

			//Visibilidad de botones
			let oSapModel = this.getOwnerComponent().getModel("ServiceH2HModel");
			this.oDataService = oData.getInstance();
			this.oDataService.setODataSapModel(oSapModel);

			/*		//Setear modelo device
					let oDeviceModel = Models.createDeviceModel();
					this.getView().setModel(oDeviceModel, "oDeviceModel");
					sap.ui.core.IconPool.addIcon('sap', 'customfont', 'icomoon', 'e900');

					//Obtener constantes
					this.oConstantes = await XsjsService.obtenerConstantes().catch(
						(err) => {
							console.error(err);
							MessageBox.error(err.responseText, {
								title: "Obtener constantes"
							});
						});*/

			let aBotones = await this.oDataService.obtenerBotones();
			/*		.catch((err) => {
						console.error(err);
						MessageBox.error(err, {
							title: "Obtener visibilidad de botones"
						});
					});*/

			let oBotones = {
				BUT1: false,
				BUT2: false,
				BUT3: false,
				BUT9: false,
				BUT4: false,
				BUT5: false,
				BUT6: false,
				BUT7: false,
				BUT8: false

			};

			if (aBotones) {
				for (let i = 0; i < aBotones.length; i++) {
					let oBoton = aBotones[i];
					if (oBotones.hasOwnProperty(oBoton.Boton)) {
						oBotones[oBoton.Boton] = oBoton.Estado;
					}
				}
				let oBotonModel = new JSONModel(oBotones);
				this.getView().setModel(oBotonModel, "Botones");
				this.byId("formCartas").setVisible(true);

				this.fireAccionBoton(oBotones);
			}

			this.setupConfig();
			//this.onLoadDataInit();
			//this.setFilterValuesModel();
			Date.prototype.getDateWithoutTime = function () {
				return new Date(this.toDateString());
			}

		},

		onPressHome: function (oEvent) {
			if (this.oConstantes && this.oConstantes.rpta) {
				let sDomainUrl = this.oConstantes.rpta.sDocumentUrl;
				let aUrlParts = sDomainUrl.split("#");
				window.location.replace(aUrlParts[0])
			}
		},

		/*	onBeforeShow: function (oEvent) {
				$(document).ready(function () {
					$('[id*="shell-header"]').hide();
				});
			},*/

		//Disparar acción de botones
		fireAccionBoton: function (oBotones) {
			let firstButton;
			let that = this;
			for (let boton in oBotones) {
				if (oBotones[boton] === true) {
					firstButton = boton;
					break;
				}
			}

			let sIndex = firstButton.slice(-1);
			let myBoton = new sap.m.Button();
			myBoton.data("fragmentIntent", sIndex);
			let oEvent = new sap.ui.base.Event("evtFragmento", myBoton, {});
			let oSapModel = this.getOwnerComponent().getModel("ServiceH2HModel");

			function ejecutarBoton(oModel) {
				return new Promise(function (resolve, reject) {

					oModel.metadataLoaded().then(function () {
						that.onChangingMainFragment(oEvent);

					});
				});
			}

			ejecutarBoton(oSapModel);
		},

		setupConfig: function () {
			this._oSociedadInput = this._byId("idInputSociedad1");
			this._oAcreedorInput = this._byId("idInputAcreedor");
			this._oClaveBancoInput = this._byId("idInputClaveBanco");
			/*			this.oColModelAcreedor = new JSONModel(sap.ui.require.toUrl("com/centria/CartaPreregistro/model") +
							"/ColsAcreedores.json");
						this.oColModelSociedad = new JSONModel(sap.ui.require.toUrl("com/centria/CartaPreregistro/model") +
							"/ColsSociedad.json");*/

			this.getView().setModel(new JSONModel({}), "TablaResultadosModel");

		},
		setFilterValuesModel: function () {
			let oStructure = {
				aSociedad: "",
				aClaveBancoCargar: "",
				aClaveBancoAbonar: ""
			};

			this.getView().setModel(new JSONModel(oStructure), "FilterValuesModel");
		},

		onLoadTablasMant: function () {
			let oBodyRequest = {
				Filter_Cab_CciSet: [],
				Filter_Cab_HkontSet: []
			};
			let bSociedad = (this._oSociedadInput.getTokens().length !== 0 ? true : false),
				bClaveBanco = (this._oClaveBancoInput.getTokens().length !== 0 ? true : false);

			if (bSociedad) {
				oBodyRequest.Bukrs = this._oSociedadInput.getTokens()[0].getKey();
				oBodyRequest.ActCci = "X";
			}
			if (bClaveBanco) {
				oBodyRequest.Hkont = this._oClaveBancoInput.getTokens()[0].getKey();
				oBodyRequest.ActAk = "X";
			}

			// let oBody = {
			// 	Bukrs: "0001",
			// 	ActCci: "",
			// 	Hkont: "10413800",
			// 	ActAk: "X",
			// 	Filter_Cab_CciSet: [],
			// 	Filter_Cab_HkontSet: []
			// };

			oBodyRequest.Hkont = "10413800";
			oBodyRequest.ActAk = "X";

			return oBodyRequest;
		},
		_byId: function (sName) {
			var cmp = this.byId(sName);
			if (!cmp) {
				cmp = sap.ui.getCore().byId(sName);
			}
			return cmp;
		},

		onChangingMainFragment: function (oEvent) {
			this.fnLimpiar();
			let oFragmentContainer = this._byId("FormElementFragmentContainer");
			let aFragmentModel = this.getOwnerComponent().getModel("ModelFragments"),
				oButton = oEvent.getSource(),
				sIntent = oButton.data("fragmentIntent"),
				sFragmentName = "";

			sFragmentGlobal = sIntent;

			aFragmentModel.getData().Fragments.forEach((x) => {
				if (x.id === sIntent) {
					sFragmentName = "com.centria.CartaPreregistro.view.fragments." + x.route;
				}
			});
			let oFragment = sap.ui.xmlfragment(sFragmentName, this);

			oFragmentContainer.destroyFields();
			oFragmentContainer.addField(oFragment);

			aFragmentModel.refresh(true);

			sap.ui.core.BusyIndicator.show(1000);
			sap.ui.core.BusyIndicator.hide();

		},

		onOpeningFragmentAnulacion: function (oEvent) {
			var self = this;
			// let oFragmentContainer = this._byId("FormElementFragmentContainer");
			self.getView().getModel("AnulacionDoc").setProperty("/idInputSociedad", "idInputSociedad9");
			self.getView().getModel("AnulacionDoc").setProperty("/NumDoc", "");
			self.getView().getModel("AnulacionDoc").setProperty("/Sociedad", "");
			self.getView().getModel("AnulacionDoc").setProperty("/Ejercicio", "");

			self.getView().getModel("AnulacionDoc").setProperty("/StateNumDoc", "None");
			self.getView().getModel("AnulacionDoc").setProperty("/StateSociedad", "None");
			self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "None");

			let aFragmentModel = this.getOwnerComponent().getModel("ModelFragments"),
				oButton = oEvent.getSource(),
				sIntent = oButton.data("fragmentIntent"),
				sFragmentName = "";

			sFragmentGlobal = sIntent;

			aFragmentModel.getData().Fragments.forEach((x) => {
				if (x.id === sIntent) {
					sFragmentName = "com.centria.CartaPreregistro.view.fragments." + x.route;
				}
			});
			let oFragment = sap.ui.xmlfragment(sFragmentName, self);

			// oFragmentContainer.destroyFields();
			// oFragmentContainer.addField(oFragment);
			if (oFragment.length !== 0) {
				self.getView().addDependent(oFragment);
			}
			aFragmentModel.refresh(true);

			sap.ui.core.BusyIndicator.show(1000);
			sap.ui.core.BusyIndicator.hide();
			oFragment.open();

			// let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.fragments.AnulacionDocumentos", this);
			// this.getView().addDependent(oFragment);
			// oFragment.open();
		},
		onContDepPlazoRowSelection: function (oEvent) {
			var self = this;
			var oTable = oEvent.getSource();
			var iSelectedIndex = oTable.getSelectedIndex();

			if (iSelectedIndex < 0) {
				return;
			}

			objectSlected = oTable.getContextByIndex(iSelectedIndex).getObject();
			objectSlected.Fvencx = Utilities.formatDate(objectSlected.Fvenc);
			self.getView().getModel("TablaContDepPlazo").setProperty("/numCarta", objectSlected.NroCarta);
			self.getView().getModel("TablaContDepPlazo").setProperty("/fechaVenc", objectSlected.Fvencx);
			self.getView().getModel("TablaContDepPlazo").setProperty("/fechaContab", objectSlected.Gvfecont);
			self.getView().getModel("TablaContDepPlazo").setProperty("/tasaInteres", objectSlected.GcWTasa);

		},
		onOpeningFragmentContabilizacion: function (oEvent) {
			var self = this;

			self.getView().getModel("TablaContDepPlazo").setProperty("/TabContPlazo", []);
			var ServiceH2HModel = this.getOwnerComponent().getModel("ServiceH2HModel");
			self.getView().getModel("TablaContDepPlazo").setProperty("/numCarta", "");
			self.getView().getModel("TablaContDepPlazo").setProperty("/fechaVenc", "");
			self.getView().getModel("TablaContDepPlazo").setProperty("/fechaContab", "");
			self.getView().getModel("TablaContDepPlazo").setProperty("/tasaInteres", "");
			self.getView().getModel("TablaContDepPlazo").setProperty("/StatefechaContab", "None");
			self.getView().getModel("TablaContDepPlazo").setProperty("/StatetasaInteres", "None");
			// var query = "/Im_107_ButSet";
			var oBody = {
				"Bukrs": "",
				"Username": "",
				"Tpgdes": "",
				"Accion": "CONDPP",
				"Formss": "TBM",
				/*	"Im_FIR107_FieldInput2Set": [],
					"Im_FIR107_ClaveBancoPropioSet": [],
					"Im_FIR107_CtasInterbancSet": [],
					"Im_FIR107_ContDepPlazoSet": [],
					"Im_FIR107_CtasDepositSet": [],
					"Im_FIR107_MantProveedSet": [],
					"Im_FIR107_BinnSet": []*/
				"Im_Zfir107Bin_07Set": [],
				"Im_Zfir107Cbp_01Set": [],
				"Im_Zfir107Cdp_02Set": [],
				"Im_Zfir107Cib_04Set": [],
				"Im_Zfir107For_05Set": [],
				"Im_Zfir107Mdp_03Set": [],
				"Im_Zfir107Mtp_06Set": []
			};

			sap.ui.core.BusyIndicator.show(0);
			//ServiceH2HModel.create("/Im_FIR107_CabeceraSet",
			ServiceH2HModel.create("/Im_CabZfir107_CabSet",
				oBody, {
					success: function (oResult2) {
						console.log(oResult2);
						//	self.getView().getModel("TablaContDepPlazo").setProperty("/TabContPlazo", oResult2.Im_FIR107_ContDepPlazoSet.results);
						self.getView().getModel("TablaContDepPlazo").setProperty("/TabContPlazo", oResult2.Im_Zfir107Cdp_02Set.results);

						// let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.fragments.ManProvExt", this);
						// oThes.getView().addDependent(oFragment);
						// oFragment.open();
						sap.ui.core.BusyIndicator.hide();
						let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.fragments.ContabilizacionDepositoPlazo", self);
						self.getView().addDependent(oFragment);
						oFragment.open();
					},
					error: function (oError2) {
						sap.ui.core.BusyIndicator.hide();
						console.log(oError2);
					}
				});

			// let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.fragments.ContabilizacionDepositoPlazo", this);
			// this.getView().addDependent(oFragment);
			// oFragment.open();

		},
		_onContabilizar: function (oEvent) {
			var self = this;
			var oSource = oEvent.getSource();
			if ($.isEmptyObject(objectSlected)) {
				MessageBox.error("Seleccione un registro!!!");
				return;
			}

			var fechaCont = self.getView().getModel("TablaContDepPlazo").getProperty("/fechaContab");

			var tasaInter = self.getView().getModel("TablaContDepPlazo").getProperty("/tasaInteres");
			if ($.isEmptyObject(fechaCont) && $.isEmptyObject(tasaInter)) {
				self.getView().getModel("TablaContDepPlazo").setProperty("/StatefechaContab", "Error");
				self.getView().getModel("TablaContDepPlazo").setProperty("/StatetasaInteres", "Error");
				return;
			} else {
				self.getView().getModel("TablaContDepPlazo").setProperty("/StatefechaContab", "None");
				self.getView().getModel("TablaContDepPlazo").setProperty("/StatetasaInteres", "None");
			}

			if ($.isEmptyObject(fechaCont)) {
				self.getView().getModel("TablaContDepPlazo").setProperty("/StatefechaContab", "Error");
				return;
			} else {
				self.getView().getModel("TablaContDepPlazo").setProperty("/StatefechaContab", "None");
			}

			if ($.isEmptyObject(tasaInter)) {
				self.getView().getModel("TablaContDepPlazo").setProperty("/StatetasaInteres", "Error");
				return;
			} else {
				self.getView().getModel("TablaContDepPlazo").setProperty("/StatetasaInteres", "None");
			}

			fechaCont = new Date(fechaCont + "T00:00:00");
			var ServiceH2HModel = this.getOwnerComponent().getModel("ServiceH2HModel");
			// var query = "/Im_107_ButSet";

			var obj = {
				BelnrApe: objectSlected.BelnrApe,
				BelnrCap: objectSlected.BelnrCap,
				Bldat: objectSlected.Bldat,
				Bukrs: objectSlected.Bukrs,
				Dmbtr: objectSlected.Dmbtr,
				Fvenc: objectSlected.Fvenc,
				GcWTasa: tasaInter,
				GjahrApe: objectSlected.GjahrApe,
				GjahrCap: objectSlected.GjahrCap,
				Gvfecont: fechaCont,
				Hkont1: objectSlected.Hkont1,
				Hkont2: objectSlected.Hkont2,
				Hkont3: objectSlected.Hkont3,
				Inter: objectSlected.Inter,
				NroCarta: objectSlected.NroCarta,
				State: objectSlected.State,
				Tasa: objectSlected.Tasa,
				Waers: objectSlected.Waers
			};
			var oBody = {
				"Bukrs": "",
				"Username": "",
				"Tpgdes": "",
				"Accion": "CONT_DP",
				"Formss": "TBM",
				/*		"Im_FIR107_FieldInput2Set": [],
						"Im_FIR107_ClaveBancoPropioSet": [],
						"Im_FIR107_CtasInterbancSet": [],
						"Im_Zfir107Cdp_02Set": [obj],
						"Im_FIR107_CtasDepositSet": [],
						"Im_FIR107_MantProveedSet": [],
						"Im_FIR107_BinnSet": []*/

				"Im_Zfir107Bin_07Set": [],
				"Im_Zfir107Cbp_01Set": [],
				"Im_Zfir107Cdp_02Set": [obj],
				"Im_Zfir107Cib_04Set": [],
				"Im_Zfir107For_05Set": [],
				"Im_Zfir107Mdp_03Set": [],
				"Im_Zfir107Mtp_06Set": [],
				"Im_Zfir107Log_08Set": [],

			};

			sap.ui.core.BusyIndicator.show(0);
			//	ServiceH2HModel.create("/Im_FIR107_CabeceraSet",
			ServiceH2HModel.create("/Im_CabZfir107_CabSet",
				oBody, {
					success: function (oResult2, response) {
						console.log(oResult2);
						//	MessageBox.success(self.getI18nText("txtSuccess"));
						self._onCreateMessageView(oResult2);
						// var sSapMessage = response.headers["sap-message"];
						// var oSapMessage = JSON.parse(sSapMessage);
						// switch (oSapMessage.severity) {
						// case "error":
						// 	MessageBox.error(oSapMessage.message);
						// 	break;
						// case "success":
						// 	MessageBox.success(oSapMessage.message);
						// 	break;
						// case "info":
						// 	MessageBox.information(oSapMessage.message);
						// 	break;
						// default:
						// 	MessageBox.information(that.getI18nText("txtInfoODataNoResponse"));
						// }
						sap.ui.core.BusyIndicator.hide();
						self.closeDialog();
						// self.getView().getModel("TablaContDepPlazo").setProperty("/TabContPlazo", oResult2.Im_FIR107_ContDepPlazoSet.results);
						// let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.fragments.ManProvExt", this);
						// oThes.getView().addDependent(oFragment);
						// oFragment.open();
						// sap.ui.core.BusyIndicator.hide();
					},
					error: function (oError2) {
						sap.ui.core.BusyIndicator.hide();
						//MessageBox.information(self.getI18nText("txtErrorOData"));
						console.log(oError2);
					}
				});

		},
		_onAnularDocumentos: function (oEvent) {
			var self = this;

			var NumDoc = self.getView().getModel("AnulacionDoc").getProperty("/NumDoc");
			//var Sociedad = self.getView().getModel("AnulacionDoc").getProperty("/Sociedad");
			var Sociedad = self._byId("idInputSociedad9").getValue();
			var Ejercicio = self.getView().getModel("AnulacionDoc").getProperty("/Ejercicio");

			var tokens;
			if ($.isEmptyObject(self.aTokens)) {
				tokens = self.aTokens;
			} else {
				tokens = self.aTokens[0].getKey();
			}

			if ($.isEmptyObject(NumDoc) && ($.isEmptyObject(Sociedad) && $.isEmptyObject(tokens)) && $.isEmptyObject(
					Ejercicio)) {
				self.getView().getModel("AnulacionDoc").setProperty("/StateNumDoc", "Error");
				self.getView().getModel("AnulacionDoc").setProperty("/StateSociedad", "Error");
				self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "Error");
				return;
			} else {
				self.getView().getModel("AnulacionDoc").setProperty("/StateNumDoc", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateSociedad", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "None");
			}

			if ($.isEmptyObject(NumDoc) && ($.isEmptyObject(Sociedad) && $.isEmptyObject(tokens))) {
				self.getView().getModel("AnulacionDoc").setProperty("/StateNumDoc", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateSociedad", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "None");
				return;
			} else {
				self.getView().getModel("AnulacionDoc").setProperty("/StateNumDoc", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateSociedad", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "None");
			}

			if ($.isEmptyObject(NumDoc) && $.isEmptyObject(Ejercicio)) {
				self.getView().getModel("AnulacionDoc").setProperty("/StateNumDoc", "Error");
				self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "Error");
				return;
			} else {
				self.getView().getModel("AnulacionDoc").setProperty("/StateNumDoc", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateSociedad", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "None");
			}

			if (($.isEmptyObject(Sociedad) && $.isEmptyObject(tokens)) && $.isEmptyObject(Ejercicio)) {
				self.getView().getModel("AnulacionDoc").setProperty("/StateSociedad", "Error");
				self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "Error");
				return;
			} else {
				self.getView().getModel("AnulacionDoc").setProperty("/StateNumDoc", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateSociedad", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "None");
			}

			if ($.isEmptyObject(NumDoc)) {
				self.getView().getModel("AnulacionDoc").setProperty("/StateNumDoc", "Error");
				return;
			} else {
				self.getView().getModel("AnulacionDoc").setProperty("/StateNumDoc", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateSociedad", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "None");
			}

			if (($.isEmptyObject(Sociedad) && $.isEmptyObject(tokens))) {
				self.getView().getModel("AnulacionDoc").setProperty("/StateSociedad", "Error");
				return;
			} else {
				self.getView().getModel("AnulacionDoc").setProperty("/StateNumDoc", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateSociedad", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "None");
			}

			if ($.isEmptyObject(Ejercicio)) {
				self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "Error");
				return;
			} else {
				self.getView().getModel("AnulacionDoc").setProperty("/StateNumDoc", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateSociedad", "None");
				self.getView().getModel("AnulacionDoc").setProperty("/StateEjercicio", "None");
			}

			// fechaCont = new Date(fechaCont + "T00:00:00");
			var ServiceH2HModel = this.getOwnerComponent().getModel("ServiceH2HModel");
			// var query = "/Im_107_ButSet";

			var obj = {
				GpBelnr: NumDoc,
				Gvbukrs: Sociedad,
				GpGjahr: Ejercicio,
				Gvfecap: null,
				Gvfecvenc: null,
				Gvfecrg: null,
				Gvfeccnt: null,
				Gvimporte: "0.0",
				Gvcapint: "0.0",
				Gvtc: "0.0",
				Gvcomision: "0.0",
				Gvinteres: "0.0",
				Gvtasa: "0.0",
				Gvimp2: "0.0",
				Gvimp1: "0.0",
				Gvctvalor: "0.0",
				Gvruc: "",
				Gvremitente: "",
				Gvwaers: "",
				Gvplazo: "",
				Gvbanklo: "",
				Gvbankld: "",
				Gvbukrsben: "",
				Gvref: "",
				Gvctadepos: "",
				Gvcci: "",
				Gvctacargo: "",
				Gvctabono: "",
				GcRad5: "",
				GcRad2: "",
				Gvcta2: "",
				Gvbco2: "",
				Gvdni: "",
				Gvprov: "",
				GcHkont1: "",
				GcHkont2: "",
				GcHkont3: "",
				Gvnomprov: "",
				Gvxland1: "",
				Gvxname1: "",
				Gvxrbancinter: "",
				Gvxbcointer: "",
				Gvxswiftinter: "",
				Gvxctainter: "",
				Gvxbcofinal: "",
				Gvxctafinal: "",
				Gvxswiftbic: "",
				Gvxaba: "",
				Gvxiban: "",
				Gvxcif: "",
				Gvxliq: ""
					// ,
					// Bukrs: objectSlected.Bukrs,
					// Dmbtr: objectSlected.Dmbtr,
					// Fvenc: objectSlected.Fvenc,
					// GcWTasa: tasaInter,
					// GjahrApe: objectSlected.GjahrApe,
					// GjahrCap: objectSlected.GjahrCap,
					// Gvfecont: fechaCont,
					// Hkont1: objectSlected.Hkont1,
					// Hkont2: objectSlected.Hkont2,
					// Hkont3: objectSlected.Hkont3,
					// Inter: objectSlected.Inter,
					// NroCarta: objectSlected.NroCarta,
					// State: objectSlected.State,
					// Tasa: objectSlected.Tasa,
					// Waers: objectSlected.Waers
			};
			var oBody = {
				"Bukrs": Sociedad,
				"Username": "",
				"Tpgdes": "",
				"Accion": "ANULDO",
				"Formss": "TBM",
				//"Laufd":"",
				/*	"Im_FIR107_FieldInput2Set": [obj],
					"Im_FIR107_ClaveBancoPropioSet": [],
					"Im_FIR107_CtasInterbancSet": [],
					"Im_FIR107_ContDepPlazoSet": [],
					"Im_FIR107_CtasDepositSet": [],
					"Im_FIR107_MantProveedSet": [],
					"Im_FIR107_BinnSet": []*/

				"Im_Zfir107Bin_07Set": [],
				"Im_Zfir107Cbp_01Set": [],
				"Im_Zfir107Cdp_02Set": [],
				"Im_Zfir107Cib_04Set": [],
				"Im_Zfir107For_05Set": [obj],
				"Im_Zfir107Mdp_03Set": [],
				"Im_Zfir107Mtp_06Set": [],
				"Im_Zfir107Log_08Set": []

			};

			sap.ui.core.BusyIndicator.show(0);
			//	ServiceH2HModel.create("/Im_FIR107_CabeceraSet",
			ServiceH2HModel.create("/Im_CabZfir107_CabSet",
				oBody, {
					success: function (oResult2, response) {
						console.log(oResult2);
						MessageBox.success(self.getI18nText("txtSuccess"));
						// var sSapMessage = response.headers["sap-message"];
						// var oSapMessage = JSON.parse(sSapMessage);
						// switch (oSapMessage.severity) {
						// case "error":
						// 	MessageBox.error(oSapMessage.message);
						// 	break;
						// case "success":
						// 	MessageBox.success(oSapMessage.message);
						// 	break;
						// case "info":
						// 	MessageBox.information(oSapMessage.message);
						// 	break;
						// default:
						// 	MessageBox.information(that.getI18nText("txtInfoODataNoResponse"));
						// }
						sap.ui.core.BusyIndicator.hide();
						self.closeDialog(oEvent);
						// self.getView().getModel("TablaContDepPlazo").setProperty("/TabContPlazo", oResult2.Im_FIR107_ContDepPlazoSet.results);
						// let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.fragments.ManProvExt", this);
						// oThes.getView().addDependent(oFragment);
						// oFragment.open();
						// sap.ui.core.BusyIndicator.hide();
					},
					error: function (oError2) {
						sap.ui.core.BusyIndicator.hide();
						//MessageBox.error(self.getI18nText("txtErrorOData"));
					}
				});

		},
		closeDialog: function (oEvent) {
			if (!$.isEmptyObject(oEvent)) {
				oEvent.getSource().getParent().destroy();
			} else {
				oEvent.getSource().getParent().close();
			}
			// sFragmentGlobal = "1";
			// oEvent.getSource().getParent().close();
		},

		/*		readEntity: function (sQuery, aFilters = []) {
					return new Promise((resolve, reject) => {
						this.getServiceModel().read("/" + sQuery, {
							filters: aFilters,
							success: (oData) => {
								resolve(oData);
							},
							error: (err) => {
								reject(err);
							}
						});
					});
				},*/
		createEntry: function (sPath, oBody = {}) {
			return new Promise((resolve, reject) => {
				this.getServiceModel().create("/" + sPath, oBody, {
					success: (oData) => {
						resolve(oData);
					},
					error: (err) => {
						reject(err);
					}
				});
			});
		},

		onSociedadSearch: function (oEvent) {
			let sValue = oEvent.getParameter("value");
			//	let sSelectedKey = this._oSociedadInput.getSelectedKey();
			let aFiltros = [new Filter("Companycode", FilterOperator.Contains, sValue),
				new Filter("Companycodename", FilterOperator.Contains, sValue)
			];

			let oFilter = new Filter({
				filters: aFiltros,
				and: false
			});
			let oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
			//oBinding.filter([oFilter, new Filter("Companycode", FilterOperator.EQ, sSelectedKey)]);
		},

		onClaveBancoSearch: function (oEvent) {
			let sValue = oEvent.getParameter("value");
			let oModelDataGlobal = this.getView().getModel("oModelDataGlobal");
			let sSociedad = oModelDataGlobal.getProperty("/InpSociedad");
			let aFiltros = [new Filter("Hbkid", FilterOperator.Contains, sValue),
				new Filter("Banka", FilterOperator.Contains, sValue)
			];

			let oFilter = new Filter({
				filters: aFiltros,
				and: false
			});
			let oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter, new Filter("Bukrs", FilterOperator.EQ, sSociedad)]);
		},

		openMatchCodeClaveBanco: function () {

			if (!this._ClaveBancoDialog) {
				this._ClaveBancoDialog = sap.ui.xmlfragment(
					"com.centria.CartaPreregistro.view.fragments.ClaveBanco",
					this);
				this.getView().addDependent(this._ClaveBancoDialog);
			}

			let oModelDataGlobal = this.getView().getModel("oModelDataGlobal");
			let sSociedad = oModelDataGlobal.getProperty("/InpSociedad");
			if (oModelDataGlobal.getProperty("/InpSociedad")) {
				let oTable = sap.ui.getCore().byId("tbsClaveBanco");
				let oBinding = oTable.getBinding("items");
				oBinding.filter([new Filter("Bukrs", FilterOperator.EQ, sSociedad)]);
				this._ClaveBancoDialog.open();
			} else {
				MessageBox.information("Seleccione una sociedad");
			}

		},

		openMatchCodeClaveBancoDest: function () {

			if (!this._ClaveBancoDestDialog) {
				this._ClaveBancoDestDialog = sap.ui.xmlfragment(
					"com.centria.CartaPreregistro.view.fragments.ClaveBancoDestino",
					this);
				this.getView().addDependent(this._ClaveBancoDestDialog);
			}

			let oModelDataGlobal = this.getView().getModel("oModelDataGlobal");
			let sSociedad = oModelDataGlobal.getProperty("/inputSocBen");
			if (sSociedad) {
				let oTable = sap.ui.getCore().byId("tbsClaveBancoDestino");
				let oBinding = oTable.getBinding("items");
				oBinding.filter([new Filter("Bukrs", FilterOperator.EQ, sSociedad)]);
				this._ClaveBancoDestDialog.open();
			} else {
				MessageBox.information("Seleccione una sociedad beneficiaria");
			}

		},

		openMatchCodeSociedad: function () {

			if (!this._oSociedadSelectDialog) {
				this._oSociedadSelectDialog = sap.ui.xmlfragment(
					"com.centria.CartaPreregistro.view.fragments.SociedadFilter",
					this);
				this.getView().addDependent(this._oSociedadSelectDialog);
			}

			this._oSociedadSelectDialog.open();

		},
		openMatchCodeSociedadBen: function () {
			if (!this._oSociedadBenSelectDialog) {
				this._oSociedadBenSelectDialog = sap.ui.xmlfragment(
					"com.centria.CartaPreregistro.view.fragments.SociedadFilterBen",
					this);
				this.getView().addDependent(this._oSociedadBenSelectDialog);
			}

			this._oSociedadBenSelectDialog.open();

		},

		onValueHelpCancelPress: function () {
			this._oValueHelpDialog.close();
		},
		onValueHelpAfterClose: function () {
			this._oValueHelpDialog.destroy();
		},
		_filterTable: function (oFilter) {
			var oValueHelpDialog = this._oValueHelpDialog;

			oValueHelpDialog.getTableAsync().then(function (oTable) {
				if (oTable.bindRows) {
					oTable.getBinding("rows").filter(oFilter);
				}

				if (oTable.bindItems) {
					oTable.getBinding("items").filter(oFilter);
				}

				oValueHelpDialog.update();
			});
		},

		onSuggestSociedad: function (oEvent) {
			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new Filter("Companycode", FilterOperator.StartsWith, sTerm.toUpperCase()));
			}

			oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
		},

		onSociedadValueHelpOkPress: function (oEvent) {
			let oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);

			let aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				let oSociedad = aContexts[0].getObject();
				let oModelDataGlobal = this._oSociedadSelectDialog.getModel("oModelDataGlobal");

				if (sFragmentGlobal === "1" || sFragmentGlobal === "2" ||
					sFragmentGlobal === "3" || sFragmentGlobal === "4" ||
					sFragmentGlobal === "5" || sFragmentGlobal === "6" || sFragmentGlobal === "7") {
					if (oModelDataGlobal) {
						oModelDataGlobal.setProperty("/InpSociedad", oSociedad.Companycode);
					}
				} else if (sFragmentGlobal === "9") {
					let oModelAnulacion = this.getView().getModel("AnulacionDoc");
					if (oModelAnulacion) {
						oModelAnulacion.setProperty("/Sociedad", oSociedad.Companycode);
					}
				}

			}

		},
		onSociedadValueHelpOkPressBen: function (oEvent) {
			let oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);

			let aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				let oSociedad = aContexts[0].getObject();
				let oModelDataGlobal = this._oSociedadBenSelectDialog.getModel("oModelDataGlobal");

				if (sFragmentGlobal === "1" || sFragmentGlobal === "2" ||
					sFragmentGlobal === "3" || sFragmentGlobal === "4" ||
					sFragmentGlobal === "5" || sFragmentGlobal === "6" || sFragmentGlobal === "7") {
					if (oModelDataGlobal) {
						oModelDataGlobal.setProperty("/inputSocBen", oSociedad.Companycode);
					}
				}

			}

		},

		onClaveBancoValueHelpOkPress: function (oEvent) {
			let oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);

			let aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				let oItem = aContexts[0].getObject();
				let oModelDataGlobal = this.getView().getModel("oModelDataGlobal");

				if (sFragmentGlobal === "1" || sFragmentGlobal === "2" ||
					sFragmentGlobal === "3" || sFragmentGlobal === "4" ||
					sFragmentGlobal === "5" || sFragmentGlobal === "6" || sFragmentGlobal === "7") {
					if (oModelDataGlobal) {
						oModelDataGlobal.setProperty("/inputClaBanOrigen", oItem.Hbkid);
					}
				}

			}
		},

		onClaveBancoDestValueHelpOkPress: function (oEvent) {
			let oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);

			let aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				let oItem = aContexts[0].getObject();
				let oModelDataGlobal = this.getView().getModel("oModelDataGlobal");

				if (sFragmentGlobal === "1" || sFragmentGlobal === "2" ||
					sFragmentGlobal === "3" || sFragmentGlobal === "4" ||
					sFragmentGlobal === "5" || sFragmentGlobal === "6" || sFragmentGlobal === "7") {
					if (oModelDataGlobal) {
						oModelDataGlobal.setProperty("/inputClaBanDestino", oItem.Hbkid);
					}
				}

			}
		},

		getServiceModel: function () {
			return this.getOwnerComponent().getModel("ServiceH2HModel");
		},

		getI18nText: function (sText, aParameters = []) {
			return aParameters.length > 0 ? this.getView().getModel("i18n").getResourceBundle().getText(sText, aParameters) : this.getView().getModel(
				"i18n").getResourceBundle().getText(sText);
		},
		onVisualizarCarta: function (oEvent) {
			var oModelDataGlobal = this.getView().getModel("oModelDataGlobal").getData();
			var accion = "VER_CARTA";
			console.log(oModelDataGlobal);
			switch (sFragmentGlobal) {
			case "1":
				this.fnbutton1(accion, oModelDataGlobal);
				//this.onOpeningFragmentVisulaizarCartaVista();
				break;
			case "2":
				this.fnbutton2(accion, oModelDataGlobal);
				break;
			case "3":
				this.fnbutton3(accion, oModelDataGlobal);
				break;
			case "4":
				this.fnbutton4(accion, oModelDataGlobal);
				break;
			case "5":
				this.fnbutton5(accion, oModelDataGlobal);
				break;
			case "6":
				this.fnbutton6(accion, oModelDataGlobal);
				break;
			case "7":
				this.fnbutton7(accion, oModelDataGlobal);
				break;
			}
		},
		onImprimirCarta: function (oEvent) {
			var oModelDataGlobal = this.getView().getModel("oModelDataGlobal").getData();
			//var accion = "IMPRIMIR";
			var accion = "VER_CARTA";
			console.log(oModelDataGlobal);
			switch (sFragmentGlobal) {
			case "1":
				this.fnbutton1(accion, oModelDataGlobal);
				break;
			case "2":
				this.fnbutton2(accion, oModelDataGlobal);
				break;
			case "3":
				this.fnbutton3(accion, oModelDataGlobal);
				break;
			case "4":
				this.fnbutton4(accion, oModelDataGlobal);
				break;
			case "5":
				this.fnbutton5(accion, oModelDataGlobal);
				break;
			case "6":
				this.fnbutton6(accion, oModelDataGlobal);
				break;
			case "7":
				this.fnbutton7(accion, oModelDataGlobal);
				break;
			}
		},
		onGenerarAsiento: function (oEvent) {
			var self = this;
			var oModelDataGlobal = this.getView().getModel("oModelDataGlobal").getData();
			var accion = "GENERAR";
			console.log(oModelDataGlobal);
			switch (sFragmentGlobal) {
			case "1":
				self.fnbutton1(accion, oModelDataGlobal);
				break;
			case "2":
				self.fnbutton2(accion, oModelDataGlobal);
				break;
			case "3":
				self.fnbutton3(accion, oModelDataGlobal);
				break;
			case "4":
				self.fnbutton4(accion, oModelDataGlobal);
				break;
			case "5":
				self.fnbutton5(accion, oModelDataGlobal);
				break;
			case "6":
				self.fnbutton6(accion, oModelDataGlobal);
				break;
			case "7":
				self.fnbutton7(accion, oModelDataGlobal);
				break;
			}
		},

		fnLimpiar: function () {
			var oJson = {
				"InpSociedad": "",
				"InpRuc": "",
				"InpAtte": "",
				"InpImporte": "",
				"InpFecRegistro": null,
				"InpFecConta": null,
				"InpCuentaCargo": "",
				"inputClaBanAbonar": "",
				"inputCuentaAbono": "",
				"inputCuentaDepPla": "",
				"inputFecApe": null,
				"inputPlazo": "",
				"inputFecVen": null,
				"inputTasa": "",
				"inputIntereses": "",
				"inputClaBanOrigen": "",
				"inputComision": "",
				"inputSocBen": "",
				"inputClaBanDestino": "",
				"inputCuentaInterbancaria": "",
				"inputCodLiq": "",
				"inputPais": "",
				"inputCIF": "",
				"inputBanFinal": "",
				"inputNCuen": "",
				"inputIBAN": "",
				"inputSwiftBic": "",
				"inputABA": "",
				"inputBanIntermediario": "",
				"inputCuentaIntermediario": "",
				"inputSwiftIntermediario": "",
				"inputImportDolar": "",
				"inputTipCambio": "",
				"inputContrValor": "",
				"inputBancoDestino1": "",
				"inputBancoDestino2": "",
				"inputCuentaCCI": "",
				"inputProveedor": "",
				"inputPortador": "",
				"inputDNI": "",
				"inputClaBanCargar": ""
			};
			var oModelDataGlobal = this.getView().getModel("oModelDataGlobal");
			oModelDataGlobal.setData(oJson);
			oModelDataGlobal.refresh();
		},
		fnbutton1: function (Accion, oModelDataGlobal) {
			var self = this;
			var ServiceH2HModel = self.getOwnerComponent().getModel("ServiceH2HModel");
			var query = "/Im_107_ButSet";
			// var oThes = this;
			sap.ui.core.BusyIndicator.show(0);
			ServiceH2HModel.read(query, {
				success: function (oResult) {
					var buttons = oResult.results;
					var CodButo = "";
					for (var i = 1; i < 8; i++) {
						if (i == sFragmentGlobal) {
							CodButo = buttons[i - 1].Tpgdes;
						}
					}

					var oBody = {
						"Bukrs": oModelDataGlobal.InpSociedad,
						"Accion": Accion,
						"Tpgdes": CodButo,
						"Formss": "",
						"Username": "",
						/*	"Im_FIR107_FieldInput2Set": [],
							"Im_FIR107_ClaveBancoPropioSet": [],
							"Im_FIR107_CtasInterbancSet": [],
							"Im_FIR107_CtasDepositSet": [],
							"Im_FIR107_MantProveedSet": [],
							"Im_FIR107_BinnSet": []*/
						"Im_Zfir107Bin_07Set": [],
						"Im_Zfir107Cbp_01Set": [],
						"Im_Zfir107Cdp_02Set": [],
						"Im_Zfir107Cib_04Set": [],
						"Im_Zfir107For_05Set": [],
						"Im_Zfir107Mdp_03Set": [],
						"Im_Zfir107Mtp_06Set": [],
						"Im_Zfir107Log_08Set": []
					};

					var oDataSap2 = self.dataSap2();

					//AGREGO LOS DATOS DEL FORMULARIO/////////////////
					oDataSap2.Gvbukrs = oModelDataGlobal.InpSociedad; //SOCIEDAD
					oDataSap2.Gvruc = oModelDataGlobal.InpRuc; //RUC
					oDataSap2.Gvremitente = oModelDataGlobal.InpAtte; //ATTE
					oDataSap2.Gvimporte = oModelDataGlobal.InpImporte; // IMPORTE
					oDataSap2.Gvfecrg = oModelDataGlobal.InpFecRegistro; //FECHA REGISTRO
					oDataSap2.Gvfeccnt = oModelDataGlobal.InpFecConta; //FECHA CONTABILIZACION
					oDataSap2.Gvbanklo = oModelDataGlobal.inputClaBanCargar; //CLAVE BANCO CARGAR
					oDataSap2.Gvctacargo = oModelDataGlobal.InpCuentaCargo; // CUENTA CARGO
					oDataSap2.Gvbankld = oModelDataGlobal.inputClaBanAbonar; //CLAVE BANCO ABONAR
					oDataSap2.Gvctabono = oModelDataGlobal.inputCuentaAbono; //CUENTA ABONO
					oDataSap2.Gvctadepos = oModelDataGlobal.inputCuentaDepPla; //CUENTA DEPOSITO PLAZO
					oDataSap2.Gvfecap = oModelDataGlobal.inputFecApe; //FECHA APERTURA
					oDataSap2.Gvplazo = oModelDataGlobal.inputPlazo; //PLAZO
					oDataSap2.Gvfecvenc = oModelDataGlobal.inputFecVen; //FECHA VENCIMIENTO
					oDataSap2.Gvtasa = (oModelDataGlobal.inputTasa === "") ? "0.0" : oModelDataGlobal.inputTasa; //TASA 
					oDataSap2.Gvinteres = (oModelDataGlobal.inputIntereses === "") ? "0.0" : oModelDataGlobal.inputIntereses; //INTERESE
					//*****************************************////////

					oBody.Im_Zfir107For_05Set.push(oDataSap2);

					//ServiceH2HModel.create("/Im_FIR107_CabeceraSet",
					ServiceH2HModel.create("/Im_CabZfir107_CabSet",
						oBody, {
							success: function (oResult2) {
								sap.ui.core.BusyIndicator.hide();
								self._onCreateMessageView(oResult2);
								//MessageBox.success(self.getI18nText("txtSuccess"));
								console.log(oResult2);
							},
							error: function (oError2) {
								// MessageBox.error(self.getI18nText("txtErrorOData"));
								sap.ui.core.BusyIndicator.hide();
								//MessageBox.error(oError2.responseText);
								console.log(oError2)
							}
						})

				},
				error: function (oError) {
					// MessageBox.error(self.getI18nText("txtErrorOData"));
					sap.ui.core.BusyIndicator.hide();
					//MessageBox.error(oError.responseText);
					console.log(oError);
				}
			});
		},
		fnbutton2: function (Accion, oModelDataGlobal) {
			var self = this;
			var ServiceH2HModel = this.getOwnerComponent().getModel("ServiceH2HModel");
			var query = "/Im_107_ButSet";
			// var oThes = this;
			/*		sap.ui.core.BusyIndicator.show(0);
					ServiceH2HModel.read(query, {
						success: function (oResult) {
							sap.ui.core.BusyIndicator.hide();
							var buttons = oResult.results;
							var CodButo = "";
							for (var i = 1; i < 8; i++) {
								if (i == sFragmentGlobal) {
									CodButo = buttons[i - 1].Tpgdes;
								}
							}*/

			var oBody = {
				"Bukrs": oModelDataGlobal.InpSociedad,
				"Accion": Accion,
				"Tpgdes": "BUT2",
				"Formss": "",
				"Username": "",
				/*	"Im_FIR107_FieldInput2Set": [],
					"Im_FIR107_ClaveBancoPropioSet": [],
					"Im_FIR107_CtasInterbancSet": [],
					"Im_FIR107_CtasDepositSet": [],
					"Im_FIR107_MantProveedSet": [],
					"Im_FIR107_BinnSet": []*/
				"Im_Zfir107Bin_07Set": [],
				"Im_Zfir107Cbp_01Set": [],
				"Im_Zfir107Cdp_02Set": [],
				"Im_Zfir107Cib_04Set": [],
				"Im_Zfir107For_05Set": [],
				"Im_Zfir107Mdp_03Set": [],
				"Im_Zfir107Mtp_06Set": [],
				"Im_Zfir107Log_08Set": []
			};

			var oDataSap2 = self.dataSap2();

			//AGREGO LOS DATOS DEL FORMULARIO/////////////////
			oDataSap2.Gvbukrs = oModelDataGlobal.InpSociedad; //SOCIEDAD
			oDataSap2.Gvremitente = oModelDataGlobal.InpAtte; //ATTE
			oDataSap2.Gvimporte = oModelDataGlobal.InpImporte; // IMPORTE
			oDataSap2.Gvfecrg = (oModelDataGlobal.InpFecRegistro === "") ? null : oModelDataGlobal.InpFecRegistro; //FECHA REGISTRO
			oDataSap2.Gvfeccnt = (oModelDataGlobal.InpFecConta === "") ? null : oModelDataGlobal.InpFecConta; //FECHA CONTABILIZACION
			oDataSap2.Gvbanklo = oModelDataGlobal.inputClaBanOrigen; //CLAVE BANCO ORIGEN
			oDataSap2.Gvctacargo = oModelDataGlobal.InpCuentaCargo; // CUENTA CARGO
			oDataSap2.Gvbukrsben = oModelDataGlobal.inputSocBen; //SOCIEDAD BENEFICIARIA
			oDataSap2.Gvbankld = oModelDataGlobal.inputClaBanDestino; //CLAVE BANCO DESTINO
			oDataSap2.Gvxctainter = oModelDataGlobal.inputCuentaInterbancaria; //CUENTA INTERBANCARIA
			oDataSap2.Gvcomision = (oModelDataGlobal.inputComision === "") ? "0.0" : oModelDataGlobal.inputComision; //COMISION

			//*****************************************////////

			oBody.Im_Zfir107For_05Set.push(oDataSap2);
			sap.ui.core.BusyIndicator.show(0);
			//		ServiceH2HModel.create("/Im_FIR107_CabeceraSet",
			ServiceH2HModel.create("/Im_CabZfir107_CabSet",

				oBody, {
					success: function (oResult2) {
						sap.ui.core.BusyIndicator.hide();
						//MessageBox.success(self.getI18nText("txtSuccess"));
						self._onCreateMessageView(oResult2);
						console.log(oResult2);
					},
					error: function (oError2) {
						sap.ui.core.BusyIndicator.hide();
						// MessageBox.error(self.getI18nText("txtErrorOData"));
						//MessageBox.error(oError2.responseText);
						console.log(oError2)
					}
				})

			/*	},
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
					// MessageBox.error(self.getI18nText("txtErrorOData"));
					//MessageBox.error(oError.responseText);
					console.log(oError);
				}
			});*/
		},
		fnbutton3: function (Accion, oModelDataGlobal) {
			var ServiceH2HModel = this.getOwnerComponent().getModel("ServiceH2HModel");
			var query = "/Im_107_ButSet";
			var self = this;
			/*		sap.ui.core.BusyIndicator.show(0);
					ServiceH2HModel.read(query, {
						success: function (oResult) {
							sap.ui.core.BusyIndicator.hide();
							var buttons = oResult.results;
							var CodButo = "";
							for (var i = 1; i < 8; i++) {
								if (i == sFragmentGlobal) {
									CodButo = buttons[i - 1].Tpgdes;
								}
							}*/

			var oBody = {
				"Bukrs": oModelDataGlobal.InpSociedad,
				"Accion": Accion,
				"Tpgdes": "BUT3",
				"Formss": "",
				"Username": "",
				/*	"Im_FIR107_FieldInput2Set": [],
					"Im_FIR107_ClaveBancoPropioSet": [],
					"Im_FIR107_CtasInterbancSet": [],
					"Im_FIR107_CtasDepositSet": [],
					"Im_FIR107_MantProveedSet": [],
					"Im_FIR107_BinnSet": []*/
				"Im_Zfir107Bin_07Set": [],
				"Im_Zfir107Cbp_01Set": [],
				"Im_Zfir107Cdp_02Set": [],
				"Im_Zfir107Cib_04Set": [],
				"Im_Zfir107For_05Set": [],
				"Im_Zfir107Mdp_03Set": [],
				"Im_Zfir107Mtp_06Set": [],
				"Im_Zfir107Log_08Set": []
			};

			var oDataSap2 = self.dataSap2();

			//AGREGO LOS DATOS DEL FORMULARIO/////////////////
			oDataSap2.Gvbukrs = oModelDataGlobal.InpSociedad; //SOCIEDAD
			oDataSap2.Gvremitente = oModelDataGlobal.InpAtte; //ATTE
			oDataSap2.Gvimporte = oModelDataGlobal.InpImporte; // IMPORTE
			oDataSap2.Gvfecrg = (oModelDataGlobal.InpFecRegistro === "") ? null : oModelDataGlobal.InpFecRegistro; //FECHA REGISTRO
			oDataSap2.Gvfeccnt = (oModelDataGlobal.InpFecConta === "") ? null : oModelDataGlobal.InpFecConta; //FECHA CONTABILIZACION
			oDataSap2.Gvbanklo = oModelDataGlobal.inputClaBanOrigen; //CLAVE BANCO ORIGEN
			oDataSap2.Gvctacargo = oModelDataGlobal.InpCuentaCargo; // CUENTA CARGO
			oDataSap2.Gvbukrsben = oModelDataGlobal.inputSocBen; //SOCIEDAD BENEFICIARIA
			oDataSap2.Gvbankld = oModelDataGlobal.inputClaBanDestino; //CLAVE BANCO DESTINO
			oDataSap2.Gvctabono = oModelDataGlobal.inputCuentaAbono; //CUENTA ABONO
			oDataSap2.Gvcomision = (oModelDataGlobal.inputComision === "") ? "0.0" : oModelDataGlobal.inputComision; //COMISION
			//*****************************************////////

			oBody.Im_Zfir107For_05Set.push(oDataSap2);
			sap.ui.core.BusyIndicator.show(0);
			//	ServiceH2HModel.create("/Im_FIR107_CabeceraSet",
			ServiceH2HModel.create("/Im_CabZfir107_CabSet",
				oBody, {
					success: function (oResult2) {
						sap.ui.core.BusyIndicator.hide();
						self._onCreateMessageView(oResult2);
						//MessageBox.success(self.getI18nText("txtSuccess"));
						console.log(oResult2);
					},
					error: function (oError2) {
						sap.ui.core.BusyIndicator.hide();
						// MessageBox.error(self.getI18nText("txtErrorOData"));
						//MessageBox.error(oError2.responseText);
						console.log(oError2)
					}
				})

			/*	},
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
					// MessageBox.error(self.getI18nText("txtErrorOData"));
					//MessageBox.error(oError.responseText);
					console.log(oError);
				}
			});*/
		},
		fnbutton4: function (Accion, oModelDataGlobal) {
			var ServiceH2HModel = this.getOwnerComponent().getModel("ServiceH2HModel");
			var query = "/Im_107_ButSet";
			var self = this;
			/*			sap.ui.core.BusyIndicator.show(0);
						ServiceH2HModel.read(query, {
							success: function (oResult) {
								sap.ui.core.BusyIndicator.hide();*/
			/*		var buttons = oResult.results;
					var CodButo = "";
					for (var i = 1; i < 8; i++) {
						if (i == sFragmentGlobal) {
							CodButo = buttons[i - 1].Tpgdes;
						}
					}*/

			var oBody = {
				"Bukrs": oModelDataGlobal.InpSociedad,
				"Accion": Accion,
				"Tpgdes": "BUT4",
				"Formss": "",
				"Username": "",
				/*	"Im_FIR107_FieldInput2Set": [],
					"Im_FIR107_ClaveBancoPropioSet": [],
					"Im_FIR107_CtasInterbancSet": [],
					"Im_FIR107_CtasDepositSet": [],
					"Im_FIR107_MantProveedSet": [],
					"Im_FIR107_BinnSet": []*/
				"Im_Zfir107Bin_07Set": [],
				"Im_Zfir107Cbp_01Set": [],
				"Im_Zfir107Cdp_02Set": [],
				"Im_Zfir107Cib_04Set": [],
				"Im_Zfir107For_05Set": [],
				"Im_Zfir107Mdp_03Set": [],
				"Im_Zfir107Mtp_06Set": [],
				"Im_Zfir107Log_08Set": [],
				"ImZfir107FacturasExtSet": []
			};

			var oDataSap2 = self.dataSap2();

			//AGREGO LOS DATOS DEL FORMULARIO/////////////////
			oDataSap2.Gvbukrs = oModelDataGlobal.InpSociedad; //SOCIEDAD
			oDataSap2.Gvprov = oModelDataGlobal.inputProveedor; // PROVEEDOR
			oDataSap2.Gvimporte = oModelDataGlobal.InpImporte; // IMPORTE
			oDataSap2.Gvfecrg = (oModelDataGlobal.InpFecRegistro === "") ? null : oModelDataGlobal.InpFecRegistro; //FECHA REGISTRO
			oDataSap2.Gvfeccnt = (oModelDataGlobal.InpFecConta === "") ? null : oModelDataGlobal.InpFecConta; //FECHA CONTABILIZACION
			oDataSap2.Gvxliq = oModelDataGlobal.inputCodLiq; //CODIGO LIQUIDACION
			oDataSap2.Gvbanklo = oModelDataGlobal.inputClaBanOrigen; //CLAVE BANCO ORIGEN
			oDataSap2.Gvctacargo = oModelDataGlobal.InpCuentaCargo; // CUENTA CARGO
			oDataSap2.Gvbukrsben = oModelDataGlobal.inputSocBen; //SOCIEDAD BENEFICIARIA
			oDataSap2.Gvxland1 = oModelDataGlobal.inputPais; //PAIS
			oDataSap2.Gvxcif = oModelDataGlobal.inputCIF; // CIF
			oDataSap2.Gvxbcofinal = oModelDataGlobal.inputBanFinal; //BANCO FINAL
			oDataSap2.Gvxctafinal = oModelDataGlobal.inputNCuen; //NUMERO CUENTA
			oDataSap2.Gvxiban = oModelDataGlobal.inputIBAN; //IBAN
			oDataSap2.Gvxswiftbic = oModelDataGlobal.inputSwiftBic; //Swift o BIC
			oDataSap2.Gvxaba = oModelDataGlobal.inputABA; //ABA
			oDataSap2.Gvxbcointer = oModelDataGlobal.inputBanIntermediario; //BANCO INTERMEDIARIO
			oDataSap2.Gvxctainter = oModelDataGlobal.inputCuentaIntermediario; //CUENTA INTERMEDIARIO
			oDataSap2.Gvxswiftinter = oModelDataGlobal.inputSwiftIntermediario; //SWIFT INTERMEDIARIO
			//*****************************************////////

			oBody.Im_Zfir107For_05Set.push(oDataSap2);

			//ServiceH2HModel.create("/Im_FIR107_CabeceraSet",
			sap.ui.core.BusyIndicator.show(0);
			ServiceH2HModel.create("/Im_CabZfir107_CabSet",
				oBody, {
					success: function (oResult2) {
						sap.ui.core.BusyIndicator.hide();
						self._fnMostrarFacturas(oResult2);
						//self._onCreateMessageView(oResult2);
						//MessageBox.success(self.getI18nText("txtSuccess"));
						console.log(oResult2);
					},
					error: function (oError2) {
						sap.ui.core.BusyIndicator.hide();
						// MessageBox.error(self.getI18nText("txtErrorOData"));
						//MessageBox.error(oError2.responseText);
						console.log(oError2)
					}
				})

			/*			},
						error: function (oError) {
							sap.ui.core.BusyIndicator.hide();
							// MessageBox.error(self.getI18nText("txtErrorOData"));
							//MessageBox.error(oError.responseText);
							console.log(oError);
						}
					});*/
		},
		fnbutton5: function (Accion, oModelDataGlobal) {
			var ServiceH2HModel = this.getOwnerComponent().getModel("ServiceH2HModel");
			var query = "/Im_107_ButSet";
			var self = this;

			ServiceH2HModel.read(query, {
				success: function (oResult) {
					var buttons = oResult.results;
					var CodButo = "";
					for (var i = 1; i < 8; i++) {
						if (i == sFragmentGlobal) {
							CodButo = buttons[i - 1].Tpgdes;
						}
					}

					var oBody = {
						"Bukrs": oModelDataGlobal.InpSociedad,
						"Accion": Accion,
						"Tpgdes": CodButo,
						"Formss": "",
						"Username": "",
						/*	"Im_FIR107_FieldInput2Set": [],
							"Im_FIR107_ClaveBancoPropioSet": [],
							"Im_FIR107_CtasInterbancSet": [],
							"Im_FIR107_CtasDepositSet": [],
							"Im_FIR107_MantProveedSet": [],
							"Im_FIR107_BinnSet": []*/
						"Im_Zfir107Bin_07Set": [],
						"Im_Zfir107Cbp_01Set": [],
						"Im_Zfir107Cdp_02Set": [],
						"Im_Zfir107Cib_04Set": [],
						"Im_Zfir107For_05Set": [],
						"Im_Zfir107Mdp_03Set": [],
						"Im_Zfir107Mtp_06Set": [],
						"Im_Zfir107Log_08Set": []
					};

					var oDataSap2 = self.dataSap2();

					//AGREGO LOS DATOS DEL FORMULARIO/////////////////
					oDataSap2.Gvbukrs = oModelDataGlobal.InpSociedad; //SOCIEDAD
					oDataSap2.Gvremitente = oModelDataGlobal.InpAtte; //ATTE
					oDataSap2.Gvimporte = oModelDataGlobal.inputImportDolar; // IMPORTE DOLAR
					oDataSap2.Gvfecrg = (oModelDataGlobal.InpFecRegistro === "") ? null : oModelDataGlobal.InpFecRegistro; //FECHA REGISTRO
					oDataSap2.Gvfeccnt = (oModelDataGlobal.InpFecConta === "") ? null : oModelDataGlobal.InpFecConta; //FECHA CONTABILIZACION
					oDataSap2.Gvtc = oModelDataGlobal.inputTipCambio; //TIPO CAMBIO
					oDataSap2.Gvctvalor = oModelDataGlobal.inputContrValor; //CONTRA VALOR
					oDataSap2.Gvbanklo = oModelDataGlobal.inputClaBanOrigen; //CLAVE BANCO ORIGEN
					oDataSap2.Gvctacargo = oModelDataGlobal.InpCuentaCargo; // CUENTA CARGO
					oDataSap2.Gvbankld = oModelDataGlobal.inputClaBanDestino; //CLAVE BANCO DESTINO
					oDataSap2.Gvctabono = oModelDataGlobal.inputCuentaAbono; //CUENTA ABONO
					//*****************************************////////

					oBody.Im_Zfir107For_05Set.push(oDataSap2);

					//	ServiceH2HModel.create("/Im_FIR107_CabeceraSet",
					ServiceH2HModel.create("/Im_CabZfir107_CabSet",
						oBody, {
							success: function (oResult2) {
								self._onCreateMessageView(oResult2);
								//MessageBox.success(self.getI18nText("txtSuccess"));
								console.log(oResult2);
							},
							error: function (oError2) {
								// MessageBox.error(self.getI18nText("txtErrorOData"));
								//MessageBox.error(oError2.responseText);
								console.log(oError2)
							}
						})

				},
				error: function (oError) {
					// MessageBox.error(self.getI18nText("txtErrorOData"));
					//MessageBox.error(oError.responseText);
					console.log(oError);
				}
			});
		},
		fnbutton6: function (Accion, oModelDataGlobal) {
			var ServiceH2HModel = this.getOwnerComponent().getModel("ServiceH2HModel");
			var query = "/Im_107_ButSet";
			var self = this;

			ServiceH2HModel.read(query, {
				success: function (oResult) {
					var buttons = oResult.results;
					var CodButo = "";
					for (var i = 1; i < 8; i++) {
						if (i == sFragmentGlobal) {
							CodButo = buttons[i - 1].Tpgdes;
						}
					}

					var oBody = {
						"Bukrs": oModelDataGlobal.InpSociedad,
						"Accion": Accion,
						"Tpgdes": CodButo,
						"Formss": "",
						"Username": "",
						/*		"Im_FIR107_FieldInput2Set": [],
								"Im_FIR107_ClaveBancoPropioSet": [],
								"Im_FIR107_CtasInterbancSet": [],
								"Im_FIR107_CtasDepositSet": [],
								"Im_FIR107_MantProveedSet": [],
								"Im_FIR107_BinnSet": []*/
						"Im_Zfir107Bin_07Set": [],
						"Im_Zfir107Cbp_01Set": [],
						"Im_Zfir107Cdp_02Set": [],
						"Im_Zfir107Cib_04Set": [],
						"Im_Zfir107For_05Set": [],
						"Im_Zfir107Mdp_03Set": [],
						"Im_Zfir107Mtp_06Set": [],
						"Im_Zfir107Log_08Set": []
					};

					var oDataSap2 = self.dataSap2();

					//AGREGO LOS DATOS DEL FORMULARIO/////////////////
					oDataSap2.Gvbukrs = oModelDataGlobal.InpSociedad; //SOCIEDAD
					oDataSap2.Gvremitente = oModelDataGlobal.InpAtte; //ATTE
					oDataSap2.Gvimporte = oModelDataGlobal.InpImporte; // IMPORTE
					oDataSap2.Gvfecrg = (oModelDataGlobal.InpFecRegistro === "") ? null : oModelDataGlobal.InpFecRegistro; //FECHA REGISTRO
					oDataSap2.Gvfeccnt = (oModelDataGlobal.InpFecConta === "") ? null : oModelDataGlobal.InpFecConta; //FECHA CONTABILIZACION
					oDataSap2.Gvtc = oModelDataGlobal.inputTipCambio; //TIPO CAMBIO
					oDataSap2.Gvctvalor = oModelDataGlobal.inputContrValor; //CONTRA VALOR
					oDataSap2.Gvbanklo = oModelDataGlobal.inputClaBanOrigen; //CLAVE BANCO ORIGEN
					oDataSap2.Gvctacargo = oModelDataGlobal.InpCuentaCargo; // CUENTA CARGO
					oDataSap2.Gvbankld = oModelDataGlobal.inputClaBanDestino; //CLAVE BANCO DESTINO1
					oDataSap2.Gvctabono = oModelDataGlobal.inputCuentaAbono; //CUENTA ABONO
					oDataSap2.Gvxbcofinal = oModelDataGlobal.inputBancoDestino2; //BANCO DESTINO2
					oDataSap2.Gvcci = oModelDataGlobal.inputCuentaCCI; //CUENTA CCI

					//*****************************************////////

					oBody.Im_Zfir107For_05Set.push(oDataSap2);
					ServiceH2HModel.create("/Im_CabZfir107_CabSet",
						//ServiceH2HModel.create("/Im_FIR107_CabeceraSet",
						oBody, {
							success: function (oResult2) {
								self._onCreateMessageView(oResult2);
								//MessageBox.success(self.getI18nText("txtSuccess"));
								console.log(oResult2);
							},
							error: function (oError2) {
								// MessageBox.error(self.getI18nText("txtErrorOData"));
								//MessageBox.error(oError2.responseText);
								console.log(oError2)
							}
						})

				},
				error: function (oError) {
					// MessageBox.error(self.getI18nText("txtErrorOData"));
					//MessageBox.error(oError.responseText);
					console.log(oError);
				}
			});
		},
		fnbutton7: function (Accion, oModelDataGlobal) {
			var ServiceH2HModel = this.getOwnerComponent().getModel("ServiceH2HModel");
			var query = "/Im_107_ButSet";
			var self = this;

			ServiceH2HModel.read(query, {
				success: function (oResult) {
					var buttons = oResult.results;
					var CodButo = "";
					for (var i = 1; i < 8; i++) {
						if (i == sFragmentGlobal) {
							CodButo = buttons[i - 1].Tpgdes;
						}
					}

					var oBody = {
						"Bukrs": oModelDataGlobal.InpSociedad,
						"Accion": Accion,
						"Bottom": CodButo,
						/*	"Im_FIR107_FieldInput2Set": [],
							"Im_FIR107_ClaveBancoPropioSet": [],
							"Im_FIR107_CtasInterbancSet": [],
							"Im_FIR107_CtasDepositSet": [],
							"Im_FIR107_MantProveedSet": [],
							"Im_FIR107_BinnSet": []*/
						"Im_Zfir107Bin_07Set": [],
						"Im_Zfir107Cbp_01Set": [],
						"Im_Zfir107Cdp_02Set": [],
						"Im_Zfir107Cib_04Set": [],
						"Im_Zfir107For_05Set": [],
						"Im_Zfir107Mdp_03Set": [],
						"Im_Zfir107Mtp_06Set": [],
						"Im_Zfir107Log_08Set": []
					};

					var oDataSap2 = self.dataSap2();

					//AGREGO LOS DATOS DEL FORMULARIO/////////////////
					oDataSap2.Gvbukrs = oModelDataGlobal.InpSociedad; //SOCIEDAD
					oDataSap2.Gvprov = oModelDataGlobal.inputProveedor; // PROVEEDOR
					oDataSap2.Gvxname1 = oModelDataGlobal.inputPortador; // PORTADOR
					oDataSap2.Gvdni = oModelDataGlobal.inputDNI; //DNI
					oDataSap2.Gvimporte = oModelDataGlobal.InpImporte; // IMPORTE
					oDataSap2.Gvfecrg = (oModelDataGlobal.InpFecRegistro === "") ? null : oModelDataGlobal.InpFecRegistro; //FECHA REGISTRO
					oDataSap2.Gvfeccnt = (oModelDataGlobal.InpFecConta === "") ? null : oModelDataGlobal.InpFecConta; //FECHA CONTABILIZACION
					oDataSap2.Gvtc = oModelDataGlobal.inputTipCambio; //TIPO CAMBIO
					oDataSap2.Gvctvalor = oModelDataGlobal.inputContrValor; //CONTRA VALOR
					oDataSap2.Gvbanklo = oModelDataGlobal.inputClaBanCargar; //CLAVE BANCO CARGAR
					oDataSap2.Gvctacargo = oModelDataGlobal.InpCuentaCargo; // CUENTA CARGO

					//*****************************************////////

					oBody.Im_Zfir107For_05Set.push(oDataSap2);
					ServiceH2HModel.create("/Im_CabZfir107_CabSet",
						//	ServiceH2HModel.create("/Im_FIR107_CabeceraSet",
						oBody, {
							success: function (oResult2) {
								self._onCreateMessageView(oResult2);
								//MessageBox.success(self.getI18nText("txtSuccess"));
								console.log(oResult2);
							},
							error: function (oError2) {
								// MessageBox.error(self.getI18nText("txtErrorOData"));
								//MessageBox.error(oError2.responseText);
								console.log(oError2)
							}
						})

				},
				error: function (oError) {
					// MessageBox.error(self.getI18nText("txtErrorOData"));
					//MessageBox.error(oError.responseText);
					console.log(oError);
				}
			});
		},

		dataSap2: function () {
			var oJson2 = {
				"Gvbukrs": "",
				"Gvruc": "",
				"Gvremitente": "",
				"Gvwaers": "",
				"Gvimporte": "0.0",
				"Gvcapint": "0.0",
				"Gvplazo": "",
				"Gvbanklo": "",
				"Gvbankld": "",
				"Gvbukrsben": "",
				"Gvtc": "0.0",
				"Gvref": "",
				"Gvcomision": "0.0",
				"Gvctadepos": "",
				"Gvinteres": "0.0",
				"Gvtasa": "0.0",
				"Gvcci": "",
				"Gvctacargo": "",
				"Gvctabono": "",
				"GcRad5": "",
				"GcRad2": "",
				"Gvcta2": "",
				"Gvbco2": "",
				"Gvimp2": "0.0",
				"Gvimp1": "0.0",
				"Gvctvalor": "0.0",
				"Gvdni": "",
				"Gvprov": "",
				"GcHkont1": "",
				"GcHkont2": "",
				"GcHkont3": "",
				"Gvnomprov": "",
				"Gvxland1": "",
				"Gvxname1": "",
				"Gvxrbancinter": "",
				"Gvxbcointer": "",
				"Gvxswiftinter": "",
				"Gvxctainter": "",
				"Gvxbcofinal": "",
				"Gvxctafinal": "",
				"Gvxswiftbic": "",
				"Gvxaba": "",
				"Gvxiban": "",
				"Gvxcif": "",
				"Gvxliq": "",
				"Gvfecrg": null, //fecRegistro
				"Gvfeccnt": null, //FecContabilizacion
				"GpBelnr": "",
				"GpGjahr": "",
				"Gvfecap": null,
				"Gvfecvenc": null
			};
			return oJson2;
		},
		dataSap: function () {
			var oDataSap = {
				"Action": "",
				"Bottom": "",
				"Switch": "",
				"Dolares": "",
				"Pagos": "",
				"Bukrs": "0011",
				"Provee": "",
				"Dprove": "",
				"Ruc": "",
				"Referencia": "",
				"Dni": "",
				"Importe": "",
				"Fecregist": "",
				"Feccontab": "",
				"Waers": "",
				"Codliquid": "",
				"Tipocambio": "",
				"Contravalor": "",
				"Banklo": "",
				"Cuentacargo": "",
				"Bukrsbenef": "",
				"Bankld": "",
				"Bankdest": "",
				"Cuentabono": "",
				"Cuentacci": "",
				"Imp1": "",
				"Imp2": "",
				"Cuentadeposito": "",
				"Cuentaccidespo": "",
				"Fecapertura": "",
				"Plazodias": "",
				"Fecvencimie": "",
				"Tasa": "",
				"Intereses": "",
				"Comision": "",
				"Remuneracion": "",
				"Motivotransp": "",
				"Pais": "",
				"Cif": "",
				"Bancofinal": "",
				"Cuentafinal": "",
				"Iban": "",
				"Swift": "",
				"Aba": "",
				"Bancointerm": "",
				"Cuentainterm": "",
				"Swiftinterm": ""
			};
			return oDataSap;
		},
		onOpeningFragmentVisulaizarCartaVista: function () {
			let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.fragments.VisulaizarCartaVista", this);
			this.getView().addDependent(oFragment);
			oFragment.open();
		},
		onOpeningFragmentImprimirCartaVista: function () {
			let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.fragments.ImprimirCartaVista", this);
			this.getView().addDependent(oFragment);
			oFragment.open();
		},
		onOpeningFragmentGenerarAsientoVista: function () {
			let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.fragments.GenerarAsientoVista", this);
			this.getView().addDependent(oFragment);
			oFragment.open();
		},
		openFragmentMantProv: function () {

			let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.fragments.ManProvExt", this);
			this.getView().addDependent(oFragment);

			let oModelOdata = this.getOwnerComponent().getModel("ServiceH2HModel");
			let oStProveedores = this._byId("stProveedores");
			oStProveedores.setModel(oModelOdata);

			oFragment.open();
		},
		openFragmentMantCtaInt: function () {
			let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.fragments.CCI", this);
			this.getView().addDependent(oFragment);

			let oModelOdata = this.getOwnerComponent().getModel("ServiceH2HModel");
			let oStProveedores = this._byId("stCCI");
			oStProveedores.setModel(oModelOdata);

			oFragment.open();

		},
		openFragmentDepositos: function () {

			let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.fragments.Depositos", this);
			this.getView().addDependent(oFragment);

			let oModelOdata = this.getOwnerComponent().getModel("ServiceH2HModel");
			let oStProveedores = this._byId("stDepoPlazo");
			oStProveedores.setModel(oModelOdata);

			oFragment.open();

		},
		_onChangeDateRangeSelection: function () {
			var self = this;
			self.getView().getModel("TablaContDepPlazo").setProperty("/StatefechaContab", "None");
		},

		openAcreedores: function (oEvent) {
			let aPromise = [];
			let sBukrs = this.getView().getModel("oModelDataGlobal").getData().InpSociedad;

			if (!sBukrs || !sBukrs.trim().length) {
				//validacionSociedad
				MessageBox.information(this.getI18nText("validacionSociedad"));
				return false;
			}

			if (!this._oProveedorSelectDialog) {
				this._oProveedorSelectDialog = sap.ui.xmlfragment(
					"com.centria.CartaPreregistro.view.fragments.Acreedor",
					this);
				this.getView().addDependent(this._oProveedorSelectDialog);
			}

			let oTable = this._byId("tbsProveedor");
			let oBinding = oTable.getBinding("items");
			oBinding.filter([new Filter("Companycode", FilterOperator.EQ, sBukrs)]);

			this._oProveedorSelectDialog.open();

		},

		onAddProveedor: function (oEvent) {
			let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.dialogs.ProveedorFormulario", this);
			this.getView().addDependent(oFragment);

			let oModelOdata = this.getOwnerComponent().getModel("ServiceH2HModel");

			let oModelEditForm = this.getView().getModel("oModelEditForm");
			oModelEditForm.setProperty("/editable", true);

			let oDialogProveedor = this._byId("dialogProveedor");
			let oForm = this._byId("fmProveedor");
			oDialogProveedor.setTitle("Nuevo Proveedor Externo");
			oForm.setModel(oModelOdata);
			let oNewEntryContext = oModelOdata.createEntry("/ProveedorExternoSet");
			oForm.setBindingContext(oNewEntryContext);

			oFragment.open();
		},

		onEditProveedor: function (oEvent) {
			//Verificar selección de registros
			let oTabla = this._byId("stProveedores").getTable();
			let oSlectedItem = oTabla.getSelectedItem();

			if (!oSlectedItem) {
				MessageBox.information("Debe seleccionar un registro");
				return false;
			}

			let oSelectedContext = oSlectedItem.getBindingContext();

			let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.dialogs.ProveedorFormulario", this);
			this.getView().addDependent(oFragment);

			let oModelOdata = this.getOwnerComponent().getModel("ServiceH2HModel");

			let oModelEditForm = this.getView().getModel("oModelEditForm");
			oModelEditForm.setProperty("/editable", false);

			let oDialogProveedor = this._byId("dialogProveedor");
			let oForm = this._byId("fmProveedor");
			oDialogProveedor.setTitle("Editar Proveedor Externo");
			oForm.setModel(oModelOdata);

			oForm.setBindingContext(oSelectedContext);

			oFragment.open();
		},

		_fnCheckRespuesta: function (aRespuestas) {
			let bTodoOk = true;
			for (let i = 0; i < aRespuestas.length; i++) {
				let oRespuesta = aRespuestas[i];
				if (oRespuesta.message === "HTTP request failed") {
					bTodoOk = false;
					break;
				}
			}

			return bTodoOk;
		},

		onLiveChangeInput: function (oEvent) {
			let oInput = oEvent.getSource();
			oInput.setValueState("None");
		},

		onDeleteProveedor: function (oEvent) {
			let that = this;
			let oSmartTable = sap.ui.getCore().byId("stProveedores");
			let oTable = oSmartTable.getTable();
			let oItemSelected = oTable.getSelectedItem();

			if (oItemSelected) {
				let oContext = oItemSelected.getBindingContext();
				let sPath = oContext.getPath();
				let oAcreedor = oContext.getObject();

				MessageBox.show(
					"¿Desea eliminar el proveedor " + oAcreedor.Lifnr + "-" + oAcreedor.Name1 + " ?", {
						icon: sap.m.MessageBox.Icon.INFORMATION,
						title: "Eliminar Provededor",
						actions: ['Sí', 'Cancelar'],
						onClose: async function (sActionClicked) {
							if (sActionClicked === 'Sí') {
								let oEliminarRpta = await that.oDataService.eliminarEntidadSAP(sPath);

								oSmartTable.rebindTable();
								MessageBox.success("Registro eliminado correctamente");

							}
						}
					}
				);

			} else {
				MessageBox.information("Debe seleccionar un registro");
			}

		},

		onProveedorSearch: function (oEvent) {
			let sValue = oEvent.getParameter("value");
			let sBukrs = this.getView().getModel("oModelDataGlobal").getData().InpSociedad;
			let aFiltros = [new Filter("Supplier", FilterOperator.Contains, sValue),
				new Filter("Suppliername", FilterOperator.Contains, sValue),
				new Filter("Taxnumber1", FilterOperator.Contains, sValue)
			];

			let oFilter = new Filter({
				filters: aFiltros,
				and: false
			});
			let oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter, new Filter("Companycode", FilterOperator.EQ, sBukrs)]);
		},

		onAcreedorValueHelpOkPress: function (oEvent) {
			let oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([]);

			let aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				let oProveedor = aContexts[0].getObject();
				let oModelDataGlobal = this._oProveedorSelectDialog.getModel("oModelDataGlobal");

				if (sFragmentGlobal === "4" || sFragmentGlobal === "7") {
					if (oModelDataGlobal) {
						oModelDataGlobal.setProperty("/inputProveedor", oProveedor.Supplier);
					}
				}

			}

		},
		openFragmentAcreedores: function (oEvent) {
			Busy.show();
			let oMatchModel = this.getView().getModel("MatchModel");
			var oModelDataGlobal = this.getView().getModel("oModelDataGlobal").getData();
			if (oModelDataGlobal.InpSociedad) {
				this.openAcreedores().then((result) => {
					let aCols = this.oColModelAcreedor.getData().cols;
					this._oBasicSearchField = new SearchField({
						showSearchButton: false
					});
					this._oValueHelpDialog = sap.ui.xmlfragment(
						"com.centria.CartaPreregistro.view.fragments.Acreedor", this);
					this.getView().addDependent(this._oValueHelpDialog);

					this._oValueHelpDialog.setRangeKeyFields([{
						label: "Código",
						key: "Lifnr",
						type: "string",
						typeInstance: new typeString({}, {
							maxLength: 20
						})
					}]);

					var oFilterBar = this._oValueHelpDialog.getFilterBar();
					oFilterBar.setFilterBarExpanded(false);
					oFilterBar.setBasicSearch(this._oBasicSearchField);

					this._oValueHelpDialog.getTableAsync().then(function (oTable) {
						oTable.setModel(oMatchModel);
						oTable.setModel(this.oColModelAcreedor, "columns");

						if (oTable.bindRows) {
							oTable.bindAggregation("rows", "MatchModel>/acreedores");
						}

						if (oTable.bindItems) {
							oTable.bindAggregation("items", "MatchModel>/acreedores", function () {
								return new ColumnListItem({
									cells: aCols.map(function (column) {
										return new Label({
											text: "{" + column.template + "}"
										});
									})
								});
							});
						}

						this._oValueHelpDialog.update();
						Busy.hide();
					}.bind(this));
					this._oAcreedorInput = this._byId("idInputAcreedor" + sFragmentGlobal);
					this._oValueHelpDialog.setTokens(this._oAcreedorInput.getTokens());
					this._oValueHelpDialog.open();
				});
			} else {
				MessageBox.error("Debe seleccionar una sociedad previamente");
				Busy.hide();
			}

		},
		_onCreateMessageView: function (amensajes) {
			var that = this;
			/*	var oLink = new Link({
					text: "Show more information",
					href: "http://sap.com",
					target: "_blank"
				});*/

			var oMessageTemplate = new sap.m.MessageItem({
				type: '{type}',
				title: '{title}',
				description: '{description}',
				subtitle: '{subtitle}',
				counter: '{counter}'

			});
			var aMockMessages = [];
			amensajes.Im_Zfir107Log_08Set.results.forEach(function (obj) {
				if (obj.Type === "E") {
					obj.title = "Error Mensaje";
					obj.Type = "Error";
				} else if (obj.Type === "W") {
					obj.title = "Advertencia Mensaje";
					obj.Type = "Warning";
				} else {
					obj.title = "Exitoso Mensaje";
					obj.Type = "Success";
				}
				var oMessage = {
					type: obj.Type,
					title: obj.Message,
					description: obj.Message,
					subtitle: obj.MessageV1,
					counter: 1
				}

				aMockMessages.push(oMessage);
			})

			var oModel = new JSONModel(),
				that = this;

			oModel.setData(aMockMessages);

			this.oMessageView = new sap.m.MessageView({
				showDetailsPageHeader: false,
				itemSelect: function () {
					oBackButton.setVisible(true);
				},
				items: {
					path: "/",
					template: oMessageTemplate
				}
			});
			var oBackButton = new sap.m.Button({
				icon: "sap-icon://nav-back",
				visible: false,
				press: function () {
					that.oMessageView.navigateBack();
					if (that._oPopover) {
						that._oPopover.focus();
					}
					this.setVisible(false);
				}
			});

			this.oMessageView.setModel(oModel);

			var oCloseButton = new sap.m.Button({
					text: "Close",
					press: function () {
						that._oPopover.close();

					}
				}),
				oPopoverFooter = new sap.m.Bar({
					contentRight: oCloseButton
				}),
				oPopoverBar = new sap.m.Bar({
					contentLeft: [oBackButton],
					contentMiddle: [
						new Text({
							text: "Messages"
						})
					]
				});

			/*	this._oPopover = new sap.m.Popover({
					customHeader: oPopoverBar,
					contentWidth: "600px",
					contentHeight: "600px",
					verticalScrolling: false,
					modal: false,
					placement: "VerticalPreferredBottom",
					resizable:true,
					class: "sapUiPopupWithPadding",
					content: [this.oMessageView],
					footer: oPopoverFooter
				});*/
			this.oDialogMessage = new sap.m.Dialog({
				resizable: true,
				content: this.oMessageView,
				beginButton: new sap.m.Button({
					press: function () {
						if (amensajes.Im_Zfir107Bin_07Set.results.length > 0) {
							that._onGenerarPDF(amensajes.Im_Zfir107Bin_07Set.results);
						}

						this.getParent().close();
					},
					text: "Close"
				}),
				customHeader: new sap.m.Bar({
					contentMiddle: [
						new sap.m.Text({
							text: "Log"
						})
					],
					contentLeft: [oBackButton]
				}),
				contentHeight: "35%",
				contentWidth: "35%",
				verticalScrolling: false
			});
			this.oMessageView.navigateBack();
			//this._oPopover.openBy(oEvent);
			this.oDialogMessage.open();
		},
		createUrlForPDF: function (sBase64) {
			var that = this;
			if (sBase64 === "") {
				MessageBox.error(that.getI18nText("txtNoData"));
				return;
			}
			var sDecodedPdfContent = atob(sBase64);
			var byteArray = new Uint8Array(sDecodedPdfContent.length);
			for (var i = 0; i < sDecodedPdfContent.length; i++) {
				byteArray[i] = sDecodedPdfContent.charCodeAt(i);
			}
			var blob = new Blob([byteArray.buffer], {
				type: "application/pdf"
			});
			var url = URL.createObjectURL(blob);

			jQuery.sap.addUrlWhitelist("BLOB");

			return url;
		},
		_onGenerarPDF: function (PDF) {

			let sFragmentName = "com.centria.CartaPreregistro.view.fragments.VisorPDF";
			let oFragment = sap.ui.xmlfragment(sFragmentName, this);

			// oFragmentContainer.destroyFields();
			// oFragmentContainer.addField(oFragment);
			if (oFragment.length !== 0) {
				this.getView().addDependent(oFragment);
			}
			//aFragmentModel.refresh(true);
			var oPdf = {};
			//	oDesglosePropuesta.PDF = oResult.Pagos_Doc_PdfSet.results;
			oPdf.Source = this.createUrlForPDF(PDF[0].Zform);
			oPdf.Height = "800px";
			oPdf.Title = "";
			this.getView().setModel(new JSONModel(oPdf), "oModelPDF");
			sap.ui.core.BusyIndicator.show(1000);
			sap.ui.core.BusyIndicator.hide();
			oFragment.open();
		},

		//////////////////////////////////////////////////////////////////////////////////////////////////
		//ARRL - 04.08.2021
		onOpenPDFDialog: function (oEvent) {
			//if (!this._oPDFDialog) {
			this._oPDFDialog = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.dialogs.DescargaPDF",
				this);
			this.getView().addDependent(this._oPDFDialog);
			//}

			let sFragmentoFinal;
			if (sFragmentGlobal === "4") {
				sFragmentoFinal = "9";
			} else {
				sFragmentoFinal = sFragmentGlobal;
			}

			let oModelPropPDF = new JSONModel({
				Botonopc: sFragmentoFinal
			});
			this._oPDFDialog.setModel(oModelPropPDF, "oModelPropPDF");
			this._oPDFDialog.open();
		},

		onMostrarPDF: async function (oEvent) {
			let oModelPropPDF = this._oPDFDialog.getModel("oModelPropPDF");
			let oPropuesta = oModelPropPDF.getData();

			if (!oPropuesta.Bukrs || !oPropuesta.Bukrs.length || !oPropuesta.Laufi || !oPropuesta.Laufi.length || !oPropuesta.Laufd) {
				MessageBox.error("Debe completar los campos obligatorios");
			}

			oPropuesta.Botonopc = "BUT" + oPropuesta.Botonopc;
			oPropuesta.Bukrs = oPropuesta.Bukrs.toUpperCase();
			oPropuesta.Laufi = oPropuesta.Laufi.toUpperCase();
			oPropuesta.Laufd = oPropuesta.Laufd.getDateWithoutTime();
			let aPDF = await this.oDataService.obtenerPDFCarta(oPropuesta);

			if (aPDF && aPDF.results && aPDF.results.length) {
				let oPDFData = aPDF.results;
				this._onGenerarPDF(oPDFData);
				this._oPDFDialog.close();
			}

		},

		onAutoCompletar: async function (oEvent) {
			let oModelDataGlobal = this.getView().getModel("oModelDataGlobal");
			let sFragmentoActual, oCarta;

			if (sFragmentGlobal !== "4") {
				sFragmentoActual = sFragmentGlobal;

				oCarta = {
					Botonopc: "BUT" + sFragmentoActual,
					Bukrs: oModelDataGlobal.getProperty("/InpSociedad"),
					Bankl: oModelDataGlobal.getProperty("/inputClaBanOrigen"),
					Bukrsben: oModelDataGlobal.getProperty("/inputSocBen"),
					Banklben: oModelDataGlobal.getProperty("/inputClaBanDestino")
				};
			} else {
				sFragmentoActual = "9";

				oCarta = {
					Botonopc: "BUT" + sFragmentoActual,
					Bukrs: oModelDataGlobal.getProperty("/InpSociedad"),
					Bankl: oModelDataGlobal.getProperty("/inputClaBanOrigen"),
					Gvprov: oModelDataGlobal.getProperty("/inputProveedor")
				};
			}

			let aCampos = await this.oDataService.fnAutocompletarCampos(oCarta, sFragmentoActual);

			if (aCampos && aCampos.results && aCampos.results.length) {
				let oCampos = aCampos.results[0];
				//	debugger;
				oModelDataGlobal.setProperty("/InpCuentaCargo", oCampos.Ctacargo);
				oModelDataGlobal.setProperty("/inputCuentaInterbancaria", oCampos.Ctacci);
				oModelDataGlobal.setProperty("/inputCuentaAbono", oCampos.Ctaabono);
				oModelDataGlobal.setProperty("/Gvnomprov", oCampos.Gvnomprov);
				oModelDataGlobal.setProperty("/inputABA", oCampos.Gvxaba);
				oModelDataGlobal.setProperty("/inputBanFinal", oCampos.Gvxbcofinal);
				oModelDataGlobal.setProperty("/inputBanIntermediario", oCampos.Gvxbcointer);
				oModelDataGlobal.setProperty("/inputCIF", oCampos.Gvxcif);
				oModelDataGlobal.setProperty("/inputNCuen", oCampos.Gvxctafinal);
				oModelDataGlobal.setProperty("/inputCuentaIntermediario", oCampos.Gvxctainter);
				oModelDataGlobal.setProperty("/inputIBAN", oCampos.Gvxiban);
				oModelDataGlobal.setProperty("/inputPais", oCampos.Gvxland1);
				//oModelDataGlobal.setProperty("/inputPais", oCampos.Gvxname1);
				oModelDataGlobal.setProperty("/inputSwiftBic", oCampos.Gvxswiftbic);
				oModelDataGlobal.setProperty("/inputSwiftIntermediario", oCampos.Gvxswiftinter);
			}

		},

		_fnMostrarFacturas: function (pData) {
			let aFacturas = pData.ImZfir107FacturasExtSet;
			if (aFacturas && aFacturas.results && aFacturas.results.length) {
				let oModelRespuesta = new JSONModel(pData);
				this.getView().setModel(oModelRespuesta, "oModelRespuesta");

				//Calcular totales
				let fDmbtr = 0,
					fWrbtr = 0;
				for (let i = 0; i < aFacturas.results.length; i++) {
					let oFactura = aFacturas.results[i];
					fDmbtr += parseFloat(oFactura.Dmbtr);
					fWrbtr += parseFloat(oFactura.Wrbtr);
				}

				let oModelTotal = new JSONModel({
					Dmbtr: fDmbtr,
					Wrbtr: fWrbtr
				});
				this.getView().setModel(oModelTotal, "oModelTotal");

				this._oFacturasDialog = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.dialogs.Facturas",
					this);
				this.getView().addDependent(this._oFacturasDialog);
				this._oFacturasDialog.open();

			}
		},

		onGenerarTransExt: function (oEvent) {
			let that = this;
			let ServiceH2HModel = this.getOwnerComponent().getModel("ServiceH2HModel");
			let oTbFacturasExt = this._byId("tbFacturasExt");
			let aFacturas = oTbFacturasExt.getSelectedItems();

			if (!aFacturas.length) {
				MessageBox.error("Debe seleccionar al menos una factura");
				return false;
			}

			let aFacturasData = [];

			for (let i = 0; i < aFacturas.length; i++) {
				let oBindingContext = aFacturas[i].getBindingContext("oModelRespuesta");
				if (oBindingContext) {
					let oFactura = oBindingContext.getObject();
					oFactura.Opc = "X";
					aFacturasData.push(oFactura);
				}
			}

			let oModelRespuesta = this.getView().getModel("oModelRespuesta");
			let oData = oModelRespuesta.getData();

			oData.Accion = "GENECAREXT";
			oData.Im_Zfir107Bin_07Set = [];
			oData.Im_Zfir107Cbp_01Set = [];
			oData.Im_Zfir107Cdp_02Set = [];
			oData.Im_Zfir107Cib_04Set = [];
			oData.Im_Zfir107For_05Set = oData.Im_Zfir107For_05Set.results;
			oData.Im_Zfir107Mdp_03Set = [];
			oData.Im_Zfir107Mtp_06Set = [];
			oData.Im_Zfir107Log_08Set = [];
			oData.ImZfir107FacturasExtSet = aFacturasData;

			sap.ui.core.BusyIndicator.show(0);
			ServiceH2HModel.create("/Im_CabZfir107_CabSet",
				oData, {
					success: function (oResult2) {
						sap.ui.core.BusyIndicator.hide();
						if (that._oFacturasDialog) {
							that._oFacturasDialog.destroy();
						}
						that._onCreateMessageView(oResult2);
						//MessageBox.success(self.getI18nText("txtSuccess"));
						console.log(oResult2);
					},
					error: function (oError2) {
						sap.ui.core.BusyIndicator.hide();
						// MessageBox.error(self.getI18nText("txtErrorOData"));
						//MessageBox.error(oError2.responseText);
						console.log(oError2)
					}
				})

		},

		onRefreshTabla: function (oEvent) {
			let oSmartTable = oEvent.getSource().getParent().getParent();
			oSmartTable.rebindTable();
		},

		onAddCCI: function (oEvent) {
			let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.dialogs.CCIFormulario", this);
			this.getView().addDependent(oFragment);

			let oModelOdata = this.getOwnerComponent().getModel("ServiceH2HModel");

			let oModelEditForm = this.getView().getModel("oModelEditForm");
			oModelEditForm.setProperty("/editable", true);

			let oDialog = this._byId("dialogCCI");
			let oForm = this._byId("fmCCI");
			oDialog.setTitle("Nueva Cta. Interbancaria");
			oForm.setModel(oModelOdata);
			let oNewEntryContext = oModelOdata.createEntry("/CuentaInterbancariaSet");
			oForm.setBindingContext(oNewEntryContext);

			oFragment.open();
		},

		onEditCCI: function (oEvent) {
			//Verificar selección de registros
			let oTabla = this._byId("stCCI").getTable();
			let oSlectedItem = oTabla.getSelectedItem();

			if (!oSlectedItem) {
				MessageBox.information("Debe seleccionar un registro");
				return false;
			}

			let oSelectedContext = oSlectedItem.getBindingContext();

			let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.dialogs.CCIFormulario", this);
			this.getView().addDependent(oFragment);

			let oModelOdata = this.getOwnerComponent().getModel("ServiceH2HModel");

			let oModelEditForm = this.getView().getModel("oModelEditForm");
			oModelEditForm.setProperty("/editable", false);

			let oDialog = this._byId("dialogCCI");
			let oForm = this._byId("fmCCI");
			oDialog.setTitle("Editar Cta. Interbancaria");
			oForm.setModel(oModelOdata);

			oForm.setBindingContext(oSelectedContext);

			oFragment.open();
		},

		onDeleteCCI: function (oEvent) {
			let that = this;
			let oSmartTable = sap.ui.getCore().byId("stCCI");
			let oTable = oSmartTable.getTable();
			let oItemSelected = oTable.getSelectedItem();

			if (oItemSelected) {
				let oContext = oItemSelected.getBindingContext();
				let sPath = oContext.getPath();
				let oCCI = oContext.getObject();

				MessageBox.show(
					"¿Desea eliminar la cuenta " + oCCI.Bukrs + "-" + oCCI.Hbkid + "-" + oCCI.Bankni + " ?", {
						icon: sap.m.MessageBox.Icon.INFORMATION,
						title: "Eliminar Cta. Interbancaria",
						actions: ['Sí', 'Cancelar'],
						onClose: async function (sActionClicked) {
							if (sActionClicked === 'Sí') {
								let oEliminarRpta = await that.oDataService.eliminarEntidadSAP(sPath);

								oSmartTable.rebindTable();
								MessageBox.success("Registro eliminado correctamente");

							}
						}
					}
				);

			} else {
				MessageBox.information("Debe seleccionar un registro");
			}

		},

		onAddDeposito: function (oEvent) {
			let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.dialogs.DepositoFormulario", this);
			this.getView().addDependent(oFragment);

			let oModelOdata = this.getOwnerComponent().getModel("ServiceH2HModel");

			let oModelEditForm = this.getView().getModel("oModelEditForm");
			oModelEditForm.setProperty("/editable", true);

			let oDialog = this._byId("dialogDeposito");
			let oForm = this._byId("fmDeposito");
			oDialog.setTitle("Nueva Cta. Depósito");
			oForm.setModel(oModelOdata);
			let oNewEntryContext = oModelOdata.createEntry("/CuentaDepPlazoSet");
			oForm.setBindingContext(oNewEntryContext);

			oFragment.open();
		},

		onEditDeposito: function (oEvent) {
			//Verificar selección de registros
			let oTabla = this._byId("stDepoPlazo").getTable();
			let oSlectedItem = oTabla.getSelectedItem();

			if (!oSlectedItem) {
				MessageBox.information("Debe seleccionar un registro");
				return false;
			}

			let oSelectedContext = oSlectedItem.getBindingContext();

			let oFragment = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.dialogs.DepositoFormulario", this);
			this.getView().addDependent(oFragment);

			let oModelOdata = this.getOwnerComponent().getModel("ServiceH2HModel");

			let oModelEditForm = this.getView().getModel("oModelEditForm");
			oModelEditForm.setProperty("/editable", false);

			let oDialog = this._byId("dialogDeposito");
			let oForm = this._byId("fmDeposito");
			oDialog.setTitle("Editar Cta. Depósito");
			oForm.setModel(oModelOdata);

			oForm.setBindingContext(oSelectedContext);

			oFragment.open();
		},

		onDeleteDeposito: function (oEvent) {
			let that = this;
			let oSmartTable = sap.ui.getCore().byId("stDepoPlazo");
			let oTable = oSmartTable.getTable();
			let oItemSelected = oTable.getSelectedItem();

			if (oItemSelected) {
				let oContext = oItemSelected.getBindingContext();
				let sPath = oContext.getPath();
				let oCtaDep = oContext.getObject();

				MessageBox.show(
					"¿Desea eliminar la cuenta " + oCtaDep.Hkont + "-" + oCtaDep.Txt50 + "-" + oCtaDep.Bankl + " ?", {
						icon: sap.m.MessageBox.Icon.INFORMATION,
						title: "Eliminar Cta. Depósito",
						actions: ['Sí', 'Cancelar'],
						onClose: async function (sActionClicked) {
							if (sActionClicked === 'Sí') {
								let oEliminarRpta = await that.oDataService.eliminarEntidadSAP(sPath);

								oSmartTable.rebindTable();
								MessageBox.success("Registro eliminado correctamente");

							}
						}
					}
				);

			} else {
				MessageBox.information("Debe seleccionar un registro");
			}

		},

		closeFormMant: function (oEvent) {
			let oBoton = oEvent.getSource();
			let oDialog = oBoton.getParent();
			let sForm = oBoton.data("form");
			let oForm = this._byId(sForm);
			let oContext = oForm.getBindingContext();
			let oModelOdata = this.getOwnerComponent().getModel("ServiceH2HModel");

			oModelOdata.deleteCreatedEntry(oContext);
			oDialog.destroy();
		},

		onSaveEntidad: function (oEvent) {
			let that = this;
			let oBoton = oEvent.getSource();
			let sTabla = oBoton.data("tabla");
			let oDialog = oBoton.getParent();
			let oModelOdata = this.getOwnerComponent().getModel("ServiceH2HModel");
			let oSmartTable = this._byId(sTabla);
			Busy.show(0);
			oModelOdata.submitChanges({
				success: function (oData) {
					Busy.hide();

					let bTodoOk = that._fnCheckRespuesta(oData.__batchResponses);
					if (bTodoOk) {
						MessageBox.success("Operación exitosa");
						oSmartTable.rebindTable();
						oDialog.destroy();
					}

				}
			});

		},

		onRegularizarCarta: function (oEvent) {
			//if (!this._oPDFDialog) {
			this._oReguDialog = sap.ui.xmlfragment("com.centria.CartaPreregistro.view.dialogs.RegularizarCarta",
				this);
			this.getView().addDependent(this._oReguDialog);

			let oModelPropReg = new JSONModel({});
			this._oReguDialog.setModel(oModelPropReg, "oModelPropReg");
			this._oReguDialog.open();
		},

		onRegularizar: async function (oEvent) {
			let oModelPropReg = this._oReguDialog.getModel("oModelPropReg");
			let oPropReg = oModelPropReg.getData();

			if (!oPropReg.Bukrs || !oPropReg.Laufi || !oPropReg.Laufd || !oPropReg.Budat || !oPropReg.Importe) {
				MessageBox.error("Complete los campos obligatorios");
				return false;
			}

			let aFilters = [
				new Filter("Bukrs", "EQ", oPropReg.Bukrs.toUpperCase()),
				new Filter("Laufi", "EQ", oPropReg.Laufi.toUpperCase()),
				new Filter("Laufd", "EQ", oPropReg.Laufd),
				new Filter("Budat", "EQ", oPropReg.Budat),
				new Filter("Importe", "EQ", oPropReg.Importe.toString()),
				new Filter("Liquid", "EQ", oPropReg.Liquid)
			];

			let oProcesarRpta = await this.oDataService.readEntidadSAP("/ReguCartaExtZFIR107Set", aFilters);

			if (oProcesarRpta) {
				this._onCreateMessageViewAux(oProcesarRpta);
			}
		},

		_onCreateMessageViewAux: function (amensajes) {
			var that = this;
			/*	var oLink = new Link({
					text: "Show more information",
					href: "http://sap.com",
					target: "_blank"
				});*/

			var oMessageTemplate = new sap.m.MessageItem({
				type: '{type}',
				title: '{title}',
				description: '{description}',
				subtitle: '{subtitle}',
				counter: '{counter}'

			});
			var aMockMessages = [];
			amensajes.results.forEach(function (obj) {
				if (obj.Mtype === "E") {
					obj.title = "Error Mensaje";
					obj.Type = "Error";
				} else if (obj.Mtype === "W") {
					obj.title = "Advertencia Mensaje";
					obj.Type = "Warning";
				} else {
					obj.title = "Mensaje Exitoso";
					obj.Type = "Success";
				}
				var oMessage = {
					type: obj.Type,
					title: obj.Message,
					//	description: obj.Message,
					subtitle: obj.MessageV1,
					counter: 1
				}

				aMockMessages.push(oMessage);
			})

			var oModel = new JSONModel(),
				that = this;

			oModel.setData(aMockMessages);

			this.oMessageView = new sap.m.MessageView({
				showDetailsPageHeader: false,
				itemSelect: function () {
					oBackButton.setVisible(true);
				},
				items: {
					path: "/",
					template: oMessageTemplate
				}
			});
			var oBackButton = new sap.m.Button({
				icon: "sap-icon://nav-back",
				visible: false,
				press: function () {
					that.oMessageView.navigateBack();
					if (that._oPopover) {
						that._oPopover.focus();
					}
					this.setVisible(false);
				}
			});

			this.oMessageView.setModel(oModel);

			var oCloseButton = new sap.m.Button({
					text: "Close",
					press: function () {
						that._oPopover.close();

					}
				}),
				oPopoverFooter = new sap.m.Bar({
					contentRight: oCloseButton
				}),
				oPopoverBar = new sap.m.Bar({
					contentLeft: [oBackButton],
					contentMiddle: [
						new Text({
							text: "Messages"
						})
					]
				});

			this.oDialogMessage = new sap.m.Dialog({
				resizable: true,
				content: this.oMessageView,
				beginButton: new sap.m.Button({
					press: function () {

						this.getParent().close();
					},
					text: "Close"
				}),
				customHeader: new sap.m.Bar({
					contentMiddle: [
						new sap.m.Text({
							text: "Log"
						})
					],
					contentLeft: [oBackButton]
				}),
				contentHeight: "25%",
				contentWidth: "25%",
				verticalScrolling: false
			});
			this.oMessageView.navigateBack();
			//this._oPopover.openBy(oEvent);
			this.oDialogMessage.open();
		},

	});
});