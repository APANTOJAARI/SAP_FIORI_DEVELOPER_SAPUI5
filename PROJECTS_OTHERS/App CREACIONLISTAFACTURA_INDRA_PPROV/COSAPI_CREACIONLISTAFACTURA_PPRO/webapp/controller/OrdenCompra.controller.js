sap.ui.define([
	"./Base.controller",
	"sap/ui/core/UIComponent",
], function(
	Controller,
	UIComponent
) {
	"use strict";

	return Controller.extend("ns.cosapi.creacionlistadofactura.controller.OrdenCompra", {
		onInit: function () {
			let oRouter = UIComponent.getRouterFor(this);
			oRouter.getRoute("ViewOrdenCompra").attachMatched(this.oRouteMatched,this);
			
		 },
		oRouteMatched:function(oEvent){
			let oArgs,oView;
			oArgs = oEvent.getParameter(("arguments"));
			this.byId("idTituloOC").setText=oArgs.ordenCompra;
			this.onListaOrdenCompra(oArgs.ordenCompra);
		 },
		onBack:function(){
			this.onNavBack();
		},
		onListaOrdenCompra:async function(Ebeln){
			// let aListaOrdenCompra = [
			// 	{
			// 		"Posicion":"010",
			// 		"Material":"100003033",
			// 		"Descripcion":"Arsenico",
			// 		"Cantidad":"20",
			// 		"Unidad":"LT",
			// 		"PrecioUnitario":"5",
			// 		"Total":"100",
			// 		"Waers":"USD"
			// 	},{
			// 		"Posicion":"020",
			// 		"Material":"100003033",
			// 		"Descripcion":"Arsenico",
			// 		"Cantidad":"20",
			// 		"Unidad":"LT",
			// 		"PrecioUnitario":"5",
			// 		"Total":"100",
			// 		"Waers":"USD"
			// 	},{
			// 		"Posicion":"030",
			// 		"Material":"100003033",
			// 		"Descripcion":"Arsenico",
			// 		"Cantidad":"20",
			// 		"Unidad":"LT",
			// 		"PrecioUnitario":"5",
			// 		"Total":"100",
			// 		"Waers":"USD"
			// 	}
			// ]
			let data= {

				"CabeceraOCSet": [
				
				{
				
				"Ebeln": Ebeln
				
				}
				
				],
				
				"DetalleOCSet": [
				
				]
				
				}
			let ZMMGS_PRE_REG_FACT_SRV = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_FACT_SRV");
			try {
				var oModel = this.getOwnerComponent().getModel();
				const aListaOrdenCompra = await this.createEntity(ZMMGS_PRE_REG_FACT_SRV, "/ConsultaOCSet", data);								
				oModel.setProperty("/oOrdenCompra", aListaOrdenCompra.CabeceraOCSet.results[0])
				oModel.setProperty("/ListaOrdenCompra", aListaOrdenCompra.DetalleOCSet.results)
			} catch (error) {
				MessageBox.error("Error al obtener estados")
			}
			
		}
	});
});