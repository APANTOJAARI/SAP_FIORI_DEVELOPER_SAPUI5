/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"sap/ui/integration/library",
	"sap/ui/base/Object",
	"sap/ui/integration/cards/NumericHeader",
	"sap/ui/integration/cards/Header",
	"sap/base/strings/formatMessage",
	"sap/ui/integration/controls/ActionsToolbar",
	"./CardActions"
], function (
	jQuery,
	library,
	BaseObject,
	NumericHeader,
	Header,
	formatMessage,
	ActionsToolbar,
	CardActions
) {
	"use strict";

	var AreaType = library.AreaType;

	/**
	 * Binds the statusText of a header to the provided format configuration.
	 *
	 * @private
	 * @param {Object} mFormat The formatting configuration.
	 * @param {sap.f.cards.IHeader} oHeader The header instance.
	 */
	function bindStatusText(mFormat, oHeader) {

		if (mFormat.parts && mFormat.translationKey && mFormat.parts.length === 2) {
			var oBindingInfo = {
				parts: [
					mFormat.translationKey,
					mFormat.parts[0].toString(),
					mFormat.parts[1].toString()
				],
				formatter: function (sText, vParam1, vParam2) {
					var sParam1 = vParam1 || mFormat.parts[0];
					var sParam2 = vParam2 || mFormat.parts[1];

					if (Array.isArray(vParam1)) {
						sParam1 = vParam1.length;
					}
					if (Array.isArray(vParam2)) {
						sParam2 = vParam2.length;
					}

					var iParam1 = parseFloat(sParam1) || 0;
					var iParam2 = parseFloat(sParam2) || 0;

					return formatMessage(sText, [iParam1, iParam2]);
				}
			};

			oHeader.bindProperty("statusText", oBindingInfo);
		}
	}

	/**
	 * Constructor for a new <code>HeaderFactory</code>.
	 *
	 * @class
	 *
	 * @extends sap.ui.base.Object
	 *
	 * @author SAP SE
	 * @version 1.77.2
	 *
	 * @constructor
	 * @private
	 * @alias sap.ui.integration.util.HeaderFactory
	 */
	var HeaderFactory = BaseObject.extend("sap.ui.integration.util.HeaderFactory", {
		metadata: {
			library: "sap.ui.integration"
		},
		constructor: function (oCard) {
			BaseObject.call(this);

			this._oCard = oCard;
		}
	});

	HeaderFactory.prototype.create = function (mConfiguration) {

		if (!mConfiguration) {
			return null;
		}

		var oHeader,
			oCard = this._oCard,
			oActions = new CardActions({
				card: oCard,
				areaType: AreaType.Header
			}),
			oActionsToolbar = this._createActionsToolbar();

		switch (mConfiguration.type) {
			case "Numeric":
				oHeader = new NumericHeader(mConfiguration, oActionsToolbar, oCard._sAppId);
				break;
			default:
				oHeader = new Header(mConfiguration, oActionsToolbar, oCard._sAppId);
				break;
		}

		if (mConfiguration.status &&
			mConfiguration.status.text &&
			mConfiguration.status.text.format) {
			if (mConfiguration.status.text.format.translationKey) {
				oCard._loadDefaultTranslations();
			}

			bindStatusText(mConfiguration.status.text.format, oHeader);
		}

		oHeader.setServiceManager(oCard._oServiceManager);
		oHeader.setDataProviderFactory(oCard._oDataProviderFactory);
		oHeader._setData(mConfiguration.data);

		oActions.attach(mConfiguration, oHeader);
		oHeader._oActions = oActions;

		return oHeader;
	};

	HeaderFactory.prototype._createActionsToolbar = function () {
		var oCard = this._oCard,
			oHost = oCard.getHostInstance(),
			oActionsToolbar,
			bHasActions;

		if (!oHost) {
			return null;
		}

		oActionsToolbar = new ActionsToolbar();
		bHasActions = oActionsToolbar.initializeContent(oHost, oCard);

		if (bHasActions) {
			return oActionsToolbar;
		}

		return null;
	};

	return HeaderFactory;
});
