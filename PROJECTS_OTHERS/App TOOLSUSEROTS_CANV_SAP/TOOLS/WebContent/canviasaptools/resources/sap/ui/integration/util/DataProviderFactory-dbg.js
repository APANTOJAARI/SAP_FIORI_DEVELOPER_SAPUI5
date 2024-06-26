/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/integration/util/ServiceDataProvider",
	"sap/ui/integration/util/RequestDataProvider",
	"sap/ui/integration/util/DataProvider"
],
function (BaseObject, ServiceDataProvider, RequestDataProvider, DataProvider) {
"use strict";

	/**
	 * @class
	 * A factory class which creates a data provider based on data settings and stores the created instance.
	 * When destroyed, all data providers created by this class are also destroyed.
	 *
	 * @author SAP SE
	 * @version 1.77.2
	 *
	 * @private
	 * @since 1.65
	 * @alias sap.ui.integration.util.DataProviderFactory
	 */
	var DataProviderFactory = BaseObject.extend("sap.ui.integration.util.DataProviderFactory", {
		constructor: function (oDestinations) {
			BaseObject.call(this);
			this._oDestinations = oDestinations;
			this._aDataProviders = [];
		}
	});

	DataProviderFactory.prototype.destroy = function () {
		BaseObject.prototype.destroy.apply(this, arguments);

		if (this._aDataProviders) {
			this._aDataProviders.forEach(function(oDataProvider) {
				if (!oDataProvider.bIsDestroyed) {
					oDataProvider.destroy();
				}
			});

			this._aDataProviders = null;
		}

		this._bIsDestroyed = true;
	};

	/**
	 * Returns if this factory is destroyed.
	 *
	 * @returns {boolean} if this manifest is destroyed
	 */
	DataProviderFactory.prototype.isDestroyed = function () {
		return this._bIsDestroyed;
	};

	/**
	 * Factory function which returns an instance of <code>DataProvider</code>.
	 *
	 * @param {Object} oDataSettings The data settings.
	 * @param {sap.ui.integration.util.ServiceManager} oServiceManager A reference to the service manager.
	 * @returns {sap.ui.integration.util.DataProvider|null} A data provider instance used for data retrieval.
	 */
	DataProviderFactory.prototype.create = function (oDataSettings, oServiceManager) {
		var oDataProvider;

		if (!oDataSettings) {
			return null;
		}

		if (oDataSettings.request) {
			oDataProvider = new RequestDataProvider();
		} else if (oDataSettings.service) {
			oDataProvider = new ServiceDataProvider();
		} else if (oDataSettings.json) {
			oDataProvider = new DataProvider();
		} else {
			return null;
		}

		oDataProvider.setDestinations(this._oDestinations);
		oDataProvider.setSettings(oDataSettings);

		if (oDataProvider.isA("sap.ui.integration.util.IServiceDataProvider")) {
			oDataProvider.createServiceInstances(oServiceManager);
		}

		if (oDataSettings.updateInterval) {
			oDataProvider.setUpdateInterval(oDataSettings.updateInterval);
		}

		this._aDataProviders.push(oDataProvider);

		return oDataProvider;
	};

	/**
	 * Removes a DataProvider from Factory's registry.
	 *
	 * @param oDataProvider {sap.ui.integration.util.DataProvider}
	 * @experimental
	 */
	DataProviderFactory.prototype.remove = function (oDataProvider) {
		var iProviderIndex = this._aDataProviders.indexOf(oDataProvider);

		if (iProviderIndex > -1) {
			this._aDataProviders.splice(iProviderIndex, 1);
		}

		if (oDataProvider && !oDataProvider.bDestroyed && oDataProvider._bIsDestroyed) {
			oDataProvider.destroy();
		}
	};

	return DataProviderFactory;
});