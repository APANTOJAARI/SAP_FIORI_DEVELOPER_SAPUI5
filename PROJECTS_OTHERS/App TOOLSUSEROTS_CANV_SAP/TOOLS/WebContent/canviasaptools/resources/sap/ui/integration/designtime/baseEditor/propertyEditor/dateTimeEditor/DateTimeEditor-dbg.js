/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	"sap/ui/integration/designtime/baseEditor/propertyEditor/BasePropertyEditor",
	"sap/ui/integration/designtime/baseEditor/propertyEditor/dateEditor/DateEditor",
	"sap/ui/core/format/DateFormat"
], function (
	BasePropertyEditor,
	DateEditor,
	DateFormat
) {
	"use strict";

	/**
	 * @class
	 * Constructor for a new <code>DateTimeEditor</code>.
	 * This allows to set datetime values for a specified property of a JSON object.
	 * The editor is rendered as a {@link sap.m.DateTimePicker}.
	 *
	 * @extends sap.ui.integration.designtime.baseEditor.propertyEditor.dateEditor.DateEditor
	 * @alias sap.ui.integration.designtime.baseEditor.propertyEditor.dateTimeEditor.DateTimeEditor
	 * @author SAP SE
	 * @since 1.76
	 * @version 1.77.2
	 *
	 * @private
	 * @experimental 1.76
	 * @ui5-restricted
	 */
	var DateTimeEditor = DateEditor.extend("sap.ui.integration.designtime.baseEditor.propertyEditor.dateTimeEditor.DateTimeEditor", {
		xmlFragment: "sap.ui.integration.designtime.baseEditor.propertyEditor.dateTimeEditor.DateTimeEditor",
		renderer: BasePropertyEditor.getMetadata().getRenderer().render
	});

	DateTimeEditor.prototype.getFormatterInstance = function () {
		return DateFormat.getDateTimeInstance();
	};

	return DateTimeEditor;
});
