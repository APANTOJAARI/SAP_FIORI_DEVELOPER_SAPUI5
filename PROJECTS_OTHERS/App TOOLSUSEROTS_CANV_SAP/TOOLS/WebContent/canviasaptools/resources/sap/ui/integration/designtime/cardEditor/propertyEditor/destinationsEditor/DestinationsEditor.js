/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/integration/designtime/baseEditor/propertyEditor/BasePropertyEditor","sap/ui/integration/designtime/cardEditor/propertyEditor/complexMapEditor/ComplexMapEditor","sap/base/util/restricted/_merge"],function(B,C,_){"use strict";var D=C.extend("sap.ui.integration.designtime.cardEditor.propertyEditor.destinationsEditor.DestinationsEditor",{renderer:B.getMetadata().getRenderer().render});D.prototype.setConfig=function(c){var t={};if(c["allowKeyChange"]!==false){t={label:{label:this.getI18nProperty("CARD_EDITOR.DESTINATION.LABEL"),type:"string",path:"label"},name:{label:this.getI18nProperty("CARD_EDITOR.DESTINATION.NAME"),type:"enum",path:"name","enum":c["allowedValues"]||[],allowCustomValues:true,allowBindings:false},defaultUrl:{label:this.getI18nProperty("CARD_EDITOR.DESTINATION.DEFAULT_URL"),type:"string",path:"defaultUrl"}};}else{t={name:{label:"{= ${label} || ${key}}",type:"enum",path:"name","enum":c["allowedValues"]||[],allowCustomValues:false,allowBindings:false}};}var o=_({},{template:t},c);C.prototype.setConfig.call(this,o);};return D;});
