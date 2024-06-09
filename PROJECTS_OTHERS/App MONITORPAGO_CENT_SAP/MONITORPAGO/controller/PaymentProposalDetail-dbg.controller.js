sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter"
], function (BaseController, JSONModel, Filter) {
	"use strict";

	return BaseController.extend("h2h.centria.h2hmonitorpagosrpa.controller.PaymentProposalDetail", {
		oArguments: null,
		onInit: function () {
		/*	this.onBeforeShow();
			this.getView().addEventDelegate({ // not added the controller as delegate to avoid controller functions with similar names as the events      
				onBeforeShow: $.proxy(function (evt) {
					this.onBeforeShow(evt);
				}, this)
			});*/

			this.getRouter()
				.getRoute("detail")
				.attachPatternMatched(this._onObjectMatched, this);
		},

		onBeforeShow: function (oEvent) {
			$(document).ready(function () {
				$('[id*="shell-header"]').hide();
			});
		},

		onBeforeRebindPymntPropDetailsTable: function (oSource) {
			let oBinding = oSource.getParameter("bindingParams");

			let aSplittedDate = this.oArguments.proposalDate.split("-");
			let dFormattedDate = new Date(`${aSplittedDate[1]}/${aSplittedDate[0]}/${aSplittedDate[2]}`);

			let aFilters = [];
			aFilters.push(new Filter("Bukrs", sap.ui.model.FilterOperator.EQ, this.oArguments.companyCode));
			aFilters.push(new Filter("Laufi", sap.ui.model.FilterOperator.EQ, this.oArguments.proposalCode));
			aFilters.push(new Filter("Laufd", sap.ui.model.FilterOperator.EQ, dFormattedDate));

			oBinding.filters = aFilters;

			let oSelectedPaymentProposal = new JSONModel();
			oSelectedPaymentProposal.setData(this.oArguments);

			this.setAppModel(oSelectedPaymentProposal, "SelectedPaymentProposalInfo");

		},
		onPaymentPropDetailClose: function () {
			this.getAppModel("appModel").setProperty(
				"/layout",
				"OneColumn"
			);
			this.getRouter().navTo("master");
		},
		_onObjectMatched: function (oEvent) {
		/*	this.onBeforeShow();
			this.getView().addEventDelegate({ // not added the controller as delegate to avoid controller functions with similar names as the events      
				onBeforeShow: $.proxy(function (evt) {
					this.onBeforeShow(evt);
				}, this)
			});*/

			this.oArguments = oEvent.getParameter("arguments");
			this.getAppModel("appModel").setProperty(
				"/layout",
				"TwoColumnsBeginExpanded"
			);

			let oTable = this.byId("stDetallePropPagosRPA");
			oTable.rebindTable(true);

		},
	});
});