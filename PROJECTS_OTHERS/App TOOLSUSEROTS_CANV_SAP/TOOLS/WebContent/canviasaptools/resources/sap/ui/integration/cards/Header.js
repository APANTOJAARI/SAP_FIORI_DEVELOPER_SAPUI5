/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/f/cards/Header","sap/f/cards/HeaderRenderer","sap/ui/integration/util/BindingHelper","sap/ui/integration/formatters/IconFormatter",'sap/ui/model/json/JSONModel',"sap/ui/integration/util/LoadingProvider"],function(F,a,B,I,J,L){"use strict";var H=F.extend("sap.ui.integration.cards.Header",{constructor:function(c,A,s){c=c||{};this._sAppId=s;var S={title:c.title,subtitle:c.subTitle};if(c.status&&typeof c.status.text==="string"){S.statusText=c.status.text;}if(c.icon){S.iconSrc=c.icon.src;S.iconDisplayShape=c.icon.shape;S.iconInitials=c.icon.text;}S=B.createBindingInfos(S);if(S.iconSrc){S.iconSrc=B.formattedProperty(S.iconSrc,function(v){return I.formatSrc(v,s);});}S.toolbar=A;F.call(this,S);},metadata:{library:"sap.ui.integration",properties:{}},renderer:a});H.prototype.init=function(){F.prototype.init.call(this);this._bReady=false;this._oLoadingProvider=new L();this._aReadyPromises=[];this._awaitEvent("_dataReady");this._awaitEvent("_actionHeaderReady");Promise.all(this._aReadyPromises).then(function(){this._bReady=true;this.fireEvent("_ready");}.bind(this));};H.prototype.exit=function(){F.prototype.exit.call(this);this._oServiceManager=null;this._oDataProviderFactory=null;if(this._oLoadingProvider){this._oLoadingProvider.destroy();this._oLoadingProvider=null;}if(this._oDataProvider){this._oDataProvider.destroy();this._oDataProvider=null;}if(this._oActions){this._oActions.destroy();this._oActions=null;}};H.prototype.isReady=function(){return this._bReady;};H.prototype.isLoading=function(){var l=this._oLoadingProvider,c=this.getParent(),b=c.getMetadata()._sClassName==='sap.ui.integration.widgets.Card'?c.isLoading():false;return!l.getDataProviderJSON()&&(l.getLoadingState()||b);};H.prototype._updateModel=function(d){this.getModel().setData(d);};H.prototype._handleError=function(l){this.fireEvent("_error",{logMessage:l});};H.prototype._awaitEvent=function(e){this._aReadyPromises.push(new Promise(function(r){this.attachEventOnce(e,function(){r();});}.bind(this)));};H.prototype.setServiceManager=function(s){this._oServiceManager=s;return this;};H.prototype.setDataProviderFactory=function(d){this._oDataProviderFactory=d;return this;};H.prototype._setData=function(d){var p="/";if(d&&d.path){p=d.path;}this.bindObject(p);if(this._oDataProvider){this._oDataProvider.destroy();}this._oDataProvider=this._oDataProviderFactory.create(d,this._oServiceManager);this._oLoadingProvider.createLoadingState(this._oDataProvider);if(this._oDataProvider){this.setModel(new J());this._oDataProvider.attachDataChanged(function(e){this._updateModel(e.getParameter("data"));}.bind(this));this._oDataProvider.attachError(function(e){this._handleError(e.getParameter("message"));}.bind(this));this._oDataProvider.triggerDataUpdate().then(function(){this.fireEvent("_dataReady");this._oLoadingProvider.setLoading(false);this._oLoadingProvider.removeHeaderPlaceholder(this);}.bind(this));}else{this.fireEvent("_dataReady");}};return H;});
