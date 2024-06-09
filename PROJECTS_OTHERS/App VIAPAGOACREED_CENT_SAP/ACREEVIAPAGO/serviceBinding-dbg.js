function initModel() {
	var sUrl = "/sap/opu/odata/sap/ZFISO_PORTAL_H2H_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}