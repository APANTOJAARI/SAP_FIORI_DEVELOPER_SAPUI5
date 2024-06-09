sap.ui.define(["sap/ui/model/json/JSONModel"], function (JSONModel) {
	"use strict";

	return {
		triggerRequest: function (oModel, aItems, sAction) {

			let oData = {
				Bukrs: "TA10",
				Accbtn: sAction
			};

			switch (sAction) {
			case "GENE_PROPAGO":
				oData.ListaPagosRPASet = aItems;
				break;
			case "ANUL_PROPAGO":
				oData.ListaProPagoRPASet = aItems;
				break;
			case "ANUL_DOCPAGO":
				oData.ListaPagosRPASet = aItems;
				break;

			}

			return new Promise((resolve, reject) => {
				oModel.create("/OpcionesRPASet", oData, {
					success: (oResponse) => {
						if (oResponse.Mtype === "S") {
							resolve({
								message: oResponse.Mensaje
							});

						} else if (oResponse.Mtype === "E") {
							reject({
								message: oResponse.Mensaje
							});

						}
					},
					error: (oError) => {
						reject({
							status: "error",
							message: "Hubo un error desconocido"
						});
					}
				});

			});
		}
	};
});