sap.ui.define(['sap/ui/thirdparty/jquery', "sap/ui/export/Spreadsheet", "sap/ui/export/library"],
    function (jQuery, Spreadsheet, exportLibrary) {
        "use strict";
        var EdmType = exportLibrary.EdmType;
        var ExportService = {
            export: function (table, oBundle) {
                if (!table) {
                    return;
                }

                var aCols, oRowBinding, oSettings, oSheet;

                oRowBinding = table.getBinding("rows");
                aCols = this.createColumnConfig(oBundle);

                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: "Level"
                    },
                    dataSource: oRowBinding,
                    fileName: "Reporte de Contabilidad.xlsx",
                    worker: false
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function () {
                    oSheet.destroy();
                });


            },

            createColumnConfig: function (oBundle) {
                var aCols = [];
                aCols.push({
                    label: oBundle.getText("oc"),
                    property: "Ebeln",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("posicion"),
                    property: "Buzei",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("ruc"),
                    property: "Stcd1",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("proveedor"),
                    property: "Lifnr",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("razonSocial"),
                    property: "Name1",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("sociedad"),
                    property: "Butxt",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("factura"),
                    property: "Xblnr",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("fechaRecepcion"),
                    property: "Fecharecep",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("fechaEmision"),
                    property: "Fechaemision",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("moneda"),
                    property: "Waers",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("importeTotal"),
                    property: "ImporteTot",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("importePagadoFechas"),
                    property: "Maktx",
                    type: EdmType.String
                });
                aCols.push({
                    label:oBundle.getText("importePendientePago"),
                    property: "ImportePend",
                    type: EdmType.String
                });
                aCols.push({
                    label:oBundle.getText("centroCostos"),
                    property: "Kostl",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("tipoOrdenCompra"),
                    property: "Batxt",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("pagoRetenido"),
                    property: "Zahls",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("condicionPago"),
                    property: "Text1",
                    type: EdmType.String
                });
                aCols.push({
                    label:  oBundle.getText("recepciones"),
                    property: "Lfbnr",
                    type: EdmType.String
                });
                aCols.push({
                    label: oBundle.getText("secuenciaPreRegistro"),
                    property: "Belnr" ,
                    type: EdmType.String
                });
                aCols.push({
                    label:  oBundle.getText("fechaVencimiento"),
                    property: "Zbd1t",
                    type: EdmType.String
                });
                aCols.push({
                    label:  oBundle.getText("comentario"),
                    property: "Comentario",
                    type: EdmType.String
                });
                aCols.push({
                    label:  oBundle.getText("estado"),
                    property: "Desestado",
                    type: EdmType.String
                });
                return aCols;
            }
        };

        return ExportService;

    });
