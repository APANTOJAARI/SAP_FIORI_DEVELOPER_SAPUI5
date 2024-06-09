sap.ui.define([
	"./utilities",
	"sap/ui/core/format/DateFormat"
], function () {
	"use strict";

	// class providing static utility methods to retrieve entity default values.

	return {

		formatDate: function (date) {
			// var d = new Date(date),
			var month = '' + (date.getMonth() + 1);
			var day = '' + date.getDate();
			var year = date.getFullYear();

			if (month.length < 2)
				month = '0' + month;
			if (day.length < 2)
				day = '0' + day;

			// return [year, month, day].join('/');
			return [day, month, year].join('.');
		}
	};
});