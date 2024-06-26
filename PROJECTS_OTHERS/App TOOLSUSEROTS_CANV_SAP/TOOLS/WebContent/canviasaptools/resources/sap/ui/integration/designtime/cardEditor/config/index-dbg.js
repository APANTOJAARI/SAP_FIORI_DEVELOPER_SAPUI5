/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 *
 * @private
 * @experimental
 */
sap.ui.define([
	"sap/ui/integration/designtime/cardEditor/config/AppConfig",
	"sap/ui/integration/designtime/cardEditor/config/HeaderConfig",
	"sap/ui/integration/designtime/cardEditor/config/ListCardConfig",
	"sap/ui/integration/designtime/cardEditor/config/ObjectCardConfig",
	"sap/ui/integration/designtime/cardEditor/config/TableCardConfig",
	"sap/ui/integration/designtime/cardEditor/config/generateDataConfig"
], function (
	AppConfig,
	HeaderConfig,
	ListCardConfig,
	ObjectCardConfig,
	TableCardConfig,
	generateDataConfig
) {
	"use strict";

	return {
		"context": "sap.card",
		"layout": {
			"form": {
				"groups": [
					{
						"label": "{i18n>CARD_EDITOR.GROUP.METADATA}",
						"items": [
							{
								type: "tag",
								value: "app"
							}
						]
					},
					{
						"label": "{i18n>CARD_EDITOR.GROUP.GENERALCONFIGURATION}",
						"items": [
							{
								type: "tag",
								value: "general"
							}
						]
					},
					{
						"label": "{i18n>CARD_EDITOR.GROUP.DATA}",
						"items": [
							{
								type: "propertyName",
								value: "appDataSources"
							},
							{
								type: "tag",
								value: ["data", "content"]
							}
						]
					},
					{
						"label": "{i18n>CARD_EDITOR.GROUP.HEADER}",
						"items": [
							{
								type: "tag",
								value: "header"
							}
						]
					},
					{
						"label": "{i18n>CARD_EDITOR.GROUP.CONTENT}",
						"items": [
							{
								type: "tag",
								value: "content"
							}
						]
					}
				]
			}
		},
		"properties" : Object.assign(
			{},
			AppConfig,
			{
				"type": {
					"tags": ["general"],
					"label": "{i18n>CARD_EDITOR.TYPE}",
					"type": "enum",
					"enum": [
						"List",
						"Analytical",
						"Table",
						"Object",
						"Timeline",
						"Component",
						"Calendar",
						"AdaptiveCard"
					],
					"path": "type"
				},
				"parameters": {
					"tags": ["general"],
					"label": "{i18n>CARD_EDITOR.PARAMETERS}",
					"path": "configuration/parameters",
					"type": "parameters",
					"allowedTypes": ["string", "number", "boolean", "integer", "date", "datetime"]
				},
				"destinations": {
					"tags": ["general"],
					"label": "{i18n>CARD_EDITOR.DESTINATIONS}",
					"itemLabel": "{i18n>CARD_EDITOR.DESTINATION}",
					"path": "configuration/destinations",
					"type": "destinations",
					"allowedValues": ["Northwind", "JAM"]
				}
			},
			HeaderConfig,
			ListCardConfig,
			ObjectCardConfig,
			TableCardConfig,
			generateDataConfig(["content"], "content/", "card")
		),
		"propertyEditors": {
			"enum" : "sap/ui/integration/designtime/baseEditor/propertyEditor/enumStringEditor/EnumStringEditor",
			"string" : "sap/ui/integration/designtime/baseEditor/propertyEditor/stringEditor/StringEditor",
			"icon" : "sap/ui/integration/designtime/baseEditor/propertyEditor/iconEditor/IconEditor",
			"array" : "sap/ui/integration/designtime/baseEditor/propertyEditor/arrayEditor/ArrayEditor",
			"parameters" : "sap/ui/integration/designtime/cardEditor/propertyEditor/parametersEditor/ParametersEditor",
			"boolean": "sap/ui/integration/designtime/baseEditor/propertyEditor/booleanEditor/BooleanEditor",
			"number": "sap/ui/integration/designtime/baseEditor/propertyEditor/numberEditor/NumberEditor",
			"integer": "sap/ui/integration/designtime/baseEditor/propertyEditor/integerEditor/IntegerEditor",
			"json": "sap/ui/integration/designtime/baseEditor/propertyEditor/jsonEditor/JsonEditor",
			"map": "sap/ui/integration/designtime/baseEditor/propertyEditor/mapEditor/MapEditor",
			"list": "sap/ui/integration/designtime/baseEditor/propertyEditor/listEditor/ListEditor",
			"complexMap": "sap/ui/integration/designtime/cardEditor/propertyEditor/complexMapEditor/ComplexMapEditor",
			"datetime": "sap/ui/integration/designtime/baseEditor/propertyEditor/dateTimeEditor/DateTimeEditor",
			"date": "sap/ui/integration/designtime/baseEditor/propertyEditor/dateEditor/DateEditor",
			"destinations": "sap/ui/integration/designtime/cardEditor/propertyEditor/destinationsEditor/DestinationsEditor"
		},
		"i18n" : "sap/ui/integration/designtime/cardEditor/i18n/i18n.properties"
	};
});
