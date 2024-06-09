/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['./library','sap/ui/core/Control','./CheckBoxRenderer','sap/ui/core/library','sap/ui/Device'],function(l,C,a,c,D){"use strict";var T=c.TextDirection;var V=c.ValueState;var b=C.extend("sap.ui.commons.CheckBox",{metadata:{library:"sap.ui.commons",properties:{checked:{type:"boolean",group:"Data",defaultValue:false,bindable:"bindable"},text:{type:"string",group:"Appearance",defaultValue:null},enabled:{type:"boolean",group:"Behavior",defaultValue:true},editable:{type:"boolean",group:"Behavior",defaultValue:true},valueState:{type:"sap.ui.core.ValueState",group:"Data",defaultValue:V.None},width:{type:"sap.ui.core.CSSSize",group:"Dimension",defaultValue:null},textDirection:{type:"sap.ui.core.TextDirection",group:"Appearance",defaultValue:T.Inherit},name:{type:"string",group:"Misc",defaultValue:null}},associations:{ariaDescribedBy:{type:"sap.ui.core.Control",multiple:true,singularName:"ariaDescribedBy"},ariaLabelledBy:{type:"sap.ui.core.Control",multiple:true,singularName:"ariaLabelledBy"}},events:{change:{parameters:{checked:{type:"boolean"}}}}}});b.prototype.onclick=function(e){if(D.browser.msie&&!this.getEnabled()){this.$().attr("tabindex",0).addClass("sapUiCbFoc");}this.userToggle(e);};b.prototype.onfocusout=function(e){if(D.browser.msie&&!this.getEnabled()){this.$().attr("tabindex",-1).removeClass("sapUiCbFoc");}};b.prototype.onsapspace=function(e){this.userToggle(e);};b.prototype.userToggle=function(e){e.preventDefault();if(this.getEnabled()&&this.getEditable()){this.toggle();this.fireChange({checked:this.getChecked()});}else{this.getDomRef().focus();}};b.prototype.toggle=function(){this.setChecked(!this.getChecked());return this;};b.prototype.getAccessibilityInfo=function(){var B=sap.ui.getCore().getLibraryResourceBundle("sap.ui.commons");return{role:"checkbox",type:B.getText("ACC_CTR_TYPE_CHECKBOX"),description:(this.getText()||"")+(this.getChecked()?(" "+B.getText("ACC_CTR_STATE_CHECKED")):""),focusable:this.getEnabled(),enabled:this.getEnabled(),editable:this.getEditable()};};return b;});
