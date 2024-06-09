sap.ui.define(["sap/ui/base/Object", "sap/ui/model/Filter"],
    function (Object, Filter) {
        "use strict";
        let _this;

        let instance;
        let logDetail = Object.extend("centria.net.fisbactivos.controller.logica.DetailSolBaja",
            {
                constructor: function () {
                    _this = this;
                },
                /**
                 * 
                 * @param { typeof object } oModelItem 
                 * @param { typeof object } oModelMain 
                 * @param { typeof boolean } create 
                 * @param { typeof boolean } edit 
                 */
                addItemDialogModel: function (oModelItem, oModelMain, create, edit,oView) {

                    if (oModelItem) 
                    {
                        let detailProduct = oModelItem.getData();
                        let dataModelMain = oModelMain.getData();

                        //Crear registro
                        if (create === true && !edit) 
                        {
                            dataModelMain.SolicBaja.DetailSolBajaSet.push(detailProduct.Detail)
                            if (detailProduct.Detail && dataModelMain) 
                            {
                                oModelMain.setData(dataModelMain);
                            }
                        }else
                        {
                            //Editar Registro
                            if(oView)
                            {
                                let oTable = oView.byId("DetailSolBaj");
                                if (oTable) 
                                {
                                    let selectedItem = oTable.getSelectedItem();
                                    let itemPath = selectedItem.getBindingContextPath()
                                    oModelMain.setProperty(itemPath, detailProduct.Detail);
                                    //dataModelMain.SolicBaja.DetailSolBajaSet[0] = detailProduct.Detail;      
                                }
                            }
                        }
                    }
                },
                setItemModifSelected: function(data,oModelDetailMod)
                {
                    if(data && oModelDetailMod)
                    {
                        oModelDetailMod.setProperty("/Detail", {});
                        oModelDetailMod.setData({ Detail: data });
                        oModelDetailMod.updateBindings(true);
                        oModelDetailMod.refresh();
                    }
                }
            });

        return {
            getInstance: function () {
                if (!instance) {
                    instance = new logDetail
                }
                return instance;
            }
        }
    });