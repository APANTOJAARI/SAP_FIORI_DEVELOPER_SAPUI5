sap.ui.define(['sap/ui/base/ManagedObject'], function (ManagedObject) {
	'use strict';

	return {
		/**
		 * Date Formatter
		 * @param {Date} dCurrentDate
		 *
		 * @returns {string}
		 */
		getFormattedDate: function (dCurrentDate, sFormat) {
			return dCurrentDate.toLocaleDateString();
		}
	};
});