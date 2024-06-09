/*global QUnit*/

sap.ui.define([
	"com/everis/centria-ZFIR098-generacion-texto-banco-web/controller/Main.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Main Controller");

	QUnit.test("I should test the Main controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});