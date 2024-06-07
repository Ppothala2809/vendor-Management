sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/model/json/JSONModel"
], function(Controller, History, JSONModel) {
    "use strict";

    return Controller.extend("dashboard.controller.Details", {
        onInit: function() {
            // Initialize the JSON model with empty values for the Vendor entity
            var oViewModel = new JSONModel({
                VendorNumber: "",
                VendorFirstName: "",
                VendorLastName: "",
                VendorEmail: "",
                VendorPhoneNumber: "",
                PONumber: "",
                PurchasingGrp: "",
                InvoiceNumber: "",
                PODescription: "",
                ComplaintDesc: "",
                ComplaintCategory: "",
                ComplaintNumber: "",
                Status: ""
            });
            this.getView().setModel(oViewModel, "vendor");

            // Get the router and attach the route pattern matched event
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("details").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function(oEvent) {
            var sPath = decodeURIComponent(oEvent.getParameter("arguments").path);
            var oModel = this.getView().getModel();

            var oBinding = oModel.bindContext(sPath);
            oBinding.requestObject().then(function(oData) {
                // Update each field in the model with the retrieved data
                var oViewModel = this.getView().getModel("vendor");
                Object.keys(oData).forEach(function(key) {
                    oViewModel.setProperty("/" + key, oData[key]);
                });
                console.log(this.getView().getModel("vendor").getData());
            }.bind(this)).catch(function(oError) {
                // Handle error
                console.error(oError);
            });
        },

        


        onNavBack: function() {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("TargetDashboard", {}, true);
            }
        }
    });
});
