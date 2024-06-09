/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./MessageStripUtilities"],function(M){"use strict";var a={apiVersion:2};a.render=function(r,c){this.startMessageStrip(r,c);this.renderAriaTypeText(r,c);if(c.getShowIcon()){this.renderIcon(r,c);}this.renderTextAndLink(r,c);if(c.getShowCloseButton()){this.renderCloseButton(r,c);}this.endMessageStrip(r);};a.startMessageStrip=function(r,c){r.openStart("div",c);r.class(M.CLASSES.ROOT);r.class(M.CLASSES.ROOT+c.getType());r.attr(M.ATTRIBUTES.CLOSABLE,c.getShowCloseButton());r.accessibilityState(c,this.getAccessibilityState.call(c));r.openEnd();};a.renderAriaTypeText=function(r,c){r.openStart("span");r.class("sapUiPseudoInvisibleText");r.openEnd();r.text(M.getAriaTypeText.call(c));r.close("span");};a.renderIcon=function(r,c){r.openStart("div");r.class(M.CLASSES.ICON);r.openEnd();r.icon(M.getIconURI.call(c),null,{"title":null,"aria-hidden":true});r.close("div");};a.renderTextAndLink=function(r,c){var f=c.getAggregation("_formattedText");r.openStart("div");r.class(M.CLASSES.MESSAGE);r.openEnd();if(c.getEnableFormattedText()&&f){r.renderControl(f);}else{r.renderControl(c.getAggregation("_text"));}r.renderControl(c.getLink());r.close("div");};a.renderCloseButton=function(r,c){r.renderControl(c.getAggregation("_closeButton"));};a.endMessageStrip=function(r){r.close("div");};return a;},true);
