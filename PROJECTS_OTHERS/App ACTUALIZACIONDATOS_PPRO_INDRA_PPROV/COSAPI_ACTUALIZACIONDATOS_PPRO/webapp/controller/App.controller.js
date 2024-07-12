sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/m/MessageBox",
        "sap/ui/model/json/JSONModel"
    ],
    function(BaseController, MessageBox, JSONModel) {
      "use strict";
  
      return BaseController.extend("ns.cosapi.actualizacionproveedor.controller.App", {
        onInit: async function () {
          await this.getInfoUser();
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
                      that.getCurrentUserData("67EXWVFAY5@TIPPABBLE.COM");
                      resolve(true);
                      }
                  });
              } else {
                  that.getCurrentUserData("67EXWVFAY5@TIPPABBLE.COM");
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
                      oModel.setProperty("/givenName", userData.Resources[0].name.givenName);
                      oModel.setProperty("/familyName", userData.Resources[0].name.familyName);
                      oModel.setProperty("/userId", userData.Resources[0].userName);
                      oModel.setProperty("/userAndName", userData.Resources[0].userName + "-" + userData.Resources[0].name.givenName + " " + userData.Resources[0].name.familyName);

                      if (userData.Resources[0].groups) {
                        let oFindProv = userData.Resources[0].groups.find(oPos => oPos.display == "GRP_PROV_ACTUALIZAR_DATOS")

                        if (oFindProv) {
                          oModel.setProperty("/rol", oFindProv.display);
                          oModel.setProperty("/editable", true);
                        } else {
                          oModel.setProperty("/rol", "ADMIN");
                          oModel.setProperty("/editable", false);
                        }
                      } else {
                        oModel.setProperty("/editable", false);
                      }
                      
                  }
              }
          });
          var url = "";
          url = this.getBaseURL() + "/scim/Users?filter=emails.value eq \"" + email + "\"";
  
          xhr.open("GET", url, false);
          xhr.send();
        },

        getBaseURL: function () {
          var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
          var appPath = appId.replaceAll(".", "/");
          var appModulePath = jQuery.sap.getModulePath(appPath);
          return appModulePath;
        },
      });
    }
  );
  