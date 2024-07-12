sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/core/UIComponent",
        "sap/ui/core/routing/History"
    ],
    function(Controller,
	UIComponent,
	History) {
      "use strict";
  
      return Controller.extend("ns.cosapi.creacionlistadofactura.controller.Base", {
        onInit: function() {
          
        },
        getRouter:function(){
          return UIComponent.getRouterFor(this);
        },
        onNavto:function(viewRoute,param=null){
           this.getRouter().navTo(viewRoute,param);
        },
        onNavBack:function(){
          let oHistory, sPreviewHash;
          oHistory = History.getInstance();
          sPreviewHash= oHistory.getPreviousHash();
          if(sPreviewHash != undefined){
            window.history.go(-1);
          }else{
            this.getRouter().navTo("RouteHome");
          }
        },
        getResourceBundle : function () {
          return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        readEntity: function(odataModel,path,parameters){
            return new Promise((resolve,reject) => {
                odataModel.read(path,{
                    filters: parameters.filters,
                    urlParameters: parameters.urlParameters,
                    success: resolve,
                    error: reject
                });
            });
        },

        createEntity:function(odataModel,path,data){
            return new Promise((resolve,reject)=>{
                odataModel.create(path,data,{
                    success:resolve,
                    error:reject
                });
            });
        },

        updateEntity:function(odataModel,path,data){
            return new Promise((resolve,reject)=>{
                odataModel.update(path,data,{
                    success:resolve,
                    error:reject
                });
            });
        },
        deleteEntity:function(odataModel,path,data){
            return new Promise((resolve,reject)=>{
                odataModel.remove(path,{
                    success:resolve,
                    error:reject
                });
            });
        },
        onFormatearFecha:function(fecha){
          let año = fecha.getFullYear();

          // Los métodos getMonth() y getDate() devuelven valores de 0 a 11 para los meses y de 1 a 31 para los días, respectivamente.
          // Si necesitas que el mes y el día tengan siempre dos dígitos, puedes agregar un 0 delante si son menores que 10.
          let mes = (fecha.getMonth() + 1 < 10 ? '0' : '') + (fecha.getMonth() + 1);
          let día = (fecha.getDate() < 10 ? '0' : '') + fecha.getDate();

          // Concatenar los componentes de la fecha en el formato deseado
          let fechaFormateada = año + mes + día;

          return fechaFormateada;
        },
        _getAppModulePath: function () {
          const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
          const appPath = appId.replaceAll(".", "/");
          return jQuery.sap.getModulePath(appPath);
        },
        getBaseURL: function () {
          var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
          var appPath = appId.replaceAll(".", "/");
          var appModulePath = jQuery.sap.getModulePath(appPath);
          return appModulePath;
        },
        getInfoUser: function(){
          return new Promise((resolve,reject) => {
              var that = this;
              var userDataModel = new sap.ui.model.json.JSONModel();
              userDataModel.setData({
                "givenName": "",
                "familyName": "",
                "userId": "",
                "userAndName": "",
                "editable": false
              });
              this.getOwnerComponent().setModel(userDataModel, "userData");
              if (sap.ushell.Container) {
                sap.ushell.Container.getServiceAsync("UserInfo").then(function (UserInfo) {
                    if (UserInfo.getEmail()) {
                      that.getCurrentUserData(UserInfo.getEmail());
                      resolve(true);
                    } else {
                      that.getCurrentUserData("jprumiche@indracompany.com");
                      resolve(true);
                    }
                });
              } else {
                that.getCurrentUserData("jprumiche@indracompany.com");
                resolve(true);
              }
          });
        },
        getCurrentUserData: function (email) {
          var that = this;
          var xhr = new XMLHttpRequest();
          xhr.withCredentials = true;
          xhr.addEventListener("readystatechange", function () {
              if (this.readyState === 4) {
                  var userData = JSON.parse(this.responseText);
                  var oModel = that.getOwnerComponent().getModel("userData");
                  if (oModel) {
                      oModel.setProperty("/email", email);
                      oModel.setProperty("/givenName", userData.Resources[0].name.givenName);
                      oModel.setProperty("/familyName", userData.Resources[0].name.familyName);
                      oModel.setProperty("/userId", userData.Resources[0].userName);
                      oModel.setProperty("/userAndName", userData.Resources[0].userName + "-" + userData.Resources[0].name.givenName + " " + userData.Resources[0].name.familyName);
                      oModel.setProperty("/esAprobador", false);
                      if (userData.Resources[0].groups) {
                        let oFindProv = userData.Resources[0].groups.find(oPos => oPos.display == "GRP_PROV_ADMIN_COSAPI")

                        if (oFindProv) {
                          oModel.setProperty("/rol", oFindProv.display);
                          oModel.setProperty("/esAprobador", true);
                          oModel.setProperty("/userId", "");
                        } else {
                          let oFindProv = userData.Resources[0].groups.find(oPos => oPos.display == "GRP_PROV_CREAR_FACTURAS")
                          if (oFindProv) {
                            oModel.setProperty("/rol", oFindProv.display);
                            oModel.setProperty("/esAprobador", false);
                          } else {
                            oModel.setProperty("/rol", "");
                          }
                        }
                      } else {
                        oModel.setProperty("/rol", "");
                        oModel.setProperty("/esAprobador", false);
                      }
                  }
              }
          });
          var url = "";
          url = this.getBaseURL() + "/scim/Users?filter=emails.value eq \"" + email + "\"";
  
          xhr.open("GET", url, false);
          xhr.send();
        },
      });
    }
  );