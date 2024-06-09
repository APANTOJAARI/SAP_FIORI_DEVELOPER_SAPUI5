sap.ui.define([
	"sap/ui/core/MessageType",
	"sap/ui/core/ValueState"
], function (MessageType, ValueState) {
	"use strict";

	return {

		parseFinalDate: function (dAnyDate) {
			if (dAnyDate) {
				dAnyDate = new Date(dAnyDate.setTime(dAnyDate.getTime() + dAnyDate.getTimezoneOffset() * 60 * 1000));
				let iDate = dAnyDate.getDate(),
					iMonth = dAnyDate.getMonth() + 1,
					iYear = dAnyDate.getFullYear();

				let iFull = iDate + "/" + iMonth + "/" + iYear;

				return iFull;
			}
		}

	};
});