sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/PDFViewer",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (Controller, History, PDFViewer, MessageBox, MessageToast) {
	"use strict";

	return Controller.extend("ZSD_APP_GREMI.ZSD_APP_GREMI.controller.Main", {
		onInit: function () {

			this._pdfViewer = new PDFViewer();
			this.getView().addDependent(this._pdfViewer);

		},
		onItemPress: function (oEvent) {

			//Obtener el controlado de la fila seleccionado
			var iconPressed = oEvent.getSource();
			//Obtener el contexto del modelo
			var oContext = iconPressed.getBindingContext();
			//Obtener el Path seleccionado
			var sPath = oContext.getPath();

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var sId = this.getView().getModel().getProperty(sPath + "/Numgr");

			oRouter.navTo("RouteGreDetails", {
				IdGre: sId
			});

		},
		onCreate: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("RouteGreCreate", {}, false);

		},
		onRefresh: function () {
			this.getView().getModel().refresh(true);
		},
		onBeforeRebindTableExtension: function (oEvent) {

			var oBindingParams = oEvent.getParameter("bindingParams");
			//initially sort the table EndTime descending, so the last synchronizations are shown first
			if (!oBindingParams.sorter.length) {
				oBindingParams.sorter.push(new sap.ui.model.Sorter("Numgr", true))
			}
		},
		onViewPdf: function (oEvent) {

			var idNumgr = oEvent.getSource().getParent().getCells()[0].mProperties.text;
			var Text = this.getView().getModel("i18n").getResourceBundle().getText("Refer") + " " + oEvent.getSource().getParent().getCells()[2]
				.mProperties.text;
			var sServiceURL = this.getView().getModel().sServiceUrl;
			var sSource = sServiceURL + "/PdfMediaSet('" + idNumgr + "'" + ")/$value";

			this._pdfViewer.setSource(sSource);
			this._pdfViewer.setTitle(Text);
			this._pdfViewer.open();

		},
		onLogOper: function (oEvent) {
			//Obtener el controlado de la fila seleccionado
			var iconPressed = oEvent.getSource();
			//Obtener el contexto del modelo
			var oContext = iconPressed.getBindingContext();
			//Obtener el Path seleccionado
			var sPath = oContext.getPath();
			//Obtener el Path seleccionado
			var sPath = oContext.getPath();
			try {

				var message = this.getView().getModel().getProperty(sPath + "/msg_operador");
				var status = this.getView().getModel().getProperty(sPath + "/rpta_operador");
				switch (status) {
				case '1.Firmado':
					MessageBox.success(message);
					break;
				case '2.No Firmado':
					MessageBox.error(message);
					break;
				default:
					MessageBox.information(this.getView().getModel("i18n").getResourceBundle().getText("SinRptaOper"));
					break;
				}
			} catch (err) {
				
			}
		},
		onLogSunat: function (oEvent) {
			//Obtener el controlado de la fila seleccionado
			var iconPressed = oEvent.getSource();
			//Obtener el contexto del modelo
			var oContext = iconPressed.getBindingContext();
			//Obtener el Path seleccionado
			var sPath = oContext.getPath();
			//Obtener el Path seleccionado
			var sPath = oContext.getPath();
			try {

				var status = this.getView().getModel().getProperty(sPath + "/estado_sunat");
				var msg_sunat = this.getView().getModel().getProperty(sPath + "/msg_sunat");
				var obs_sunat = this.getView().getModel().getProperty(sPath + "/obs_sunat");

				switch (status) {
				case '1.Aceptado':
					MessageBox.success(msg_sunat);
					break;
				case '2.Rechazado':
					if (msg_sunat) {
						MessageBox.error(msg_sunat);
					} else if (obs_sunat) {
						MessageBox.error(obs_sunat);
					} else {
						MessageBox.information(this.getView().getModel("i18n").getResourceBundle().getText("SinRptaOper2"));
					}
					break;
				case '3.Acept.Observ':
					if (msg_sunat) {
						MessageBox.warning(msg_sunat);
					} else if (obs_sunat) {
						MessageBox.warning(obs_sunat);
					} else {
						MessageBox.information(this.getView().getModel("i18n").getResourceBundle().getText("SinRptaOper2"));
					}
					break;
				default:
					MessageBox.information(this.getView().getModel("i18n").getResourceBundle().getText("SinRptaOper2"));
					break;
				}
			} catch (err) {
				console.log(err);
			}
		}
	});
});