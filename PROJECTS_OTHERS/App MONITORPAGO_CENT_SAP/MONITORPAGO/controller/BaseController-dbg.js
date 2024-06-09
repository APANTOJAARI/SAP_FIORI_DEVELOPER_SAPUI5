sap.ui.define(
	[
		'sap/ui/core/mvc/Controller',
		'sap/ui/core/UIComponent',
		'sap/m/MessageBox',
		'sap/m/Dialog',
		'sap/m/DialogType',
		'sap/m/Button',
		'sap/m/ButtonType',
		'sap/m/Text',
		'sap/m/MessageToast'
	],
	function (Controller, UIComponent, MessageBox, Dialog, DialogType, Button, ButtonType, Text, MessageToast) {
		'use strict';

		return Controller.extend('h2h.centria.h2hmonitorpagosrpa.controller.BaseController', {
			/**
			 * Convenience method for accessing the router.
			 * @public
			 * @returns {sap.ui.core.routing.Router} the router for this component
			 */
			getRouter: function () {
				return UIComponent.getRouterFor(this);
			},
			getAppModel: function (sModel) {
				return this.getOwnerComponent().getModel(sModel);
			},
			setAppModel: function (oData, sModel) {
				return this.getOwnerComponent().setModel(oData, sModel || '');
			},
			getViewModel: function (sModel) {
				return this.getView().getModel(sModel || '');
			},
			setViewModel: function (oData, sModel) {
				return this.getView().setModel(oData, sModel || '');
			},
			/**
			 * Retrieve the Resource Bundle from i18n
			 *
			 * @returns
			 */
			getResourceBundle: function () {
				return this.getOwnerComponent().getModel('i18n').getResourceBundle();
			},
			/**
			 * Show a Message Box with Title and Description
			 *
			 * @param {string} sType
			 * @param {string} sTitle
			 * @param {string} sMessage
			 * @returns
			 */
			showMessageBox: function (sType, sTitle, sMessage) {
				return MessageBox[sType](sMessage, {
					title: sTitle,
					id: 'msgbxId'
				});
			},
			showMessageToast: function (sMessage) {
				return MessageToast.show(sMessage);
			},
			showApproveDialog: function (sTitle, sMessage, oCallbackData, fCallback) {
				if (!this.oApproveDialog) {
					this.oApproveDialog = new Dialog({
						type: DialogType.Message,
						title: sTitle,
						content: new Text({
							text: sMessage
						}),
						beginButton: new Button({
							type: ButtonType.Emphasized,
							text: "Aceptar",
							press: () => {
								fCallback(oCallbackData.items);
								this.oApproveDialog.close();
								this.oApproveDialog = null;
							}
						}),
						endButton: new Button({
							text: "Cancel",
							press: () => {
								this.oApproveDialog.close();
								this.oApproveDialog = null;
							}
						})
					});
				}

				this.oApproveDialog.open();
			}
		});
	}
);