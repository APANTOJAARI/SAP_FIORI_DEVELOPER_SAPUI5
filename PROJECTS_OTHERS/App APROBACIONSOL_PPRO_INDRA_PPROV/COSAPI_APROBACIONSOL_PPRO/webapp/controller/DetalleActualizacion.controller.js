sap.ui.define([
  "./BaseController",
  "sap/m/MessageToast",
  "sap/base/Log",
  "sap/ui/model/json/JSONModel",
  "sap/ui/Device",
  "sap/m/MessageBox",
  "sap/ui/core/Element",
  "sap/ui/layout/HorizontalLayout",
  "sap/ui/layout/VerticalLayout",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/Label",
  "sap/m/library",
  "sap/m/Text",
  "sap/m/TextArea",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/format/DateFormat"
],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (BaseController, MessageToast, Log, JSONModel, Device, MessageBox, Element, HorizontalLayout,
    VerticalLayout, Dialog, Button, Label, mobileLibrary, Text, TextArea, Filter, FilterOperator, DateFormat) {
    "use strict";

    let ButtonType = mobileLibrary.ButtonType;
    let DialogType = mobileLibrary.DialogType;
    let that,
      oModelPreRegProv;

    //Varibales dms
    let rutaInicial = "/apidms/browser/"; //despliegue
    //let rutaInicial ="/browser/";           //Local
    let Repositoryid = "";
    let bHayDocumento = false;

    return BaseController.extend("ns.cosapi.aprobacionsolppro.controller.DetalleActualizacion", {
      onInit: function () {
        that = this;
        oModelPreRegProv = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_PROV_SRV");
        this.getRouter().getRoute("DetalleActualizacion").attachPatternMatched(this._onObjectMatched, this)
      },

      _onObjectMatched: async function () {
        sap.ui.core.BusyIndicator.show(0)
        this.inciarModelosArrays()
        if (this.getOwnerComponent().getModel("oActualizacion") == undefined) {
          sap.ui.core.BusyIndicator.hide()
          this.onNavBack()
        }
        Repositoryid = this.onObtenerRepositorioId()
        let oActualizacion = this.getOwnerComponent().getModel("oActualizacion").getData()
        let oNewMmodeloProveedor = this.formatoModelSAPtoBtp(oActualizacion)
        this.setModel(new JSONModel(oNewMmodeloProveedor), "oProveedor");

        this.getView().getModel("ListaReferencias").setProperty("/data", oActualizacion.ReferenciasFinDetSet.results)
        this.getView().getModel("ListaLineaProducto").setProperty("/data", oNewMmodeloProveedor.LineaProducto.LineaProductoDetSet)
        this.getView().getModel("ListaPrincClientes").setProperty("/data", oNewMmodeloProveedor.ExpClienteCab.ExpPrincClientesDetSet)
        this.getView().getModel("ListaLinNegocio").setProperty("/data", oNewMmodeloProveedor.LineaNegocio.LineaNegocioDetSet)
        this.completarCamposCalidad(oActualizacion.SistemasCalidadDetSet.results)

        this.byId("iconTabBar").setSelectedKey("Contacto")
        var oViewModel = this.getView().getModel();
        oViewModel.setProperty("/Source", "");
        oViewModel.setProperty("/Title", "");
        oViewModel.setProperty("/Height", "600px");
        oViewModel.setProperty("/File", {});
        var oModelUser = this.getOwnerComponent().getModel("userData");
        oModelUser.setProperty("/Codigoestado", oActualizacion.Codigoestado);


        this._getListaPaises()
        //this._getListaGrupos()
        //this._getListaCategoria()
        this._getListaMoneda()
        this._getListaNombreBanco()
        this._getListaTipoPlanes()
        this._getListaTipoCuenta()
        this._getListaSucursal()
        this._getOrgCompras(); //+@ INSERT
        //this._getListaEspecialidad()
        await this.obtenerDocumentos();
        await this._obtenerDocumentosCertificados();
        sap.ui.core.BusyIndicator.hide()
      },

      inciarModelosArrays: function () {
        let oDataRef = { data: [] };

        let oModelReferencia = this.getView().getModel("ListaReferencias");
        if (!oModelReferencia) {
          oModelReferencia = new sap.ui.model.json.JSONModel(oDataRef);
          this.getView().setModel(oModelReferencia, "ListaReferencias");
        } else {
          this.getView().setModel(oModelReferencia, "ListaReferencias");
        }

        let oDataLineaProducto = { data: [] };

        let oModelLineaProducto = this.getView().getModel("ListaLineaProducto");
        if (!oModelLineaProducto) {
          oModelLineaProducto = new sap.ui.model.json.JSONModel(oDataLineaProducto);
          this.getView().setModel(oModelLineaProducto, "ListaLineaProducto");
        } else {
          this.getView().setModel(oModelLineaProducto, "ListaLineaProducto");
        }

        let oDataPrinClientes = { data: [] };

        let oModelPrinClientes = this.getView().getModel("ListaPrincClientes");
        if (!oModelPrinClientes) {
          oModelPrinClientes = new sap.ui.model.json.JSONModel(oDataPrinClientes);
          this.getView().setModel(oModelPrinClientes, "ListaPrincClientes");
        } else {
          this.getView().setModel(oModelPrinClientes, "ListaPrincClientes");
        }

        let oDataLineaNegocio = { data: [] };

        let oModelLineaNegocio = this.getView().getModel("ListaLinNegocio");
        if (!oModelLineaNegocio) {
          oModelLineaNegocio = new sap.ui.model.json.JSONModel(oDataLineaNegocio);
          this.getView().setModel(oModelLineaNegocio, "ListaLinNegocio");
        } else {
          this.getView().setModel(oModelLineaNegocio, "ListaLinNegocio");
        }

        //Iniciar modelo de documentos y certificaciones
        let aDocumentos = {
          brochure: [],
          balance: [],
          estado: [],
          certificado_tributaria: [],
          celula: [],
          certificado_cuenta: [],
          certificado_iso: [],
          legajo: [],
          terminos: [],
          sistema: [],
          planes: []  //+@INSERT
        }
        this.setModel(new JSONModel(aDocumentos), "aDocumentos")
      },

      onNavBack: function () {
        this.getRouter().navTo("RouteHome");
      },

      onAprobarWithComentary: function () {
        //Nueva funcionalidad Aprobar con comentario +@INSERT
        this.onAprobarComentary();
      },
      onAprobar: async function () {
        let oDatosEnviar = this.getOwnerComponent().getModel("oActualizacion").getData();
        let proveedor = { exists: false, idBp: "", results: [] };

        sap.ui.core.BusyIndicator.show(0)
        async function delay(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
        //Verificar si existe el proveedor
        proveedor = await that._checkProveedor(oDatosEnviar.Taxnumxl); //+@INSERT

        let oBP = await that._createProveedorApi(proveedor) //+@MODIFY
        if (oBP.type == "S") {
          let bValidate = await that._approvePreRegistro()
          if (bValidate) {
            await delay(1000);
            let sId = await that._getIdUserIas()
            await that.updateGroupsUser(sId)
            await that._addBpTableSAP(oBP.sBP)
          }
        } else {
          MessageBox.error(oBP.message)
          sap.ui.core.BusyIndicator.hide()
        }
      },

      //Se crea el BP de la API ODATA SAP estandar
      _createProveedorApi: async function (existsProv) {
        return new Promise(async (resolve, reject) => {

          let fechaFinVenc;
          let districtProv = "";
          let ciudad ="";
          let oRetun = {
            type: "S",
            sBP: "",
            message: ""
          }

          fechaFinVenc = this.getDateEnd(2);  //+@INSERT - Obtener la Fecha de Vencimiento

          let oDatosEnviar = this.getOwnerComponent().getModel("oActualizacion").getData()

          if (oDatosEnviar.ContactoComercialDetSet.results.length == 0) {
            oRetun.type = "E"
            oRetun.message = "El proveedor debe tener al menos 1 contacto comercial."
            resolve(oRetun)
            return
          }

          if (oDatosEnviar.Land1 == "PE") {
            districtProv = this.getView().byId("cboMainDistrito").getValue();
          } else {
            districtProv = oDatosEnviar.Ort02Text;
          }
          //Otro campo
          if (oDatosEnviar.Land1 == "PE") {
            ciudad = this.byId("cboMainCiudad").getValue();
          } else {
            ciudad = oDatosEnviar.Pfach;
          }

          let datoEnviar =
          {
            "SearchTerm1": oDatosEnviar.Taxnumxl,
            "SearchTerm2":  oDatosEnviar.Name1.substring(20),  //+@INSERT
            "FormOfAddress": "0003",
            "OrganizationBPName1": oDatosEnviar.Name1.substring(0, 40),
            "OrganizationBPName2": oDatosEnviar.Name1.substring(40),
            "OrganizationBPName3": oDatosEnviar.Name3,
            "OrganizationBPName4": oDatosEnviar.Name4,
            "BusinessPartnerFullName": oDatosEnviar.Fullname,
            "BusinessPartnerName": oDatosEnviar.Fullname,
            "BusinessPartnerCategory": "2",
            "BusinessPartnerGrouping": "Z001",
            "BusinessPartnerIsBlocked": false,
            "to_BusinessPartnerAddress": {
              "results": [
                {
                  "StreetName": oDatosEnviar.Stras,
                  "Country": oDatosEnviar.Pais,
                  "Region": oDatosEnviar.Ort01,
                  "District": districtProv,
                  "CityName": ciudad,  //that.byId("cboMainCiudad").getValue(),
                  "Language": "ES",
                  "AddressTimeZone": "UTC-5",
                //"ValidityEndDate": fechaFinVenc,  //
                  "HouseNumber": (oDatosEnviar.Stras.match(/\d+/) != null ? oDatosEnviar.Stras.match(/\d+/)[0] : "").substring(0, 10),
                  "to_EmailAddress": {
                    "results": [
                      {
                        "EmailAddress": oDatosEnviar.Correo
                      }
                    ]
                  },
                  "to_PhoneNumber": {
                    "results": [
                      {
                        "PhoneNumber": oDatosEnviar.Telefono
                      }
                    ]
                  },
                  "to_MobilePhoneNumber": {
                    "results": [
                      {
                        "PhoneNumber": oDatosEnviar.Telefono
                      }
                    ]
                  }
                }
              ]
            },
            "to_BusinessPartnerTax": {
              "results": [
                {
                  "BPTaxType": oDatosEnviar.Stcdt,
                  "BPTaxNumber": oDatosEnviar.Taxnumxl
                }
              ]
            },
            "to_BusinessPartnerBank": {
              "results": []
            },
            "to_BusinessPartnerRole": {
              "results": [
                {
                  BusinessPartnerRole: "FLVN00"
                },
                {
                  BusinessPartnerRole: "FLVN01"
                }
              ]
            }
          }

          let aCuentasBancarias = oDatosEnviar.CuentasBancariasDetSet.results
          for (let i = 0; i < aCuentasBancarias.length; i++) {
            if (!aCuentasBancarias[i].Paisbanco && !aCuentasBancarias[i].Clavebanco) {
              continue
            }
            let oPos = {
              "BankCountryKey": aCuentasBancarias[i].Paisbanco,
              "BankNumber": aCuentasBancarias[i].Clavebanco,
              "BankControlKey": aCuentasBancarias[i].Tipocuenta,
              "BankAccount": aCuentasBancarias[i].Numcuenta,
              "BankAccountReferenceText": aCuentasBancarias[i].Cuentainterbancaria,
              "BankAccountHolderName": aCuentasBancarias[i].Cuentainterbancaria,   //aCuentasBancarias[i].Titularnombre,
              "BankAccountName": aCuentasBancarias[i].Correopagos
            }

            /* Comentar esta lógica ya no aplica -@DELETE
            if ( i == 0 ) {
              if (aCuentasBancarias[i].Nombrebanco.indexOf("CL") > 0) {
                oPos.BankIdentification = "CLP1"
              } else {
                oPos.BankIdentification = "PEN1"
              }
            } else if ( i == 1 ) {
              oPos.BankIdentification = "USD1";
            } else if ( i == 2 ) {
              //oPos.BankIdentification = "DET"
              oPos.BankIdentification = "ZDET";
            }*/

            switch (aCuentasBancarias[i].Selectcuentasodode) {  //+@INSERT - MEJORA
              /*
              case "SOLES":
                oPos.BankIdentification = "PEN1"
              break;
              case "DOLARES":
                oPos.BankIdentification = "USD1";
              break;*/
              case "DETRACCIONES":
                oPos.BankIdentification = "ZDET";
                break;
              default:
                oPos.BankIdentification = `${aCuentasBancarias[i].Moneda}` + `${aCuentasBancarias[i].Bancopos}`;//Otras opciones
                break;
            }

            if (oDatosEnviar.Land1 != "PE") {
              oPos.BankCountryKey = "PE";

              if (oDatosEnviar.Land1 == "CL") //+@INSERT 
              {
                oPos.BankCountryKey = "CL";
              }

              if (aCuentasBancarias[i].Swift) {
                oPos.BankAccountHolderName = aCuentasBancarias[i].Swift;
              }

              if (aCuentasBancarias[i].Iban) {
                oPos.BankAccountHolderName = aCuentasBancarias[i].Iban;
              }
            }

            /*
            if (aCuentasBancarias[i].Tipocuenta == "CA") {
              oPos.BankControlKey = "02"
            }else{
              oPos.BankControlKey = "01"
            }*/

            //Validación de BANCOS para enviar solo 16 caracteres
            if (aCuentasBancarias[i].Clavebanco == "S11" || aCuentasBancarias[i].Clavebanco == "D11") {
              try {
                let newCta = aCuentasBancarias[i].Numcuenta;
                oPos.BankAccount = newCta.substring(4);
              } catch (error) {
                oPos.BankAccount = aCuentasBancarias[i].Numcuenta;
              }
            }

            datoEnviar.to_BusinessPartnerBank.results.push(oPos)
          }

          let toSupplierCompany = {
            Supplier: "",
            CompanyCode: "PE02",
            PaymentTerms: "C060",
            Currency: oDatosEnviar.Land1 == "PE" ? "PEN" : "USD",
            ReconciliationAccount: "4212000000",
            PaymentMethodsList: "T",
            IsToBeCheckedForDuplicates: true,
            SupplierAccountGroup: "Z001",
            CashPlanningGroup: "A99"
          }
          /*
          let to_SupplierPurchasingOrg = {
            Supplier: "",
            PurchasingOrganization: "COPE",
            CalculationSchemaGroupCode: oDatosEnviar.Land1 == "PE" ? "Z1" : "Z2",
            InvoiceIsGoodsReceiptBased: true,
            PaymentTerms: "C060",
            PurchaseOrderCurrency: oDatosEnviar.Land1 == "PE" ? "PEN" : oDatosEnviar.Land1 == "CL" ? "CLP" : "USD",
            SupplierPhoneNumber: oDatosEnviar.ContactoComercialDetSet.results[0].Telefono,
            SupplierRespSalesPersonName: oDatosEnviar.ContactoComercialDetSet.results[0].Nombre
          }*/
          let to_SupplierPurchasingOrg = [];
          //Llenar los datos de organización de Compras +@INSERT
          this._setSupplierPurchasingOrg(to_SupplierPurchasingOrg,oDatosEnviar);

          //Contemplar los datos de telefono y correos  +@INSERT
          this._updateDatosAddress(datoEnviar);

          let oBp = await that._saveBusinessPartner(datoEnviar, existsProv)
          if (oBp.type == "S") {
            toSupplierCompany.Supplier = oBp.BusinessPartner
            //to_SupplierPurchasingOrg.Supplier = oBp.BusinessPartner;

            let to_SupplierWithHoldingTax = getFormatterSupplierWithHoldingTax(oDatosEnviar, oBp.BusinessPartner);
            to_SupplierWithHoldingTax.Supplier = oBp.BusinessPartner;

            let oSupplier = await that._saveSupplierCompany(toSupplierCompany, existsProv)
            if (oSupplier.type == "E") {
              oRetun.message = oSupplier.message
            }

            let oPurchasing = await that._saveSupplierPurchasingOrg(to_SupplierPurchasingOrg, existsProv,oBp.BusinessPartner)
            if (oPurchasing.type == "E") {
              oRetun.message = oPurchasing.message
            }

            for (let i = 0; i < to_SupplierWithHoldingTax.length; i++) {
              let oWithHoldingTax = await that._saveSupplierWithHoldingTax(to_SupplierWithHoldingTax[i], existsProv)
            }

            oRetun.sBP = oBp.BusinessPartner
            resolve(oRetun)
          } else {
            oRetun.type = "E"
            oRetun.message = oBp.message
            resolve(oRetun)
          }

        });

        function getFormatterSupplierWithHoldingTax(oDatosEnviar, sBP) {
          let aReturn = []
          let aOneRule = ["DE", "FC", "FG", "RE"]
          let aTwoRule = ["CF", "CG", "Q1", "Q3"]

          if (oDatosEnviar.Stcdt == "PE1") {

            let sPrimCaracters = oDatosEnviar.Taxnumxl.substring(0, 2);
            if (sPrimCaracters == "20") {
              for (let i = 0; i < aOneRule.length; i++) {
                let oReturn = {
                  "Supplier": sBP,
                  "CompanyCode": "PE02",
                  "WithholdingTaxType": aOneRule[i],
                }
                aReturn.push(oReturn)
              }
            } else if (sPrimCaracters == "10") {
              let oReturn = {
                "Supplier": sBP,
                "CompanyCode": "PE02",
                "WithholdingTaxType": "HR",
              }
              aReturn.push(oReturn)
            }

          } else if (oDatosEnviar.Stcdt == "CL1") {
            for (let i = 0; i < aTwoRule.length; i++) {
              let oReturn = {
                "Supplier": sBP,
                "CompanyCode": "PE02",
                "WithholdingTaxType": aTwoRule[i],
              }
              aReturn.push(oReturn)
            }
          } else {
            let oReturn1 = {
              "Supplier": sBP,
              "CompanyCode": "PE02",
              "WithholdingTaxType": "RX",
            }
            aReturn.push(oReturn1)
            let oReturn2 = {
              "Supplier": sBP,
              "CompanyCode": "PE02",
              "WithholdingTaxType": "Q2",
            }
            aReturn.push(oReturn2)
          }
          return aReturn
        }
      },

      _saveSupplierCompany: function (oDataSend, existsProv) {
        return new Promise(async (resolve, reject) => {
          let oReturn = {
            message: "",
            type: "S"
          }
          try {
            let API_BUSINESS_PARTNER = this.getOwnerComponent().getModel("API_BUSINESS_PARTNER");

            if (existsProv.exists) //+@INSERT Actualizar 
            {
              let companyCode = oDataSend.CompanyCode;
              let supplier = oDataSend.Supplier;

              let path = "/A_SupplierCompany(CompanyCode=" + "'" + `${companyCode}` + "',";
              path = path + "Supplier=" + "'" + `${supplier}` + "')";

              const oDataUpdate = await this.updateEntity(API_BUSINESS_PARTNER, path, oDataSend);
            } else {
              const oData = await this.createEntity(API_BUSINESS_PARTNER, "/A_SupplierCompany", oDataSend);
            }
            resolve(oReturn)
          } catch (error) {
            sap.ui.core.BusyIndicator.hide()
            oReturn.type = "E"
            oReturn.message = JSON.parse(error.responseText).error.message.value
            resolve(oReturn)
          }
        });
      },
      _saveSupplierPurchasingOrg:  function (oDataSend, existsProv,idBp) {
        return new Promise(async (resolve, reject) => {
          let oReturn = {
            message: "",
            type: "S"
          }
          if (oDataSend.length === 0) {
            return;
          }

          for (let index = 0; index < oDataSend.length; index++) {
            oDataSend[index].Supplier = idBp;
          }
          let SupplierCreate = [],
              SupplierUpdate = [];

          if (existsProv.supplier) {
          if (existsProv.supplier.to_SupplierPurchasingOrg.results.length > 0) 
          {
            let OdataSupplier = existsProv.supplier.to_SupplierPurchasingOrg.results;
            for (let index = 0; index < oDataSend.length; index++) 
            { 
              let CodeOrg = oDataSend[index].PurchasingOrganization;

              let resultExists = OdataSupplier.filter( x => x.PurchasingOrganization === CodeOrg  ); 
              if (resultExists.length > 0) {
                SupplierUpdate.push(oDataSend[index]);
              }else{
                SupplierCreate.push(oDataSend[index]);
              }
            }
          }else{
            SupplierCreate = oDataSend;
          }
        }else{
          SupplierCreate = oDataSend;
        }

          try {

            let API_BUSINESS_PARTNER = this.getOwnerComponent().getModel("API_BUSINESS_PARTNER");

            if (existsProv.exists) //+@INSERT -- Considerar Update BP 
            {
              for (let index = 0; index < SupplierUpdate.length; index++) 
              {
              let organization = SupplierUpdate[index].PurchasingOrganization;
              let supplier = SupplierUpdate[index].Supplier;

              let path = "/A_SupplierPurchasingOrg(PurchasingOrganization='" + `${organization}` + "'" +
                ",Supplier=" + "'" + `${supplier}` + "')";

              const oDataUpdate = await this.updateEntity(API_BUSINESS_PARTNER, path, SupplierUpdate[index]);
            }
            //Crear Nuevos registros
            if (SupplierCreate.length > 0) 
            {
              for (let index = 0; index < SupplierCreate.length; index++) 
              {
               const result = await this.createEntity(API_BUSINESS_PARTNER, "/A_SupplierPurchasingOrg", SupplierCreate[index]);
             }
          }

            } else {
              for (let index = 0; index < SupplierCreate.length; index++) 
              {
              const oData = await this.createEntity(API_BUSINESS_PARTNER, "/A_SupplierPurchasingOrg", SupplierCreate[index]);
              }
            }

            resolve(oReturn)
          } catch (error) {
            sap.ui.core.BusyIndicator.hide()
            oReturn.type = "E"
            oReturn.message = JSON.parse(error.responseText).error.message.value
            resolve(oReturn)
          }
        });
      },

      _saveSupplierWithHoldingTax: function (oDataSend, existsProv) {
        return new Promise(async (resolve, reject) => {
          let oReturn = {
            message: "",
            type: "S"
          }
          try {
            if (existsProv.exists) //+@INSERT -- Considerar Update BP 
            {
            } else {
              const oData = await this.createEntity(this.getOwnerComponent().getModel("API_BUSINESS_PARTNER"), "/A_SupplierWithHoldingTax", oDataSend);
            }
            resolve(oReturn);
          } catch (error) {
            sap.ui.core.BusyIndicator.hide()
            oReturn.type = "E"
            oReturn.message = JSON.parse(error.responseText).error.message.value
            resolve(oReturn)
          }
        });
      },

      _saveBusinessPartner: function (oData, existsProv) {
        return new Promise(async (resolve, reject) => {
          let oReturn = {
            message: "",
            type: "S",
            BusinessPartner: ""
          }
          try {
            let API_BUSINESS_PARTNER = this.getOwnerComponent().getModel("API_BUSINESS_PARTNER");
            let bp = {};

            //const bp = await this.createEntity(API_BUSINESS_PARTNER, "/A_BusinessPartner", oData);

            if (existsProv.exists) {                                                   //+@INSERT                                                                 
              await this.updateEntityProveedor(API_BUSINESS_PARTNER, existsProv, oData);
              oReturn.BusinessPartner = existsProv.idBp;
              resolve(oReturn)
              return;
            } else {
              bp = await this.createEntity(API_BUSINESS_PARTNER, "/A_BusinessPartner", oData);
            }

            oReturn.BusinessPartner = bp.BusinessPartner;
            resolve(oReturn);

          } catch (error) {
            sap.ui.core.BusyIndicator.hide()
            //MessageBox.error(JSON.parse(error.responseText).error.message.value)
            //resolve(JSON.parse(error.responseText).error.message.value)
            oReturn.type = "E"
            oReturn.message = JSON.parse(error.responseText).error.message.value
            resolve(oReturn)
          }
        });
      },

      //Se aprueba la solicitud actualización de datos
      _approvePreRegistro: async function () {
        return new Promise(async (resolve, reject) => {

          let oPreRegistro = this.getOwnerComponent().getModel("oActualizacion").getData()
          let oSendData = {
            "Taxnumxl": oPreRegistro.Taxnumxl,
            "Codigoestado": "07",
            "Usuario": "",
            "Correonombre": "",
            "Motivorechazo": oPreRegistro.Comentariolegajo //+@INSERT 
          }
          try {
            const oResultData = await this.createEntity(oModelPreRegProv, "/LogPPSet", oSendData)

            if (oResultData.Codigo == "500") {
              MessageBox.error(oResultData.Mensaje)
              resolve(false)
            } else {
              resolve(true)
            }
            console.log(oResultData)
          } catch (error) {
            sap.ui.core.BusyIndicator.hide()
            resolve(false)
          }
        });
      },

      _getIdUserIas: function () {
        return new Promise(function (resolve, reject) {
          let oPreRegistro = that.getOwnerComponent().getModel("oActualizacion").getData()

          $.ajax({
            type: "GET",
            async: false,
            url: that.getBaseURL() + "/scim/Users?filter=userName eq '" + oPreRegistro.Taxnumxl + "'",
            contentType: "application/scim+json",
            success: async function (data, textStatus, xhr) {
              resolve(data.Resources[0].id)
            },
            error: function (error) {
              console.log(error)
              resolve(false)
            }
          });
        });

      },

      updateGroupsUser: function (sId) {
        return new Promise(function (resolve, reject) {
          let oData = {
            "schemas": [
              "urn:ietf:params:scim:api:messages:2.0:PatchOp"
            ],
            "Operations": [
              {
                "op": "add",
                "path": "members",
                "value": [
                  {
                    "value": sId
                  }
                ]
              }
            ]
          }
          $.ajax({
            type: "PATCH",
            data: JSON.stringify(oData),
            async: false,
            url: that.getBaseURL() + "/scim/Groups/f5ac553c-8b9f-4678-acb9-a6e7cf4f4f3b",
            contentType: "application/scim+json",
            success: async function (data, textStatus, xhr) {
              resolve(true)
            },
            error: function (error) {
              resolve(false)
            }
          });
        });
      },

      //Agregar el codigo BP a la tabla Z
      _addBpTableSAP: async function (sBP) {
        return new Promise(async (resolve, reject) => {
          let oPreRegistro = this.getOwnerComponent().getModel("oActualizacion").getData()
          let oSendData = {
            "Taxnumxl": oPreRegistro.Taxnumxl,
            "Numerodebp": sBP
          }
          try {
            const oResultData = await this.createEntity(oModelPreRegProv, "/RegistroNumeroBPSet", oSendData)

            sap.ui.core.BusyIndicator.hide()
            if (oResultData.Codigo == "500") {
              MessageBox.error(oResultData.Mensaje)
            } else {
              MessageBox.success(oResultData.Mensaje, {
                onClose: function () {
                  that.onNavBack()
                }
              })
            }
          } catch (error) {
            sap.ui.core.BusyIndicator.hide()
            resolve(false)
          }
        });
      },

      onRechazar: function () {
        if (!this.oSubmitDialog) {
          this.oSubmitDialog = new Dialog({
            type: DialogType.Message,
            state: "Error",
            title: "Rechazar",
            content: [
              new Label({
                text: "¿Desea rechazar esta solicitud?",
                labelFor: "submissionNote"
              }),
              new TextArea("submissionNote", {
                width: "100%",
                placeholder: "Agregar Motivo (requerido)",
                liveChange: function (oEvent) {
                  var sText = oEvent.getParameter("value");
                  this.oSubmitDialog.getBeginButton().setEnabled(sText.length > 0);
                }.bind(this)
              })
            ],
            beginButton: new Button({
              type: ButtonType.Emphasized,
              text: "Aceptar",
              enabled: false,
              press: function () {
                var sText = Element.getElementById("submissionNote").getValue();
                this.oSubmitDialog.close();
                that._declinePreRegistro(sText);
              }.bind(this)
            }),
            endButton: new Button({
              text: "Cancelar",
              press: function () {
                this.oSubmitDialog.close();
              }.bind(this)
            })
          });
        }

        this.oSubmitDialog.open();
      },

      _declinePreRegistro: async function (sMessage) {
        let oPreRegistro = this.getOwnerComponent().getModel("oActualizacion").getData()
        let oSendData = {
          "Taxnumxl": oPreRegistro.Taxnumxl,
          "Codigoestado": "06",
          "Motivorechazo": sMessage,
          "Usuario": "",
          "Correonombre": ""
        }
        try {
          const oResultData = await this.createEntity(oModelPreRegProv, "/LogPPSet", oSendData)

          if (oResultData.Codigo == "500") {
            MessageBox.error(oResultData.Mensaje)
          } else {
            MessageBox.success(oResultData.Mensaje, {
              onClose: function () {
                that.onNavBack()
              }
            })
          }
          console.log(oResultData)
        } catch (error) {
          MessageBox.error(JSON.parse(error.responseText).error.message.value)
        }
      },

      /************************************************* */
      /** Funciones para la carga de documentos al DMS */
      /************************************************* */

      uploadPDFVerificar: function (oEvent) {
        var aFiles = oEvent.getParameter("files");
        var oFile = aFiles[0]; // Suponiendo que solo se permite cargar un archivo a la vez

        if (oFile) {
          var oReader = new FileReader();
          oReader.onload = function (e) {
            var sSourceURL = e.target.result;
            var oViewModel = this.getView().getModel();

            var decodedPdfContent = atob(sSourceURL.split(',')[1]);
            var byteArray = new Uint8Array(decodedPdfContent.length)
            for (var i = 0; i < decodedPdfContent.length; i++) {
              byteArray[i] = decodedPdfContent.charCodeAt(i);
            }
            var blob = new Blob([byteArray.buffer], { type: 'application/pdf' });
            var _pdfurl = URL.createObjectURL(blob);
            jQuery.sap.addUrlWhitelist("blob");

            oViewModel.setProperty("/Source", _pdfurl);
            oViewModel.setProperty("/Title", oFile.name);
            oViewModel.setProperty("/Height", "600px");
            oViewModel.setProperty("/File", oFile);
          }.bind(this);

          // Lee el archivo como una URL
          oReader.readAsDataURL(oFile);
        }
      },

      //Funcion para ejecutar las demás y guardar documentos
      onSaveLegajo: async function () {
        var oViewModel = this.getView().getModel()
        let oActualizacion = this.getOwnerComponent().getModel("oActualizacion").getData()
        let oForm = that.onFormDataFolder(oActualizacion.Taxnumxl)

        if (oViewModel.getProperty("/Source")) {
          if (!bHayDocumento) {
            //await that.onCreateCarpetasDMS( oForm, oActualizacion.Taxnumxl )
          }
          await that.guardarDocumentosAdjuntos(oActualizacion.Taxnumxl, "1", oViewModel.getProperty("/File"))
          MessageBox.success("Se guardó correctamente el documento.");
        } else {
          MessageBox.error("Por favor, cargar un documento.");
        }
      },

      //Crea carpetas en DMS
      onCreateCarpetasDMS: function (form, rutaCont) {
        let that = this;
        return new Promise((resolve, reject) => {

          $.ajax({
            url: that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR",
            type: "POST",
            "mimeType": "multipart/form-data",
            "contentType": false,
            "data": form,
            "processData": false,
            success: resolve,
            error: reject
          })
        });
      },

      //Guarda el documento en la carpeta creada anteriormente
      guardarDocumentosAdjuntos: function (rucProveedor, numSolicitud, oItemAdjunto) {
        let that = this;
        let oResult = {
          type: "S",
          message: "",
        };
        let aErrores = [];
        let idRepositorioDMS = Repositoryid;
        return new Promise(function (resolve, reject) {
          sap.ui.core.BusyIndicator.show(0);
          let oRequestOption = construirFormData(oItemAdjunto);

          fetch(that._getAppModulePath() + rutaInicial + idRepositorioDMS + "/root/PROVEEDOR/" + rucProveedor, oRequestOption)
            .then(response => response.text())
            .then(result => {
              console.log(result);
              sap.ui.core.BusyIndicator.hide();
              resolve(oResult);
            }).catch(error => {
              oResult.type = "E";
              oResult.message = JSON.stringify(error)
              aErrores.push(oResult);
              sap.ui.core.BusyIndicator.hide();
              resolve(oResult);
            });
        });
        //construye formdata para file
        function construirFormData(oFile) {
          let sName = that.formatoNombreArchivo(oFile.name)
          var myHeaders = new Headers();
          var formdata = new FormData();
          formdata.append("cmisaction", "createDocument");
          formdata.append("propertyId[0]", "cmis:name");
          formdata.append("propertyValue[0]", sName);
          formdata.append("propertyId[1]", "cmis:objectTypeId");
          formdata.append("propertyValue[1]", "cmis:document");
          formdata.append("filename", sName);
          formdata.append("_charset", "UTF-8");
          formdata.append("includeAllowableActions", "False");
          formdata.append("succinct", "true");
          formdata.append("media", oFile, sName);

          var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: formdata,
            redirect: 'follow'
          };

          return requestOptions;
        }
      },

      //Eliminacion y formato de caracteres raros en el nombre del archivo
      formatoNombreArchivo: function (sFile) {
        var textoCodificado = encodeURIComponent(sFile);
        var sNombre = decodeURIComponent(textoCodificado);
        var reemplazos = {
          'Ã': 'A', 'À': 'A', 'Á': 'A', 'Ä': 'A', 'Â': 'A',
          'È': 'E', 'É': 'E', 'Ë': 'E', 'Ê': 'E',
          'Ì': 'I', 'Í': 'I', 'Ï': 'I', 'Î': 'I',
          'Ò': 'O', 'Ó': 'O', 'Ö': 'O', 'Ô': 'O',
          'Ù': 'U', 'Ú': 'U', 'Ü': 'U', 'Û': 'U',
          'ã': 'a', 'à': 'a', 'á': 'a', 'ä': 'a', 'â': 'a',
          'è': 'e', 'é': 'e', 'ë': 'e', 'ê': 'e',
          'ì': 'i', 'í': 'i', 'ï': 'i', 'î': 'i',
          'ò': 'o', 'ó': 'o', 'ö': 'o', 'ô': 'o',
          'ù': 'u', 'ú': 'u', 'ü': 'u', 'û': 'u',
          'Ñ': 'N', 'ñ': 'n',
          'Ç': 'c', 'ç': 'c'
        };
        var textoNormalizado = sNombre.replace(/[ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç]/g, function (match) {
          return reemplazos[match];
        });
        return textoNormalizado;
      },

      //Obtener el ID del repostiorio
      onObtenerRepositorioId: function () {
        //return "0687b0df-65d8-45b5-802c-a5e76db45277";//PRD
        return "2ac5f6e5-9f27-4c41-8e73-9191cf7a90be"; //ID-QAS
      },

      //Creacion del FORMDATA del FOLDER (RUC)
      onFormDataFolder: function (sNombre) {
        var formOrden = new FormData();
        formOrden.append("cmisaction", "createFolder");
        formOrden.append("propertyId[0]", "cmis:name");
        formOrden.append("propertyValue[0]", sNombre);
        formOrden.append("propertyId[1]", "cmis:objectTypeId");
        formOrden.append("propertyValue[1]", "cmis:folder");
        formOrden.append("succinct", "true");
        return formOrden;
      },

      //Obtener documento existente
      obtenerDocumentos: function () {
        return new Promise(async (resolve, reject) => {
          let oActualizacion = this.getOwnerComponent().getModel("oActualizacion").getData()

          try {

            $.ajax({
              url: that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oActualizacion.Taxnumxl,
              type: "GET",
              "mimeType": "multipart/form-data",
              "contentType": false,
              "processData": false,
              success: function (data) {
                let aObjects = JSON.parse(data).objects.filter(oPos => oPos.object.properties["cmis:objectTypeId"].value != 'cmis:folder')
                if (aObjects.length == 0) {
                  bHayDocumento = false
                  resolve(true)
                } else {
                  let oReturn = encontrarArchivoActual(aObjects)
                  if (oReturn) {
                    let sUrl = that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oActualizacion.Taxnumxl + "/" + aObjects[0].object.properties["cmis:name"].value
                    var oViewModel = that.getView().getModel();
                    oViewModel.setProperty("/Source", sUrl);
                    oViewModel.setProperty("/Title", aObjects[0].object.properties["cmis:name"].value);
                    oViewModel.setProperty("/Height", "600px");
                    bHayDocumento = true
                  } else {
                    bHayDocumento = false
                  }
                  resolve(true)
                }

              },
              error: function (error) {
                let oError = JSON.parse(error.responseText)
                if (oError.exception = "objectNotFound") {
                  bHayDocumento = false
                  resolve(false)
                }
                resolve(false)
              },
            })

          } catch (error) {
            sap.ui.core.BusyIndicator.hide()
            MessageBox.error(JSON.parse(error.responseText).error.message.value)
          }
        });

        function encontrarArchivoActual(objetos) {
          return objetos.reduce(function (objetoMayor, objetoActual) {
            return new Date(objetoMayor.object.properties["cmis:creationDate"].value) > new Date(objetoMayor.object.properties["cmis:creationDate"].value) ? objetoActual : objetoMayor;
          });
        }
      },

      _getAppModulePath: function () {
        const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
        const appPath = appId.replaceAll(".", "/");
        return jQuery.sap.getModulePath(appPath);
      },

      /************************************************** */

      onChangePais: async function (oEvent) {
        let sKey = this.byId("cboMainPais").getSelectedKey()
        let filters = []
        filters.push(new Filter("Land1", "EQ", `${sKey}`))

        try {
          let oModel = this.getOwnerComponent().getModel()
          const aListaRegiones = await this.readEntity(oModelPreRegProv, "/ConsultaRegionDepartamentoSet", { filters })
          oModel.setProperty("/RegionDptp", aListaRegiones.results)
          if (aListaRegiones.results.length == 0) {
            this.byId("cboMainRegionDpto").setSelectedKey("")
            this.byId("cboMainCiudad").setSelectedKey("")
          } else {
            this.byId("cboMainRegionDpto").fireChange()
          }
        } catch (error) {
          MessageBox.error(error)
          console.log("Funcion onChangePais: " + error)
        }
      },

      onChangeRegion: async function (oEvent) {
        let sKey = this.byId("cboMainRegionDpto").getSelectedKey(),
          sKeyPais = this.byId("cboMainPais").getSelectedKey();

        let filters = [];
        filters.push(new Filter("Region", "EQ", `${sKey}`))
        filters.push(new Filter("Pais", "EQ", `${sKeyPais}`))

        try {
          let oModel = this.getOwnerComponent().getModel()
          const aListaCiudades = await this.readEntity(oModelPreRegProv, "/ConsultaRegDepCiudadSet", { filters })
          oModel.setProperty("/Ciudad", aListaCiudades.results)
          if (aListaCiudades.results.length == 0) {
            this.byId("cboMainCiudad").setSelectedKey("")
          } else {
            this.byId("cboMainCiudad").fireChange()  //+@INSERT
          }
        } catch (error) {
          console.log("Funcion onChangeRegion: " + error)
        }
      },

      //Funciones para obtener los DOCUMENTOS Y CERTIFICACIONES
      //Documentos y certificaciones
      // BROCHURE
      // BALANCE
      // ESTADO
      // CERTIFICADO_TRIBUTARIA
      // CELULA
      // CERTIFICADO_CUENTA
      // CERTIFICADO_ISO
      _obtenerDocumentosCertificados: async function () {
        let bBROCHURE = await that._buscarFolderDocumentacion("BROCHURE", "/brochure")
        let bBALANCE = await that._buscarFolderDocumentacion("BALANCE", "/balance")
        let bESTADO = await that._buscarFolderDocumentacion("ESTADO", "/estado")
        let bCERTIFICADO_TRIBUTARIA = await that._buscarFolderDocumentacion("CERTIFICADO_TRIBUTARIA", "/certificado_tributaria")
        let bCELULA = await that._buscarFolderDocumentacion("CELULA", "/celula")
        let bCERTIFICADO_CUENTA = await that._buscarFolderDocumentacion("CERTIFICADO_CUENTA", "/certificado_cuenta")
        let bCERTIFICADO_ISO = await that._buscarFolderDocumentacion("CERTIFICADO_ISO", "/certificado_iso")
        let bLEGAJO = await that._buscarFolderDocumentacion("LEGAJO", "/legajo")
        let bTERMINOS = await that._buscarFolderDocumentacion("TERMINOS", "/terminos")
        let bSISTEMA = await that._buscarFolderDocumentacion("SISTEMA", "/sistema")
        let bplanes = await that._buscarFolderDocumentacion("PLANES", "/planes");//+@INSERT
      },

      //Buscar Folder Terminos
      _buscarFolderDocumentacion: function (sNombreCarpeta, sProperty) {
        let that = this;
        let oProveedor = this.getModel("oProveedor").getProperty("/DatosGeneral")

        return new Promise((resolve, reject) => {
          $.ajax({
            url: that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oProveedor.Taxnumxl + "/" + sNombreCarpeta,
            type: "GET",
            "mimeType": "multipart/form-data",
            "contentType": false,
            "processData": false,
            success: async function (data) {
              sap.ui.core.BusyIndicator.hide()
              let aObjects = JSON.parse(data).objects
              if (aObjects.length > 0) {
                let aFiles = []
                for (let i = 0; i < aObjects.length; i++) {
                  let oObject = aObjects[i]
                  let sUrl = that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oProveedor.Taxnumxl + "/" + sNombreCarpeta + "/" + oObject.object.properties["cmis:name"].value
                  let oFile = {
                    name: oObject.object.properties["cmis:name"].value,
                    url: sUrl,
                    File: null,
                    dms: true,
                    fecha_creacion: that.formatoFechaMilenio(oObject.object.properties["cmis:creationDate"].value)
                  }
                  aFiles.push(oFile)
                }
                that.getModel("aDocumentos").setProperty(sProperty, aFiles);
              }
              resolve(true)
            },
            error: function (error) {
              resolve(false)
            },
          })
        });
      },

      onSubirDocumento: function (oEvent, sProperty) {
        let aFiles = oEvent.getParameter("files");
        let oFile = aFiles[0];
        let aBrochure = this.getModel("aDocumentos").getProperty(sProperty) || [];

        if (oFile) {
          // Verificar si el archivo es un ZIP
          if (oFile.type === "application/x-zip-compressed") {
            var oReader = new FileReader();
            oReader.onload = function (e) {
              var oZip = new JSZip();
              oZip.loadAsync(e.target.result).then(function (zip) {
                var promises = [];
                zip.forEach(function (relativePath, zipEntry) {
                  // Extraer cada archivo del ZIP
                  promises.push(zip.file(relativePath).async("uint8array").then(function (fileData) {
                    // Deduce el tipo MIME basado en la extensión del archivo
                    var mimeType = "application/octet-stream"; // MIME predeterminado
                    if (zipEntry.name.endsWith(".pdf")) {
                      mimeType = "application/pdf";
                    } else if (zipEntry.name.endsWith(".docx")) {
                      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    } else if (zipEntry.name.endsWith(".xlsx")) {
                      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    } // Añade más extensiones según sea necesario

                    // Crear un Blob para cada archivo extraído
                    var blob = new Blob([fileData], { type: mimeType });
                    var url = URL.createObjectURL(blob);
                    return {
                      name: zipEntry.name,
                      url: url,
                      File: blob,
                      dms: false,
                      fecha_creacion: that.obtenerFechaActual()
                    };
                  }));
                });
                Promise.all(promises).then(function (files) {
                  let aFiles = aBrochure.concat(files);
                  this.getModel("aDocumentos").setProperty(sProperty, aFiles);
                }.bind(this));
              }.bind(this));
            }.bind(this);
            oReader.readAsArrayBuffer(oFile);
            oEvent.getSource().setValue("")
          } else {
            var oReader = new FileReader();
            oReader.onload = function (e) {
              let sSourceURL = e.target.result;
              let decodedPdfContent = atob(sSourceURL.split(',')[1]);
              let byteArray = new Uint8Array(decodedPdfContent.length);
              for (let i = 0; i < decodedPdfContent.length; i++) {
                byteArray[i] = decodedPdfContent.charCodeAt(i);
              }
              let blob = new Blob([byteArray.buffer], { type: oFile.type });
              let _url = URL.createObjectURL(blob);
              jQuery.sap.addUrlWhitelist("blob");

              // Unir los nuevos archivos con los existentes
              let aFiles = aBrochure.concat([
                {
                  name: oFile.name,
                  url: _url,
                  File: oFile,
                  dms: false,
                  fecha_creacion: that.obtenerFechaActual()
                }
              ]);

              // Establecer el nuevo array de archivos en el modelo
              this.getModel("aDocumentos").setProperty(sProperty, aFiles);
            }.bind(this);

            oReader.readAsDataURL(oFile);
            oEvent.getSource().setValue("")
          }
        }
      },

      //Descargar los documentos que seleccione
      onDownloadFile: function (oEvent) {
        let oObject = oEvent.getSource().getBindingContext("aDocumentos").getObject();
        let link = document.createElement("a");

        link.href = oObject.url;
        link.download = oObject.name;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
      },

      //Función para guardar los Principal Clientes OTROS
      _saveCommentCalificador: async function (sComentario) {
        async function delay(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }

        return new Promise(async (resolve, reject) => {
          let oActualizacion = this.getModel("oActualizacion").getData()
          let oSendData = {
            "Land1": oActualizacion.Land1,
            "Taxnumxl": oActualizacion.Taxnumxl,
            "Correlativo": oActualizacion.Correlativo,
            "Comentariolegajo": sComentario
          }

          try {
            const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/RegistroLegajoSet", oSendData)
            await delay(1000);
            await this._approvePreCalificador()
            that.onNavBack()
            resolve(true)
            sap.ui.core.BusyIndicator.hide()
          } catch (error) {
            resolve(false)
            sap.ui.core.BusyIndicator.hide()
          }
        });
      },

      _approvePreCalificador: async function () {
        return new Promise(async (resolve, reject) => {
          let oActualizacion = this.getOwnerComponent().getModel("oActualizacion").getData()
          let oSendData = {
            "Taxnumxl": oActualizacion.Taxnumxl,
            "Codigoestado": "05",
            "Usuario": "",
            "Correonombre": ""
          }
          try {
            const oResultData = await this.createEntity(oModelPreRegProv, "/LogPPSet", oSendData)
            resolve(true)
            // if (oResultData.Codigo == "500") {
            //   MessageBox.error(oResultData.Mensaje)
            // } else {
            //   MessageBox.success(oResultData.Mensaje ,{
            //     onClose: function () {
            //       that.onNavBack()
            //     }
            //   })
            // }
          } catch (error) {
            resolve(false)
            //MessageBox.error(JSON.parse(error.responseText).error.message.value)
          }
        });
      },

      onSaveFilesDocumentos: async function (sProperty, sCarpeta) {
        let aFiles = this.getModel("aDocumentos").getProperty(sProperty)
        let oProveedor = this.getModel("oProveedor").getProperty("/DatosGeneral")
        let sComentario = this.byId("legajoFragment--txtComentario").getValue()
        let bValidate = false,
          sMensaje = ""

        if (sComentario == "") {
          MessageBox.error("Por favor, agregar un comentario.")
          return
        }

        if (aFiles.length === 0) {
          MessageBox.error("Por favor, subir al menos 1 archivo.")
          return
        }

        let aFileNew = aFiles.filter(oPos => oPos.dms === false)
        if (aFileNew.length === 0) {
          MessageBox.error("Por favor, subir al menos 1 nuevo archivo.")
          return
        }

        sap.ui.core.BusyIndicator.show(0)
        for (let i = 0; i < aFileNew.length; i++) {
          let oFile = aFileNew[i]

          let oObject = await that._saveFileDocument(oFile, sCarpeta, oProveedor.Taxnumxl)

          if (oObject.type === "E") {
            bValidate = oObject.type
            sMensaje = oObject.message
          }

        }

        await this._saveCommentCalificador(sComentario)

        if (bValidate) {
          MessageBox.error(sMensaje)
        } else {
          let bLEGAJO = await that._buscarFolderDocumentacion("LEGAJO", "/legajo")
          MessageBox.success("Se guardaron los documentos y se pasó a estado APTO con éxito.")
        }
        sap.ui.core.BusyIndicator.hide(0)
      },

      onEliminarDoc: function (oEvent, sCarpeta, sProperty, sTable) {
        let oDocument = oEvent.getSource().getBindingContext("aDocumentos").getObject();

        // Función para eliminar el documento
        const eliminarDocumento = () => {
          if (oDocument.id) {
            sap.ui.core.BusyIndicator.show(0)
            let form = onFormDataDelete(oDocument.id);
            return new Promise((resolve, reject) => {
              $.ajax({
                url: that._getAppModulePath() + rutaInicial + Repositoryid + "/root", //+ pathGeneral +"/"+ path,
                type: "POST",
                "mimeType": "multipart/form-data",
                "contentType": false,
                "data": form,
                "processData": false,
                success: async function (data) {
                  let bBROCHURE = await that._buscarFolderDocumentacion(sCarpeta, "/" + sProperty);
                  MessageToast.show("Se eliminó el archivo con éxito.")
                  sap.ui.core.BusyIndicator.hide()
                },
                error: function (error) {
                  console.log(error);
                  sap.ui.core.BusyIndicator.hide()
                }
              });
            });
          } else {
            let oTable = this.byId("legajoFragment--" + sTable);
            let oItem = oEvent.getSource().getParent();
            let sPath = oItem.getBindingContext("aDocumentos").getPath();
            let iIndex = parseInt(sPath.split("/").pop());
            let oModel = this.getView().getModel("aDocumentos");
            let oData = oModel.getData();

            oData[sProperty].splice(iIndex, 1);

            oModel.setData(oData);
            oTable.removeSelections();

            MessageToast.show("Se eliminó el archivo con éxito.")
          }
        };

        // Confirmación antes de eliminar
        sap.m.MessageBox.confirm(
          "¿Está seguro que desea eliminar el archivo?",
          {
            title: "Confirmación",
            onClose: function (oAction) {
              if (oAction === sap.m.MessageBox.Action.OK) {
                eliminarDocumento();
              } else {
                return;
              }
            }
          }
        );

        function onFormDataDelete(id) {
          var formdata = new FormData();
          formdata.append("cmisaction", "delete");
          formdata.append("objectId", id);
          formdata.append("allVersions", "true");
          return formdata;
        }
      },

      _saveFileDocument: function (oFile, sCarpeta, sRucProveedor) {
        let that = this;
        let oResult = {
          type: "S",
          message: "",
        };
        return new Promise(function (resolve, reject) {
          sap.ui.core.BusyIndicator.show(0);
          let oRequestOption = construirFormData(oFile);

          fetch(that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + sRucProveedor + "/" + sCarpeta, oRequestOption)
            .then(response => response.text())
            .then(result => {
              console.log(result);
              sap.ui.core.BusyIndicator.hide();
              resolve(oResult);
            }).catch(error => {
              oResult.type = "E";
              oResult.message = JSON.stringify(error)
              sap.ui.core.BusyIndicator.hide();
              resolve(oResult);
            });
        });
        //construye formdata para file
        function construirFormData(oFile) {
          let sName = that.formatoNombreArchivo(oFile.name)
          var myHeaders = new Headers();
          var formdata = new FormData();
          formdata.append("cmisaction", "createDocument");
          formdata.append("propertyId[0]", "cmis:name");
          formdata.append("propertyValue[0]", sName);
          formdata.append("propertyId[1]", "cmis:objectTypeId");
          formdata.append("propertyValue[1]", "cmis:document");
          formdata.append("filename", sName);
          formdata.append("_charset", "UTF-8");
          formdata.append("includeAllowableActions", "False");
          formdata.append("succinct", "true");
          formdata.append("media", oFile.File, sName);

          var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: formdata,
            redirect: 'follow'
          };

          return requestOptions;
        }
      },

      completarCamposCalidad: function (aDatos) {
        if (aDatos.length > 0) {
          let oGestionCalidad = aDatos[0]
          if (oGestionCalidad.SisGesCal == "X") {
            this.byId("gestioncalidadFragment--rbgPregunta1").setSelectedIndex(0)
          } else {
            this.byId("gestioncalidadFragment--rbgPregunta1").setSelectedIndex(1)
          }

          if (oGestionCalidad.SisAsCal == "X") {
            this.byId("gestioncalidadFragment--rbgPregunta2").setSelectedIndex(0)
          } else {
            this.byId("gestioncalidadFragment--rbgPregunta2").setSelectedIndex(1)
          }

          if (oGestionCalidad.SisConCal == "X") {
            this.byId("gestioncalidadFragment--rbgPregunta3").setSelectedIndex(0)
          } else {
            this.byId("gestioncalidadFragment--rbgPregunta3").setSelectedIndex(1)
          }

          if (oGestionCalidad.SisGesAl == "X") {
            this.byId("gestioncalidadFragment--rbgPregunta4").setSelectedIndex(0)
          } else {
            this.byId("gestioncalidadFragment--rbgPregunta4").setSelectedIndex(1)
          }

          if (oGestionCalidad.CerIso == "X") {
            this.byId("gestioncalidadFragment--rbgISO").setSelectedIndex(0)
          } else {
            this.byId("gestioncalidadFragment--rbgISO").setSelectedIndex(1)
          }

          if (oGestionCalidad.EntCerPg == "X") {
            this.byId("gestioncalidadFragment--rbgPregunta5").setSelectedIndex(0)
          } else {
            this.byId("gestioncalidadFragment--rbgPregunta5").setSelectedIndex(1)
          }

          if (oGestionCalidad.EntCalProd == "X") {
            this.byId("gestioncalidadFragment--rbgPregunta6").setSelectedIndex(0)
          } else {
            this.byId("gestioncalidadFragment--rbgPregunta6").setSelectedIndex(1)
          }

          if (oGestionCalidad.SubProcAct == "X") {
            this.byId("gestioncalidadFragment--rbgPregunta7").setSelectedIndex(0)
            this.byId("gestioncalidadFragment--txtPregunta7Cal").setVisible(true)
          } else {
            this.byId("gestioncalidadFragment--rbgPregunta7").setSelectedIndex(1)
            this.byId("gestioncalidadFragment--txtPregunta7Cal").setVisible(false)
          }
        }
      },

      onVerSisSeguridadFile: async function (oEvent, path) {

        let aFiles = this.getModel("aDocumentos").getProperty(path);

        if (aFiles.length === 0) {
          MessageBox.error(oBundle.getText("notFileUpload"))
          return
        }

        for (let i = 0; i < aFiles.length; i++) {
          let oObject = aFiles[i]
          let link = document.createElement("a");

          link.href = oObject.url;
          link.download = oObject.name;
          document.body.appendChild(link);
          link.click();

          document.body.removeChild(link);
        }
      },

      /****************************************************/
      /** Funciones para obtener datos de los despegables */
      /****************************************************/
      _getListaPaises: async function () {
        try {
          let oModel = this.getOwnerComponent().getModel()
          const aListaPaises = await this.readEntity(oModelPreRegProv, "/ConsultaPaisesSet", {})
          oModel.setProperty("/Paises", aListaPaises.results)
          oModel.setSizeLimit(9000);
          console.log(aListaPaises);
        } catch (error) {
          sap.ui.core.BusyIndicator.hide()
          console.log("Funcion _getListaPaises: " + error)
        }
      },

      _getListaGrupos: async function () {
        try {
          let oModel = this.getOwnerComponent().getModel()
          const aListaGrupos = await this.readEntity(oModelPreRegProv, "/ConsultaGruposSet", {})
          oModel.setProperty("/Grupos", aListaGrupos.results)
          oModel.setSizeLimit(9000);
          console.log(aListaGrupos);
        } catch (error) {
          sap.ui.core.BusyIndicator.hide()
          console.log("Funcion _getListaGrupos: " + error)
        }
      },

      _getListaCategoria: async function () {
        try {
          let oModel = this.getOwnerComponent().getModel()
          const aListaCategoria = await this.readEntity(oModelPreRegProv, "/ConsultaCategoriasSet", {})
          oModel.setProperty("/Categorias", aListaCategoria.results)
          oModel.setSizeLimit(9000);
          console.log(aListaCategoria);
        } catch (error) {
          sap.ui.core.BusyIndicator.hide()
          console.log("Funcion _getListaCategoria: " + error)
        }
      },

      _getListaNombreBanco: async function () {
        try {
          let oModel = this.getOwnerComponent().getModel()
          const aListaNombreBanco = await this.readEntity(oModelPreRegProv, "/ConsultaNombreBancoSet", {})
          oModel.setProperty("/NombreBancos", aListaNombreBanco.results)
          oModel.setSizeLimit(9000);
          console.log(aListaNombreBanco);
        } catch (error) {
          sap.ui.core.BusyIndicator.hide()
          console.log("Funcion _getListaNombreBanco: " + error)
        }
      },

      _getListaMoneda: async function () {
        try {
          let oModel = this.getOwnerComponent().getModel()
          const aListaMoneda = await this.readEntity(oModelPreRegProv, "/ConsultaMonedaSet", {})
          oModel.setProperty("/Moneda", aListaMoneda.results)
          oModel.setSizeLimit(9000);
          console.log(aListaMoneda);
        } catch (error) {
          sap.ui.core.BusyIndicator.hide()
          console.log("Funcion _getListaMoneda: " + error)
        }
      },

      _getListaTipoPlanes: async function () {
        try {
          let oModel = this.getOwnerComponent().getModel()
          const aListaTipoPlanes = await this.readEntity(oModelPreRegProv, "/ConsultaPlanesDeSaludSet", {})
          oModel.setProperty("/TipoPlanes", aListaTipoPlanes.results)
          oModel.setSizeLimit(9000);
          console.log(aListaTipoPlanes);
        } catch (error) {
          sap.ui.core.BusyIndicator.hide()
          console.log("Funcion _getListaTipoPlanes: " + error)
        }
      },

      _getListaTipoCuenta: async function () {
        try {
          let oModel = this.getOwnerComponent().getModel()
          const aListaTipoCuenta = await this.readEntity(oModelPreRegProv, "/ConsultaTipoCuentaBancSet", {})
          oModel.setProperty("/TipoCuenta", aListaTipoCuenta.results)
          that.byId("cboMainPais").fireChange()
          oModel.setSizeLimit(9000);
          console.log(aListaTipoCuenta);
        } catch (error) {
          sap.ui.core.BusyIndicator.hide()
          console.log("Funcion _getListaTipoCuenta: " + error)
        }
      },

      _getListaEspecialidad: async function () {
        try {
          let oModel = this.getOwnerComponent().getModel()
          const aListaEspecialidad = await this.readEntity(oModelPreRegProv, "/ConsultaEspecialidadSet", {})
          oModel.setProperty("/Especialidad", aListaEspecialidad.results)
          oModel.setSizeLimit(9000);
        } catch (error) {
          console.log("Funcion _getListaEspecialidad: " + error)
        }
      },

      formatoMoneda: function (sMonedaSo, sMonedaDo) {
        if (sMonedaSo === "X") {
          return "S/"
        }

        if (sMonedaDo === "X") {
          return "USD"
        }
        return ""
      },

      formatoMonedaLP: function (sMonedaSo, sMonedaDo, sMonto) {
        if (sMonedaSo === "X") {
          return "S/ " + sMonto
        }

        if (sMonedaDo === "X") {
          return sMonto + " USD"
        }

        return ""
      },
      onAprobarComentary: async function () {
        if (!this.oSubmitDialog2) {
          this.oSubmitDialog2 = new Dialog({
            type: DialogType.Message,
            state: "Success",
            title: "Aprobar",
            content: [
              new Label({
                text: "¿Desea aprobar esta solicitud?",
                labelFor: "submissionNote"
              }),
              new TextArea("submissionNote2", {
                width: "100%",
                placeholder: "Agregar Motivo (requerido)",
                liveChange: function (oEvent) {
                  var sText = oEvent.getParameter("value");
                  this.oSubmitDialog2.getBeginButton().setEnabled(sText.length > 0);
                }.bind(this)
              })
            ],
            beginButton: new Button({
              type: ButtonType.Emphasized,
              text: "Aceptar",
              enabled: false,
              press: function () {
                var sText = Element.getElementById("submissionNote2").getValue();
                this.oSubmitDialog2.close();
                that.setComentaryAprobar(sText);
                that.onAprobar();//+add

              }.bind(this)
            }),
            endButton: new Button({
              text: "Cancelar",
              press: function () {
                this.oSubmitDialog2.close();
                that.setComentaryAprobar("");
              }.bind(this)
            })
          });
        }
        this.oSubmitDialog2.open();
      },
      setComentaryAprobar: function (description) {
        let oDatosAprobComent = this.getOwnerComponent().getModel("oActualizacion");
        if (description != "" && description != undefined) {
          oDatosAprobComent.setProperty("/Comentariolegajo", description);
        } else {
          oDatosAprobComent.setProperty("/Comentariolegajo", "");
        }
      },
      getDateFormatDisplay: function (date) {
        let result;
        // Date - 20240611
        if (date != "" && date != undefined) {
          let cadena = "";
          let dateAux = date;
          result = cadena.concat(dateAux.slice(6, 8), "/", dateAux.slice(4, 6), "/", dateAux.slice(0, 4));
        }
        return result;
      },
      onChangeCiudProv: async function () {

        let odataPreRegis = this.getView().getModel("oProveedor").getData();

        let sKey = this.byId("cboMainRegionDpto").getSelectedKey(),
          sKeyDepart = this.byId("cboMainCiudad").getSelectedKey();

        let filters = [];
        filters.push(new Filter("Region", "EQ", `${sKey}`))
        filters.push(new Filter("Provincia", "EQ", `${sKeyDepart}`))
        if (odataPreRegis.DatosGeneral.Land1 == "PE") {
          try {
            let oModel = this.getOwnerComponent().getModel()
            const aListaDistritos = await this.readEntity(oModelPreRegProv, "/ConsultaProvinciaDistritoSet", { filters })
            oModel.setProperty("/Distrito", aListaDistritos.results);
            if (aListaDistritos.results.length == 0) {
              this.byId("cboMainDistrito").setSelectedKey("");
            }
          } catch (error) {
            MessageBox.error(JSON.parse(error.responseText).error.message.value)
            console.log("Funcion onDistrito: " + error)
          }
        }
      },

      getDateEnd: function (aniosAdd, fdate) {

        let valor;

        let date = new Date();
        date.setFullYear(date.getFullYear() + aniosAdd);
        if (fdate) {
          valor = date;
          return valor;
        }

        let oFormatOptions = {
          pattern: "yyyy-MM-dd\'T\'HH:mm:ss"
        };

        try {

          let oFormatDateTime = sap.ui.core.format.DateFormat.getDateTimeInstance(oFormatOptions);
          valor = oFormatDateTime.format(date);

        } catch (error) {
          console.error("Error DateTime Function: getDateEnd");
          console.error(error);
        }

        valor = valor + "Z";
        return valor;

      },
      _checkProveedor: async function (ruc) {
        return new Promise(async (resolve, reject) => {
          let proveedor = { exists: false, idBp: "", results: [] };

          let filters = [];
          filters.push(new Filter("SearchTerm1", "EQ", `${ruc}`));

          const parameters = {
            filters: filters,
            urlParameters: {
              "$expand": "to_BusinessPartnerAddress,to_BusinessPartnerBank,to_BusinessPartnerTax,to_BusinessPartnerRole"
            }
          }

          try {
            let API_BUSINESS_PARTNER = this.getOwnerComponent().getModel("API_BUSINESS_PARTNER");
            const oDataPartner = await this.readEntity(API_BUSINESS_PARTNER, "/A_BusinessPartner", parameters)
            if (oDataPartner.results.length > 0) {
              proveedor.exists = true;
              proveedor.results = oDataPartner.results;
              proveedor.idBp = oDataPartner.results[0].BusinessPartner;
              await this._getSupplierOrg(API_BUSINESS_PARTNER,proveedor);//+@INSERT
              resolve(proveedor);
            } else {
              proveedor.exists = false;
              resolve(proveedor);
            }
          } catch (error) {
            proveedor.exists = false;
            console.log(error);
            resolve(proveedor);
          }
        });
      },

      updateEntityProveedor: async function (API_BUSINESS_PARTNER, existsProv, oData) {

        await this._updateBusinessPartner(API_BUSINESS_PARTNER, existsProv, oData);
        await this._updateBpAddress(API_BUSINESS_PARTNER, existsProv, oData);
        await this._updateBpCtaBanks(API_BUSINESS_PARTNER, existsProv, oData);

      },

      _updateBusinessPartner: async function (API_BUSINESS_PARTNER, existsProv, oData) {
        let results = {};
        let path = "/A_BusinessPartner(" + "'" + `${existsProv.idBp}` + "'" + ")";

        //Entidad: "A_BusinessPartner"
        let odataBusinessPartner =
        {
          "BusinessPartnerCategory": oData.BusinessPartnerCategory,
          "BusinessPartnerFullName": oData.BusinessPartnerFullName,
          "BusinessPartnerGrouping": oData.BusinessPartnerGrouping,
          "BusinessPartnerIsBlocked": false,
          "BusinessPartnerName": oData.BusinessPartnerName,
          "FormOfAddress": "0003",
          "OrganizationBPName1": oData.OrganizationBPName1,
          "OrganizationBPName2": "",
          "OrganizationBPName3": "",
          "OrganizationBPName4": "",
          "SearchTerm1": oData.SearchTerm1,
          "SearchTerm2": oData.SearchTerm2,
        }
        try {
          results = await this.updateEntity(API_BUSINESS_PARTNER, path, odataBusinessPartner);
        } catch (error) {
          console.error("Error - Update BusinessPartner");
          console.error(error);
        }

      },
      _updateBpAddress: async function (API_BUSINESS_PARTNER, existsProv, oData) {

        //Entidad: "A_BusinessPartnerAddress(BusinessPartner='',AddressID='') "
        let results = {};
        let id = "";
        let path = "";

        let oDataBpAddress = {};


        try {

          if (existsProv.results[0].to_BusinessPartnerAddress.results.length > 0) {

            oDataBpAddress = existsProv.results[0].to_BusinessPartnerAddress.results[0];
            oDataBpAddress.AddressTimeZone = oData.to_BusinessPartnerAddress.results[0].AddressTimeZone;
            oDataBpAddress.CityName = oData.to_BusinessPartnerAddress.results[0].CityName;
            oDataBpAddress.Country = oData.to_BusinessPartnerAddress.results[0].Country;
            oDataBpAddress.District = oData.to_BusinessPartnerAddress.results[0].District;
            oDataBpAddress.HouseNumber = oData.to_BusinessPartnerAddress.results[0].HouseNumber;
            oDataBpAddress.Language = oData.to_BusinessPartnerAddress.results[0].Language;
            oDataBpAddress.Region = oData.to_BusinessPartnerAddress.results[0].Region;
            oDataBpAddress.StreetName = oData.to_BusinessPartnerAddress.results[0].StreetName;


            id = existsProv.results[0].to_BusinessPartnerAddress.results[0].AddressID;

            path = "/A_BusinessPartnerAddress(BusinessPartner=" + "'" + `${existsProv.idBp}` + "'" +
              ",AddressID=" + "'" + id + "'" + ")";

            results = await this.updateEntity(API_BUSINESS_PARTNER, path, oDataBpAddress);

            //Actualizar Otras entidades de BusinessPartnerAddress 
            let OdataResult = await this._getInfoPartnerAddress(API_BUSINESS_PARTNER, existsProv.idBp, id);
            if (OdataResult) {
              await this._updateBpAddressOthers(API_BUSINESS_PARTNER, OdataResult, oData, existsProv.idBp, id);
            }
          }

        } catch (error) {
          console.error("Error - BusinessPartnerAddress");
          console.error(error);
        }
      },

      _updateBpCtaBanks: async function (API_BUSINESS_PARTNER, existsProv, oData) {
        let results = {};
        let path = "";
        let oDataBpBank = {};

        try {
          let BanckPrev = existsProv.results[0].to_BusinessPartnerBank.results;
          //Eliminar Los Bancos Previos Guardados
          if (BanckPrev.length > 0) {
            for (let index = 0; index < BanckPrev.length; index++) {
              path = "/A_BusinessPartnerBank(BusinessPartner=" + "'" + `${existsProv.idBp}` + "'" +
                ",BankIdentification=" + "'" + `${BanckPrev[index].BankIdentification}` + "'" + ")";
              try {
                results = await this.deleteEntity(API_BUSINESS_PARTNER, path);
              }
              catch (error) {
                console.error("Error - Delete BusinessPartnerBank - " + oData.to_BusinessPartnerBank.results[index].BankIdentification);
                console.error(error);
              }
            }
          }

          //Insertar y actualizar nuevos Bancos
          if (oData.to_BusinessPartnerBank.results.length > 0) {
            for (let index = 0; index < oData.to_BusinessPartnerBank.results.length; index++) {
              oDataBpBank = {};
              path = "/A_BusinessPartnerBank"
              try {
                oDataBpBank = oData.to_BusinessPartnerBank.results[index];
                oDataBpBank.BusinessPartner = existsProv.idBp;
                results = await this.createEntity(API_BUSINESS_PARTNER, path, oDataBpBank);
              }
              catch (error) {
                console.error("Error - Create - BusinessPartnerBank - " + oData.to_BusinessPartnerBank.results[index].BankIdentification);
                console.error(error);
              }
            }
          }
        } catch (error) {
          console.error("Error - BusinessPartnerBank");
          console.error(error);
        }
      },
      _getInfoPartnerAddress: async function (API_BUSINESS_PARTNER, businessPartner, addressID) {
        return new Promise(async (resolve, reject) => {

          let filters = [];
          filters.push(new Filter("BusinessPartner", "EQ", `${businessPartner}`));
          filters.push(new Filter("AddressID", "EQ", `${addressID}`));

          const parameters = {
            filters: filters,
            urlParameters: {
              "$expand": "to_EmailAddress,to_PhoneNumber,to_MobilePhoneNumber"
            }
          }
          try {
            const oDataPartner = await this.readEntity(API_BUSINESS_PARTNER, "/A_BusinessPartnerAddress", parameters)
            if (oDataPartner.results.length > 0) {
              resolve(oDataPartner.results[0]);
            } else {
              resolve(null);
            }
          } catch (error) {
            console.error("Error - Function: _getInfoPartnerAddress");
            console.error(error);
            reject(null);
          }

        });

      },
      _updateBpAddressOthers: async function (API_BUSINESS_PARTNER, result, oData, nroBp, nroIdAddress) {
        let results = {};
        let path = "";
        let oDataBody = {};

        let pathMain = "/A_BusinessPartnerAddress(BusinessPartner=" + "'" + `${nroBp}` + "'" +
          ",AddressID=" + "'" + nroIdAddress + "'" + ")";


        //A_AddressEmailAddress
        try {
          let oDataEmail = oData.to_BusinessPartnerAddress.results[0].to_EmailAddress.results[0];

          if (result.to_EmailAddress.results.length > 0) {

            let ordinalNumber = result.to_EmailAddress.results[0].OrdinalNumber;
            let idPerson = result.to_EmailAddress.results[0].Person;

            path = "/A_AddressEmailAddress(AddressID=" + "'" + `${nroIdAddress}` + "'" +
              ",OrdinalNumber=" + "'" + `${ordinalNumber}` + "'" +
              ",Person=" + "'" + `${idPerson}` + "'" + ")";

            oDataBody = result.to_EmailAddress.results[0];
            oDataBody.EmailAddress = oDataEmail.EmailAddress;
            oDataBody.AddressCommunicationRemarkText = "Compras";

            //oDataBody.SearchEmailAddress = oDataEmail.EmailAddress;

            results = await this.updateEntity(API_BUSINESS_PARTNER, path, oDataBody);
          } else {
            path = "/A_AddressEmailAddress";
            oDataBody = oDataEmail;
            oDataBody.AddressID = nroIdAddress;
            oDataBody.AddressCommunicationRemarkText = "Compras";
            results = await this.createEntity(API_BUSINESS_PARTNER, path, oDataBody);
          }

        } catch (error) {
          console.error("Error: A_AddressEmailAddress");
          console.error(error);
        }

        //A_AddressPhoneNumber -Field - to_PhoneNumber
        try {
          if (result.to_PhoneNumber.results.length > 0) {
            let ordinalNumber = result.to_PhoneNumber.results[0].OrdinalNumber;
            let idPerson = result.to_PhoneNumber.results[0].Person;

            path = "/A_AddressPhoneNumber(AddressID=" + "'" + `${nroIdAddress}` + "'" +
              ",OrdinalNumber=" + "'" + `${ordinalNumber}` + "'" +
              ",Person=" + "'" + `${idPerson}` + "'" + ")";

              
            oDataBody = result.to_PhoneNumber.results[0];
            oDataBody.PhoneNumber = oData.to_BusinessPartnerAddress.results[0].to_PhoneNumber.results[0].PhoneNumber;
            results = await this.updateEntity(API_BUSINESS_PARTNER, path, oDataBody);

          } else {
            path = "/A_AddressPhoneNumber";
            oDataBody = oData.to_BusinessPartnerAddress.results[0].to_PhoneNumber.results[0];
            oDataBody.AddressID = nroIdAddress;
            oDataBody.PhoneNumberType = "1";
            results = await this.createEntity(API_BUSINESS_PARTNER, path, oDataBody);
          }
          
          //--------------------Field - to_MobilePhoneNumber--------------------
          if (result.to_MobilePhoneNumber.results.length > 0) {

            let ordinalNumber = result.to_MobilePhoneNumber.results[0].OrdinalNumber;
            let idPerson = result.to_MobilePhoneNumber.results[0].Person;

            path = "/A_AddressPhoneNumber(AddressID=" + "'" + `${nroIdAddress}` + "'" +
              ",OrdinalNumber=" + "'" + `${ordinalNumber}` + "'" +
              ",Person=" + "'" + `${idPerson}` + "'" + ")";

            oDataBody = result.to_MobilePhoneNumber.results[0];
            oDataBody.PhoneNumber = oData.to_BusinessPartnerAddress.results[0].to_PhoneNumber.results[0].PhoneNumber;
            results = await this.updateEntity(API_BUSINESS_PARTNER, path, oDataBody);

          }else{
            //Create
            path = "/A_AddressPhoneNumber";
            oDataBody = oData.to_BusinessPartnerAddress.results[0].to_PhoneNumber.results[0];
            oDataBody.AddressID = nroIdAddress;
            oDataBody.PhoneNumberType = "3";
            results = await this.createEntity(API_BUSINESS_PARTNER, path, oDataBody);
          }

        } catch (error) {
          console.error("Error: A_AddressPhoneNumber");
          console.error(error);
        }

      },
      _updateDatosAddress: function(datoEnviar)
      {
        let oDatosEnviar = this.getOwnerComponent().getModel("oActualizacion").getData()
        let toEmailAddress = [];
        let toMobilePhoneNumber = [];
        let toPhoneNumber = [];
        try 
        {

          if (datoEnviar.to_BusinessPartnerAddress.results.length > 0) 
          {
            let dataComercial = oDatosEnviar.ContactoComercialDetSet.results;
            for (let index = 0; index < dataComercial.length; index++) 
            {
             if (dataComercial[index].Telefono != "" && dataComercial[index].Telefono != undefined ) {
              toPhoneNumber.push({ PhoneNumber: dataComercial[index].Telefono,
                                   PhoneNumberType: "1" });

              toMobilePhoneNumber.push({ PhoneNumber: dataComercial[index].Telefono,
                                         PhoneNumberType : "3"});
             }
            }
          }

          //Agregar el Texto
          datoEnviar.to_BusinessPartnerAddress.results[0].to_EmailAddress.results[0].AddressCommunicationRemarkText = "Compras";  

          if (toPhoneNumber.length > 0) 
          {
            datoEnviar.to_BusinessPartnerAddress.results[0].to_PhoneNumber.results = toPhoneNumber; 
          }

          if (toMobilePhoneNumber.length > 0) 
          {
            datoEnviar.to_BusinessPartnerAddress.results[0].to_MobilePhoneNumber.results = toMobilePhoneNumber; 
          }

        } catch (error) {
          console.error("Error function: _updateDatosAddress");
          console.error(error);
        }
      },
      _getListaSucursal: async function()
      {
        let oActualizacion = this.getOwnerComponent().getModel("oActualizacion").getData();
        let oModel = this.getOwnerComponent().getModel()
        if (oActualizacion.Ejecutarsucursalcosapi != "" && oActualizacion.Ejecutarsucursalcosapi != undefined ) {
        try {
          
          const aListaSucursal = await this.readEntity(oModelPreRegProv, "/ConsultaSucursalesCOSAPISet", {})
          oModel.setSizeLimit(9000);
          oModel.setProperty("/Sucursal", aListaSucursal.results)
      } catch (error) 
      {
          console.log("Funcion _getListaSucursal: " + error)
      }
      }else{
        oModel.setProperty("/Sucursal", []);
      }

      },
      _getOrgCompras: async function()
      {
        let filters = [];
        let oActualizacion = this.getOwnerComponent().getModel("oActualizacion").getData();
        let oModel = this.getOwnerComponent().getModel()
        filters.push(new Filter("Pais","EQ",oActualizacion.Land1));

        try {
          const aListaOrgCompr = await this.readEntity(oModelPreRegProv, "/ConsultaOrganizacionesComprasSet", { filters })
          oModel.setProperty("/OrgCompras", aListaOrgCompr.results)
          oModel.setSizeLimit(9000);
        } catch (error) {
          console.error("Error Function:_getOrgCompras",error);
        }
      },
      _setSupplierPurchasingOrg: function (oDataorgCompr,oDatosEnviar) 
      {
        try {
            let oDataModel = this.getView().getModel().getProperty("/OrgCompras");
            if (oDataModel.length > 0) {
                for (let index = 0; index < oDataModel.length; index++) {
                  oDataorgCompr.push({
                    Supplier: "",
                    PurchasingOrganization: oDataModel[index].OrganizacionCompra,                    
                    CalculationSchemaGroupCode: oDataModel[index].GrupoEsquema,
                    InvoiceIsGoodsReceiptBased: oDataModel[index].VerificarEm,
                    PaymentTerms: oDataModel[index].CondicionPago,
                    PurchaseOrderCurrency: oDataModel[index].Moneda,
                    SupplierPhoneNumber: oDatosEnviar.ContactoComercialDetSet.results[0].Telefono,
                    SupplierRespSalesPersonName: oDatosEnviar.ContactoComercialDetSet.results[0].Nombre
                  });
                }
            }else{
              oDataorgCompr = [];
            } 
        } catch (error) {
        }  
      },
      _getSupplierOrg: async function(API_BUSINESS_PARTNER,proveedor)
      {
      
          let filters = [];
          filters.push(new Filter("Supplier", "EQ", `${proveedor.idBp}`));

          const parameters = {
            filters: filters,
            urlParameters: {
              "$expand": "to_SupplierPurchasingOrg,to_SupplierCompany"
            }
          }

          try {
            const oDataSupplier = await this.readEntity(API_BUSINESS_PARTNER, "/A_Supplier", parameters)
            if (oDataSupplier.results.length > 0) 
            {
              proveedor.supplier = oDataSupplier.results[0]; 
            }else{
              proveedor.supplier = [];
            }
        } catch (error) {
        }
      
      }


    });
  });
