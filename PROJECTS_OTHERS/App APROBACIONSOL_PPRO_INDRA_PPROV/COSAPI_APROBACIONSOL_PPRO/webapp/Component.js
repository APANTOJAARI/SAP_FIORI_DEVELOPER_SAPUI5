/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "ns/cosapi/aprobacionsolppro/model/models"
    ],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("ns.cosapi.aprobacionsolppro.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                //Inicializar idioma
                this._updateLang();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            },

            _updateLang: function () {
                const lang = this._getBrowserLang();
                const i18nModel = new sap.ui.model.resource.ResourceModel({
                   bundleName: "ns.cosapi.aprobacionsolppro.i18n.i18n",
                   bundleLocale: lang
                });
                this.setModel(i18nModel, "i18n");
             },

             _getBrowserLang: function () {
                return navigator.language.substring(0,2) || navigator.userLanguage || "es"; // "en" es el valor por defecto
             },

            _getLangFromUrl: function () {
                let slang = "es"; 
                const oUrlParams = new URLSearchParams(window.location.search);
                if (oUrlParams.has("lang")) {
                   slang = oUrlParams.get("lang");
                }
                return slang;
             },
             
        });
    }
);