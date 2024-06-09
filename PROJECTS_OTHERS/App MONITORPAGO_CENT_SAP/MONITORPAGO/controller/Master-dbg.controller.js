sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/table/RowAction",
	"sap/ui/table/RowActionItem",
	"sap/ui/core/BusyIndicator",
	"../service/MonitorRPA.service",
	"sap/ui/Device",
	"../model/models",
 
	"sap/m/MessageBox"
], function (BaseController, JSONModel, RowAction, RowActionItem, BusyIndicator, MonitorRPAService, Device, Models, 
	MessageBox) {
	"use strict";

	return BaseController.extend("h2h.centria.h2hmonitorpagosrpa.controller.Master", {
		onInit: async function () {
		/*	this.onBeforeShow();
			this.getView().addEventDelegate({ // not added the controller as delegate to avoid controller functions with similar names as the events      
				onBeforeShow: $.proxy(function (evt) {
					this.onBeforeShow(evt);
				}, this)
			});

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

			this.getRouter()
				.getRoute("master")
				.attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function (oEvent) {
		/*	this.onBeforeShow();
			this.getView().addEventDelegate({ // not added the controller as delegate to avoid controller functions with similar names as the events      
				onBeforeShow: $.proxy(function (evt) {
					this.onBeforeShow(evt);
				}, this)
			});*/

		},

		onPressHome: function (oEvent) {
			if (this.oConstantes && this.oConstantes.rpta) {
				let sDomainUrl = this.oConstantes.rpta.sDocumentUrl;
				let aUrlParts = sDomainUrl.split("#");
				window.location.replace(aUrlParts[0])
			}
		},

		onBeforeShow: function (oEvent) {
			$(document).ready(function () {
				$('[id*="shell-header"]').hide();
			});
		},
		onRowNavActionPress: function (oEvent) {
			this._showDetail(
				oEvent.getParameter("row") || oEvent.getSource()
			);

		},
		onGeneratePaymentProposalPress: function (oEvent) {
			let oTable = this.byId("stPagosRPA").getTable();
			let aIndex = oTable.getSelectedIndices();
			if (aIndex.length > 0) {

				let aItems = aIndex.map((index) => oTable.getContextByIndex(index).getObject());

				const aCleanedItems = aItems.map(({
					__metadata,
					...rest
				}) => {
					return {
						...rest,
						"Check": "X"
					}
				});

				this.showApproveDialog("Confirmar Generación",
					"Se generará una propuesta de pago a partir de los asientos de pago seleccionados, desea continuar?", {
						items: aCleanedItems
					}, this._generatePaymentProposal
					.bind(this)
				);
			} else {
				this.showMessageBox("warning", "Advertencia", "Para generar una propuesta de pago necesita seleccionar uno o más asientos de pago");
			}

		},
		onDeletePaymentSeatPress: function (oEvent) {
			let oTable = this.byId("stPagosRPA").getTable();
			let aIndex = oTable.getSelectedIndices();
			if (aIndex.length > 0) {

				let aItems = aIndex.map((index) => oTable.getContextByIndex(index).getObject());

				const aCleanedItems = aItems.map(({
					__metadata,
					...rest
				}) => {
					return {
						...rest,
						"Check": "X"
					}
				});

				this.showApproveDialog("Confirmar Eliminación",
					"Se eliminarán los asientos de pago seleccionados, desea continuar?", {
						items: aCleanedItems
					}, this._deletePaymentSeats.bind(this));
			} else {
				this.showMessageBox("warning", "Advertencia",
					"Para eliminar asientos de pago necesita seleccionar uno o mas registros de la tabla");
			}

		},
		onDeletePaymentProposalPress: function (oEvent) {
			let oTable = this.byId("stPropPagosRPA").getTable();
			let aIndex = oTable.getSelectedIndices();
			if (aIndex.length > 0) {

				let aItems = aIndex.map((index) => oTable.getContextByIndex(index).getObject());

				const aCleanedItems = aItems.map(({
					__metadata,
					...rest
				}) => {
					return {
						...rest,
						"Check": "X"
					}
				});

				this.showApproveDialog("Confirmar Eliminación",
					"Se eliminarán las propuestas de pago seleccionadas, desea continuar?", {
						items: aCleanedItems
					}, this._deletePaymentProposals.bind(this));
			} else {
				this.showMessageBox("warning", "Advertencia",
					"Para eliminar asientos de pago necesita seleccionar uno o mas registros de la tabla");
			}

		},

		/* =========================================================== */
		/* begin: private methods                                     */
		/* =========================================================== */
		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function (oRow) {
			let bReplace = !Device.system.phone;

			// set the layout property of FCL control to show two columns
			this.getAppModel("appModel").setProperty(
				"/layout",
				"TwoColumnsBeginExpanded"
			);

			let oPymntProCtx = oRow.getBindingContext();
			let dProposalDate = oPymntProCtx.getProperty("Laufd");
			let sProposalCode = oPymntProCtx.getProperty("Laufi");
			let sCompanyDate = oPymntProCtx.getProperty("Bukrs");

			let nPropDateMonth = dProposalDate.getUTCMonth() + 1;

			let sCustomFormattedDate =
				`${dProposalDate.getUTCDate()}-${(nPropDateMonth < 10) ?"0" + nPropDateMonth :nPropDateMonth }-${dProposalDate.getUTCFullYear()}`;

			this.getRouter().navTo(
				"detail", {
					proposalDate: sCustomFormattedDate,
					companyCode: sCompanyDate,
					proposalCode: sProposalCode
				},
				bReplace
			);

		},
		_generatePaymentProposal: function (aPaymentSeats) {

			BusyIndicator.show(0);
			let oTablePaymentSeats = this.byId("stPropPagosRPA");
			let oTablePaymentProps = this.byId("stPagosRPA");

			MonitorRPAService.triggerRequest(this.getAppModel(), aPaymentSeats, "GENE_PROPAGO")
				.then((oResponse) => {
					BusyIndicator.hide();
					oTablePaymentSeats.rebindTable(true);
					oTablePaymentProps.rebindTable(true);
					this.showMessageToast(oResponse.message || "Propuesta de pago generada");
				})
				.catch((oError) => {
					BusyIndicator.hide();
					this.showMessageBox("error", "Error", oError.message);
				});

		},
		_deletePaymentProposals: function (aPaymentProps) {

			BusyIndicator.show(0);
			let oTablePaymentSeats = this.byId("stPropPagosRPA");
			let oTablePaymentProps = this.byId("stPagosRPA");

			MonitorRPAService.triggerRequest(this.getAppModel(), aPaymentProps, "ANUL_PROPAGO")
				.then((oResponse) => {
					BusyIndicator.hide();
					oTablePaymentSeats.rebindTable(true);
					oTablePaymentProps.rebindTable(true);
					this.showMessageToast(oResponse.message || "Propuesta de pago anulada");
				})
				.catch((oError) => {
					BusyIndicator.hide();
					this.showMessageBox("error", "Error", oError.message);
				});

		},
		_deletePaymentSeats: function (aPaymentSeats) {

			BusyIndicator.show(0);
			let oTablePaymentSeats = this.byId("stPropPagosRPA");
			let oTablePaymentProps = this.byId("stPagosRPA");

			MonitorRPAService.triggerRequest(this.getAppModel(), aPaymentSeats, "ANUL_DOCPAGO")
				.then((oResponse) => {
					BusyIndicator.hide();
					oTablePaymentSeats.rebindTable(true);
					oTablePaymentProps.rebindTable(true);
					this.showMessageToast(oResponse.message || "Asiento de pago anulado");
				})
				.catch((oError) => {
					BusyIndicator.hide();
					this.showMessageBox("error", "Error", oError.message);
				});

		}
	});
});