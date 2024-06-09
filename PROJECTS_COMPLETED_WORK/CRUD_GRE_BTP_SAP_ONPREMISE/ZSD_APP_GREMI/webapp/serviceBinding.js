function initModel() {
	var sUrl = "/GSE_QAS_GRE/sap/opu/odata/sap/ZGW_SD_GREMI_SCP_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}