/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/base/util/includes"
], function (
	includes
) {
	"use strict";

	/**
	 * Factory for the creation of <code>BasePropertyEditor</code> instances.
	 *
	 * @namespace sap.ui.integration.designtime.baseEditor.propertyEditor.PropertyEditorFactory
	 *
	 * @author SAP SE
	 * @version 1.77.2
	 *
	 * @static
	 * @since 1.75
	 * @private
	 * @experimental Since 1.75
	 * @ui5-restricted
	 */

	var PropertyEditorFactory = {};

	var oPropertyEditorClasses = {};

	/**
	* Registers classes for the given editor types. If an editor type is already registered,
	* it will be skipped and must first be deregistered using the <code>PropertyEditorFactory.deregisterType</code>
	* function.
	* @param {Object<string, string>} mTypes - Map containing pairs of editor type and the path to load the class from
	* @public
	* @function
	* @name sap.ui.integration.designtime.baseEditor.propertyEditor.PropertyEditorFactory.registerTypes
	*/
	PropertyEditorFactory.registerTypes = function (mTypes) {
		Object.keys(mTypes).forEach(function (sPropertyEditorType) {
			if (!oPropertyEditorClasses[sPropertyEditorType]) {
				oPropertyEditorClasses[sPropertyEditorType] = new Promise(function (resolve, reject) {
					sap.ui.require(
						[mTypes[sPropertyEditorType]],
						resolve,
						reject
					);
				});
			}
		});
	};

	/**
	* Deregisters a type and removes the loaded property editor class.
	* @param {string} sType - Editor type to deregister
	* @public
	* @function
	* @name sap.ui.integration.designtime.baseEditor.propertyEditor.PropertyEditorFactory.deregisterType
	*/
	PropertyEditorFactory.deregisterType = function (sType) {
		if (oPropertyEditorClasses[sType]) {
			delete oPropertyEditorClasses[sType];
		}
	};

	/**
	* Deregisters all editor types and removes the loaded classes.
	* @public
	* @function
	* @name sap.ui.integration.designtime.baseEditor.propertyEditor.PropertyEditorFactory.deregisterAllTypes
	*/
	PropertyEditorFactory.deregisterAllTypes = function () {
		oPropertyEditorClasses = {};
	};

	/**
	* Creates a new <code>BasePropertyEditor</code> instance of the given editor type.
	* @param {string} sPropertyType - Type of the property editor to create
	* @returns {Promise<sap.ui.integration.designtime.baseEditor.propertyEditor.BasePropertyEditor>} Promise resolving to the created editor
	* @public
	* @function
	* @name sap.ui.integration.designtime.baseEditor.propertyEditor.PropertyEditorFactory.create
	*/
	PropertyEditorFactory.create = function (sPropertyType) {
		return new Promise(function (resolve, reject) {
			if (!sPropertyType) {
				return reject("No editor type was specified in the property configuration.");
			}
			if (!oPropertyEditorClasses[sPropertyType]) {
				return reject("Editor type was not registered");
			}
			oPropertyEditorClasses[sPropertyType]
				.then(function (PropertyEditorClass) {
					return resolve(new PropertyEditorClass());
				})
				.catch(function (vError) {
					return reject(vError);
				});
		});
	};

	/**
	 * Retrieves all registered types.
	 * @returns {Object<string, Promise<sap.ui.integration.designtime.baseEditor.propertyEditor.BasePropertyEditor>>} List of registered types
	 */
	PropertyEditorFactory.getTypes = function () {
		return Object.assign({}, oPropertyEditorClasses);
	};

	/**
	 * Checks if specified type is registered already in the factory.
	 * @param {string} sPropertyType - Property editor type, e.g. "string" / "icon" / etc.
	 * @returns {boolean} <code>true</code> if the specified type is registered
	 */
	PropertyEditorFactory.hasType = function (sPropertyType) {
		return includes(
			Object.keys(PropertyEditorFactory.getTypes()),
			sPropertyType
		);
	};

	return PropertyEditorFactory;
});