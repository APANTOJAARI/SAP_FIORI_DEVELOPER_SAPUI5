sap.ui.define([
    "./Base.controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/resource/ResourceModel",
    "sap/ui/core/format/NumberFormat",
    "sap/m/Dialog",
    "sap/ui/core/Messaging",
    "sap/ui/core/Fragment",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, MessageBox, MessageToast, JSONModel, Filter, FilterOperator, NumberFormat,Dialog,Messaging,Fragment) {
        "use strict";
        let oModelPreRegProv,
            oModelRegProvePP,
            oDataUserSCIM,
            that

       
        //Varibales dms
        let rutaInicial = "/apidms/browser/"; //despliegue
        //let rutaInicial ="/browser/";           //Local
        let Repositoryid = "";
        let oBundle;
        let bHayDocumento = false;
        let statusSaveDocumento = {
            saveFichaRuc: false,
            cantfileFichaRuc: 0,
            saveCedulaLegal: false,
            cantFileCedulaLegal: 0
        };

        let initValuesUbic = { Region: "", Provincia: "", Distrito: "" }; //+@INSERT

        return Controller.extend("ns.cosapi.actualizacionproveedor.controller.Home", {
            onInit: async function () {
                oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();//+@INSERT
                that = this
                oModelPreRegProv = this.getOwnerComponent().getModel("ZMMGS_PRE_REG_PROV_SRV")
                oModelRegProvePP = this.getOwnerComponent().getModel("ZMMGS_REGPROVEEPP_CRUD_SRV")
                oDataUserSCIM = this.getOwnerComponent().getModel("userData").getData()
                Repositoryid = this.onObtenerRepositorioId()
                that.getView().setModel(new JSONModel({}), "DMS")

                this.inciarModelosArrays()

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
                    termino: [],
                    sistema: [],
                    planes: [], //+@INSERT Agregar para la opción "Cuenta con Algunos Planes" 
                }

                this.setModel(new JSONModel(aDocumentos), "aDocumentos")

                //Inicializar Modelo para editar campos por cada tipo de Status
                let StatusEdit = { edit: true, btnBancariaEdit: true,modifTabSgyTc:true };
                this.setModel(new JSONModel(StatusEdit), "statusEdit");


                //this.sUrlCosapi = sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/model/Terminos_y_Condiciones.pdf"); -@DELETE

                var oViewModel = that.getView().getModel("DMS");
                //oViewModel.setProperty("/Source", this.sUrlCosapi); -@DELETE
                oViewModel.setProperty("/SourceData", []);
                oViewModel.setProperty("/Title", "");
                oViewModel.setProperty("/Height", "600px");
                oViewModel.setProperty("/File", {});
                oViewModel.setProperty("/TerminoCondicion", false);

                await this.getDataUser(oDataUserSCIM.userId);

                this._getListaPaises()
                this._getListaGrupos()
                //this._getListaCategoria()    //-@DELETE

                //this._getListaNombreBanco()   //-@DELETE
                //this._getListaMoneda()        //-@DELETE

                //this._getListaTipoPlanes()
                this._getListaTipoCuenta()
                this._getListaSucursal()
                //this._getListaEspecialidad()
                this._getRefFinanciera();
                this._getTipCtaSoDoDet();    //+@INSERT
                this._getCaractClaveBanco(); //+@INSERT
                this.checkPlanesBtnUpload(); //+@INSERT

                oBundle = this.getView().getModel("i18n").getResourceBundle()
                sap.ui.core.BusyIndicator.hide();
            },
            onAfterRendering: function () //+@INSERT
            {
                this.setInitButtonUploadPlanes();
                this.onSelectRbResultEstadis();
                this.InitValuesGlobales();
            },

            getDataUser: async function (sUserId) {
                return new Promise(async (resolve, reject) => {
                    try {
                        sap.ui.core.BusyIndicator.show(0);
                        let aFilters = [];
                        let oModel = this.getOwnerComponent().getModel()

                        aFilters.push(new Filter("Taxnumxl", "EQ", sUserId)) //"20340584237"

                        let parameters = {
                            filters: aFilters,
                            urlParameters: {
                                "$expand": "ContactoComercialDetSet,InformacionContableDetSet,ExpPrincClientesDetSet,SistemaGestionDetSet,CuentasBancariasDetSet,ReferenciasFinDetSet,SistemasCalidadDetSet,EjecutivosEmpresaDetSet,SistemaGestionSeguridadDetSet,LineaNegocioDetSet,LineaProductoDetSet"
                            }
                        }

                        const aResult = await this.readEntity(oModelRegProvePP, "/ConsultaTablaProvSet", parameters)
                        let oNewMmodeloProveedor = this.formatoModelSAPtoBtp(aResult.results[0])
                        this.setModel(new JSONModel({
                            RazonSocial: aResult.results[0].Fullname,
                            Representante: aResult.results[0].Representante,
                            Identificacion: aResult.results[0].Identificacion,
                            Correo: aResult.results[0].Correo,
                            Taxnumxl: aResult.results[0].Taxnumxl,
                            Land1: aResult.results[0].Land1,
                            Correlativo: aResult.results[0].Correlativo,
                            Direccion: aResult.results[0].Direccion,
                            Codigoestado: aResult.results[0].Codigoestado, //+@INSERT - Incluir el status
                            TipoNif: aResult.results[0].Stcdt,              //+@INSERT
                            Ejecutarsucursalcosapi: aResult.results[0].Ejecutarsucursalcosapi,  //+@INSERT
                            Flagactivereferfinan: aResult.results[0].Flagactivereferfinan,      //+@INSERT
                            UrlPasarelaPago: aResult.results[0].UrlPasarelaPago,                 //+@INSERT
                            MontoPasarelaPago: aResult.results[0].MontoPasarelaPago,             //+@INSERT
                            PaisPasarelaPago:  aResult.results[0].PaisPasarelaPago,              //+@INSERT
                            Land1des: aResult.results[0].Land1des,                               //+@INSERT
                            NombreContacSpt: aResult.results[0].NombreContacSpt,                 //+@INSERT
                            CelularContacSpt: aResult.results[0].CelularContacSpt,               //+@INSERT
                            CorreoContacSpt: aResult.results[0].CorreoContacSpt,                 //+@INSERT
                        }), "oPreRegistro");
                        this.setModel(new JSONModel(oNewMmodeloProveedor), "oProveedor");

                        this.getView().getModel("ListaReferencias").setProperty("/data", formatoListaReferencia(aResult.results[0].ReferenciasFinDetSet.results))
                        this.getView().getModel("ListaLineaProducto").setProperty("/data", oNewMmodeloProveedor.LineaProducto.LineaProductoDetSet)
                        this.getView().getModel("ListaPrincClientes").setProperty("/data", oNewMmodeloProveedor.ExpClienteCab.ExpPrincClientesDetSet)
                        this.getView().getModel("ListaLinNegocio").setProperty("/data", oNewMmodeloProveedor.LineaNegocio.LineaNegocioDetSet)
                        this._getListaEspecialidad(oNewMmodeloProveedor.LineaNegocio.LineaNegocioDetSet)

                        //Valida si es PERU MUESTRA TODOS LOS FORMULARIOS
                        if (aResult.results[0].Land1 == "PE") {
                            oModel.setProperty("/oPaisProveedor", true)
                            this.byId("txtDireccion").setEditable(false)
                            this.byId("txtFecha").setEditable(false)
                        } else {
                            oModel.setProperty("/oPaisProveedor", false)
                            this.byId("txtDireccion").setEditable(true)
                            this.byId("txtFecha").setEditable(true)
                        }

                        if (aResult.results[0].Direccion == "-") {
                            this.byId("txtDireccion").setEditable(true)
                        }

                        if (aResult.results[0].Land1 == "PE") {
                            this.byId("txtNombreComercial").setEditable(false)
                        } else {
                            this.byId("txtNombreComercial").setEditable(true)
                        }

                        await this._validarCarpetaTerminos()  //Carpetas

                        this.byId("cboMainPais").fireChange()
                        //this.onSelectSubContratista() -@DELETE
                        this.validateStatusProveedorEdit(aResult);//+@INSERT
                        this.initValuesUbigeoProv(true);//+@INSERT

                        resolve(true)
                    } catch (error) {
                        MessageBox.error(JSON.parse(error.responseText).error.message.value)
                        console.log("Funcion getDataUser: " + error)
                        sap.ui.core.BusyIndicator.hide();
                        resolve(false)
                    }
                });

                function formatoListaReferencia(aData) {
                    let aRef = []
                    for (let i = 0; i < aData.length; i++) {
                        let oData = aData[i]
                        let iPos = i + 1
                        let oRef = {
                            "Entfinancpos": iPos,
                            "EmailSec": oData.EmailSec,
                            "Taxnumxl": oData.Taxnumxl,
                            "Correlativo": oData.Correlativo,
                            "IdEnt": oData.IdEnt,
                            "Land1": oData.Land1,
                            "NombreEnt": oData.NombreEnt,
                            "NombreSect": oData.NombreSect,
                            "TelSec": oData.TelSec,
                            "LineaCredito": oData.LinAproS == "X" ? "S/" : "USD", //Campo solo vista tabla
                            "LinAproS": oData.LinAproS,
                            "LinAproD": oData.LinAproD,
                            "Monto": oData.Monto
                        }
                        aRef.push(oRef)
                    }

                    return aRef
                }

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

                let oDataLineaProducto = { data: [] };

                let oModelLineaProducto = this.getView().getModel("ListaLineaProducto");
                if (!oModelLineaProducto) {
                    oModelLineaProducto = new sap.ui.model.json.JSONModel(oDataLineaProducto);
                    this.getView().setModel(oModelLineaProducto, "ListaLineaProducto");
                } else {
                    this.getView().setModel(oModelLineaProducto, "ListaLineaProducto");
                }
            },

            validateFields: function () {
                var aForms = ["FormContactoComercial", "ormContactoComercial2", "FormContactoComercial3", "FormCuentasBancarias", "FormDatosGenerales", "FormInformacionContable", "FormInformacionContable2", "FormLineasDeNegocio",
                    "FormPrincipalesClientes", "FormPrincipalesClientes2", "FormPrincipalesClientes3", "FormSistemaDeGestion"];
                var aValidated = [];
                aForms.forEach(oForm => {
                    let aformElements = this.getView().byId(oForm).getFormContainers()[0].getFormElements();
                    aformElements.forEach(aFElements => {
                        let aFields = aFElements.getFields();
                        aFields.forEach(aField => {
                            if (aField.getValue) {
                                let oFieldID = aField.getId().split("form--")[1];
                                let validate = aField.getValue() !== "" ? true : false;

                                if (!validate) {
                                    aValidated.push({ idField: oFieldID, state: validate });
                                    this.getById(oFieldID).setValueState("Error");
                                }
                            }
                        });
                    })
                });
                return aValidated.length;
            },

            onsubmit: function () {
                const _this = this;

                let nValidatedFields = this.validateFields();

                if (nValidatedFields) {
                    return;
                }
            },

            changeValueState: function (oEvent) {
                let oValue = oEvent.getSource().getValue()
                if (oValue) {
                    oEvent.getSource().setValueState("None")
                }
            },


            //Función para guardar los Datos Generales
            onSaveDatosGeneral: async function (oEvent) {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                //let oProveedor = this.getModel("oProveedor").getProperty("/DatosGeneral");
                let oProveedor = $.extend({}, this.getModel("oProveedor").getProperty("/DatosGeneral"));

                oProveedor.Land1 = oPreRegistro.Land1       // Viene del modelo preregistro
                oProveedor.Taxnumxl = oPreRegistro.Taxnumxl // Viene del modelo preregistro

                oProveedor.Tprovbienes = oProveedor.Tprovbienes ? "X" : ""
                oProveedor.Tprovservicios = oProveedor.Tprovservicios ? "X" : ""
                oProveedor.Tprovsubcontratista = oProveedor.Tprovsubcontratista ? "X" : ""
                oProveedor.Stras = oPreRegistro.Direccion

                /*
                //Agregar el Correo +@INSERT
                if (this.byId("txtEmail").getValue() != "" && this.byId("txtEmail").getValue() != undefined ) 
                {
                    oProveedor.Correo = this.byId("txtEmail").getValue();   
                }*/

                let oValidate = this.fnValidarCampos("DatoGeneral")

                if (!oValidate.isdValid) {
                    if (oValidate.message) {
                        MessageBox.error(oValidate.message)
                        return;
                    } else {
                        MessageBox.error(oBundle.getText("completeDatoOblig"));
                        return;
                    }
                }

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/DatosGeneralesSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("ContactoComercial")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            //Función para guardar Contacto Comercial
            onSaveContComercial: async function () {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/ContactoGeneral");

                oProveedor.Taxnumxl = oPreRegistro.Taxnumxl

                let oValidate = this.fnValidarCampos("ContactoComercial")

                if (!oValidate.isdValid) {
                    MessageBox.error(oValidate.message)
                    return
                }

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/ContactoComercialCabSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("Ejecutivos")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            //Función para guardar Linea de Negocio
            onSaveLineasNegocio: async function (oEvent) {
                let oPreRegistro = this.getModel("oPreRegistro").getData()
                let aLineaNegocio = this.getView().getModel("ListaLinNegocio").getProperty("/data")
                let oProveedor = {
                    "Taxnumxl": oPreRegistro.Taxnumxl,
                    "Correlativo": oPreRegistro.Correlativo,
                    "Land1": oPreRegistro.Land1,
                    "LineaNegocioDetSet": aLineaNegocio
                }

                if (aLineaNegocio.length === 0) {
                    MessageBox.error(oBundle.getText("addOneRegister"))
                    return
                }

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/LineaNegocioCabSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("LineaProducto")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            onAddLineaNegocio: function () {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/LineaNegocio");
                let oModel = this.getView().getModel("ListaLinNegocio");
                let oData = oModel.getData();

                let oValidate = _validarCampos()
                if (!oValidate.isdValid) {
                    MessageBox.error(oValidate.message)
                    return
                }
                let newCorrelativo = oData.data.length + 1;
                let oNewEntry = {
                    "Taxnumxl": oPreRegistro.Taxnumxl,
                    "Correlativo": oPreRegistro.Correlativo,
                    "Land1": oPreRegistro.Land1,
                    "Lineapos": newCorrelativo.toString(),
                    "Matkl": oProveedor.Matkl,
                    "Wgbez60": that.byId("cboMainGrupos").getSelectedItem().getText(),
                    "Bklas": oProveedor.Bklas,
                    "Bkbez": that.byId("cboMainCategorias").getSelectedItem().getText()
                }

                oData.data.push(oNewEntry);
                oModel.setData(oData);
                this._getListaEspecialidad(oData.data)

                this.getModel("oProveedor").setProperty("/LineaNegocio", {
                    Matkl: "",
                    Bklas: "",
                });

                function _validarCampos() {
                    let oReturn = {
                        isdValid: true,
                        message: oBundle.getText("completeDatoOblig")
                    }

                    let aComboBoxs = ["cboMainGrupos", "cboMainCategorias"]
                    oReturn.isdValid = that._validarComboBox(aComboBoxs)

                    return oReturn;
                }
            },

            onDeleteLineaNegocio: function (oEvent) {
                var oTable = this.getView().byId("tbListaLinNeg");
                var oItem = oEvent.getSource().getParent();
                var sPath = oItem.getBindingContext("ListaLinNegocio").getPath();
                var iIndex = parseInt(sPath.split("/").pop());

                var oModel = this.getView().getModel("ListaLinNegocio");
                var oData = oModel.getData();

                oData.data.splice(iIndex, 1);

                oModel.setData(oData);
                oTable.removeSelections();
                this._getListaEspecialidad(oData.data)
            },

            //Función para guardar la Información Contable
            onSaveInfoContable: async function (oEvent) {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/InformacionContable");

                oProveedor.Taxnumxl = oPreRegistro.Taxnumxl

                let oValidate = this.fnValidarCampos("InfoContable")

                if (!oValidate.isdValid) {
                    MessageBox.error(oValidate.message)
                    return
                }

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/InformacionContableCabSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("ReferenciaFinanciera")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            //Función para guardar los Principal Clientes OTROS
            onSavePrinciCliente: async function (oEvent) {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/Experiencia");

                oProveedor.Taxnumxl = oPreRegistro.Taxnumxl

                let oValidate = this.fnValidarCampos("PrincipalCliente")

                if (!oValidate.isdValid) {
                    MessageBox.error(oValidate.message)
                    return
                }

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/ExpPrincClientesCabSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("Documentacion")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            //Función para guardar los Principales Clientes PERÚ
            onSavePrinClientePeru: async function (oEvent) {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/ExpClienteCab");
                let aListaPrinClienPeru = this.getView().getModel("ListaPrincClientes").getData();
                let oSendData = {}

                oSendData.Land1 = oPreRegistro.Land1
                oSendData.Correlativo = oPreRegistro.Correlativo
                oSendData.Taxnumxl = oPreRegistro.Taxnumxl

                if (aListaPrinClienPeru.data.length === 0) {
                    MessageBox.error(oBundle.getText("addOneRegister"));
                    return
                }

                oSendData.ExpPrincClientesDetSet = aListaPrinClienPeru.data

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/ExpPrincClientesCabSet", oSendData)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("Documentacion")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            onAddPrinClientePeru: function () {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/ExpClienteCab");
                let oModel = this.getView().getModel("ListaPrincClientes");
                let oData = oModel.getData();

                let oValidate = _validarCampos()
                if (!oValidate.isdValid) {
                    MessageBox.error(oValidate.message)
                    return
                }

                let newCorrelativo = oData.data.length + 1;
                let oNewEntry = {
                    "Land1": oPreRegistro.Land1,
                    "Taxnumxl": oPreRegistro.Taxnumxl,
                    "Correlativo": oPreRegistro.Correlativo,
                    "Nifpos": newCorrelativo.toString(),
                    "Cliente": oProveedor.Cliente ? oProveedor.Cliente : "",
                    "Fechacontrato": oProveedor.Fechacontrato ? oProveedor.Fechacontrato : "",
                    "Nombreproyecto": oProveedor.Nombreproyecto ? oProveedor.Nombreproyecto : "",
                    "Ncontratooc": oProveedor.Ncontratooc ? oProveedor.Ncontratooc : "",
                    "Monedaso": this.byId("rbgMonedaPeru").getSelectedIndex() == 0 ? "X" : "",
                    "Monedado": this.byId("rbgMonedaPeru").getSelectedIndex() == 1 ? "X" : "",
                    "Montoventa": oProveedor.Montoventa ? oProveedor.Montoventa : "",
                    "Prodservvendidos": oProveedor.Prodservvendidos ? oProveedor.Prodservvendidos : "",
                    "Contactocliente": oProveedor.Contactocliente ? oProveedor.Contactocliente : "",
                    "Cargo": oProveedor.Cargo ? oProveedor.Cargo : "",
                    "Email": oProveedor.Email ? oProveedor.Email : "",
                    "Telefonoexp": oProveedor.Telefonoexp ? oProveedor.Telefonoexp : ""
                }

                oData.data.push(oNewEntry);
                oModel.setData(oData);

                this.getModel("oProveedor").setProperty("/ExpClienteCab", {
                    "Land1": "",
                    "Taxnumxl": "",
                    "Correlativo": "",
                    "Nifpos": "",
                    "Cliente": "",
                    "Fechacontrato": "",
                    "Nombreproyecto": "",
                    "Ncontratooc": "",
                    "Monedaso": "",
                    "Monedado": "",
                    "Montoventa": "",
                    "Prodservvendidos": "",
                    "Contactocliente": "",
                    "Cargo": "",
                    "Email": "",
                    "Telefonoexp": ""
                });
                this.byId("rbgMonedaPeru").setSelectedIndex(-1);

                function _validarCampos(oProveedor) {
                    let oReturn = {
                        isdValid: true,
                        message: oBundle.getText("completeDatoOblig")
                    }

                    let aInputs = ["txtClientePCP", "txtNombreProyectoPC", "txtServicioPC", "txtContactoPC", "txtEmailPC", "txtCargoPC", "TxtFechaCont"]
                    oReturn.isdValid = that._validarInput(aInputs)

                    return oReturn;
                }

            },

            onDeleteItemPrinCliente: function (oEvent) {
                var oTable = this.getView().byId("tbListaPC");
                var oItem = oEvent.getSource().getParent();
                var sPath = oItem.getBindingContext("ListaPrincClientes").getPath();
                var iIndex = parseInt(sPath.split("/").pop()); // Obtiene el índice de la fila a eliminar

                var oModel = this.getView().getModel("ListaPrincClientes");
                var oData = oModel.getData();

                oData.data.splice(iIndex, 1); // Elimina la fila del array de datos

                oModel.setData(oData);
                oTable.removeSelections();
            },

            //Función para guardar la Cuentas Bancarias
            onSaveCuentBancaria: async function (oEvent) {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/CuentaBancaria");

                oProveedor.Taxnumxl = oPreRegistro.Taxnumxl

                let oValidate = this.fnValidarCampos("CuentaBancaria")

                if (!oValidate.isdValid) {
                    MessageBox.error(oValidate.message)
                    return
                }

                if (oProveedor.CuentasBancariasDetSet[0].Nombrebanco) {
                    let oBank = this.byId("cboNombreBanco").getSelectedItem().getBindingContext().getObject()
                    oProveedor.CuentasBancariasDetSet[0].Paisbanco = oBank.Land1
                    oProveedor.CuentasBancariasDetSet[0].Clavebanco = oBank.Bankl
                }

                if (oProveedor.CuentasBancariasDetSet[1].Nombrebanco) {
                    let oBank = this.byId("cboNombreBanco2").getSelectedItem().getBindingContext().getObject()
                    oProveedor.CuentasBancariasDetSet[1].Paisbanco = oBank.Land1
                    oProveedor.CuentasBancariasDetSet[1].Clavebanco = oBank.Bankl
                }

                if (oProveedor.CuentasBancariasDetSet[2].Nombrebanco) {
                    let oBank = this.byId("cboNombreBanco3").getSelectedItem().getBindingContext().getObject()
                    oProveedor.CuentasBancariasDetSet[2].Paisbanco = oBank.Land1
                    oProveedor.CuentasBancariasDetSet[2].Clavebanco = oBank.Bankl
                }

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/CuentasBancariasCabSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("SistemaCalidad")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            //Función para guardar la Sistema Gestion
            onSaveSistemGestion: async function (oEvent) {
                let opcPlanes = { uploadError: false, ejecUpload: false };

                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = $.extend({}, this.getModel("oProveedor").getProperty("/SistemaGestion"));
                let oSistemaSeguridad = this.getModel("oProveedor").getProperty("/SistemaSeguridad");

                oProveedor.Taxnumxl = oPreRegistro.Taxnumxl;
                //oProveedor.Seguridadsalud = this.byId("SiCheckBox").getSelectedIndex() == 0 ? "X" : ""

                //Convertir los número al tipo Interno de SAP. Ejem: 15458.36
                //this.convertNumberInternSistemaGestion(oProveedor); //-@DELETE

                if (this.byId("SubcontratistaCheckBox").getSelected()) {
                    let oValidate = this.fnValidarCampos("SistemaGestion")

                    if (!oValidate.isdValid) {
                        MessageBox.error(oValidate.message)
                        return
                    }

                    let aFiles = this.getModel("aDocumentos").getProperty("/sistema")
                    if (this.byId("rbgPregunta3SS").getSelectedIndex() == "0" && aFiles.length === 0) {
                        MessageBox.error(oBundle.getText("pregunt3SSFile"))
                        return
                    }
                }

                oSistemaSeguridad.Land1 = oPreRegistro.Land1
                oSistemaSeguridad.Taxnumxl = oPreRegistro.Taxnumxl
                oSistemaSeguridad.Correlativo = oPreRegistro.Correlativo

                //Sistema de Seguridad
                if (this.byId("rbgPregunta1SS").getSelectedIndex() == "0") {
                    oSistemaSeguridad.SistGestSeguSaludTrab = "X"
                } else {
                    oSistemaSeguridad.SistGestSeguSaludTrab = ""
                }

                if (this.byId("rbgPregunta2SS").getSelectedIndex() == "0") {
                    oSistemaSeguridad.SistGestAmbi = "X"
                } else {
                    oSistemaSeguridad.SistGestAmbi = ""
                }

                if (this.byId("rbgPregunta3SS").getSelectedIndex() == "0") {
                    oSistemaSeguridad.ComiSeguSaludTrab = "X"
                } else {
                    oSistemaSeguridad.ComiSeguSaludTrab = ""
                }

                if (this.byId("rbgPregunta4SS").getSelectedIndex() == "0") {
                    oSistemaSeguridad.RegiEstaSeguSalud = "X"
                } else {
                    oSistemaSeguridad.RegiEstaSeguSalud = ""
                }

                if (this.byId("rbgPregunta5SS").getSelectedIndex() == "0") {
                    oSistemaSeguridad.ReglInteSst = "X"
                } else {
                    oSistemaSeguridad.ReglInteSst = ""
                }

                if (this.byId("rbgPregunta6SS").getSelectedIndex() == "0") {
                    oSistemaSeguridad.PlanGestResiSoli = "X"
                } else {
                    oSistemaSeguridad.PlanGestResiSoli = ""
                }

                if (this.byId("rbgPregunta1CC").getSelectedIndex() == "0") {
                    oSistemaSeguridad.PlanSst = "X"
                } else {
                    oSistemaSeguridad.PlanSst = ""
                }
                if (this.byId("rbgPregunta2CC").getSelectedIndex() == "0") {
                    oSistemaSeguridad.PlanRespEmer = "X"
                } else {
                    oSistemaSeguridad.PlanRespEmer = ""
                }
                if (this.byId("rbgPregunta3CC").getSelectedIndex() == "0") {
                    oSistemaSeguridad.PlanCapa = "X"
                } else {
                    oSistemaSeguridad.PlanCapa = ""
                }
                if (this.byId("rbgPregunta4CC").getSelectedIndex() == "0") {
                    oSistemaSeguridad.ProcTrabSegu = "X"
                } else {
                    oSistemaSeguridad.ProcTrabSegu = ""
                }
                if (this.byId("rbgPregunta5CC").getSelectedIndex() == "0") {
                    oSistemaSeguridad.MatrIperc = "X"
                } else {
                    oSistemaSeguridad.MatrIperc = ""
                }

                //Nuevos Campos de opciones +@INSERT
                if (this.byId("rbgPregunta5_1CC").getSelectedIndex() == "0") {
                    oSistemaSeguridad.InfoAudiMintra = "X"
                } else {
                    oSistemaSeguridad.InfoAudiMintra = ""
                }
                if (this.byId("rbgPregunta5_2CC").getSelectedIndex() == "0") {
                    oSistemaSeguridad.PlanAccAudi = "X"
                } else {
                    oSistemaSeguridad.PlanAccAudi = ""
                }
                if (this.byId("rbgPregunta5_3CC").getSelectedIndex() == "0") {
                    oSistemaSeguridad.ResoAudiMintra = "X"
                } else {
                    oSistemaSeguridad.ResoAudiMintra = ""
                }

                //Validación archivo adjunto "Cuenta con algunos planes" +@INSERT 
                this.fnValidarPlanes(opcPlanes);
                if (opcPlanes.uploadError === true) {
                    return
                }

                // if ( this.byId("rbgPregunta7SS").getSelectedIndex() == "0") {
                //     oProveedor.Cuenalguplanes = "X"
                // } else {
                //     oProveedor.Cuenalguplanes = ""
                // }

                oProveedor.SistemaGestionSeguridadSet = [oSistemaSeguridad]

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/SistemaGestionCabSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        that.onSaveFilesDocumentos('/sistema', 'SISTEMA', 'X');
                        //Cargar Archivo Adjunto - "Cuenta con algunos planes" +@INSERT 
                        if (opcPlanes.ejecUpload === true) {
                            that.onSaveFilesDocumentos('/planes', 'PLANES', 'X')
                        }

                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("PrincipalCliente")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            _guardarTerminosCondiciones: async function () {
                return new Promise(async (resolve, reject) => {

                    let oPreRegistro = this.getModel("oPreRegistro").getData()
                    let sSucursal = this.byId("slSucursal").getSelectedKey()
                    let oSendData = {
                        "Taxnumxl": oPreRegistro.Taxnumxl,
                        "Sucursalescosapi": sSucursal,
                        "Aceptorechazotyc": "X"
                    }

                    try {
                        const oResultData = await this.createEntity(oModelPreRegProv, "/TerminosYCondicionesSet", oSendData)

                        if (oResultData.Codigo == "500") {
                            //MessageBox.error(oResultData.Mensaje)
                            resolve(false)
                        } else {
                            resolve(true)
                        }
                    } catch (error) {
                        resolve(false)
                    }

                });
            },

            // Funciones de la pestaña REFERENCIA FINANCIERA
            onSaveReferenciasFinancieras: async function (oEvent) {
                let oPreRegistro = this.getModel("oPreRegistro").getData()
                let sSelectNoAplica = this.byId("NoAplicaCheckBox").getSelected() ? "X" : ""
                let oProveedor = {
                    "Taxnumxl": oPreRegistro.Taxnumxl,
                    "Correlativo": oPreRegistro.Correlativo,
                    "Land1": oPreRegistro.Land1,
                    "Noaplicarefefinanc": sSelectNoAplica,
                    "RegistroRefeFinanLogSet": []
                };
                let RegistroRefeFinanLogSet = this.getView().getModel("ListaReferencias").getProperty("/data")

                if (sSelectNoAplica === "" && RegistroRefeFinanLogSet.length === 0) {
                    MessageBox.error(oBundle.getText("addOneRegister"))
                    return
                }

                for (let i = 0; i < RegistroRefeFinanLogSet.length; i++) {
                    let oRefFinanciera = RegistroRefeFinanLogSet[i]
                    oProveedor.RegistroRefeFinanLogSet.push({
                        "Entfinancpos": oRefFinanciera.Entfinancpos.toString(),
                        "EmailSec": oRefFinanciera.EmailSec,
                        "Taxnumxl": oRefFinanciera.Taxnumxl,
                        "Correlativo": oRefFinanciera.Correlativo,
                        "IdEnt": oRefFinanciera.IdEnt,
                        "Land1": oRefFinanciera.Land1,
                        "NombreEnt": oRefFinanciera.NombreEnt,
                        "NombreSect": oRefFinanciera.NombreSect,
                        "TelSec": oRefFinanciera.TelSec,
                        "LinAproS": oRefFinanciera.LinAproS,
                        "LinAproD": oRefFinanciera.LinAproD,
                        "Monto": oRefFinanciera.Monto,
                        "NombreEntLibre": oRefFinanciera.NombreEntLibre //+@INSERT
                    })
                }

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/RegistroRefeFinancierasSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("CuentaBancaria")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            onAddRefFinanciera: function () {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/RefFinanciera");
                let oModel = this.getView().getModel("ListaReferencias");
                let oData = oModel.getData();

                if (!this.byId("NoAplicaCheckBox").getSelected()) {
                    let oValidate = _validarCampos()
                    if (!oValidate.isdValid) {
                        MessageBox.error(oValidate.message)
                        return
                    }
                }

                let newCorrelativo = oData.data.length + 1;
                let oNewEntry = {
                    "Entfinancpos": newCorrelativo,
                    "EmailSec": oProveedor.EmailSec,
                    "Taxnumxl": oPreRegistro.Taxnumxl,
                    "Correlativo": oPreRegistro.Correlativo,
                    "IdEnt": oProveedor.IdEnt,
                    "Land1": oPreRegistro.Land1,
                    "NombreEnt": this.byId("cboMainFinanza").getValue(),
                    "NombreSect": oProveedor.NombreSect,
                    "TelSec": oProveedor.TelSec,
                    "LineaCredito": this.byId("rbgLineacredi").getSelectedIndex() == 0 ? "S/" : "USD", //Campo solo vista tabla
                    "LinAproS": this.byId("rbgLineacredi").getSelectedIndex() == 0 ? "X" : "",
                    "LinAproD": this.byId("rbgLineacredi").getSelectedIndex() == 1 ? "X" : "",
                    "Monto": oProveedor.Monto,
                    "NombreEntLibre": this.byId("txtNombreEntid").getValue(), //+@INSERT
                }

                oData.data.push(oNewEntry);
                oModel.setData(oData);

                this.getModel("oProveedor").setProperty("/RefFinanciera", {
                    EmailSec: "",
                    IdEnt: "",
                    NombreSect: "",
                    TelSec: "",
                    Monto: "",
                    NombreEntLibre: "",//+@INSERT
                });
                this.byId("rbgLineacredi").setSelectedIndex(-1);
                this.byId("NoAplicaCheckBox").setSelected(false)

                function _validarCampos(oProveedor) {
                    let oReturn = {
                        isdValid: true,
                        message: oBundle.getText("completeDatoOblig")
                    }
                    let oProveedorData = that.getModel("oProveedor").getData();//+@INSERT
                    let aSelectes = [];

                    let aInputs = ["txtNombresec"]
                    if (oProveedorData.DatosGeneral.Flagactivereferfinan == "X") { //+@INSERT
                        aSelectes.push("cboMainFinanza");
                    } else {
                        aInputs.push("txtNombreEntid");
                    }

                    oReturn.isdValid = that._validarInput(aInputs)

                    if (oReturn.isdValid) {
                        oReturn.isdValid = that._validarComboBox(aSelectes)
                    } else {
                        that._validarComboBox(aSelectes)
                    }

                    return oReturn;
                }
            },

            onDeleteRefFinanciera: function (oEvent) {
                var oTable = this.getView().byId("tbListaRef");
                var oItem = oEvent.getSource().getParent();
                var sPath = oItem.getBindingContext("ListaReferencias").getPath();
                var iIndex = parseInt(sPath.split("/").pop()); // Obtiene el índice de la fila a eliminar

                var oModel = this.getView().getModel("ListaReferencias");
                var oData = oModel.getData();

                oData.data.splice(iIndex, 1); // Elimina la fila del array de datos

                oModel.setData(oData);
                oTable.removeSelections();
            },

            // Funciones de la pestaña LINEA DE PRODUCTO / CONTACTO COMERCIAL
            onSaveLineaProducto: async function () {
                let oPreRegistro = this.getModel("oPreRegistro").getData()
                let aRegistroLinProdDetSet = this.getView().getModel("ListaLineaProducto").getProperty("/data")
                let oProveedor = {
                    "Taxnumxl": oPreRegistro.Taxnumxl,
                    "Correlativo": oPreRegistro.Correlativo,
                    "Land1": oPreRegistro.Land1,
                    "LineaProductoDetSet": aRegistroLinProdDetSet
                }

                // let oValidate = this.fnValidarCampos("LineaProducto")

                // if (!oValidate.isdValid) {
                //     MessageBox.error(oValidate.message)
                //     return
                // }

                if (aRegistroLinProdDetSet.length == 0) {
                    MessageBox.error(oBundle.getText("addOneContacComercial"))
                    return
                }

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/LineaProductoCabSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("InfoContable")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            onAddLineaProducto: function () {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/LineaProducto");
                let oModel = this.getView().getModel("ListaLineaProducto");
                let oData = oModel.getData();
                let oProveedorCab = $.extend({}, this.getModel("oProveedor").getProperty("/LineaProducto"));

                let oValidate = _validarCampos()
                if (!oValidate.isdValid) {
                    MessageBox.error(oValidate.message)
                    return
                }

                if (oProveedorCab.IdEsp == "") {
                    MessageBox.error(oBundle.getText("selectEspeciality"))
                    return
                }

                let newCorrelativo = oData.data.length + 1;
                var oNewEntry = {
                    "Taxnumxl": oPreRegistro.Taxnumxl,
                    "Correlativo": oPreRegistro.Correlativo,
                    "Land1": oPreRegistro.Land1,
                    "NomApe": oProveedor.NomApe,
                    "Email": oProveedor.Email,
                    "Celular": oProveedor.Celular,
                    "Cargo": oProveedor.Cargo,
                    "TelFij": oProveedor.TelFij,
                    "Lineaprodpos": newCorrelativo.toString(),
                    "Especialidadcod": oProveedor.IdEsp,
                    "Especialidaddes": that.byId("cboMainEspecialidad").getSelectedItem().getText(),
                    "Marca": oProveedor.Marca,
                    "Lineaprodservcod": that.byId("txtServicioCod").getText(),
                    "Lineaprodservdes": oProveedor.LinProdS,
                    "PromdmenventSo": that.byId("rbgPromedioMensual").getSelectedIndex() == 0 ? "X" : "",
                    "PromdmenventDo": that.byId("rbgPromedioMensual").getSelectedIndex() == 1 ? "X" : "",
                    "PromdmenventMonto": oProveedor.PromMen
                }

                oData.data.push(oNewEntry);
                oModel.setData(oData);

                this.getModel("oProveedor").setProperty("/LineaProducto", {
                    NomApe: "",
                    Cargo: "",
                    Email: "",
                    TelFij: "",
                    Celular: ""
                });

                function _validarCampos() {
                    let oReturn = {
                        isdValid: true,
                        message: oBundle.getText("completeDatoOblig")
                    }
                    let aInputs = ["txtNombreapLP1", "txtCargoLP1", "txtCorreoLP1", "txtTelefonoLP1", "txtCelularLP1", "txtPromedioMensual", "txtServicio"],
                        aSelectes = ["cboMainEspecialidad"]

                    oReturn.isdValid = that._validarInput(aInputs)

                    if (oReturn.isdValid) {
                        oReturn.isdValid = that._validarComboBox(aSelectes)
                    } else {
                        that._validarComboBox(aSelectes)
                    }
                    return oReturn;
                }

                function _generateCorrelativeID(index) {
                    var id = String(index);
                    var zerosToAdd = "0000";
                    var correlativeID = zerosToAdd.substring(0, zerosToAdd.length - id.length) + id;
                    return correlativeID;
                }
            },

            onDeleteLineaProducto: function (oEvent) {
                let oTable = this.getView().byId("tbListaContactoC");
                let oItem = oEvent.getSource().getParent();
                let sPath = oItem.getBindingContext("ListaLineaProducto").getPath();
                let iIndex = parseInt(sPath.split("/").pop());
                let oModel = this.getView().getModel("ListaLineaProducto");
                let oData = oModel.getData();

                oData.data.splice(iIndex, 1);

                oModel.setData(oData);
                oTable.removeSelections();
            },

            onSaveSistemaGestCalidad: async function () {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = $.extend({}, this.getModel("oProveedor").getProperty("/GestionCalidad"));

                let oValidate = this.fnValidarCampos("SistemaCalidad")

                if (!oValidate.isdValid) {
                    MessageBox.error(oValidate.message)
                    return
                }

                oProveedor.Taxnumxl = oPreRegistro.Taxnumxl
                oProveedor.Land1 = oPreRegistro.Land1
                oProveedor.Correlativo = oPreRegistro.Correlativo

                oProveedor.RegistroGesCalDetSet[0].Taxnumxl = oPreRegistro.Taxnumxl
                oProveedor.RegistroGesCalDetSet[0].Land1 = oPreRegistro.Land1
                oProveedor.RegistroGesCalDetSet[0].Correlativo = oPreRegistro.Correlativo
                delete oProveedor.RegistroGesCalDetSet[0].Id

                if (this.byId("rbgPregunta1").getSelectedIndex() == "0") {
                    oProveedor.RegistroGesCalDetSet[0].SisGesCal = "X"
                } else {
                    oProveedor.RegistroGesCalDetSet[0].SisGesCal = ""
                }

                if (this.byId("rbgPregunta2").getSelectedIndex() == "0") {
                    oProveedor.RegistroGesCalDetSet[0].SisAsCal = "X"
                } else {
                    oProveedor.RegistroGesCalDetSet[0].SisAsCal = ""
                }

                if (this.byId("rbgPregunta3").getSelectedIndex() == "0") {
                    oProveedor.RegistroGesCalDetSet[0].SisConCal = "X"
                } else {
                    oProveedor.RegistroGesCalDetSet[0].SisConCal = ""
                }

                if (this.byId("rbgPregunta4").getSelectedIndex() == "0") {
                    oProveedor.RegistroGesCalDetSet[0].SisGesAl = "X"
                } else {
                    oProveedor.RegistroGesCalDetSet[0].SisGesAl = ""
                }

                if (this.byId("rbgISO").getSelectedIndex() == "0") {
                    oProveedor.RegistroGesCalDetSet[0].CerIso = "X"
                } else {
                    oProveedor.RegistroGesCalDetSet[0].CerIso = ""
                }

                if (this.byId("rbgPregunta5").getSelectedIndex() == "0") {
                    oProveedor.RegistroGesCalDetSet[0].EntCerPg = "X"
                } else {
                    oProveedor.RegistroGesCalDetSet[0].EntCerPg = ""
                }

                if (this.byId("rbgPregunta6").getSelectedIndex() == "0") {
                    oProveedor.RegistroGesCalDetSet[0].EntCalProd = "X"
                } else {
                    oProveedor.RegistroGesCalDetSet[0].EntCalProd = ""
                }

                if (this.byId("rbgPregunta7").getSelectedIndex() == "0") {
                    oProveedor.RegistroGesCalDetSet[0].SubProcAct = "X"

                    if (oProveedor.RegistroGesCalDetSet[0].SubProcActText == "") {
                        MessageBox.error(oBundle.getText("validateIngreseComent"))
                        return
                    }
                } else {
                    oProveedor.RegistroGesCalDetSet[0].SubProcAct = ""
                    oProveedor.RegistroGesCalDetSet[0].SubProcActText = ""
                }

                delete oProveedor.SubProcActText

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/RegistroGesCalSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("SistemaGestion")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            //Para la pregunta D.Sistema de gestión de la calidad alineado a norma
            onSelectOtros: function (oEvent) {
                let sKey = oEvent.getSource().getSelectedIndex()

                if (sKey == "1") {
                    this.byId("txtOtrosD").setVisible(true)
                } else {
                    this.byId("txtOtrosD").setVisible(false)
                }
            },

            onSaveEjecutivoEmpresa: async function () {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/Ejecutivos");
                oProveedor.Taxnumxl = oPreRegistro.Taxnumxl
                oProveedor.Correlativo = oPreRegistro.Correlativo
                oProveedor.Land1 = oPreRegistro.Land1
                oProveedor.RegistroEjecEmpresaLogSet[0].Taxnumxl = oPreRegistro.Taxnumxl
                oProveedor.RegistroEjecEmpresaLogSet[0].Correlativo = oPreRegistro.Correlativo
                oProveedor.RegistroEjecEmpresaLogSet[0].Land1 = oPreRegistro.Land1
                delete oProveedor.RegistroEjecEmpresaLogSet[0].Id

                let oValidate = this.fnValidarCampos("EjecutivoEmpresa")

                if (!oValidate.isdValid) {
                    MessageBox.error(oValidate.message)
                    return
                }

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/RegistroEjecEmpresaSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("LineaNegocio")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            //Sistema de Gestión Seguridad
            onSaveSistemaGestSeguridad: async function () {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/SistemaSeguridad");
                oProveedor.Taxnumxl = oPreRegistro.Taxnumxl
                oProveedor.Correlativo = oPreRegistro.Correlativo
                oProveedor.Land1 = oPreRegistro.Land1

                if (this.byId("rbgPregunta1SS").getSelectedIndex() == "0") {
                    oProveedor.SistGestSeguSaludTrab = "X"
                } else {
                    oProveedor.SistGestSeguSaludTrab = ""
                }

                if (this.byId("rbgPregunta2SS").getSelectedIndex() == "0") {
                    oProveedor.SistGestAmbi = "X"
                } else {
                    oProveedor.SistGestAmbi = ""
                }

                if (this.byId("rbgPregunta3SS").getSelectedIndex() == "0") {
                    oProveedor.ComiSeguSaludTrab = "X"
                } else {
                    oProveedor.ComiSeguSaludTrab = ""
                }

                if (this.byId("rbgPregunta4SS").getSelectedIndex() == "0") {
                    oProveedor.RegiEstaSeguSalud = "X"
                } else {
                    oProveedor.RegiEstaSeguSalud = ""
                }

                if (this.byId("rbgPregunta5SS").getSelectedIndex() == "0") {
                    oProveedor.ReglInteSst = "X"
                } else {
                    oProveedor.ReglInteSst = ""
                }

                if (this.byId("rbgPregunta6SS").getSelectedIndex() == "0") {
                    oProveedor.PlanGestResiSoli = "X"
                } else {
                    oProveedor.PlanGestResiSoli = ""
                }

                try {
                    sap.ui.core.BusyIndicator.show(0)

                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/SistemaGestionSeguridadSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("SistemaCalidad")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },
            onSelectSS: function (oEvent, sId) {
                let sKey = oEvent.getSource().getSelectedIndex()

                if (sKey == "0") {
                    this.byId(sId).setVisible(true)
                } else {
                    this.byId(sId).setVisible(false)
                }
            },

            //Aprobar último tab para la actualización de datos
            //onSendSolicitudUpdate: async function () {
            _sendSolicitudUpdate: async function () {
                return new Promise(async (resolve, reject) => {

                    let oPreRegistro = this.getModel("oPreRegistro").getData()
                    let oSendData = {
                        "Taxnumxl": oPreRegistro.Taxnumxl,
                        "Codigoestado": "04",
                        "Usuario": "",
                        "Correonombre": ""
                    }

                    let oValidate = this.fnValidarCampos("Todo")

                    if (!oValidate.isdValid) {
                        MessageBox.error(oValidate.message)
                        resolve(false)
                    }

                    //let bValidate = await that._saveSistemGestion()
                    try {
                        const oResultData = await this.createEntity(oModelPreRegProv, "/LogPPSet", oSendData)

                        if (oResultData.Codigo == "500") {
                            MessageBox.error(oResultData.Mensaje)
                            resolve(false)
                        } else {
                            //MessageBox.success(oResultData.Mensaje)
                            resolve(true)
                        }
                    } catch (error) {
                        //MessageBox.error(error)
                        resolve(false)
                    }

                });
            },

            //Función para obtener las regiones según el país seleccionado
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
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion onChangePais: " + error)
                }
            },

            //Función para obtener las ciudades según el país y región seleccionado
            onChangeRegion: async function (oEvent) {

                let odataPreRegis = this.getView().getModel("oPreRegistro").getData();
                let errorData = false;
                let sKey = this.byId("cboMainRegionDpto").getSelectedKey(),
                    sKeyPais = this.byId("cboMainPais").getSelectedKey()
                let filters = [];

                filters.push(new Filter("Region", "EQ", `${sKey}`))
                filters.push(new Filter("Pais", "EQ", `${sKeyPais}`))

                if (odataPreRegis.Land1 != "PE") {
                    return;
                }

                try {
                    let oModel = this.getOwnerComponent().getModel()
                    const aListaCiudades = await this.readEntity(oModelPreRegProv, "/ConsultaRegDepCiudadSet", { filters })
                    oModel.setProperty("/Ciudad", aListaCiudades.results)
                    if (aListaCiudades.results.length == 0) {
                        this.byId("cboMainCiudad").setSelectedKey("")
                        MessageToast.show(oBundle.getText("addCiudad"));
                        errorData = true;
                    } else {
                        this.byId("cboMainCiudad").fireChange()  //+@INSERT
                    }
                    //Actualizar valor seleccionado
                    if (sKey != "" && sKey != undefined) {
                        const filterResults = aListaCiudades.results.filter(x => x.Region === initValuesUbic.Region);
                        if (filterResults.length === 0) {
                            this.byId("cboMainCiudad").setSelectedKey("");
                            this.byId("cboMainDistrito").setSelectedKey("");
                            this.initValuesUbigeoProv(true);//+@INSERT    
                        }
                    }

                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion onChangeRegion: " + error)
                    errorData = true;
                }

                this._checkDataRegion(errorData); //+@INSERT - Corregir el error para editar los datos del extranjeros
            },

            changeNombreBanco: function (oEvent, sKeyMoneda) {
                let oValue = oEvent.getSource().getValue()
                this.byId(sKeyMoneda).setEditable(true)
                if (oValue) {
                    oEvent.getSource().setValueState("None")
                    if (oValue == "Banco de la Nación-PEN") {
                        this.byId(sKeyMoneda).setSelectedKey("PEN")
                        this.byId(sKeyMoneda).setEditable(false)
                    } else {
                        this.byId(sKeyMoneda).setEditable(true)
                    }
                }
            },

            /****************************************************/
            /** Funciones para obtener datos de los despegables */
            /****************************************************/
            _getListaPaises: async function () {
                let odataPreRegis = this.getView().getModel("oPreRegistro").getData();
                try {
                    let oModel = this.getOwnerComponent().getModel()
                    const aListaPaises = await this.readEntity(oModelPreRegProv, "/ConsultaPaisesSet", {})
                    oModel.setSizeLimit(9000);
                    if (odataPreRegis.Land1 == "PE") {
                        const filterPais = aListaPaises.results.filter(x => x.Land1 === "PE");
                        oModel.setProperty("/Paises", filterPais);
                    } else {
                        oModel.setProperty("/Paises", aListaPaises.results);
                    }

                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion _getListaPaises: " + error)
                }
            },

            _getListaGrupos: async function () {
                try {
                    let oModel = this.getOwnerComponent().getModel()
                    const aListaGrupos = await this.readEntity(oModelPreRegProv, "/ConsultaGruposSet", {})
                    oModel.setSizeLimit(9000);
                    oModel.setProperty("/Grupos", aListaGrupos.results)
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion _getListaGrupos: " + error)
                }
            },

            _getListaCategoria: async function () {
                try {
                    let oModel = this.getOwnerComponent().getModel()
                    const aListaCategoria = await this.readEntity(oModelPreRegProv, "/ConsultaCategoriasSet", {})
                    oModel.setSizeLimit(9000);
                    oModel.setProperty("/Categorias", aListaCategoria.results)
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion _getListaCategoria: " + error)
                }
            },

            _getListaNombreBanco: async function () {

                let extranjero = true;
                let oDataPreRegis = this.getModel("oPreRegistro").getData();
                let filters = [];

                if (oDataPreRegis.Land1 == "PE" && oDataPreRegis.Land1 == "CL") {
                    return;
                }

                /*-@DELETE
                if (oDataPreRegis.Land1 == "PE")    //+@INSERT - Agregar Filtro
                {
                    filters.push(new Filter("Land1", "EQ", `${oDataPreRegis.Land1}`));
                } else {
                    extranjero = true;
                }
                */
                filters.push(new Filter("Land1", "EQ", "EXT"));
                filters.push(new Filter("Waers", "EQ", "USD"));

                try {
                    let oModel = this.getOwnerComponent().getModel()
                    const aListaNombreBanco = await this.readEntity(oModelPreRegProv, "/ConsultaNombreBancoSet", { filters })
                    oModel.setSizeLimit(9000);
                    if (extranjero) {
                        const filterResults = aListaNombreBanco.results.filter(x => x.Bankl === "DEX99");
                        oModel.setProperty("/NombreBancos", filterResults);
                        this.byId("cboNombreBanco").setSelectedKey("DEX99");
                        this.byId("cboNombreBanco").setEditable(false);
                    } else {
                        oModel.setProperty("/NombreBancos", aListaNombreBanco.results);
                    }

                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion _getListaNombreBanco: " + error)
                }
            },

            _getListaMoneda: async function () {

                let extranjero = false;
                let oDataPreRegis = this.getModel("oPreRegistro").getData();
                let filters = [];
                if (oDataPreRegis.Land1 == "PE")    //+@INSERT - Agregar Filtro
                {

                    filters.push(new Filter("Waers", "EQ", "PEN"),
                        new Filter("Waers", "EQ", "USD"));
                } else {
                    filters.push(new Filter("Waers", "EQ", "USD"));
                    extranjero = true;
                }

                try {
                    let oModel = this.getOwnerComponent().getModel()
                    const aListaMoneda = await this.readEntity(oModelPreRegProv, "/ConsultaMonedaSet", { filters })
                    oModel.setSizeLimit(9000);
                    oModel.setProperty("/Moneda", aListaMoneda.results);

                    //inahablitar ciertos campos cuando el proveedor es extranjero
                    if (extranjero) {
                        this._setInitialInputExtranjero(true);
                    } else {
                        this._setInitialInputExtranjero(false);
                    }

                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion _getListaMoneda: " + error)
                }
            },

            _getListaTipoPlanes: async function () {
                try {
                    let oModel = this.getOwnerComponent().getModel()
                    const aListaTipoPlanes = await this.readEntity(oModelPreRegProv, "/ConsultaPlanesDeSaludSet", {})
                    oModel.setSizeLimit(9000);
                    oModel.setProperty("/TipoPlanes", aListaTipoPlanes.results)
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion _getListaTipoPlanes: " + error)
                }
            },

            _getListaTipoCuenta: async function () {
                try {

                    let oData = this.getView().getModel("oPreRegistro").getData();
                    let filters = [];
                    let oModel = this.getOwnerComponent().getModel()

                    filters.push(new Filter("Land1", "EQ", `${oData.Land1}`));

                    let aListaTipoCuenta = await this.readEntity(oModelPreRegProv, "/ConsultaTipoCuentaBancSet", { filters })
                    if (aListaTipoCuenta.results == 0) {
                        filters = [];
                        filters.push(new Filter("Land1", "EQ", "EXT"));
                        aListaTipoCuenta = await this.readEntity(oModelPreRegProv, "/ConsultaTipoCuentaBancSet", { filters })
                    }
                    oModel.setSizeLimit(9000);
                    oModel.setProperty("/TipoCuenta", aListaTipoCuenta.results)
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion _getListaTipoCuenta: " + error)
                }
            },

            _getListaSucursal: async function () {
                try {
                    let oModel = this.getOwnerComponent().getModel()
                    const aListaSucursal = await this.readEntity(oModelPreRegProv, "/ConsultaSucursalesCOSAPISet", {})
                    oModel.setSizeLimit(9000);
                    /*-@DELETE
                    let aNewSucursal = [{
                        Id: 1,
                        Sucursalescosapi: "Perú"
                    },
                    {
                        Id: 2,
                        Sucursalescosapi: "Chile"
                    },
                    {                                     //+@INSERT - Agregar la Opción Otros
                        Id: 3,
                        Sucursalescosapi: "Otros"
                    }];*/

                    oModel.setProperty("/Sucursal", aListaSucursal.results)
                } catch (error) {
                    //MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.error("Funcion _getListaSucursal: ");
                    console.error(error);
                }
            },

            _getListaEspecialidad: async function (aData) {
                let oModel = this.getOwnerComponent().getModel()
                oModel.setProperty("/Especialidad", aData)
            },

            _getRefFinanciera: async function () {
                try {
                    let oPreRegistro = this.getModel("oPreRegistro").getData();
                    let oModel = this.getOwnerComponent().getModel()

                    let filters = []
                    filters.push(new Filter("Land1", "EQ", oPreRegistro.Land1))
                    const aListaRefFinanciera = await this.readEntity(oModelPreRegProv, "/ConsultaRefFinancierasSet", { filters })
                    oModel.setSizeLimit(9000);
                    oModel.setProperty("/RefFinanciera", aListaRefFinanciera.results)
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion _getListaRefFinanciera: " + error)
                }
            },

            //Funcion para validar campos obligatorios
            fnValidarCampos: function (sForm) {

                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/CuentaBancaria");

                let oReturn = {
                    isdValid: true,
                    message: oBundle.getText("completeDatoOblig")
                }

                let aInputs,
                    aSelectes,
                    aRadioButton

                switch (sForm) {

                    case "DatoGeneral":

                        let sCheckUno = this.byId("BienesCheckBox").getSelected(),
                            sCheckDos = this.byId("ServiciosCheckBox").getSelected(),
                            sCheckTres = this.byId("SubcontratistaCheckBox").getSelected()

                        aInputs = ["txtFecha", "txtDireccion"]
                        aSelectes = ["cboMainPais", "cboMainRegionDpto"];

                        if (oPreRegistro.Land1 == "PE") {
                            aSelectes.push('cboMainCiudad');
                            aSelectes.push('cboMainDistrito');
                        }

                        if (oPreRegistro.Land1 != "PE") {
                            aInputs.push("txtNombreComercial");
                            aInputs.push("txtProvExtran");//+@INSERT
                            aInputs.push("txtComuna");//+@INSERT
                        }

                        oReturn.isdValid = this._validarInput(aInputs)

                        if (oReturn.isdValid) {
                            oReturn.isdValid = this._validarComboBox(aSelectes)
                        } else {
                            this._validarComboBox(aSelectes)
                        }

                        if (!sCheckUno && !sCheckDos && !sCheckTres) {
                            this.byId("BienesCheckBox").setValueState("Error")
                            this.byId("ServiciosCheckBox").setValueState("Error")
                            this.byId("SubcontratistaCheckBox").setValueState("Error")
                            oReturn.isdValid = false
                        } else {
                            this.byId("BienesCheckBox").setValueState("None")
                            this.byId("ServiciosCheckBox").setValueState("None")
                            this.byId("SubcontratistaCheckBox").setValueState("None")
                        }

                        break;

                    case "ContactoComercial":

                        aInputs = ["txtNombre1", "txtTelefono1", "txtCorreo1"]
                        oReturn.isdValid = this._validarInput(aInputs)
                        break;

                    case "LineaNegocio":

                        aSelectes = ["cboMainGrupos", "cboMainCategorias"]

                        oReturn.isdValid = this._validarComboBox(aSelectes)
                        break;

                    case "EjecutivoEmpresa":

                        aInputs = ["txtGerente", "txtGerente1", "txtGerente7", "txtEmail2", "txtEmail3", "txtEmail9"]

                        oReturn.isdValid = this._validarInput(aInputs)
                        break;

                    case "InfoContable":

                        aInputs = ["txtYear1", "textMontoUno"]

                        if (oPreRegistro.Land1 == "PE" && oPreRegistro.TipoNif != "PE2") {
                            aInputs.push("txtImporteActivo", "txtImportePasivo", "txtImportePasivoTotal", "txtPatrimonioNeto");
                        }

                        oReturn.isdValid = this._validarInput(aInputs)
                        break;

                    case "PrincipalCliente":

                        aInputs = ["txtNifUno", "txtRsUno"]

                        oReturn.isdValid = this._validarInput(aInputs)
                        break;

                    case "CuentaBancaria":

                        aInputs = ["txtTitular", "txtRuc", "txtNumCuenta", "txtCci", "txtCorreoPagos"]
                        aSelectes = ["cboNombreBanco", "cboMainMoneda", "cboMainTipoCuenta"]

                        oReturn.isdValid = this._validarInput(aInputs)

                        if (oReturn.isdValid) {
                            oReturn.isdValid = this._validarComboBox(aSelectes)
                        } else {
                            this._validarComboBox(aSelectes)
                        }
                        break;

                    case "SistemaGestion":

                        aInputs = ["txtYear01", "txtIf", "txtIs", "txtIa", "txtYear02", "txtIf2", "txtIs2", "txtIa2", "textYear03", "textIf3", "textIs3", "textIa3"]
                        aSelectes = []
                        aRadioButton = ["rbgPregunta1SS", "rbgPregunta2SS", "rbgPregunta3SS", "rbgPregunta5_1CC", "rbgPregunta5_2CC", "rbgPregunta5_3CC"]

                        // if ( this.byId("rbgPregunta4SS").getSelectedIndex() == "0") {
                        //     aInputs.push("txtPregunta4SS1")
                        //     aInputs.push("txtPregunta4SS2")
                        //     aInputs.push("txtPregunta4SS3")
                        // }

                        /*-@DELETE - Ya no va esta validación
                        if (this.byId("rbgPregunta4SS").getSelectedIndex() == "0") //@INSERT
                        {
                            oReturn.isdValid = this._validarInput(aInputs)
                        }*/

                        if (oReturn.isdValid) {
                            oReturn.isdValid = this._validarComboBox(aSelectes)
                        } else {
                            this._validarComboBox(aSelectes)
                        }

                        if (oReturn.isdValid) {
                            oReturn.isdValid = this._validarRadioButton(aRadioButton)
                        } else {
                            this._validarRadioButton(aRadioButton)
                        }

                        break;

                    case "SistemaCalidad":
                        //Validar Texto de Subcontrata +@INSERT
                        if (this.byId("rbgPregunta7").getSelectedIndex() == "0") {
                            let sTextValue = this.byId("txtPregunta7Cal").getValue()
                            if (sTextValue === "" || sTextValue === undefined) {
                                //MessageBox.error(oBundle.getText("msgErrActSub"));
                                oReturn.isdValid = false;
                                break;
                            }
                        }

                        aRadioButton = ["rbgPregunta1", "rbgPregunta4", "rbgPregunta5", "rbgPregunta6", "rbgPregunta7"]

                        oReturn.isdValid = this._validarRadioButton(aRadioButton)
                        break;

                    case "LineaProducto":

                        aInputs = ["txtPromedioMensual", "txtServicio"]
                        aSelectes = ["cboMainEspecialidad"]

                        oReturn.isdValid = this._validarInput(aInputs)

                        if (oReturn.isdValid) {
                            oReturn.isdValid = this._validarComboBox(aSelectes)
                        } else {
                            this._validarComboBox(aSelectes)
                        }
                        break;

                    case "Todo":

                        aInputs = ["txtFecha", "txtDireccion", "txtNombre1", "txtTelefono1", "txtCorreo1", "txtYear1", "textMontoUno", "txtGerente", "txtGerente1", "txtGerente7", "txtEmail2", "txtEmail3", "txtEmail9"]
                        aSelectes = ["cboMainPais", "cboMainRegionDpto"]

                        if (oPreRegistro.Land1 == "PE" && oPreRegistro.TipoNif != "PE2") //+@INSERT
                        {
                            aInputs.push("txtImporteActivo", "txtImportePasivo", "txtImportePasivoTotal", "txtPatrimonioNeto");
                        }

                        if (this.byId("SubcontratistaCheckBox").getSelected() &&
                            this.byId("rbgPregunta4SS").getSelectedIndex() == "0") //+@INSERT 05.06.2024
                        {
                            aInputs.push("txtYear01")
                            aInputs.push("txtIf")
                            aInputs.push("txtIs")
                            aInputs.push("txtIa")
                            aInputs.push("txtYear02")
                            aInputs.push("txtIf2")
                            aInputs.push("txtIs2")
                            aInputs.push("txtIa2")
                            aInputs.push("textYear03")
                            aInputs.push("textIf3")
                            aInputs.push("textIs3")
                            aInputs.push("textIa3")
                            //aSelectes.push("cboTipoPlanes")

                            // if ( this.byId("rbgPregunta4SS").getSelectedIndex() == "0") {
                            //     aInputs.push("txtPregunta4SS1")
                            //     aInputs.push("txtPregunta4SS2")
                            //     aInputs.push("txtPregunta4SS3")
                            // }
                        }

                        //+@INSERT - Validar Ctas Bancarias
                        if (oProveedor.CuentasBancariasDetSet.length === 0) {
                            oReturn.isdValid = false;
                            break;
                        }

                        if (oPreRegistro.Land1 != "PE") {
                            aInputs.push("txtNombreComercial")
                        } else {
                            aSelectes.push("cboMainDistrito");
                        }

                        // if ( oPreRegistro.Land1 != "PE" ) {
                        //     aInputs.push("txtNifUno")
                        //     aInputs.push("txtRsUno")
                        // }

                        oReturn.isdValid = this._validarInput(aInputs)

                        if (oReturn.isdValid) {
                            oReturn.isdValid = this._validarComboBox(aSelectes)
                        } else {
                            this._validarComboBox(aSelectes)
                        }
                        break;
                }


                return oReturn;
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
                        var oViewModel = this.getView().getModel("DMS");

                        var decodedPdfContent = atob(sSourceURL.split(',')[1]);
                        var byteArray = new Uint8Array(decodedPdfContent.length)
                        for (var i = 0; i < decodedPdfContent.length; i++) {
                            byteArray[i] = decodedPdfContent.charCodeAt(i);
                        }
                        var blob = new Blob([byteArray.buffer], { type: 'application/pdf' });
                        var _pdfurl = URL.createObjectURL(blob);
                        jQuery.sap.addUrlWhitelist("blob");

                        //oViewModel.setProperty("/Source", _pdfurl );
                        //oViewModel.setProperty("/Title", oFile.name);
                        oViewModel.setProperty("/Height", "600px");
                        oViewModel.setProperty("/File", oFile);
                        oViewModel.setProperty("/TerminoCondicion", true);
                    }.bind(this);

                    // Lee el archivo como una URL
                    oReader.readAsDataURL(oFile);
                }
            },
            onSaveDocumentTerminos: function()
            {   
                //Mostrar la POPUP del Subcontratista
                if (this.byId("SubcontratistaCheckBox").getSelected()) {
                   this.show2PopupSubContratista();   
                }else{
                    this.onSaveDocument();
                }
            },
            //Términos y condiciones
            //Funcion para ejecutar las demás y guardar documentos
            onSaveDocument: async function () {
                var oViewModel = this.getView().getModel("DMS")
                let oProveedor = this.getModel("oPreRegistro").getData()
                let bTerminos = this.byId("rbAcceptTerminos").getSelected()
                let bValidDocument = oViewModel.getProperty("/TerminoCondicion");
                let aFiles = this.getModel("aDocumentos").getProperty("/termino");

                //Validación de campos obligatorios
                let oValidate = this.fnValidarCampos("Todo");

                if (!oValidate.isdValid) {
                    if (oValidate.message) {
                        MessageBox.error(oValidate.message);
                        return;
                    } else {
                        MessageBox.error(oBundle.getText("completeDatoOblig"));
                        return;
                    }
                }

                if (!bTerminos) {
                    MessageBox.error(oBundle.getText("acceptTerCond"))
                    return
                }

                //Validación de documentos
                let aCerTri = that.getModel("aDocumentos").getProperty("/certificado_tributaria"),
                    aCelula = that.getModel("aDocumentos").getProperty("/celula");

                if (aCerTri.length === 0) {
                    MessageBox.error(oBundle.getText("addFileCertiTrib"))
                    return
                }

                if (aCelula.length === 0) {
                    MessageBox.error(oBundle.getText("addFileCelIden"))
                    return
                }

                if (this.byId("SubcontratistaCheckBox").getSelected()) {
                    let aFilesSystem = this.getModel("aDocumentos").getProperty("/sistema")
                    if (this.byId("rbgPregunta3SS").getSelectedIndex() == "0" && aFilesSystem.length === 0) {
                        MessageBox.error(oBundle.getText("pregunt3SSFile"))
                        return
                    }
                }

                //Validación de archivos proveedor
                let bValidate = false,
                    sMensaje = ""

                if (aFiles.length === 0) {
                    MessageBox.error(oBundle.getText("addOneFileRequerid"))
                    return
                }

                let aFileNew = aFiles.filter(oPos => oPos.dms === false)
                if (aFileNew.length === 0) {
                    MessageBox.error(oBundle.getText("addOneAddFile"))
                    return
                }

                //Se guardan los documentos
                for (let i = 0; i < aFileNew.length; i++) {
                    let oFile = aFileNew[i]

                    let oObject = await that._saveFileDocument(oFile, "TERMINOS", oProveedor.Taxnumxl)

                    if (oObject.type === "E") {
                        bValidate = oObject.type
                        sMensaje = oObject.message
                    }

                }

                //Validación de envío de solicitud
                if (bValidate) {
                    MessageBox.error(sMensaje)
                    return
                }

                let bValidateSol = await that._sendSolicitudUpdate()
                if (!bValidateSol) {
                    return
                }

                MessageBox.success(oBundle.getText("saveSuccess"));

                // if ( oViewModel.getProperty("/Source") ) {
                //     let bValidate = await that._sendSolicitudUpdate()
                //     if (!bValidate) {
                //         return
                //     }
                //     await that._guardarTerminosCondiciones()
                //     await that.guardarDocumentosAdjuntos( oProveedor.Taxnumxl, oViewModel.getProperty("/File") )
                //     MessageBox.success("El documento se ha guardado correctamente y la solicitud ha sido enviada para su aprobación.");
                // } else {
                //     MessageBox.error("Por favor, cargar un documento.");
                // }
            },

            //Guarda el documento en la carpeta creada anteriormente
            guardarDocumentosAdjuntos: function (rucProveedor, oItemAdjunto) {
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

                    fetch(that._getAppModulePath() + rutaInicial + idRepositorioDMS + "/root/PROVEEDOR/" + rucProveedor + "/TERMINOS", oRequestOption)
                        .then(response => response.text())
                        .then(result => {
                            console.log(result);
                            that._bloquearBotonesFinales()
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
                    let sName = that.formatoNombreArchivo("Términos y Condiciones.pdf")
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

            onDescargaFileUser: async function () {
                let aFiles = this.getModel("aDocumentos").getProperty("/termino")

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

            onVerSisSeguridadFile: async function () {
                let aFiles = this.getModel("aDocumentos").getProperty("/sistema")

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
            //Botón Descarga para la opción "Cuenta con Algunos Planes"   +@INSERT
            onDownloadAdjuntos: async function (pathFile) {
                let aFiles = this.getModel("aDocumentos").getProperty(pathFile);

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
            //Obtener el ID del repostiorio
            onObtenerRepositorioId: function () {
                
                //return "0687b0df-65d8-45b5-802c-a5e76db45277";//PRD

                return "2ac5f6e5-9f27-4c41-8e73-9191cf7a90be";//QAS
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

            //Validar carpetas para los términos
            _validarCarpetaTerminos: async function () {
                let oProveedor = this.getModel("oPreRegistro").getData()
                let oForm = that.onFormDataFolder(oProveedor.Taxnumxl)
                let bValidate = await that._buscarCarpetaRUC()

                if (bValidate) {
                    //Documentos y certificaciones
                    // BROCHURE
                    // BALANCE
                    // ESTADO
                    // CERTIFICADO_TRIBUTARIA
                    // CELULA
                    // CERTIFICADO_CUENTA
                    // CERTIFICADO_ISO
                    // LEGAJO
                    // TERMINOS
                    let bBROCHURE = await that._buscarFolderDocumentacion("BROCHURE", "/brochure")
                    let bBALANCE = await that._buscarFolderDocumentacion("BALANCE", "/balance")
                    let bESTADO = await that._buscarFolderDocumentacion("ESTADO", "/estado")
                    let bCERTIFICADO_TRIBUTARIA = await that._buscarFolderDocumentacion("CERTIFICADO_TRIBUTARIA", "/certificado_tributaria")
                    let bCELULA = await that._buscarFolderDocumentacion("CELULA", "/celula")
                    let bCERTIFICADO_CUENTA = await that._buscarFolderDocumentacion("CERTIFICADO_CUENTA", "/certificado_cuenta")
                    let bCERTIFICADO_ISO = await that._buscarFolderDocumentacion("CERTIFICADO_ISO", "/certificado_iso")
                    let bLEGAJO = await that._buscarFolderDocumentacion("LEGAJO", "/legajo")
                    let bTERMINOS = await that._buscarFolderDocumentacion("TERMINOS", "/termino")
                    let bSISTEMA = await that._buscarFolderDocumentacion("SISTEMA", "/sistema")
                    let bplanes = await that._buscarFolderDocumentacion("PLANES", "/planes");//+@INSERT

                    if (!bBROCHURE) {
                        await that._crearCarpetasDocumentacion("BROCHURE")
                    }
                    if (!bBALANCE) {
                        await that._crearCarpetasDocumentacion("BALANCE")
                    }
                    if (!bESTADO) {
                        await that._crearCarpetasDocumentacion("ESTADO")
                    }
                    if (!bCERTIFICADO_TRIBUTARIA) {
                        await that._crearCarpetasDocumentacion("CERTIFICADO_TRIBUTARIA")
                    }
                    if (!bCELULA) {
                        await that._crearCarpetasDocumentacion("CELULA")
                    }
                    if (!bCERTIFICADO_CUENTA) {
                        await that._crearCarpetasDocumentacion("CERTIFICADO_CUENTA")
                    }
                    if (!bCERTIFICADO_ISO) {
                        await that._crearCarpetasDocumentacion("CERTIFICADO_ISO")
                    }
                    if (!bLEGAJO) {
                        await that._crearCarpetasDocumentacion("LEGAJO")
                    }
                    if (!bTERMINOS) {
                        await that._crearCarpetasDocumentacion("TERMINOS")
                    }
                    if (!bSISTEMA) {
                        await that._crearCarpetasDocumentacion("SISTEMA")
                    }

                    if (!bplanes) { //+@INSERT
                        await that._crearCarpetasDocumentacion("PLANES");
                    }

                } else {
                    await that.onCreateCarpetasDMS(oForm, oProveedor.Taxnumxl)
                    //await that.onCreateCarpetaTerminos()
                    //Documentos y certificaciones
                    await that._crearCarpetasDocumentacion("BROCHURE")
                    await that._crearCarpetasDocumentacion("BALANCE")
                    await that._crearCarpetasDocumentacion("ESTADO")
                    await that._crearCarpetasDocumentacion("CERTIFICADO_TRIBUTARIA")
                    await that._crearCarpetasDocumentacion("CELULA")
                    await that._crearCarpetasDocumentacion("CERTIFICADO_CUENTA")
                    await that._crearCarpetasDocumentacion("CERTIFICADO_ISO")
                    await that._crearCarpetasDocumentacion("LEGAJO")
                    await that._crearCarpetasDocumentacion("TERMINOS")
                    await that._crearCarpetasDocumentacion("SISTEMA")
                    await that._crearCarpetasDocumentacion("PLANES"); //+@INSERT
                }

            },

            //Buscar carpeta RUC
            _buscarCarpetaRUC: function () {
                return new Promise(async (resolve, reject) => {
                    sap.ui.core.BusyIndicator.show(0)
                    let oProveedor = this.getModel("oPreRegistro").getData()

                    try {

                        $.ajax({
                            url: that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oProveedor.Taxnumxl,
                            type: "GET",
                            "mimeType": "multipart/form-data",
                            "contentType": false,
                            "processData": false,
                            success: async function (data) {
                                sap.ui.core.BusyIndicator.hide()
                                resolve(true)
                            },
                            error: function (error) {
                                sap.ui.core.BusyIndicator.hide()
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
                        resolve(false)
                    }
                });

                function encontrarArchivoActual(objetos) {
                    return objetos.reduce(function (objetoMayor, objetoActual) {
                        return new Date(objetoMayor.object.properties["cmis:creationDate"].value) > new Date(objetoMayor.object.properties["cmis:creationDate"].value) ? objetoActual : objetoMayor;
                    });
                }
            },

            //Buscar Folder Terminos
            buscarFolderTerminos: function () {
                let that = this;
                let oProveedor = this.getModel("oPreRegistro").getData()

                return new Promise((resolve, reject) => {

                    $.ajax({
                        url: that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oProveedor.Taxnumxl + "/TERMINOS",
                        type: "GET",
                        "mimeType": "multipart/form-data",
                        "contentType": false,
                        "processData": false,
                        success: async function (data) {
                            sap.ui.core.BusyIndicator.hide()
                            let aObjects = JSON.parse(data).objects
                            if (aObjects.length === 0) {
                                bHayDocumento = false
                            } else {
                                let oReturn = encontrarArchivoActual(aObjects)
                                if (oReturn) {
                                    let sUrl = that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oProveedor.Taxnumxl + "/TERMINOS/" + aObjects[0].object.properties["cmis:name"].value
                                    var oViewModel = that.getView().getModel("DMS");
                                    //oViewModel.setProperty("/Source", sUrl );
                                    //oViewModel.setProperty("/Title", aObjects[0].object.properties["cmis:name"].value);
                                    oViewModel.setProperty("/Height", "600px");
                                    oViewModel.setProperty("/TerminoCondicion", true);
                                    that.byId("fuSubirArchivo").setEnabled(false)
                                    that.byId("rbAcceptTerminos").setEnabled(false)
                                    that.byId("rbAcceptTerminos").setSelected(true)
                                    that.byId("btnEnviar").setEnabled(false)
                                }
                                bHayDocumento = true
                            }

                            resolve(true)
                        },
                        error: function (error) {
                            resolve(false)
                        },
                    })

                });

                function encontrarArchivoActual(objetos) {
                    return objetos.reduce(function (objetoMayor, objetoActual) {
                        return new Date(objetoMayor.object.properties["cmis:creationDate"].value) > new Date(objetoMayor.object.properties["cmis:creationDate"].value) ? objetoActual : objetoMayor;
                    });
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

            //Crea carpetas Terminos
            onCreateCarpetaTerminos: function () {
                let that = this;
                return new Promise((resolve, reject) => {
                    let oFormTermino = that.onFormDataFolder("TERMINOS")
                    let oProveedor = this.getModel("oPreRegistro").getData()

                    $.ajax({
                        url: that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oProveedor.Taxnumxl,
                        type: "POST",
                        "mimeType": "multipart/form-data",
                        "contentType": false,
                        "data": oFormTermino,
                        "processData": false,
                        success: resolve,
                        error: reject
                    })

                });
            },

            //Obtener documento existente
            obtenerDocumentos: function () {
                return new Promise(async (resolve, reject) => {
                    sap.ui.core.BusyIndicator.show(0)
                    let oProveedor = this.getModel("oPreRegistro").getData()

                    try {

                        $.ajax({
                            url: that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oProveedor.Taxnumxl,
                            type: "GET",
                            "mimeType": "multipart/form-data",
                            "contentType": false,
                            "processData": false,
                            success: async function (data) {
                                sap.ui.core.BusyIndicator.hide()
                                let aObjects = JSON.parse(data).objects
                                let oReturn = encontrarArchivoActual(aObjects)
                                if (oReturn) {
                                    let sUrl = that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oProveedor.Taxnumxl + "/" + aObjects[0].object.properties["cmis:name"].value
                                    var oViewModel = that.getView().getModel("DMS");
                                    //oViewModel.setProperty("/Source", sUrl );
                                    //oViewModel.setProperty("/Title", aObjects[0].object.properties["cmis:name"].value);
                                    oViewModel.setProperty("/Height", "600px");
                                }
                                //Se busca si existe la carpeta términos, sino se crea
                                let bTerminos = await that.buscarFolderTerminos()

                                if (!bTerminos) {
                                    await that.onCreateCarpetaTerminos()
                                }

                                bHayDocumento = true
                                resolve(true)
                            },
                            error: function (error) {
                                sap.ui.core.BusyIndicator.hide()
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
                        resolve(false)
                    }
                });

                function encontrarArchivoActual(objetos) {
                    return objetos.reduce(function (objetoMayor, objetoActual) {
                        return new Date(objetoMayor.object.properties["cmis:creationDate"].value) > new Date(objetoMayor.object.properties["cmis:creationDate"].value) ? objetoActual : objetoMayor;
                    });
                }
            },

            _bloquearBotonesFinales: function () {
                that.byId("fuSubirArchivo").setEnabled(false)
                that.byId("rbAcceptTerminos").setEnabled(false)
                that.byId("rbAcceptTerminos").setSelected(true)
                that.byId("btnEnviar").setEnabled(false)
            },

            //Descargar documentos para que el proveedor firme
            onDescargarDocAcept: async function () {

                let idRepositorioDMS = Repositoryid;
                let urlMain = that._getAppModulePath() + rutaInicial + idRepositorioDMS + "/root/PROVEEDOR/TERMINOS";

                let sPais = this.byId("slSucursal").getSelectedKey(),
                    sTipoPersona = this.byId("slTipoPresona").getSelectedKey()

                if (sTipoPersona == "0") {
                    MessageBox.error(oBundle.getText("selectTypeHuman"))
                    return
                }
                /*-@
                if (window.navigator.language.split('-')[0] == "es" || window.navigator.language == 'es-PE') {
                    if (sPais == "Perú") {
                        if (sTipoPersona == 1) {
                            let PN = sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/files/peru/es/DJ_Y_TERMINOS_DATOS_(Persona_Natural)_es.pdf")
                            downloadFile('DJ_Y_TERMINOS_DATOS_(Persona_Natural).pdf', PN)
                            this.downloadFileTerminosDMS()
                        } else {
                            //let PJ = sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/files/peru/es/DJ_Y_TERMINOS_DATOS_(Pesona_Juridica)_es.pdf")
                            //downloadFile('DJ_Y_TERMINOS_DATOS_(Pesona_Juridica).pdf', PJ)
                        }
                    } else {
                        if (sTipoPersona == 1) {
                            let PN1 = sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/files/chile/es/pn/Declaracion_Jurada_de_Conocimiento_de_Socio_de_Negocio_PN_Cosapi_Chile.pdf")
                            downloadFile('Declaración Jurada de Conocimiento de Socio de Negocio-PN- Cosapi Chile.pdf', PN1)
                        } else {
                            let PJ1 = sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/files/chile/es/pj/Declaracion_Jurada_de_Conocimiento_de_Socio_de_Negocio_PJ_Cosapi_Chile.pdf")
                            downloadFile('Declaración Jurada de Conocimiento de Socio de Negocio-PJ- Cosapi Chile.pdf', PJ1)
                        }

                        let PJ2 = sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/files/chile/es/pj/PG_PROC_03_A1_Terminos_y_Condiciones_para_el_Registro_de_Proveedores_Chile.docx")
                        downloadFile('PG_PROC_03_A1_Terminos_y_Condiciones_para_el_Registro_de_Proveedores_Chile.docx', PJ2)
                    }
                } else {
                    if (sPais == "Perú") {
                        if (sTipoPersona == 1) {
                            let PN = sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/files/peru/en/DJ_Y_TERMINOS_DATOS_(Persona_Natural)_en.pdf")
                            downloadFile('DJ_Y_TERMINOS_DATOS_(Persona_Natural).pdf', PN)
                        } else {
                            let PJ = sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/files/peru/en/DJ_Y_TERMINOS_DATOS_(Pesona_Juridica)_en.pdf")
                            downloadFile('DJ_Y_TERMINOS_DATOS_(Pesona_Juridica).pdf', PJ)
                        }
                    } else {
                        if (sTipoPersona == 1) {
                            let PN1 = sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/files/chile/en/pn/1_2_ANNEX_B_2_SWORN_STATEMENT_OF_THE_BUSINESS_PARTNER_PN_Agency_Chile.docx")
                            downloadFile('1_2_ANNEX_B_2_SWORN_STATEMENT_OF_THE_BUSINESS_PARTNER_PN_Agency_Chile.docx', PN1)
                        } else {
                            let PJ1 = sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/files/chile/en/pj/1_1_ANNEX_B_1_SWORN_STATEMENT_OF_THE_BUSINESS_PARTNER_PJ_Agency_Chile.docx")
                            downloadFile('1_1_ANNEX_B_1_SWORN_STATEMENT_OF_THE_BUSINESS_PARTNER_PJ_Agency_Chile.docx', PJ1)
                        }

                        let PJ2 = sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/files/chile/en/pj/PG_PROC_03_A1_Terms_and_Conditions_for_Supplier_Registration_Chile.docx")
                        downloadFile('PG_PROC_03_A1_Terms_and_Conditions_for_Supplier_Registration_Chile.docx', PJ2)
                    }
                    */

                //Mejora para obtener los PDF del repositorio DMS +@INSERT
                urlMain = urlMain + "/" + sPais;

                if (window.navigator.language.split('-')[0] == "es" || window.navigator.language == 'es-PE') {
                    urlMain = urlMain + "/ES";
                } else {
                    urlMain = urlMain + "/EN";
                }
                if (sTipoPersona == 1) {
                    urlMain = urlMain + "/NATURAL";
                } else {
                    urlMain = urlMain + "/JURIDICA";
                }

                await this.downloadFileTerminosDMS(urlMain);
            },

            downloadFile: function (sTitle, oFile) {
                var linkPN = document.createElement('a');
                linkPN.href = oFile;
                linkPN.download = sTitle;
                linkPN.style.display = 'none';
                document.body.appendChild(linkPN);
                linkPN.click();
                document.body.removeChild(linkPN);
            },

            _getAppModulePath: function () {
                const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                const appPath = appId.replaceAll(".", "/");
                return jQuery.sap.getModulePath(appPath);
            },

            // PESTAÑA DOCUMENTACIÓN Y CERTIFICADOS
            // BROCHURE
            // BALANCE
            // ESTADO
            // CERTIFICADO_TRIBUTARIA
            // CELULA
            // CERTIFICADO_CUENTA
            // CERTIFICADO_ISO
            onSubirDocumento: function (oEvent, sProperty, sTermino) {
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
                    if (sTermino === "X") {
                        MessageToast.show(oBundle.getText("successUploadFile"))
                    }
                }
            },

            onDownloadFile: function (oEvent) {
                let oObject = oEvent.getSource().getBindingContext("aDocumentos").getObject();
                let link = document.createElement("a");

                link.href = oObject.url;
                link.download = oObject.name;
                document.body.appendChild(link);
                link.click();

                document.body.removeChild(link);
            },

            onSaveFilesDocumentos: async function (sProperty, sCarpeta, sX) {
                let aFiles = this.getModel("aDocumentos").getProperty(sProperty)
                let oProveedor = this.getModel("oPreRegistro").getData()
                let bValidate = false,
                    sMensaje = "";

                if (aFiles.length === 0) {
                    if (!sX) {
                        MessageBox.error(oBundle.getText("addAddFile"))
                        return
                    }
                }

                let aFileNew = aFiles.filter(oPos => oPos.dms === false)
                if (aFileNew.length === 0) {
                    if (!sX) {
                        MessageBox.error(oBundle.getText("addOneAddFile"))
                        return
                    }
                }


                for (let i = 0; i < aFileNew.length; i++) {
                    let oFile = aFileNew[i]

                    let oObject = await that._saveFileDocument(oFile, sCarpeta, oProveedor.Taxnumxl)

                    if (oObject.type === "E") {
                        bValidate = oObject.type
                        sMensaje = oObject.message
                    }

                }

                if (bValidate) {
                    if (!sX) {
                        MessageBox.error(sMensaje)
                    }
                } else {
                    if (!sX) {
                        MessageBox.success(oBundle.getText("saveSuccessFiles"))
                        this.set_StatusSaveDocumentos(sCarpeta);//+@INSERT
                    }

                    await that._buscarFolderDocumentacion(sCarpeta, sProperty)
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

            //Crea carpetas Documentación y certificados
            // Las carpetas serán las siguientes:
            // BROCHURE
            // BALANCE
            // ESTADO
            // CERTIFICADO_TRIBUTARIA
            // CELULA
            // CERTIFICADO_CUENTA
            // CERTIFICADO_ISO
            _crearCarpetasDocumentacion: function (sNombre) {
                let that = this;
                return new Promise((resolve, reject) => {
                    let oFormTermino = that.onFormDataFolder(sNombre)
                    let oProveedor = this.getModel("oPreRegistro").getData()

                    $.ajax({
                        url: that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oProveedor.Taxnumxl,
                        type: "POST",
                        "mimeType": "multipart/form-data",
                        "contentType": false,
                        "data": oFormTermino,
                        "processData": false,
                        success: resolve,
                        error: reject
                    })

                });
            },

            //Buscar Folder Terminos
            _buscarFolderDocumentacion: function (sNombreCarpeta, sProperty) {
                let that = this;
                let oProveedor = this.getModel("oPreRegistro").getData()

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
                            let aFiles = []
                            if (aObjects.length > 0) {
                                for (let i = 0; i < aObjects.length; i++) {
                                    let oObject = aObjects[i]
                                    let sUrl = that._getAppModulePath() + rutaInicial + Repositoryid + "/root/PROVEEDOR/" + oProveedor.Taxnumxl + "/" + sNombreCarpeta + "/" + oObject.object.properties["cmis:name"].value
                                    let oFile = {
                                        id: oObject.object.properties["cmis:objectId"].value,
                                        name: oObject.object.properties["cmis:name"].value,
                                        url: sUrl,
                                        File: null,
                                        dms: true,
                                        fecha_creacion: that.formatoFechaMilenio(oObject.object.properties["cmis:creationDate"].value)
                                    }
                                    aFiles.push(oFile)
                                }
                                that.getModel("aDocumentos").setProperty(sProperty, aFiles);
                            } else {
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

            onContinueDocument: function () {
                let aCerTri = that.getModel("aDocumentos").getProperty("/certificado_tributaria"),
                    aCelula = that.getModel("aDocumentos").getProperty("/celula");

                if (aCerTri.length === 0) {
                    MessageBox.error(oBundle.getText("addFileCertiTrib"))
                    return
                }

                if (aCelula.length === 0) {
                    MessageBox.error(oBundle.getText("addFileCelIden"))
                    return
                }
                //Validar Sí guardo los archivos adjuntos "+@INSERT"
                let flagOkSave = this.check_StatusSaveDocumentos();
                if (flagOkSave === false) {
                    MessageBox.error(oBundle.getText("saveFileDocTrib"));
                    return
                }

                that.byId("iconTabCabecera").setSelectedKey("Terminos")
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
                        let oTable = this.getView().byId(sTable);
                        let oItem = oEvent.getSource().getParent();
                        let sPath = oItem.getBindingContext("aDocumentos").getPath();
                        let iIndex = parseInt(sPath.split("/").pop());
                        let oModel = this.getView().getModel("aDocumentos");
                        let oData = oModel.getData();

                        oData[sProperty].splice(iIndex, 1);

                        oModel.setData(oData);
                        oTable.removeSelections();

                        MessageToast.show(oBundle.getText("successDeleteFile"))
                    }
                };

                // Confirmación antes de eliminar
                sap.m.MessageBox.confirm(
                    oBundle.getText("questionDeleteFile"),
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


            /*********************FUNCIONES DE VALIDACIÓN* ***************************** */
            changeValueNumber: function (oEvent) {
                var _oInput = oEvent.getSource();
                var input = _oInput.getValue();

                // Elimina cualquier carácter no numérico
                input = input.replace(/[^\d]/g, '');

                // Limita la longitud máxima de la entrada a 20 caracteres (18 enteros + 2 decimales)
                if (input.length > 21) {
                    input = input.substring(0, 21);
                }

                // No permite un cero inicial seguido de otros números
                if (input.length > 1 && input[0] === '0') {
                    input = input.substring(1);
                }

                // Si la longitud es mayor a 2, inserta el punto decimal
                if (input.length > 2) {
                    input = input.slice(0, -2) + '.' + input.slice(-2);
                } else if (input.length === 2) {
                    input = '0.' + input;
                } else if (input.length === 1) {
                    input = '0.0' + input;
                }

                _oInput.setValue(input);
            },

            changeOnlyNumber: function (oEvent) {
                var _oInput = oEvent.getSource();
                var input = _oInput.getValue();

                // Elimina cualquier carácter que no sea un número
                input = input.replace(/[^\d]/g, '');

                _oInput.setValue(input);
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

            onValidarFormatoCorreo: function (oEvent) {
                let sCorreo = oEvent.getSource().getValue()
                let bValidate = that.formatoCorreo(sCorreo)

                if (!bValidate) {
                    oEvent.getSource().setValue("")
                    oEvent.getSource().setValueState("Error")
                    oEvent.getSource().setValueStateText(oBundle.getText("formatterEmail"));
                } else {
                    oEvent.getSource().setValueState("None")
                    oEvent.getSource().setValueStateText("");
                }
            },
             /* -@DELETE
            onSelectSubContratista: function () {
               
                let bValidate = that.byId("SubcontratistaCheckBox").getSelected()
                let aIdsInput = ["txtYear01", "txtIf", "txtIs", "txtIa", "txtYear02", "txtIf2", "txtIs2", "txtIa2", "textYear03", "textIf3", "textIs3", "textIa3"]
                let aIdLbl = ["lblPregunta1SS", "lblPregunta2SS", "lblPregunta3SS", "lblPregunta5SSS", "lblPregunta6SSS"] //"lblPregunta4SS",

                if (bValidate) {
                    //aIdsInput.push("lblCuentaPlan")
                    for (let i = 0; i < aIdsInput.length; i++) {
                        this.byId(aIdsInput[i]).setRequired(true)
                    }
                    for (let i = 0; i < aIdLbl.length; i++) {
                        this.byId(aIdLbl[i]).setRequired(true)
                    }
                } else {
                    //aIdsInput.push("cboTipoPlanes")
                    //this.byId("lblCuentaPlan").setRequired(false)
                    for (let i = 0; i < aIdsInput.length; i++) {
                        this.byId(aIdsInput[i]).setRequired(false)
                        this.byId(aIdsInput[i]).setValueState("None")
                    }
                    for (let i = 0; i < aIdLbl.length; i++) {
                        this.byId(aIdLbl[i]).setRequired(false)
                    }
               
            },
             }*/
            onSelectSubContratista: function (oEvent, valid) {
                if (oEvent) { 
                let showActive = oEvent.getSource().getSelected();
                if (showActive) {
                    //this.showPopupSubcontratista(showActive);
                }   
                }
            },

            onNoAplica: function (oEvent) {
                let bValidate = oEvent.getSource().getSelected()

                if (bValidate) {
                    this.byId("btnAgregarRF").setEnabled(false)
                    this.getModel("oProveedor").setProperty("/RefFinanciera", {
                        EmailSec: "",
                        IdEnt: "",
                        NombreSect: "",
                        TelSec: "",
                        Monto: ""
                    });
                } else {
                    this.byId("btnAgregarRF").setEnabled(true)
                }
            },

            onChangeEspecialidad: function (oEvent) {
                let oValue = oEvent.getSource().getValue()
                let oItem = oEvent.getSource().getSelectedItem().getBindingContext().getObject()
                this.byId("txtServicio").setValue(oItem.Bkbez)
                this.byId("txtServicioCod").setText(oItem.Bklas)

                if (oValue) {
                    oEvent.getSource().setValueState("None")
                    this.byId("txtServicio").setValueState("None")
                }
            },

            combinarPdf: function () {
                var pdfPaths = [
                    sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/aaa/1.pdf"),
                    sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/aaa/2.pdf"),
                    sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/aaa/3.pdf"),
                    sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/aaa/4.pdf"),
                    sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/aaa/5.pdf"),
                    sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/aaa/6.pdf"),
                    sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/aaa/7.pdf"),
                    sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/aaa/8.pdf"),
                    sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/aaa/9.pdf"),
                    sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/aaa/10.pdf"),
                    sap.ui.require.toUrl("ns/cosapi/actualizacionproveedor/aaa/11.pdf")
                    // Agrega aquí las rutas de tus otros archivos PDF
                ];

                this.mergePDFs(pdfPaths, "Términos y Condiciones.pdf")
                    .then(function () {
                        MessageBox.success("PDFs unidos exitosamente. Descarga iniciada.");
                        window.open("Términos y Condiciones.pdf", "_blank");
                    })
                    .catch(function (err) {
                        MessageBox.error("Error al unir PDFs: " + err);
                    });
            },

            mergePDFs: async function (pdfPaths, outputPath) {
                const { PDFDocument } = PDFLib;

                const mergedPdf = await PDFDocument.create();

                for (const pdfPath of pdfPaths) {
                    const pdfBytes = await fetch(pdfPath).then(response => response.arrayBuffer());
                    const pdfDoc = await PDFDocument.load(pdfBytes);
                    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }

                const mergedPdfBytes = await mergedPdf.save();
                const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                    // Para IE
                    window.navigator.msSaveOrOpenBlob(blob, outputPath);
                } else {
                    // Para otros navegadores
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = outputPath;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                }
            },

            fnValidarPlanes: function (opcPlanes) {

                let lv_flag_error = false;
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                let aFiles = this.getModel("aDocumentos").getProperty("/planes");
                let odataPreRegis = this.getView().getModel("oPreRegistro").getData();

                if (odataPreRegis.Land1 != "PE") //+@INSERT
                {
                    opcPlanes.uploadError = false;
                    opcPlanes.ejecUpload = false;
                    return;
                }

                if (this.byId("rbgPregunta1CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta2CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta3CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta4CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta5CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta5_1CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta5_2CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta5_3CC").getSelectedIndex() == "0") {
                    if (aFiles.length === 0) {
                        opcPlanes.uploadError = true;
                        MessageBox.error(oResourceBundle.getText("pregunt1capl"));
                    } else {
                        opcPlanes.ejecUpload = true;
                    }
                }
            },

            fnCamposRegisEstadisClear: function (aInputs, obligatorio) {
                //Sí, marca la opción "No" en la parte de Resultados Estadisticos no se debe rellenar los
                //campos Obligatorios.

                for (let i = 0; i < aInputs.length; i++) {
                    if (obligatorio) {
                        this.byId(aInputs[i]).setEditable(true);
                    } else {
                        this.byId(aInputs[i]).setValueState(sap.ui.core.ValueState.None);
                        this.byId(aInputs[i]).setEditable(false);
                    }
                }
            },
            onSelectRbResultEstadis: function (oEvent) {
                let inputs = ['txtYear01', 'txtIf', 'txtIs', 'txtIa', 'txtYear02', 'txtIf2', 'txtIs2', 'txtIa2', 'textYear03', 'textIf3', 'textIs3', 'textIa3'];
                let sKey = oEvent.getSource().getSelectedIndex();
                if (sKey == '0') {
                    this.fnCamposRegisEstadisClear(inputs, true);
                } else if (sKey == '1') {
                    this.fnCamposRegisEstadisClear(inputs, false);
                }
            },
            onSelectRbResultEstadis: function () {
                let inputs = ['txtYear01', 'txtIf', 'txtIs', 'txtIa', 'txtYear02', 'txtIf2', 'txtIs2', 'txtIa2', 'textYear03', 'textIf3', 'textIs3', 'textIa3'];

                if (this.byId("rbgPregunta4SS").getSelectedIndex() == "0") {
                    //this.byId("rbgPregunta4SS").getSelectedIndex() != "1") {
                    this.fnCamposRegisEstadisClear(inputs, true);
                } else {
                    this.fnCamposRegisEstadisClear(inputs, false);
                }
            }
            ,

            set_StatusSaveDocumentos: function (sCarpeta) {
                const aCerTri = that.getModel("aDocumentos").getProperty("/certificado_tributaria"),
                    aCelula = that.getModel("aDocumentos").getProperty("/celula");

                switch (sCarpeta) {
                    case "CERTIFICADO_TRIBUTARIA":
                        if (aCerTri.length > 0) {
                            statusSaveDocumento.saveFichaRuc = true;
                            statusSaveDocumento.cantfileFichaRuc = aCerTri.length;
                        }
                        break;
                    case "CELULA":
                        if (aCelula.length > 0) {
                            statusSaveDocumento.saveCedulaLegal = true;
                            statusSaveDocumento.cantFileCedulaLegal = aCelula.length;
                            break;
                        }
                    default:
                        break;
                }
            },
            check_StatusSaveDocumentos: function () {
                let flag_ok = false;

                const aCerTri = that.getModel("aDocumentos").getProperty("/certificado_tributaria"),
                    aCelula = that.getModel("aDocumentos").getProperty("/celula");

                if (statusSaveDocumento.saveFichaRuc === true &&
                    statusSaveDocumento.saveCedulaLegal === true) {
                    if (aCerTri.length === statusSaveDocumento.cantfileFichaRuc) {
                        flag_ok = true;

                    } else {
                        flag_ok = false;
                        return flag_ok;
                    }

                    if (aCelula.length === statusSaveDocumento.cantFileCedulaLegal) {
                        flag_ok = true;
                    } else {
                        flag_ok = false;
                        return flag_ok;
                    }

                } else {
                    if (aCerTri.length !== statusSaveDocumento.cantfileFichaRuc) {
                        flag_ok = false;
                        return flag_ok;
                    }
                    if (aCelula.length !== statusSaveDocumento.cantFileCedulaLegal) {
                        flag_ok = false;
                        return flag_ok;
                    }

                    flag_ok = true;
                }

                return flag_ok;

            },
            onSelectRBAlgunPlanes: function (oEvent) {
                let odataPreRegis = this.getView().getModel("oPreRegistro").getData();
                if (odataPreRegis.Land1 != "PE") {
                    return;
                }

                let inputUploadPlanes = this.byId("FrmElemUploadPlnes");
                let sKey = oEvent.getSource().getSelectedIndex();
                if (sKey == '0') {
                    inputUploadPlanes.setVisible(true);
                } else if (sKey == '1') {
                    if (this.byId("rbgPregunta1CC").getSelectedIndex() == "0" ||
                        this.byId("rbgPregunta2CC").getSelectedIndex() == "0" ||
                        this.byId("rbgPregunta3CC").getSelectedIndex() == "0" ||
                        this.byId("rbgPregunta4CC").getSelectedIndex() == "0" ||
                        this.byId("rbgPregunta5CC").getSelectedIndex() == "0" ||
                        this.byId("rbgPregunta5_1CC").getSelectedIndex() == "0" ||
                        this.byId("rbgPregunta5_2CC").getSelectedIndex() == "0" ||
                        this.byId("rbgPregunta5_3CC").getSelectedIndex() == "0") {
                        inputUploadPlanes.setVisible(true);
                    } else {
                        inputUploadPlanes.setVisible(false);
                    }
                }
            },
            checkPlanesBtnUpload: function () {
                let inputUploadPlanes = this.byId("FrmElemUploadPlnes");
                if (this.byId("rbgPregunta1CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta2CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta3CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta4CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta5CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta5_1CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta5_2CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta5_3CC").getSelectedIndex() == "0") {
                    inputUploadPlanes.setVisible(true);
                } else {
                    inputUploadPlanes.setVisible(false);
                }

            },
            setInitButtonUploadPlanes: function () {
                let inputUploadPlanes = this.byId("FrmElemUploadPlnes");

                if (this.byId("rbgPregunta1CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta2CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta3CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta4CC").getSelectedIndex() == "0" ||
                    this.byId("rbgPregunta5CC").getSelectedIndex() == "0") {
                    inputUploadPlanes.setVisible(true);
                } else {
                    inputUploadPlanes.setVisible(false);
                }

            },
            setConvertNumber: function (oEvent) {
                let oSourceInput = oEvent.getSource();
                let oValue = oSourceInput.getValue();
                //oValue = oValue.replace(/[^\d]/g, '');

                if (oValue) {
                    let resultConvertNumber = this.formatNumberDecimals(oValue);
                    if (resultConvertNumber) {
                        oSourceInput.setValue(resultConvertNumber);
                    }
                }
            },

            formatNumberDecimals(numberValue) {

                let oFormatOptions = {
                    groupingEnabled: true,  // grouping is enabled
                    groupingSeparator: ',', // grouping separator is '.'
                    groupingSize: 3,        // the amount of digits to be grouped (here: thousand)
                    decimalSeparator: ".",   // the decimal separator must be different from the grouping separator
                    maxIntegerDigits: 18,
                    minFractionDigits: 2,
                    maxFractionDigits: 2
                };

                let oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance(oFormatOptions);
                let valor = oNumberFormat.format(numberValue); // returns 1,234.567
                return valor;
            },

            changeValueStateNumberInputs: function (oEvent) {
                let oValue = oEvent.getSource().getValue();
                let isValid = this.validateNumberDecimal(oEvent, oValue);
                if (isValid) {
                    this.setConvertNumber(oEvent);
                }
            },
            InitValuesGlobales: function () {
                //Inicializar Variable para verificar carga de Documento
                let statusSaveDocumento = {
                    saveFichaRuc: false,
                    cantfileFichaRuc: 0,
                    saveCedulaLegal: false,
                    cantFileCedulaLegal: 0
                };
            }
            ,
            validateNumberDecimal(oEvent, oValue) {
                let inputSource = oEvent.getSource();
                //Validación con Dos decimales
                let isValid = /^(\d{1,3}(\,\d{3})*|(\d+))(\.\d{2})?$/.test(oValue);
                if (!isValid) {
                    inputSource.setValueState("Error");
                    inputSource.setValue("");
                } else {
                    inputSource.setValueState("None");
                }
                return isValid;
            },
            convertNumberInternSistemaGestion: function (oDatos) {
                if (oDatos.SistemaGestionDetSet.length > 0) {
                    for (let index = 0; index < oDatos.SistemaGestionDetSet.length; index++) {
                        let mountConvert = 0;

                        if (oDatos.SistemaGestionDetSet[index].Indiceaccidentabilidad != undefined &&
                            oDatos.SistemaGestionDetSet[index].Indiceaccidentabilidad != "") {
                            mountConvert = oDatos.SistemaGestionDetSet[index].Indiceaccidentabilidad;
                            oDatos.SistemaGestionDetSet[index].Indiceaccidentabilidad = this.ParceNumberDecimalsIntern(mountConvert).toString();
                        }

                        if (oDatos.SistemaGestionDetSet[index].Indicefrecuencia != undefined &&
                            oDatos.SistemaGestionDetSet[index].Indicefrecuencia != "") {
                            mountConvert = oDatos.SistemaGestionDetSet[index].Indicefrecuencia;
                            oDatos.SistemaGestionDetSet[index].Indicefrecuencia = this.ParceNumberDecimalsIntern(mountConvert).toString();
                        }

                        if (oDatos.SistemaGestionDetSet[index].Indiceseveridad != undefined &&
                            oDatos.SistemaGestionDetSet[index].Indiceseveridad != "") {
                            mountConvert = oDatos.SistemaGestionDetSet[index].Indiceseveridad;
                            oDatos.SistemaGestionDetSet[index].Indiceseveridad = this.ParceNumberDecimalsIntern(mountConvert).toString();
                        }
                    }
                }
            },
            ParceNumberDecimalsIntern: function (numberValue) {
                let oFormatOptions = {
                    groupingEnabled: true,  // grouping is enabled
                    groupingSeparator: ',', // grouping separator is '.'
                    groupingSize: 3,        // the amount of digits to be grouped (here: thousand)
                    decimalSeparator: ".",   // the decimal separator must be different from the grouping separator
                    maxIntegerDigits: 18,
                    minFractionDigits: 2,
                    maxFractionDigits: 2
                }

                let oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance(oFormatOptions);

                let result = oNumberFormat.parse(numberValue); // returns 1234.567
                return result;
            },
            onSelectTabHome: function (oEvent) {
                let tabSelected = oEvent.getSource().getSelectedKey();

                switch (tabSelected) {
                    case "Documentacion":
                        this.validateTabDocumentacion();
                        break;
                    case "Terminos":
                        this.displayPdfterminos();
                        break;
                    default:
                        break;
                }
            },
            validateTabDocumentacion: function () {

                const aCerTri = that.getModel("aDocumentos").getProperty("/certificado_tributaria"),
                    aCelula = that.getModel("aDocumentos").getProperty("/celula");

                //Actualizar la cantidad de archivos guardados previamente.
                if (statusSaveDocumento.saveFichaRuc === false &&
                    statusSaveDocumento.saveCedulaLegal === false) {
                    statusSaveDocumento.cantfileFichaRuc = aCerTri.length;
                    statusSaveDocumento.cantFileCedulaLegal = aCelula.length;
                }
            },
            validateStatusProveedorEdit: async function (aResult) {

                //let inputs = ['txtYear01', 'txtIf', 'txtIs', 'txtIa', 'txtYear02', 'txtIf2', 'txtIs2', 'txtIa2', 'textYear03', 'textIf3', 'textIs3', 'textIa3'];
                let userEdit = this.getOwnerComponent().getModel("userData").getData();
                /*
                //Status Proveedor no se modifica
                if (aResult.results[0].Codigoestado == '07') {
                    //

                    this.fnCamposRegisEstadisClear(inputs, false);

                    //todos los campos
                    this.getView().getModel("userData").setProperty("/editable", false);
                    this.getView().getModel("statusEdit").setProperty("/edit", false);
                    this.getView().getModel("statusEdit").setProperty("/btnBancariaEdit", true);

                } else {*/  //-@DELETE

                if (userEdit) {
                    this.getView().getModel("statusEdit").setProperty("/btnBancariaEdit", userEdit.editable);
                    this.getView().getModel("statusEdit").setProperty("/edit", userEdit.editable);
                    //this.fnCamposRegisEstadisClear(inputs, userEdit.editable);
                } else {
                    this.getView().getModel("statusEdit").setProperty("/btnBancariaEdit", true);
                    this.getView().getModel("statusEdit").setProperty("/edit", true);
                    //this.fnCamposRegisEstadisClear(inputs, true);
                }
                //}

                //Realizar Otras Validaciones para la Pestaña de Documentación y Certificados , Términos y condiciones
                if (aResult.results[0].Codigoestado == '04' ||  //Estado Base de datos
                    aResult.results[0].Codigoestado == '07' )   //Estado Proveedor
                {
                    this.getView().getModel("statusEdit").setProperty("/modifTabSgyTc", false);
                }else
                {
                    if (userEdit) {
                        this.getView().getModel("statusEdit").setProperty("/modifTabSgyTc", userEdit.editable);
                    }else{
                        this.getView().getModel("statusEdit").setProperty("/modifTabSgyTc", true);
                    }
                }

                if (aResult.results[0].Codigoestado == '06' ) //RECHAZADO
                {
                    this.getView().getModel("statusEdit").setProperty("/btnBancariaEdit", false);
                    this.getView().getModel("statusEdit").setProperty("/edit", false);
                    this.getView().getModel("statusEdit").setProperty("/modifTabSgyTc", false);
                }  
            },
            onAddCtaBancaria: function () {
                let isValid = this._validInputsCtaBank();  //Validar Inputs
                if (!isValid) return;

                isValid = this._validStateInputsCtaBank();  //Validar Inputs States
                if (!isValid) return;

                let oDataItem = this.validacionAddBtnCtaBank();
                if (oDataItem != undefined && oDataItem != null) {
                    this._setAddModelCtaBank(oDataItem);
                }
                this._clearInputsCtaBank();  //+@ADD
            },
            onEliminarItemBank: function (oEvent) {

                let oTable = this.getView().byId("tbCtasBancarias");
                let oItem = oEvent.getSource().getParent();

                let sPath = oItem.getBindingContext("oProveedor").getPath();
                let iIndex = parseInt(sPath.split("/").pop());

                let oModel = this.getView().getModel("oProveedor");
                let oData = oModel.getData();

                oData.CuentaBancaria.CuentasBancariasDetSet.splice(iIndex, 1);

                oModel.setData(oData);
                oTable.removeSelections();

            },
            onChangeSelecTipoCta: async function (oEvent) {
                let oKeySelected = oEvent.getSource().getSelectedKey();
                let oValue = oEvent.getSource().getValue();


                if (oValue) {
                    oEvent.getSource().setValueState("None")
                }

                await this.selectValuesBankWaers(oKeySelected);

                if (oKeySelected == "DETRACCIONES") {
                    this._logicFieldsDetrac(true);
                } else {
                    this._logicFieldsDetrac(false);
                }
            },
            validacionAddBtnCtaBank: function () {

                let oDataTipCtaSoDoDet = this.getView().getModel().getData();
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oDataItem = {};
                //Ok        

                oDataItem.Selectcuentasodode = this.byId("cboSelecTipoCta").getSelectedKey();
                oDataItem.Nombrebanco = this.byId("cboNombreBanco").getValue();
                oDataItem.Clavebanco = this.byId("cboNombreBanco").getSelectedKey();
                oDataItem.Paisbanco = oPreRegistro.Land1;
                //oDataItem.Moneda = this.byId("cboMainMoneda").getSelectedKey();
                oDataItem.Tipocuenta = this.byId("cboMainTipoCuenta").getSelectedKey();
                oDataItem.Numcuenta = this.byId("txtNumCuenta").getValue();

                //obtener la moneda
                if (oDataTipCtaSoDoDet.TipCtaSoDoDet.length > 0) {
                    let result = oDataTipCtaSoDoDet.TipCtaSoDoDet.filter(x => x.Selectcuentasodode === oDataItem.Selectcuentasodode);
                    if (result.length > 0) {
                        oDataItem.Moneda = result[0].Waers;
                    }
                }

                if (oPreRegistro.Land1 == "PE") {

                    oDataItem.Cuentainterbancaria = this.byId("txtCci").getValue();
                    oDataItem.Correopagos = this.byId("txtCorreoPagos").getValue();

                }
                //Otros valores
                oDataItem.Iban = this.byId("txtCtaIban").getValue();
                oDataItem.Swift = this.byId("txtCtaSwift").getValue();
                oDataItem.Nombrebancointermediario = this.byId("txtCtaBankInterm").getValue();
                oDataItem.Numcuentabancointermediario = this.byId("txtNCtabankInterm").getValue();

                return oDataItem;
            },
            _setAddModelCtaBank: function (oDataItem) {

                let oModel = this.getView().getModel("oProveedor");
                let oData = oModel.getData();
                let items = [];

                if (oData.CuentaBancaria.CuentasBancariasDetSet.length > 0) {
                    items = oData.CuentaBancaria.CuentasBancariasDetSet;
                }
                items.push(oDataItem);
                oModel.setProperty("/CuentaBancaria", { CuentasBancariasDetSet: items });
                oModel.refresh(true);

            },
            changeValueNumCta: function () {
                //this.changeOnlyNumber(oEvent); //Solo Números

                let oPreRegistro = this.getModel("oPreRegistro").getData();
                //Validaciones para PE
                if (oPreRegistro.Land1 == "PE") {
                    this._validCtasPE();
                } else {

                }
            },
            _validCtasPE: function () {
                let length = 0;
                let TipoBanco = this.byId("cboNombreBanco").getSelectedKey();
                let TipoCta = this.byId("cboMainTipoCuenta").getSelectedKey();
                let Moneda = this.byId("cboMainMoneda").getSelectedKey();

                if (TipoBanco == "" || TipoBanco == undefined) {
                    this.byId("cboNombreBanco").setValueState("Error");
                    return;
                }
                /* -@DELETE
                if (Moneda == "" || Moneda == undefined) {
                    this.byId("cboMainMoneda").setValueState("Error");
                    return;
                }*/

                if (TipoCta == "" || TipoCta == undefined) {
                    this.byId("cboMainTipoCuenta").setValueState("Error");
                    return;
                }

                //Validar Campo Numero de Cuenta
                switch (TipoCta) {
                    case "CC" || "CM": //Cta Corriente / Cta Maestra
                        length = this._getLengthBank(TipoBanco, "1");
                        if (length > 0) {
                            this._ValidarLengthBank("txtNumCuenta", length);
                        } else {
                            this._ValidarLengthBank("txtNumCuenta", 18);
                        }
                        break;
                    case "CA": //Cta Ahorro
                        length = this._getLengthBank(TipoBanco, "2");
                        if (length > 0) {
                            this._ValidarLengthBank("txtNumCuenta", length);
                        } else {

                            this._ValidarLengthBank("txtNumCuenta", 18);
                        }
                        break;

                    default:
                        if (this.byId("cboSelecTipoCta").getSelectedKey() == "DETRACCIONES") {
                            this._ValidarLengthBank("txtNumCuenta", 11);
                        }
                        break;
                }

            },
            _getLengthBank: function (codeBank, opcCta) {
                let length = 0;
                let oDataResult = this.getView().getModel().getData();
                let Filter = oDataResult.CaracteresXClaveBancoSet.filter(x => x.Clavebanco === codeBank);
                if (Filter.length > 0) {
                    let value = Filter[0].Cantidad;
                    let arrayLengths = value.split("_");
                    if (arrayLengths.length > 0) {
                        switch (arrayLengths.length) {
                            case 2:
                                if (opcCta == "1" || opcCta == "2") {
                                    length = arrayLengths[1];
                                }
                                break;
                            case 3:
                                if (opcCta == "1") {
                                    length = arrayLengths[1];
                                } else if (opcCta == "2") {
                                    length = arrayLengths[2];
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
                return length;
            },
            _ValidarLengthBank: function (field, length) {
                let message = oBundle.getText("regisTxt") + " " + length + " " + oBundle.getText("digTxt");
                let valuetext = this.byId(field).getValue();

                if (valuetext != "" && valuetext != undefined) {
                    if (valuetext.length != length) {
                        this.byId(field).setValueStateText(message);
                        this.byId(field).setValueState("Error");
                        return;
                    }
                    this.byId(field).setValueState("None");
                    this.byId(field).setValueStateText("");
                } else {
                    this.byId(field).setValueStateText(message);
                    this.byId(field).setValueState("Error");
                }
            },
            _validInputsCtaBank: function () {

                let oPreRegistro = this.getModel("oPreRegistro").getData();

                if (this.byId("cboSelecTipoCta").getSelectedKey() == "" || this.byId("cboSelecTipoCta").getSelectedKey() == undefined ||
                    this.byId("cboNombreBanco").getSelectedKey() == "" || this.byId("cboNombreBanco").getSelectedKey() == undefined ||
                    //this.byId("cboMainMoneda").getSelectedKey() == "" || this.byId("cboMainMoneda").getSelectedKey() == undefined ||
                    this.byId("cboMainTipoCuenta").getValue() == "" || this.byId("cboMainTipoCuenta").getValue() == undefined) {

                    MessageBox.error(oBundle.getText("messageInput"));
                    return false;
                }

                if (oPreRegistro.Land1 == "PE") {
                    if (this.byId("cboSelecTipoCta").getSelectedKey() == "DETRACCIONES") {
                        if (this.byId("txtNumCuenta").getValue() == "" || this.byId("txtNumCuenta").getValue() == undefined) {
                            MessageBox.error(oBundle.getText("messageInput"));
                            return false;
                        }
                    } else {

                        if (this.byId("txtNumCuenta").getValue() == "" || this.byId("txtNumCuenta").getValue() == undefined ||
                            this.byId("txtCci").getValue() == "" || this.byId("txtCci").getValue() == undefined ||
                            this.byId("txtCorreoPagos").getValue() == "" || this.byId("txtCorreoPagos").getValue() == undefined) {
                            MessageBox.error(oBundle.getText("messageInput"));
                            return false;
                        }
                    }
                } else {

                    if (this.byId("txtNumCuenta").getValue() == "" || this.byId("txtNumCuenta").getValue() == undefined) {
                        //this.byId("txtCtaBankInterm").getValue() == "" || this.byId("txtCtaBankInterm").getValue() == undefined ||
                        //this.byId("txtNCtabankInterm").getValue() == "" || this.byId("txtNCtabankInterm").getValue() == undefined) {
                        MessageBox.error(oBundle.getText("messageInput"));
                        return false;
                    }

                    if (oPreRegistro.Land1 != "PE" && oPreRegistro.Land1 != "CL") {
                        if ((this.byId("txtCtaIban").getValue() == "" || this.byId("txtCtaIban").getValue() == undefined) &&
                            (this.byId("txtCtaSwift").getValue() == "" || this.byId("txtCtaSwift").getValue() == undefined)) {
                            MessageBox.error(oBundle.getText("messageInput"));
                            return false;
                        }
                    }

                }

                return true;
            },
            _validStateInputsCtaBank: function () {
                let isValid = false;
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let fields = [];

                if (oPreRegistro.Land1 == "PE") {
                    fields = ["txtNumCuenta", "txtCci", "txtCorreoPagos"];
                    isValid = this._checkInputsState(fields);
                } else {
                    isValid = true;
                }

                return isValid;
            },
            _checkInputsState: function (aInputs) {
                let isValid = false;
                for (let i = 0; i < aInputs.length; i++) {

                    let stateText = this.byId(aInputs[i]).getValueState();
                    if (stateText == "Error") {
                        MessageBox.error(oBundle.getText("messageInput"));
                        isValid = false;
                        break;
                    } else {
                        isValid = true;
                    }
                }
                return isValid;
            },
            _getTipCtaSoDoDet: async function () {
                try {
                    let odataPreRegis = this.getView().getModel("oPreRegistro").getData();
                    let codeKeyPais = "";
                    let filters = [];
                    let oModel = this.getOwnerComponent().getModel();

                    /*
                    if (odataPreRegis.Land1 != "PE" && odataPreRegis.Land1 != "CL" ) {
                        codeKeyPais = "EXT";
                        //this._setInitialInputExtranjero(true);
                    }else{
                        codeKeyPais = odataPreRegis.Land1;  
                        //this._setInitialInputExtranjero(false);
                    }*/
                    codeKeyPais = odataPreRegis.Land1;
                    filters.push(new Filter("Land1", "EQ", `${codeKeyPais}`))

                    let aListaTipCtaSoDoDet = await this.readEntity(oModelPreRegProv, "/ConsultaTipoCuentaSoDoDeSet", { filters });
                    if (aListaTipCtaSoDoDet.results.length == 0) {
                        filters = [];
                        codeKeyPais = "EXT";
                        filters.push(new Filter("Land1", "EQ", `${codeKeyPais}`))
                        aListaTipCtaSoDoDet = await this.readEntity(oModelPreRegProv, "/ConsultaTipoCuentaSoDoDeSet", { filters });
                    }
                    oModel.setSizeLimit(9000);
                    oModel.setProperty("/TipCtaSoDoDet", aListaTipCtaSoDoDet.results)

                    if (codeKeyPais == "EXT") {
                        this.byId("cboSelecTipoCta").fireChange();
                    }

                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion _getTipCtaSoDoDet: " + error)
                }
            },
            _getCaractClaveBanco: async function () {
                try {
                    let oModel = this.getOwnerComponent().getModel()
                    const oDataRpta = await this.readEntity(oModelPreRegProv, "/ConsultaCaracteresXClaveBancoSet", {})
                    oModel.setSizeLimit(9000);
                    oModel.setProperty("/CaracteresXClaveBancoSet", oDataRpta.results)
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion _getCaractClaveBanco: " + error)
                }

            },
            changeValueNomBanco: function (oEvent) {
                let oValue = oEvent.getSource().getValue();
                if (oValue) {
                    oEvent.getSource().setValueState("None")
                }

                //Validar
                this.changeValueNumCta();

            },
            changeValueTipoCta: function (oEvent) {

                let oValue = oEvent.getSource().getValue();
                if (oValue) {
                    oEvent.getSource().setValueState("None")
                }

                //Validar
                this.changeValueNumCta();
            },
            _logicFieldsDetrac: function (opcDet) {

                let keyBankExtran = this.byId("cboNombreBanco").getSelectedKey();
                if (keyBankExtran == "DEX99") {
                    return;
                }
                if (opcDet) {

                    this.byId("txtCci").setEditable(false);
                    this.byId("txtCorreoPagos").setEditable(false);

                    this.byId("cboNombreBanco").setEditable(false);
                    this.byId("cboNombreBanco").setSelectedKey("S18");

                    //this.byId("cboMainMoneda").setEditable(false);
                    //this.byId("cboMainMoneda").setSelectedKey("PEN");

                } else {
                    this.byId("cboNombreBanco").setEditable(true);
                    this.byId("cboNombreBanco").setSelectedKey("");

                    //this.byId("cboMainMoneda").setEditable(true);
                    //this.byId("cboMainMoneda").setSelectedKey("");

                    this.byId("txtCci").setEditable(true);
                    this.byId("txtCorreoPagos").setEditable(true);
                }

            },
            changeValueMonedaCta: function (oEvent) {
                let oValue = oEvent.getSource().getValue();
                if (oValue) {
                    oEvent.getSource().setValueState("None")
                }
                //Validar
                this.changeValueNumCta();
            },
            _setInitialInputExtranjero: function (opcActive) {
                if (opcActive) {
                    //this.byId("cboMainMoneda").setSelectedKey("USD");
                    //this.byId("cboMainMoneda").setEditable(false);

                    this.byId("cboNombreBanco").setSelectedKey("DEX99");
                    this.byId("cboNombreBanco").setEditable(false);

                    this.byId("cboSelecTipoCta").setSelectedKey("DOLARES");
                    this.byId("cboSelecTipoCta").setEditable(false);

                } else {

                    //this.byId("cboMainMoneda").setSelectedKey("");
                    //this.byId("cboMainMoneda").setEditable(true);

                    this.byId("cboNombreBanco").setSelectedKey("");
                    this.byId("cboNombreBanco").setEditable(true);

                    this.byId("cboSelecTipoCta").setSelectedKey("");
                    this.byId("cboSelecTipoCta").setEditable(true);

                }
            },
            changeValueIban: function (oEvent) {
                let oValue = oEvent.getSource().getValue();
                if (oValue) {
                    oEvent.getSource().setValueState("None")
                }
                this.byId("txtCtaSwift").setValue("");
            },
            changeValueSwift: function (oEvent) {
                let oValue = oEvent.getSource().getValue();
                if (oValue) {
                    oEvent.getSource().setValueState("None")
                }
                this.byId("txtCtaIban").setValue("");

            },
            _clearInputsCtaBank: function () {
                this.byId("txtCtaSwift").setValue("");
                this.byId("txtCtaIban").setValue("");
                this.byId("txtNCtabankInterm").setValue("");
                this.byId("txtCtaBankInterm").setValue("");
                this.byId("txtCorreoPagos").setValue("");
                this.byId("txtCci").setValue("");
                this.byId("txtNumCuenta").setValue("");
                //
                this.byId("cboMainTipoCuenta").setSelectedKey("");
            },
            onSaveCuentBancariaV2: async function () {
                let oPreRegistro = this.getModel("oPreRegistro").getData();
                let oProveedor = this.getModel("oProveedor").getProperty("/CuentaBancaria");
                oProveedor.Taxnumxl = oPreRegistro.Taxnumxl;

                if (oProveedor.CuentasBancariasDetSet.length === 0) {
                    MessageBox.error(oBundle.getText("tableCta"));
                    return;
                }

                let isValid = await this._getDetSaveBankProveedor(oProveedor.CuentasBancariasDetSet.length);
                if (!isValid) {
                    return;
                }

                try {
                    sap.ui.core.BusyIndicator.show(0)
                    const oResultCreateProveedor = await this.createEntity(oModelPreRegProv, "/CuentasBancariasCabSet", oProveedor)

                    if (oResultCreateProveedor.Codigo == "500") {
                        MessageBox.error(oResultCreateProveedor.Mensaje);
                    } else {
                        MessageBox.success(oResultCreateProveedor.Mensaje, {
                            onClose: function () {
                                that.byId("iconTabCabecera").setSelectedKey("SistemaCalidad")
                            }
                        });
                    }
                    sap.ui.core.BusyIndicator.hide()
                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    sap.ui.core.BusyIndicator.hide()
                }
            },

            _getDetSaveBankProveedor: async function (lengthTable, check) {
                let isValid = false;
                let filters = [];
                let nif = this.byId("txtNif").getValue();

                filters.push(new Filter("Taxnumxl", "EQ", nif)) //

                try {
                    let oModel = this.getOwnerComponent().getModel()
                    const oDataRpta = await this.readEntity(oModelPreRegProv, "/CuentasBancariasDetSet", { filters })
                    oModel.setSizeLimit(9000);
                    if (oDataRpta.results.length > 0 && oDataRpta.results.length !== lengthTable) {
                        isValid = true;
                        if (check) {
                            MessageBox.error(oBundle.getText("tableCta2"));
                            isValid = true;
                        }
                    } else if ((oDataRpta.results.length > 0 && oDataRpta.results.length === lengthTable)) {
                        isValid = false;
                    }

                    if (oDataRpta.results.length === 0 && lengthTable > 0) {
                        isValid = true;
                    }

                } catch (error) {
                    console.log("Funcion _getDetSaveBankProveedor: " + error);
                    isValid = true;
                }


                return isValid;

            },
            _checkDataRegion: function (errorData) {
                let odataPreRegis = this.getView().getModel("oPreRegistro").getData();
                let oModelUser = this.getView().getModel("userData");
                let oDatauser = oModelUser.getData();

                //Validación solo para Proveedores extranjeros
                if (odataPreRegis.Land1 != "PE") {
                    if (odataPreRegis.Codigoestado != "07") {
                        if (errorData && oDatauser.editable === false) {
                            this.getView().getModel("userData").setProperty("/editable", true);
                        }
                    }
                }
            },
            onChangeCiudProv: async function () {

                let odataPreRegis = this.getView().getModel("oPreRegistro").getData();

                let sKey = this.byId("cboMainRegionDpto").getSelectedKey(),
                    sKeyDepart = this.byId("cboMainCiudad").getSelectedKey(),
                    sKeyDistrito = this.byId("cboMainDistrito").getSelectedKey();;

                let filters = [];
                filters.push(new Filter("Region", "EQ", `${sKey}`))
                filters.push(new Filter("Provincia", "EQ", `${sKeyDepart}`))
                if (odataPreRegis.Land1 == "PE") {
                    try {
                        let oModel = this.getOwnerComponent().getModel()
                        const aListaDistritos = await this.readEntity(oModelPreRegProv, "/ConsultaProvinciaDistritoSet", { filters })
                        oModel.setProperty("/Distrito", aListaDistritos.results);
                        if (aListaDistritos.results.length == 0) {
                            this.byId("cboMainDistrito").setSelectedKey("");
                        }
                        //Actualizar valor seleccionado
                        if (sKeyDistrito != "" && sKeyDistrito != undefined) {
                            const filterResults = aListaDistritos.results.filter(x => x.Region === initValuesUbic.Region &&
                                x.Provincia === initValuesUbic.Provincia);
                            if (filterResults.length === 0) {
                                this.byId("cboMainDistrito").setSelectedKey("");
                                this.initValuesUbigeoProv(false, false, true);//+@INSERT    
                            }
                        }
                    } catch (error) {
                        MessageBox.error(JSON.parse(error.responseText).error.message.value)
                        console.log("Funcion onChangeDistrito: " + error)
                    }
                }
            },
            initValuesUbigeoProv: function (all, region, provincia) {
                let OdataProveedor = this.getView().getModel("oProveedor").getData();
                if (OdataProveedor) {
                    if (all) {
                        initValuesUbic.Region = OdataProveedor.DatosGeneral.Ort01;
                        initValuesUbic.Provincia = OdataProveedor.DatosGeneral.Ort02;;
                        initValuesUbic.Distrito = OdataProveedor.DatosGeneral.Pfach;
                    }
                    if (region) {
                        initValuesUbic.Region = OdataProveedor.DatosGeneral.Ort01;
                    }
                    if (provincia) {
                        initValuesUbic.Provincia = OdataProveedor.DatosGeneral.Ort02;;
                        initValuesUbic.Distrito = OdataProveedor.DatosGeneral.Pfach;
                    }
                }
            },
            changeValueGrupo: async function () {
                let sKey = this.byId("cboMainGrupos").getSelectedKey();
                let filters = [];
                filters.push(new Filter("Matkl", "EQ", `${sKey}`));

                try {
                    let oModel = this.getOwnerComponent().getModel()
                    const aListaCateg = await this.readEntity(oModelPreRegProv, "/ConsultaCategoriasSet", { filters })
                    oModel.setProperty("/Categorias", aListaCateg.results);
                    if (aListaCateg.results.length == 0) {
                        this.byId("cboMainCategorias").setSelectedKey("");
                    }
                    this.byId("cboMainCategorias").setSelectedKey("");

                } catch (error) {
                    MessageBox.error(JSON.parse(error.responseText).error.message.value)
                    console.log("Funcion onChangeDistrito: " + error)
                }
            },
            selectValuesBankWaers: async function (keySelec) {
                let odataPreRegis = this.getView().getModel("oPreRegistro").getData();
                let oDataTipCtaSoDoDet = this.getView().getModel().getData();
                let waersSelect = "";
                let filters = [];

                if (oDataTipCtaSoDoDet.TipCtaSoDoDet.length > 0) {
                    let result = oDataTipCtaSoDoDet.TipCtaSoDoDet.filter(x => x.Selectcuentasodode === keySelec);
                    if (result.length > 0) {
                        waersSelect = result[0].Waers;
                    }
                }
                filters.push(new Filter("Land1", "EQ", `${odataPreRegis.Land1}`));
                if (keySelec != "DETRACCIONES") {
                    filters.push(new Filter("Waers", "EQ", `${waersSelect}`));
                }

                if (keySelec == "DETRACCIONES") {
                    filters.push(new Filter("Waers", "EQ", "PEN"));
                }

                try {
                    let oModel = this.getOwnerComponent().getModel();
                    let oDataResult = await this.readEntity(oModelPreRegProv, "/ConsultaNombreBancoSet", { filters });
                    if (oDataResult.results.length > 0) {
                        oModel.setProperty("/NombreBancos", oDataResult.results);
                        this.byId("cboNombreBanco").setSelectedKey("");
                    } else {
                        filters = [];
                        filters.push(new Filter("Land1", "EQ", "EXT"));
                        filters.push(new Filter("Waers", "EQ", "USD"));
                        oDataResult = await this.readEntity(oModelPreRegProv, "/ConsultaNombreBancoSet", { filters });
                        oModel.setProperty("/NombreBancos", oDataResult.results);
                        if (oDataResult.results.length > 0) {
                            this._setInitialInputExtranjero(true);
                        }
                    }

                } catch (error) {
                    console.error("ERROR FUNCTION selectValuesBankWaers:");
                    console.error({ error });
                }
            },
            displayPdfterminos: async function () {
                let idRepositorioDMS = Repositoryid;
                let modelPdfTerminso = this.getView().getModel("DMS");
                let urlMain = that._getAppModulePath() + rutaInicial + idRepositorioDMS + "/root/PROVEEDOR/TERMINOS";
                let odataPdftermin = modelPdfTerminso.getData();

                if (odataPdftermin.SourceData.length > 0) {
                    return;
                }

                if (window.navigator.language.split('-')[0] == "es" || window.navigator.language == 'es-PE') {
                    urlMain = urlMain + "/ES";
                } else {
                    urlMain = urlMain + "/EN";
                }

                return new Promise(function (resolve, reject) {
                    sap.ui.core.BusyIndicator.show(0);
                    try {
                        $.ajax({
                            url: urlMain,
                            type: "GET",
                            "mimeType": "multipart/form-data",
                            "contentType": false,
                            "processData": false,
                            success: async function (data) {
                                sap.ui.core.BusyIndicator.hide();
                                let aObjects = JSON.parse(data).objects
                                let aFiles = []
                                if (aObjects.length > 0) {
                                    for (let i = 0; i < aObjects.length; i++) {
                                        let oObject = aObjects[i]
                                        let sUrl = urlMain + "/" + oObject.object.properties["cmis:name"].value
                                        let oFile = {
                                            id: oObject.object.properties["cmis:objectId"].value,
                                            name: oObject.object.properties["cmis:name"].value,
                                            url: sUrl,
                                            File: null,
                                            dms: true,
                                            fecha_creacion: that.formatoFechaMilenio(oObject.object.properties["cmis:creationDate"].value)
                                        }
                                        aFiles.push(oFile)
                                    }
                                    modelPdfTerminso.setProperty("/SourceData", aFiles);
                                } else {
                                    modelPdfTerminso.setProperty("/SourceData", aFiles);
                                }
                                resolve(true)
                            },
                            error: function (error) {
                                console.error("Error Function: displayPdfterminos ", error);
                                sap.ui.core.BusyIndicator.hide();
                                resolve(false);
                            },
                        })

                        sap.ui.core.BusyIndicator.hide();
                    } catch (error) {
                        console.error("Error Function: displayPdfterminos ", error);
                        sap.ui.core.BusyIndicator.hide();
                    }
                })
            },
            getFileTerminosDMS: async function (url) {
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: url,
                        contentType: "application/json",
                        success: resolve,
                        error: reject
                    })
                });
            },
            downloadFileTerminosDMS: async function (url) {
                const docs = await this.getFileTerminosDMS(url);
                if (docs) {
                    if (docs.objects.length > 0) {


                        for (let i = 0; i < docs.objects.length; i++) {
                            let doc = docs.objects[i];
                            let rutaDoc = url + "/" + doc.object.properties["cmis:name"].value;
                            window.open(rutaDoc, '_blank');
                        }
                    } else {
                        MessageToast.show(oBundle.getText("messageErrorTer"));
                    }
                } else {
                    MessageToast.show(oBundle.getText("messageErrorTer"));
                }
            },
            showPopupSubcontratista: async function (showActive) {

                let oDataPreregis = this.getView().getModel("oPreRegistro").getData();
                let urlAccess = oDataPreregis.UrlPasarelaPago;

                if (!this.oDefaultMessageDialog) {
                    this.oDefaultMessageDialog = new sap.m.Dialog({
                        type: sap.m.DialogType.Message,
                        title: oBundle.getText("tituloSub"),
                        state: sap.ui.core.ValueState.Information,
                        content: [
                                    new sap.ui.layout.VerticalLayout({
                                        content: [
                                            new sap.m.Text({ text: oBundle.getText("bodyMessageSub") }),
                                            new sap.m.Text({ text: oBundle.getText("bodyMessageSub2")}),
                                            new sap.m.Text({ text: " "}),
                                            new sap.m.Text({ text: oBundle.getText("bodyMessageSub3") }),
                                            new sap.m.Text({ text: " "}),
                                            new sap.m.FlexBox({
                                                alignItems:"Start",
                                                justifyContent:"Center",
                                                items:[
                                                    new sap.m.Link({ text: oBundle.getText("bodyMessageSub4"),
                                                    textAlign: sap.ui.core.TextAlign.Left,
                                                    target: "_blank",
                                                    press: function () {
                                                       window.open(urlAccess, "_blank");
                                                    }})
                                                ]
                                                
                                            })
                                        ]
                                    }),
                             ],

                        beginButton: new sap.m.Button({
                            type: sap.m.ButtonType.Emphasized,
                            text: "OK",
                            press: function () {
                                this.oDefaultMessageDialog.close();
                            }.bind(this)
                        })
                    });
                }
                this.oDefaultMessageDialog.open();
            },
            show2PopupSubContratista: function()
            {
                this.onOpenDialog();
            },
            onOpenDialog: function(){

                /*
                let paisesSub   = this.getView().getModel().getProperty("/Paises");
                let pasarelaPag = this.getView().getModel("oPreRegistro").getData();

                let oModelDialog = new sap.ui.model.json.JSONModel({
                    paisesSub: paisesSub,
                    pasarelaPag:pasarelaPag, 
                });*/

                let oDataModel = this.getView().getModel("oPreRegistro");

                if (!this._BusyFragment) {
                    this._BusyFragment = sap.ui.xmlfragment("ns.cosapi.actualizacionproveedor.fragment.showPopupSubContratista", this);
                    this.getView().addDependent(this._BusyFragment);
                    let idForm = sap.ui.getCore().byId("mainDialog");
                    if (idForm) {
                        idForm.setModel(oDataModel);//+
                    }
                }


                this._BusyFragment.open();
            },
            onCloseAceptSubcont: async function()
            {   
                this._BusyFragment.close();
                this.onSaveDocument();
            },
            onSavePagoPass: async function(pago)
            {
                let DatosProv = this.getView().getModel("oPreRegistro").getData();
                let DataPass = {
                    Land1: DatosProv.Land1,
                    Taxnumxl:DatosProv.Taxnumxl,
                    PaisPasarelaPago: DatosProv.Land1,
                    MontoPasarelaPago: pago
                }

                return new  Promise((resolve,reject) => {

                try {
                        sap.ui.core.BusyIndicator.show(0)
                        const oResultCreatePass = this.createEntity(oModelPreRegProv, "/RegistroPasarelaPagoSet", DataPass);
                        sap.ui.core.BusyIndicator.hide()
                        resolve(oResultCreatePass);
                    } catch (error) {
                        console.error("Error - Function onSavePagoPass:",error);
                        sap.ui.core.BusyIndicator.hide()
                        resolve(undefined);
                    }
                });

            },
            onPressLink: async function()
            {

                let montoSubcont = sap.ui.getCore().byId("FragMontoSubs").getValue();
                if ( montoSubcont == "" || montoSubcont == undefined) 
                {
                    MessageBox.error(oBundle.getText("SubValid"));
                    return;
                }

                let oDataResult = await this.onSavePagoPass(montoSubcont);
                if (oDataResult) {
                    window.open(oDataResult.EnlacePorMonto,"_blank"); 
                }
            },
            onCloseDialogSubcont: function()
            {
                this._BusyFragment.close();
            }
        });
    });