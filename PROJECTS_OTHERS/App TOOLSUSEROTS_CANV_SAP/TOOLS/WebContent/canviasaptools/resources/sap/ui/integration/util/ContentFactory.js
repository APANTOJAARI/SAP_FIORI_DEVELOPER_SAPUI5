/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Core","sap/ui/base/Object","sap/ui/integration/util/BindingHelper","./CardActions"],function(C,B,a,b){"use strict";var c=B.extend("sap.ui.integration.util.ContentFactory",{metadata:{library:"sap.ui.integration"},constructor:function(o){B.call(this);this._oCard=o;}});c.prototype.create=function(m){var o=this._oCard,t=m.cardType;return new Promise(function(r,d){var f=function(g){if((m.cardManifest&&m.cardManifest.isDestroyed())||(m.dataProviderFactory&&m.dataProviderFactory.isDestroyed())){d();return;}var h=new g(),A=new b({card:o});h._sAppId=m.appId;h.setServiceManager(m.serviceManager);h.setDataProviderFactory(m.dataProviderFactory);h.setActions(A);if(t.toLowerCase()!=="adaptivecard"){h.setConfiguration(a.createBindingInfos(m.contentManifest),t);}else{h.setConfiguration(m.contentManifest);}r(h);};try{switch(t.toLowerCase()){case"list":sap.ui.require(["sap/ui/integration/cards/ListContent"],f);break;case"calendar":sap.ui.require(["sap/ui/integration/cards/CalendarContent"],f);break;case"table":sap.ui.require(["sap/ui/integration/cards/TableContent"],f);break;case"object":sap.ui.require(["sap/ui/integration/cards/ObjectContent"],f);break;case"analytical":C.loadLibrary("sap.viz",{async:true}).then(function(){sap.ui.require(["sap/ui/integration/cards/AnalyticalContent"],f);}).catch(function(){d("Analytical content type is not available with this distribution.");});break;case"analyticscloud":sap.ui.require(["sap/ui/integration/cards/AnalyticsCloudContent"],f);break;case"timeline":C.loadLibrary("sap.suite.ui.commons",{async:true}).then(function(){sap.ui.require(["sap/ui/integration/cards/TimelineContent"],f);}).catch(function(){d("Timeline content type is not available with this distribution.");});break;case"component":sap.ui.require(["sap/ui/integration/cards/ComponentContent"],f);break;case"adaptivecard":sap.ui.require(["sap/ui/integration/cards/AdaptiveContent"],f);break;default:d(t.toUpperCase()+" content type is not supported.");}}catch(e){d(e);}});};return c;});
