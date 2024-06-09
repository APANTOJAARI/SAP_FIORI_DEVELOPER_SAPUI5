/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/jquery","sap/ui/core/Core","sap/ui/core/Control","sap/ui/integration/util/Manifest","sap/ui/integration/util/ServiceManager","sap/base/Log","sap/ui/integration/util/DataProviderFactory","sap/ui/integration/cards/BaseContent","sap/m/HBox","sap/m/VBox","sap/ui/core/Icon","sap/m/Text","sap/ui/model/json/JSONModel","sap/ui/model/resource/ResourceModel","sap/base/util/LoaderExtensions","sap/f/CardRenderer","sap/f/library","sap/ui/integration/library","sap/ui/core/InvisibleText","sap/ui/integration/util/Destinations","sap/ui/integration/util/LoadingProvider","sap/ui/integration/util/HeaderFactory","sap/ui/integration/util/ContentFactory"],function(q,C,a,b,S,L,D,B,H,V,I,T,J,R,c,d,l,e,f,g,h,i,j){"use strict";var M={TYPE:"/sap.card/type",DATA:"/sap.card/data",HEADER:"/sap.card/header",HEADER_POSITION:"/sap.card/headerPosition",CONTENT:"/sap.card/content",SERVICES:"/sap.ui5/services",APP_TYPE:"/sap.app/type",PARAMS:"/sap.card/configuration/parameters",DESTINATIONS:"/sap.card/configuration/destinations"};var k=l.cards.HeaderPosition;var m=e.CardDataMode;var n=a.extend("sap.ui.integration.widgets.Card",{metadata:{library:"sap.ui.integration",interfaces:["sap.f.ICard"],properties:{manifest:{type:"any",defaultValue:""},parameters:{type:"object",defaultValue:null},width:{type:"sap.ui.core.CSSSize",group:"Appearance",defaultValue:"100%"},height:{type:"sap.ui.core.CSSSize",group:"Appearance",defaultValue:"auto"},dataMode:{type:"sap.ui.integration.CardDataMode",group:"Behavior",defaultValue:m.Active},baseUrl:{type:"sap.ui.core.URI",defaultValue:null},manifestChanges:{type:"object[]"}},aggregations:{_header:{type:"sap.f.cards.IHeader",multiple:false,visibility:"hidden"},_content:{type:"sap.ui.core.Control",multiple:false,visibility:"hidden"}},events:{action:{allowPreventDefault:true,parameters:{actionSource:{type:"sap.ui.core.Control"},manifestParameters:{type:"object"},parameters:{type:"object"},type:{type:"sap.ui.integration.CardActionType"}}},manifestReady:{parameters:{}}},associations:{hostConfigurationId:{},host:{}}},renderer:d});n.prototype.init=function(){this._ariaText=new f({id:this.getId()+"-ariaText"});this._oRb=C.getLibraryResourceBundle("sap.f");this.setModel(new J(),"parameters");this._busyStates=new Map();};n.prototype._initReadyState=function(){this._aReadyPromises=[];this._awaitEvent("_headerReady");this._awaitEvent("_contentReady");this._awaitEvent("_cardReady");Promise.all(this._aReadyPromises).then(function(){this._bReady=true;this.fireEvent("_ready");}.bind(this));};n.prototype._clearReadyState=function(){this._bReady=false;this._aReadyPromises=[];};n.prototype.onBeforeRendering=function(){var s=this.getHostConfigurationId();if(this.getDataMode()!==m.Active){return;}if(s){this.addStyleClass(s.replace(/-/g,"_"));}if(this._bApplyManifest){this._bApplyManifest=false;var v=this.getManifest();this._clearReadyState();this._initReadyState();if(!v){this.destroyManifest();}else{this.createManifest(v,this.getBaseUrl());}}};n.prototype.setManifest=function(v){this.setProperty("manifest",v);this._bApplyManifest=true;return this;};n.prototype.setManifestChanges=function(v){this.setProperty("manifestChanges",v);this._bApplyManifest=true;return this;};n.prototype.setParameters=function(v){this.setProperty("parameters",v);this._bApplyManifest=true;return this;};n.prototype.setHost=function(v){this.setAssociation("host",v);if(this._oDestinations){this._oDestinations.setHost(this.getHostInstance());}return this;};n.prototype.createManifest=function(v,s){var o={};this._isManifestReady=false;if(typeof v==="string"){o.manifestUrl=v;v=null;}if(this._oCardManifest){this._oCardManifest.destroy();}this._oCardManifest=new b("sap.card",v,s,this.getManifestChanges());this._oCardManifest.load(o).then(function(){this._isManifestReady=true;this.fireManifestReady();this._applyManifest();}.bind(this)).catch(this._applyManifest.bind(this));};n.prototype._applyManifest=function(){var p=this.getParameters(),o=this._oCardManifest;this._registerManifestModulePath();if(o&&o.getResourceBundle()){this._enhanceI18nModel(o.getResourceBundle());}o.processParameters(p);this._applyManifestSettings();};n.prototype._loadDefaultTranslations=function(){var r=C.getLibraryResourceBundle("sap.ui.integration");this._enhanceI18nModel(r);};n.prototype._enhanceI18nModel=function(r){var o=this.getModel("i18n");if(o){o.enhance(r);return;}o=new R({bundle:r});this.setModel(o,"i18n");};n.prototype._awaitEvent=function(E){this._aReadyPromises.push(new Promise(function(r){this.attachEventOnce(E,function(){r();});}.bind(this)));};n.prototype.isReady=function(){return this._bReady;};n.prototype.refresh=function(){if(this.getDataMode()===m.Active){this._clearReadyState();this._initReadyState();this.destroyManifest();this._bApplyManifest=true;this.invalidate();}};n.prototype.exit=function(){this.destroyManifest();this._busyStates=null;this._oRb=null;if(this._ariaText){this._ariaText.destroy();this._ariaText=null;}};n.prototype.destroyManifest=function(){if(this._oCardManifest){this._oCardManifest.destroy();this._oCardManifest=null;}if(this._oServiceManager){this._oServiceManager.destroy();this._oServiceManager=null;}if(this._oDataProviderFactory){this._oDataProviderFactory.destroy();this._oDataProviderFactory=null;this._oDataProvider=null;}if(this._oLoadingProvider){this._oLoadingProvider.destroy();this._oLoadingProvider=null;}if(this._oTemporaryContent){this._oTemporaryContent.destroy();this._oTemporaryContent=null;}if(this._oDestinations){this._oDestinations.destroy();this._oDestinations=null;}this.destroyAggregation("_header");this.destroyAggregation("_content");this._aReadyPromises=null;this._busyStates.clear();};n.prototype._registerManifestModulePath=function(){if(!this._oCardManifest){return;}this._sAppId=this._oCardManifest.get("/sap.app/id");if(this._sAppId){c.registerResourcePath(this._sAppId.replace(/\./g,"/"),this._oCardManifest.getUrl());}else{L.error("Card sap.app/id entry in the manifest is mandatory");}};n.prototype.getManifest=function(){var v=this.getProperty("manifest");if(v&&typeof v==="object"){return q.extend(true,{},v);}return v;};n.prototype.getParameters=function(){var v=this.getProperty("parameters");if(v&&typeof v==="object"){return q.extend(true,{},v);}return v;};n.prototype.getCombinedParameters=function(){if(!this._isManifestReady){L.error("The manifest is not ready. Consider using the 'manifestReady' event.","sap.ui.integration.widgets.Card");return null;}var p=this._oCardManifest.getProcessedParameters(this.getProperty("parameters")),r={},K;for(K in p){r[K]=p[K].value;}return r;};n.prototype.getManifestEntry=function(p){if(!this._isManifestReady){L.error("The manifest is not ready. Consider using the 'manifestReady' event.","sap.ui.integration.widgets.Card");return null;}return this._oCardManifest.get(p);};n.prototype.getManifestWithMergedChanges=function(){if(!this._oCardManifest||!this._oCardManifest._oManifest){L.error("The manifest is not ready. Consider using the 'manifestReady' event.","sap.ui.integration.widgets.Card");return{};}return q.extend(true,{},this._oCardManifest._oManifest.getRawJson());};n.prototype.resolveDestination=function(K){return this._oDestinations.getUrl(K);};n.prototype._applyManifestSettings=function(){var A=this._oCardManifest.get(M.APP_TYPE);if(A&&A!=="card"){L.error("sap.app/type entry in manifest is not 'card'");}if(this._oDataProviderFactory){this._oDataProviderFactory.destroy();}this._oDestinations=new g(this.getHostInstance(),this._oCardManifest.get(M.DESTINATIONS));this._oDataProviderFactory=new D(this._oDestinations);this._oLoadingProvider=new h();this._applyServiceManifestSettings();this._applyDataManifestSettings();this._applyHeaderManifestSettings();this._applyContentManifestSettings();};n.prototype._applyDataManifestSettings=function(){var o=this._oCardManifest.get(M.DATA);if(!o){this.fireEvent("_cardReady");return;}if(this._oDataProvider){this._oDataProvider.destroy();}this._oDataProvider=this._oDataProviderFactory.create(o,this._oServiceManager);this._oLoadingProvider.createLoadingState(this._oDataProvider);if(this._oDataProvider){this.setModel(new J());this._oDataProvider.attachDataChanged(function(E){this.getModel().setData(E.getParameter("data"));if(this._createContentPromise){this._createContentPromise.then(function(p){p.onDataChanged();});}}.bind(this));this._oDataProvider.attachError(function(E){this._handleError("Data service unavailable. "+E.getParameter("message"));}.bind(this));this._oDataProvider.triggerDataUpdate().then(function(){this.fireEvent("_cardReady");this._handleCardLoading();}.bind(this));}};n.prototype._handleCardLoading=function(){var o=this.getCardContent();if(o&&!o.hasStyleClass("sapFCardErrorContent")&&o._oLoadingPlaceholder){var p=o.getAggregation("_content");if(p){p.removeStyleClass("sapFCardContentHidden");}o._oLoadingPlaceholder.destroy();}if(this._oLoadingProvider){this._oLoadingProvider.removeHeaderPlaceholder(this.getCardHeader());}this._oLoadingProvider.setLoading(false);};n.prototype._applyServiceManifestSettings=function(){var s=this._oCardManifest.get(M.SERVICES);if(!s){return;}if(!this._oServiceManager){this._oServiceManager=new S(s,this);}};n.prototype.getCardHeader=function(){return this.getAggregation("_header");};n.prototype.getCardHeaderPosition=function(){if(!this._oCardManifest){return"Top";}return this._oCardManifest.get(M.HEADER_POSITION)||k.Top;};n.prototype.getCardContent=function(){return this.getAggregation("_content");};n.prototype._applyHeaderManifestSettings=function(){var o=this.createHeader();if(!o){this.fireEvent("_headerReady");return;}this.destroyAggregation("_header");this.setAggregation("_header",o);if(o.isReady()){this.fireEvent("_headerReady");}else{o.attachEvent("_ready",function(){this.fireEvent("_headerReady");}.bind(this));}};n.prototype.getHostInstance=function(){var s=this.getHost();if(!s){return null;}return C.byId(s);};n.prototype._applyContentManifestSettings=function(){var s=this._oCardManifest.get(M.TYPE),o=this.getContentManifest(),A=s+" "+this._oRb.getText("ARIA_ROLEDESCRIPTION_CARD");this._ariaText.setText(A);if(!o){this.fireEvent("_contentReady");return;}this._setTemporaryContent(s,o);this._createContentPromise=this.createContent({cardType:s,contentManifest:o,serviceManager:this._oServiceManager,dataProviderFactory:this._oDataProviderFactory,appId:this._sAppId}).then(function(p){this._setCardContent(p);return p;}.bind(this));this._createContentPromise.catch(function(E){if(E){this._handleError(E);}}.bind(this));};n.prototype.createHeader=function(){var o=this._oCardManifest.get(M.HEADER),p=new i(this);return p.create(o,this._oCardManifest);};n.prototype.getContentManifest=function(){var s=this._oCardManifest.get(M.TYPE),o=s&&s.toLowerCase()==="component",p=this._oCardManifest.get(M.CONTENT),r=!!p;if(r&&!s){L.error("Card type property is mandatory!");return null;}if(!r&&!o){return null;}if(!p&&o){p=this._oCardManifest.getJson();}return p;};n.prototype.createContent=function(o){var p=new j(this);o.cardManifest=this._oCardManifest;return p.create(o);};n.prototype.onAfterRendering=function(){var s;if(this._oCardManifest&&this._oCardManifest.get(M.TYPE)){s=this._oCardManifest.get(M.TYPE).toLowerCase();}if(s==="analytical"){this.$().addClass("sapFCardAnalytical");}};n.prototype._setCardContent=function(o){o.attachEvent("_error",function(E){this._handleError(E.getParameter("logMessage"),E.getParameter("displayMessage"));}.bind(this));var p=this.getAggregation("_content");if(p&&p!==this._oTemporaryContent){p.destroy();}this.setAggregation("_content",o);if(o.isReady()){this.fireEvent("_contentReady");}else{o.attachEvent("_ready",function(){this.fireEvent("_contentReady");}.bind(this));}};n.prototype._setTemporaryContent=function(s,o){var t=this._getTemporaryContent(s,o),p=this.getAggregation("_content");if(p&&p!==t){p.destroy();}this.setAggregation("_content",t);};n.prototype._handleError=function(s,o){L.error(s);this.fireEvent("_error",{message:s});var p="Unable to load the data.",E=o||p,P=this.getAggregation("_content");var r=new H({justifyContent:"Center",alignItems:"Center",items:[new I({src:"sap-icon://message-error",size:"1rem"}).addStyleClass("sapUiTinyMargin"),new T({text:E})]}).addStyleClass("sapFCardErrorContent");if(P&&!P.hasStyleClass("sapFCardErrorContent")){P.destroy();this.fireEvent("_contentReady");}r.addEventDelegate({onAfterRendering:function(){if(!this._oCardManifest){return;}var t=this._oCardManifest.get(M.TYPE)+"Content",u=this._oCardManifest.get(M.CONTENT),v=B.getMinHeight(t,u,r);if(this.getHeight()==="auto"){r.$().css({"min-height":v});}}},this);this.setAggregation("_content",r);};n.prototype._getTemporaryContent=function(s,o){if(!this._oTemporaryContent&&this._oLoadingProvider){this._oTemporaryContent=this._oLoadingProvider.createContentPlaceholder(o,s);this._oTemporaryContent.addEventDelegate({onAfterRendering:function(){if(!this._oCardManifest){return;}var t=this._oCardManifest.get(M.TYPE)+"Content",p=this._oCardManifest.get(M.CONTENT),r=B.getMinHeight(t,p,this._oTemporaryContent);if(this.getHeight()==="auto"){this._oTemporaryContent.$().css({"min-height":r});}}},this);}return this._oTemporaryContent;};n.prototype.setDataMode=function(s){if(this._oDataProviderFactory&&s===m.Inactive){this._oDataProviderFactory.destroy();this._oDataProviderFactory=null;}this.setProperty("dataMode",s,true);if(this.getProperty("dataMode")===m.Active){this.refresh();}return this;};n.prototype.loadDesigntime=function(){if(!this._oCardManifest){return Promise.reject("Manifest not yet available");}var A=this._oCardManifest.get("/sap.app/id");if(!A){return Promise.reject("App id not maintained");}var s=A.replace(/\./g,"/");return new Promise(function(r,o){var p=s+"/"+(this._oCardManifest.get("/sap.card/designtime")||"designtime/Card.designtime");if(p){sap.ui.require([p,"sap/base/util/deepClone"],function(t,u){r({designtime:t,manifest:u(this._oCardManifest._oManifest.getRawJson(),30)});}.bind(this),function(){o({error:p+" not found"});});}else{o();}}.bind(this));};n.prototype.isLoading=function(){return this._oLoadingProvider?this._oLoadingProvider.getLoadingState():false;};return n;});
