sap.ui.define([
    //"sap/ui/core/mvc/Controller",
    "centria/net/fisbactivos/controller/BaseController",
    "centria/net/fisbactivos/services/SolBajaOdata",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController,SolBajaOdata) {
        "use strict";

        return BaseController.extend("centria.net.fisbactivos.controller.Main", {
            onInit: function () 
            {
            //Inicializar instancias
            this.oDataServSolBaj = SolBajaOdata.getInstance();

            //Modelo Status de formulario
            let modelAuth = this.getOwnerComponent().getModel("AuthSolBaj");
            this.getView().setModel(modelAuth, "authSolBaj");

            },
            onAfterRendering: function()
            {
                this.setModelAuthorization();
            },
            /**
             * Esta función navega a la vista "SBCreate.view", para crear la solicitud de baja
             */
            onCreateSolBaja: function()
            {
            
            let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
             oRouter.navTo("RouteSBajCreate", {}, false);   
            },   
            /**
             * Esta función navega a la vista "SBDetails.view", según el item seleccionado
             * @param { typeof object} oEvent 
             */ 
            onItemPress: function(oEvent)
            {
            
			let iconPressed = oEvent.getSource();
			let oContext    = iconPressed.getBindingContext();
		  //let sPath       = oContext.getPath();
			let oRouter     = sap.ui.core.UIComponent.getRouterFor(this);


            let itemSelected = oContext.getPath().substr(1);   
			oRouter.navTo("RouteSBajDetails", {
                inventPath: itemSelected
			});
            },
            
            onRefresh: function () {
                this.getView().getModel().refresh(true);
                
                //Actualizar autorizaciones
                this.setModelAuthorization();
            },

        });
    });
