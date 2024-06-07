sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("dashboard.controller.Dashboard", {
        onInit: function () {
            // Initialization code
            this.getOwnerComponent().getRouter().getRoute("TargetDashboard").attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: function () {
            this._refreshList();
        },

        _refreshList: function () {
            var oList = this.byId("vendorTable");
            var oBinding = oList.getBinding("items");
            oBinding.refresh();
        },

        formatStatusText: function(status) {
            if (status === 'In_Progress') {
                return 'In Progress';
            } else {
                return status;
            }
        },
        

        onFilterSearch: function (oEvent) {
            var oStatusSelect = this.byId("statusSelect");
            var oPONumberInput = this.byId("poNumberInput");
            // var oInvoiceNumberInput = this.byId("invoiceNumberInput");
            var oComplaintNumberInput = this.byId("complaintNumberInput");

            var sStatusKey = oStatusSelect.getSelectedKey();
            var sPONumber = oPONumberInput.getValue();
            // var sInvoiceNumber = oInvoiceNumberInput.getValue();
            var sComplaintNumber = oComplaintNumberInput.getValue();

            var oDateFromPicker = this.byId("dateFromPicker");
            var oDateToPicker = this.byId("dateToPicker");

            var oDateFrom = oDateFromPicker.getDateValue();
            var oDateTo = oDateToPicker.getDateValue();

            var oTable = this.byId("vendorTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            if (sStatusKey) {
                aFilters.push(new Filter("Status", FilterOperator.EQ, sStatusKey));
            }

            if (sPONumber) {
                aFilters.push(new Filter("PONumber", FilterOperator.Contains, sPONumber));
            }

            // if (sInvoiceNumber) {
            //     aFilters.push(new Filter("InvoiceNumber", FilterOperator.Contains, sInvoiceNumber));
            // }

            if (sComplaintNumber) {
                aFilters.push(new Filter("ComplaintNumber", FilterOperator.Contains, sComplaintNumber));
            }

            if (oDateFrom && oDateTo) {
                var oDateFromFilter = new Filter("createdAt", FilterOperator.GE, oDateFrom.toISOString());
                var oDateToFilter = new Filter("createdAt", FilterOperator.LE, oDateTo.toISOString());
                aFilters.push(new Filter([oDateFromFilter, oDateToFilter], true));
            } else if (oDateFrom) {
                aFilters.push(new Filter("createdAt", FilterOperator.GE, oDateFrom.toISOString()));
            } else if (oDateTo) {
                aFilters.push(new Filter("createdAt", FilterOperator.LE, oDateTo.toISOString()));
            }

            oBinding.filter(aFilters);
        },

        onCreateSelection: function(oEvent) {
            var oTable = this.byId("vendorTable");
            var oSelectedRow = oTable.getSelectedItem();
        
            // If a row is selected, get the complaint number value
            var sComplaintNumber = "";
            if (oSelectedRow) {
                sComplaintNumber = oSelectedRow.getCells()[0].getText(); // Assuming Complaint Number is the first cell
            }
        
            // Get the "Create New Complaint" button
            var oCreateComplaintButton = this.byId("createComplaintButton");
        
            // Enable the button only if the complaint number is empty or null
            oCreateComplaintButton.setEnabled(!sComplaintNumber);
        },
        

        onCreateComplaint: function() {
            var oTable = this.byId("vendorTable");
            var oSelectedRow = oTable.getSelectedItem();
            
            if (oSelectedRow) {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                var sPath = oSelectedRow.getBindingContext().getPath();
                console.log(sPath);
                oRouter.navTo("complaintDetails", {
                    path: encodeURIComponent(sPath)
                });
            } else {
                // Handle case where no row is selected
            }
        },

        onItemPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            var sPath = oItem.getBindingContext().getPath();
            oRouter.navTo("details", {
                path: encodeURIComponent(sPath)
            });
        }
    });
});
