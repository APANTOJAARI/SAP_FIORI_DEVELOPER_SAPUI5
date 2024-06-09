/***
@controller Name:i2d.eam.pmnotification.create.s1.controller.MaintainNotification,
*@viewId:application-adaptationproject-display-component---create--pmNotifViewCreateNotification
*/
/*!
 * OpenUI5
 * (c) Copyright 2009-2021 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	'sap/ui/core/mvc/ControllerExtension',
	'sap/ui/core/mvc/OverrideExecution',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
],
	function (ControllerExtension, OverrideExecution, Controller, JSONModel, Filter, FilterOperator) {
		"use strict";
		return ControllerExtension.extend("customer.zeamntfcres3ext.MaintainNotificationCustom", {
			metadata: {
				// 	// extension can declare the public methods
				// 	// in general methods that start with "_" are private
				methods: {
					publicMethod: {
						public: true /*default*/,
						final: false /*default*/,
						overrideExecution: OverrideExecution.Instead /*default*/
					},
					finalPublicMethod: {
						final: true
					},
					onMyHook: {
						public: true /*default*/,
						final: false /*default*/,
						overrideExecution: OverrideExecution.After
					},
					couldBePrivate: {
						public: false
					}
				}
			},

			onValueHelpInputPriority: function (oEvent) {

				var oButton = oEvent.getSource(),
					oView = this.getView();

				if (!this._pDialog) {
					this._pDialog = sap.ui.core.Fragment.load({
						id: oView.getId(),
						name: "customer.zeamntfcres3ext.changes.fragments.PopupPriority",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						return oDialog;
					});
				}

				this._pDialog.then(function (oDialog) {
					this._configDialog(oButton, oDialog);
					// filterthelistviabinding +add ====================================================//
					var oFilterAux = new Filter("Maintprioritytype", FilterOperator.Contains, 'ZM');
					var oList = this.getView().byId("myDialog");
					var oBinding = oList.getBinding("items");
					oBinding.filter(oFilterAux);
					//================================================================================//

					oDialog.open();

				}.bind(this));

			},
			onValueHelpInputCodif: function (oEvent) {

				var oButton = oEvent.getSource(),
					oView = this.getView();

				if (!this._pDialog2) {
					this._pDialog2 = sap.ui.core.Fragment.load({
						id: oView.getId(),
						name: "customer.zeamntfcres3ext.changes.fragments.PopupGrpCod",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						return oDialog;
					});
				}

				this._pDialog2.then(function (oDialog) {
					this._configDialog(oButton, oDialog);
					oDialog.open();
				}.bind(this));

			},

			//search=".handleSearchGrp" - grupo de Códigos Help
			handleSearchGrp: function (oEvent) {

				var sValue = oEvent.getParameter("value");
				var oFilter = new Filter("CodeTxt", FilterOperator.Contains, sValue);
				var oBinding2 = oEvent.getSource().getBinding("items");
				oBinding2.filter([oFilter]);
			},
			//confirm=".handleCloseGrp" - grupo de Códigos Help 
			handleCloseGrp: function (oEvent) {

				// reset the filter
				var oBinding = oEvent.getSource().getBinding("items");
				oBinding.filter([]);

				//===================================================================//
				//Traer el objeto Press Item o Click
				const aContexts = oEvent.getParameter("selectedContexts")

				if (aContexts && aContexts.length) {

					var oSelectedItem = oEvent.getSource();
					var oContext = oSelectedItem.getBindingContext();
					var sPath = oContext.getPath();


					// SET INPUT TEXT VALUE //
					var inputZqmgrp = this.byId("pmNotifInputZqmgrp");
					inputZqmgrp.setValue(aContexts[0].getObject().Codegruppe);
					inputZqmgrp.setValueState(sap.ui.core.ValueState.None);

					var inputZqmcod = this.byId("pmNotifInputZqmcod");
					inputZqmcod.setValue(aContexts[0].getObject().Code);

					var inputTxtZqmcod = this.byId("pmNotifLabelTxtZqmcod");
					inputTxtZqmcod.setValue(aContexts[0].getObject().CodeTxt);

					//===================================================================//
					//===================================================================//
					var objectMain_aux = oEvent.getSource().getBindingContext().getObject();

				}
			},

			_configDialog: function (oButton, oDialog) {
				// Set draggable property
				var bDraggable = oButton.data("draggable");
				oDialog.setDraggable(bDraggable == "true");

				// Set resizable property
				var bResizable = oButton.data("resizable");
				oDialog.setResizable(bResizable == "true");

				// Multi-select if required
				var bMultiSelect = !!oButton.data("multi");
				oDialog.setMultiSelect(bMultiSelect);

				// Remember selections if required
				var bRemember = !!oButton.data("remember");
				oDialog.setRememberSelections(bRemember);

				var sResponsivePadding = oButton.data("responsivePadding");
				var sResponsiveStyleClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer";

				if (sResponsivePadding) {
					oDialog.addStyleClass(sResponsiveStyleClasses);
				} else {
					oDialog.removeStyleClass(sResponsiveStyleClasses);
				}

				// Set custom text for the confirmation button
				var sCustomConfirmButtonText = oButton.data("confirmButtonText");
				oDialog.setConfirmButtonText(sCustomConfirmButtonText);

				// toggle compact style
				//sap.ui.core.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
			},

			handleSearch: function (oEvent) {
				/**
				 
			   
				var sValue = oEvent.getParameter("value");
				//var oFilter = new Filter("Maintprioritydesc", FilterOperator.Contains, sValue);

				var oFilter =  new Filter("Maintprioritydesc", FilterOperator.Contains, sValue);

				//Nuevo Filtrado de los datos
				var aFilters = [ 
								  new sap.ui.model.Filter("Maintprioritydesc", FilterOperator.EQ, sValue),
								  new sap.ui.model.Filter("Maintprioritytype", FilterOperator.EQ, "ZM")  
				];
				//var oFilter = new sap.ui.model.Filter({ filters : aFilters,
				//                                        and     : true });

				var oBinding = oEvent.getSource().getBinding("items");
				//oBinding.filter([oFilter]);
				oBinding.filter([aFilters]); //new
			    
				//oEvent.getSource().getBinding("items").filter([oFilter]);
				  */

			}, handleClose: function (oEvent) {

				// reset the filter
				var oBinding = oEvent.getSource().getBinding("items");
				oBinding.filter([]);

				//===================================================================//
				//Traer el objeto Press Item o Click
				const aContexts = oEvent.getParameter("selectedContexts")

				if (aContexts && aContexts.length) {
					//Values Seleccionados
					console.log(aContexts[0].getObject().Maintpriority);
					console.log(aContexts[0].getObject().Maintprioritydesc);
					console.log(aContexts[0].getObject().Maintprioritytype);

					//===================================================================//


					var oSelectedItem = oEvent.getSource();
					var oContext = oSelectedItem.getBindingContext();
					var sPath = oContext.getPath();


					// SET INPUT TEXT VALUE //

					//sap.ui.getCore().byId("pmNotifInputpriority").setValue(aContexts[0].getObject().Maintpriority);

					var inputPriority = this.byId("pmNotifInputpriority");
					inputPriority.setValue(aContexts[0].getObject().Maintpriority);
					inputPriority.setValueState(sap.ui.core.ValueState.None);

					var inputPriorityType = this.byId("pmNotifInputPriorityType");
					inputPriorityType.setValue(aContexts[0].getObject().Maintprioritytype);

					var inputPriorityText = this.byId("pmNotifInputPriorityText");
					inputPriorityText.setValue(aContexts[0].getObject().Maintprioritydesc);


					//  inputPriority.bindProperty("value",aContexts[0].getObject().Maintpriority); 

					//ControllerExtension.getView().byId("pmNotifInputpriority").setValue(aContexts[0].getObject().Maintpriority);     
					// this.getView().byId("pmNotifInputpriority").setValue(aContexts[0].getObject().Maintpriority);
					//this.getView().byId("pmNotifInputPriorityText").setValue(aContexts[0].getObject().Maintprioritydesc);
					//this.getView().byId("pmNotifInputPriorityType").setValue(aContexts[0].getObject().Maintprioritytype);

					//===================================================================//
					//===================================================================//
					var objectMain = oEvent.getSource().getBindingContext().getObject();
				}


			},
			onValidationPriority: function (oEvent) {
				console.log('validate change');

				var priorityValue = oEvent.getParameter("value");
				if (typeof priorityValue !== 'undefined') {

					if (priorityValue !== '') {



						//this._oNotifTypeControl = this.getView().byId("pmNotifInputpriority");
						//this._oNotifTypeControl.setBusy(true);
						//this._oNotifTypeControl.getModel().read("/NotificationPrioritySet(Maintpriority='" + priorityValue + "')", {
						var lv_check = true;
						var lv_element = oEvent.getSource();
						this.getView().getModel().read("/NotificationPrioritySet", {
							success: function (data) {
								console.log("Ok prioridad")
								console.log(data)
								for (let index = 0; index < data.results.length; ++index) {
									if (data.results[index].Maintpriority.includes(String(priorityValue))) {
										lv_check = true;
										break;
									} else {
										lv_check = false;
									}
								}

								if (lv_check === false) {
									lv_element.setValueState(sap.ui.core.ValueState.Error);
								} else {
									lv_element.setValueState(sap.ui.core.ValueState.None);
								}

							}, error: function (e) {
								console.log(e);
							}
						});

					} else {
						let lv_element2 = oEvent.getSource();
						lv_element2.setValueState(sap.ui.core.ValueState.Error);
					}

				} else {
					let lv_element2 = oEvent.getSource();
					lv_element2.setValueState(sap.ui.core.ValueState.Error);
				}


			},
			onValidationGrp: function (oEvent) {
				var lv_element = oEvent.getSource();
				var qmgrpValue = oEvent.getParameter("value");
				var lv_check = true;
				if (typeof qmgrpValue !== 'undefined') {

					if (qmgrpValue !== '') {


						this.getView().getModel().read("/NotificationGrpCodigoSet", {
							success: function (data) {
								console.log("Ok zmgrp")
								console.log(data)
								for (let index = 0; index < data.results.length; ++index) {
									//if (data.results[index].Codegruppe.includes(String(qmgrpValue))) {
									if (data.results[index].Codegruppe === qmgrpValue) {
										lv_check = true;
										break;
									} else {
										lv_check = false;
									}
								}

								if (lv_check === false) {
									lv_element.setValueState(sap.ui.core.ValueState.Error);
								} else {
									lv_element.setValueState(sap.ui.core.ValueState.None);
								}

							}, error: function (e) {
								console.log(e);
							}
						});

					} else {
						let lv_element2 = oEvent.getSource();
						lv_element2.setValueState(sap.ui.core.ValueState.Error);
					}

				} else {
					let lv_element2 = oEvent.getSource();
					lv_element2.setValueState(sap.ui.core.ValueState.Error);
				}
			},

			// // adding a private method, only accessible from this controller extension
			// _privateMethod: function() {},
			// // adding a public method, might be called from or overridden by other controller extensions as well
			// publicMethod: function() {},
			// // adding final public method, might be called from, but not overridden by other controller extensions as well
			// finalPublicMethod: function() {},
			// // adding a hook method, might be called by or overridden from other controller extensions
			// // override these method does not replace the implementation, but executes after the original method
			// onMyHook: function() {},
			// // method public per default, but made private via metadata
			// couldBePrivate: function() {},
			// // this section allows to extend lifecycle hooks or override public methods of the base controller
			override: {
				// 	/**
				// 	 * Called when a controller is instantiated and its View controls (if available) are already created.
				// 	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
				// 	 * @memberOf customer.zeamntfcres3ext.MaintainNotificationCustom
				// 	 */
				onInit: function () {
				},

				// 	/**
				// 	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
				// 	 * (NOT before the first rendering! onInit() is used for that one!).
				// 	 * @memberOf customer.zeamntfcres3ext.MaintainNotificationCustom
				// 	 */
				// 	onBeforeRendering: function() {
				// 	},

				// 	/**
				// 	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
				// 	 * This hook is the same one that SAPUI5 controls get after being rendered.
				// 	 * @memberOf customer.zeamntfcres3ext.MaintainNotificationCustom
				// 	 */
				onAfterRendering: function () {
					var inputPriority = this.byId("pmNotifInputpriority");
					//Validar
					var lv_inputPriority = inputPriority.getValue("value")
					if (lv_inputPriority === '' || typeof qmgrpValue !== 'undefined') {
						inputPriority.setValueState(sap.ui.core.ValueState.Error);
					} else {
						inputPriority.setValueState(sap.ui.core.ValueState.None);
					}


					var inputZqmgrp2 = this.byId("pmNotifInputZqmgrp");

					//Validar
					var lv_inputZqmgrp2 = inputZqmgrp2.getValue("value")
					if (lv_inputZqmgrp2 === '' || typeof qmgrpValue !== 'undefined') {
						inputZqmgrp2.setValueState(sap.ui.core.ValueState.Error);
					} else {
						inputZqmgrp2.setValueState(sap.ui.core.ValueState.None);
					}

				},

				// 	/**
				// 	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
				// 	 * @memberOf customer.zeamntfcres3ext.MaintainNotificationCustom
				// 	 */
				// 	onExit: function() {
				// 	},

				// 	// override public method of the base controller
				// 	basePublicMethod: function() {
				// 	}
				// }
			},

		});
	});