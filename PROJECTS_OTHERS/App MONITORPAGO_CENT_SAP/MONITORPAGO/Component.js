sap.ui.define(["sap/ui/core/UIComponent","sap/ui/Device","h2h/centria/h2hmonitorpagosrpa/model/models"],function(e,t,i){"use strict";return e.extend("h2h.centria.h2hmonitorpagosrpa.Component",{metadata:{manifest:"json"},init:function(){e.prototype.init.apply(this,arguments);sap.ui.getCore().getConfiguration().setLanguage("es");this.getRouter().initialize();this.setModel(i.createDeviceModel(),"device")},initMockServer:function(){}})});