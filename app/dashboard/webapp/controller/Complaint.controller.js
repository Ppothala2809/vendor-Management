sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/BusyDialog",
], function(Controller, History, JSONModel,MessageBox,BusyDialog) {
    "use strict";

    return Controller.extend("dashboard.controller.Complaint", {
        sSavedPath: "",
        complaintNumber : "",

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

            var oFileModel = new JSONModel({
                items: null,
                fileNames: "",
                aFileNames: null
            });
            this.getView().setModel(oFileModel, "FileModel");

            // Get the router and attach the route pattern matched event
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("complaintDetails").attachPatternMatched(this._onObjectMatched, this);
        },


        saveData: function () {
            var oView = this.getView();
            var oModel = oView.getModel("vendor");
            var oData = oModel.getData();
        
            // Generate a 10-digit complaint number
            this.complaintNumber = "COM" + this.generateRandomNumber();
            var status = "In_Progress"
        
            // Get the updated values from the input fields
            var sComplaintDesc = oView.byId("complaintDescInput").getValue();
            var sComplaintCategory = oView.byId("complaintCategoryInput").getSelectedKey();
        
            // Validate the mandatory fields
            if (!sComplaintDesc || !sComplaintCategory) {
                MessageBox.error("Please fill in all mandatory fields."); 
                return; // Exit the function if validation fails
            }
        
            var ofModel = this.getView().getModel("FileModel");
            var ofData = ofModel.getData();
        
            if (ofData.items == null) {
                MessageBox.error("Please attach at least one file."); 
                return;
            }
            
            // Create an object with only the properties that need to be updated
            var oUpdateData = {
                ComplaintDesc: sComplaintDesc,
                ComplaintCategory: sComplaintCategory,
                ComplaintNumber: this.complaintNumber ,
                Status : status
            };
            console.log(oUpdateData);
        
            // Prepare the request URL
            // 07557707-df9d-4f21-a852-912e791b52fc.complaints.dashboard-0.0.1
            var serviceUrl = "/odata/v4/vendor";
            var sRequestUrl = serviceUrl + this.sSavedPath;
        
            // Make an HTTP PATCH request to update the entity
            $.ajax({
                url: sRequestUrl,
                type: "PATCH",
                contentType: "application/json",
                data: JSON.stringify(oUpdateData),
                success: function (data) {
                    console.log("Entity updated successfully:", data);
                    // Handle success response
                },
                error: function (error) {
                    console.error("Error updating entity:", error);
                    // Handle error response
                }
            });
        
            this.postFiles();
        },
        
        generateRandomNumber: function() {
            var min = 1000000; // Minimum 7-digit number
            var max = 9999999; // Maximum 7-digit number
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        
        
        

        _createEntity: function (item, itemNumber) {
            var oModel = this.getView().getModel("vendor");
            var oData = oModel.getData();

            var ofModel = this.getView().getModel("FileModel");
            var ofData = ofModel.getData();

            var data = {
                VendorNumber: oData.VendorNumber,
                ItemNumber: itemNumber,
                FileType: item.type,
                FileName: item.name
            };

            var settings = {
                url: "/odata/v4/vendor/Document",
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                data: JSON.stringify(data)
            };

            return new Promise((resolve, reject) => {
                $.ajax(settings)
                    .done((results, textStatus, request) => {
                        resolve(results.ID);
                        console.log("Posted")
                    })
                    .fail((err) => {
                        reject(err);
                    });
            });
        },
        
        _updateEntity: function (item, itemNumber,id ) {
            var oModel = this.getView().getModel("vendor");
            var oData = oModel.getData();

            var ofModel = this.getView().getModel("FileModel");
            var ofData = ofModel.getData();

            // var data = {
            //     ReferenceNumber: oData.ReferenceNumber,
            //     ItemNumber: itemNumber,
            //     FileType: item.type,
            //     FileName: item.name
            // };
            
            var reader = new FileReader();
            reader.onload = (e) => {
            var fileContent = e.target.result;
            var settings = {
                url: `/odata/v4/vendor/Document(${id})/content`,
                method: "PUT",
                headers: {
                    "Content-Type": item.type
                },
                processData: false, // Required for non-form-encoded data
                data: fileContent // Send the file content as data
            };

            $.ajax(settings)
                .done((results, textStatus, request) => {
                    console.log("Posted", results);
                })
                .fail((err) => {
                    console.error("Error posting file content:", err);
                });
        };

        // Read the file content as an ArrayBuffer
        reader.readAsArrayBuffer(item);
        },

        postFiles: function () {
            var that = this;
        
            // Show busy dialog
            var busyDialog = new sap.m.BusyDialog({
                title: "Please wait",
                text: "Posting files and data...",
                showCancelButton: false
            });
            busyDialog.open();
        
            var oModel = this.getView().getModel("FileModel");
            var oData = oModel.getData();
            console.log(oData)
        
            var createPromises = [];
        
            for (var i = 0; i < oData.items.length; i++) {
                var item = oData.items[i];
                createPromises.push(this._createEntity(item, i + 1));
            }
        
            Promise.all(createPromises)
                .then((ids) => {
                    var updatePromises = [];
        
                    for (var i = 0; i < oData.items.length; i++) {
                        var item = oData.items[i];
                        var id = ids[i];
                        updatePromises.push(this._updateEntity(item, i + 1, id));
                    }
        
                    return Promise.all(updatePromises);
                })
                .then(() => {
                    // Close busy dialog
                    busyDialog.close();
                    MessageBox.success(`Complaint Registered : ${this.complaintNumber}`, {
                        onClose: function() {
                            // Navigate to dashboard after OK button is pressed
                            that.onNavToDashboard();
                        }
                    });
                })
                .catch((error) => {
                    // Close busy dialog
                    busyDialog.close();
                    console.error("Error posting files:", error);
                    // Show error message
                    sap.m.MessageToast.show("Error posting files and data: " + error);
                });
        },

        onNavToDashboard: function() {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("TargetDashboard", {}, true);
        },
        
        _showMessageDialog: function (title, message) {
            MessageBox.information(
                message,
                {
                    title: title,
                    actions: [MessageBox.Action.OK]
                }
            );
        },
        

        post: function (oEvent) {
            var oSource = oEvent.getSource();
            var oBindingContext = oSource.getBindingContext("afileNames");
            var sPath = oBindingContext.getPath();
            var oitem = oBindingContext.getObject();
            
            var index = sPath.split("/").pop(); // Extract the index from the path

            var oModel = this.getView().getModel("FileModel");
            var oData = oModel.getData();
            var item = oData.items[index];
            console.log(item)

            this._createEntity(item, parseInt(index) + 1).then((id) => {
                this._updateEntity(item,parseInt(index) + 1, id)
                oitem.status = "completed";
                console.log(oitem)
                var oModel = this.getView().getModel("afileNames");
                var oData = oModel.getData();
                console.log(oData)
                this.getView().setModel(oModel, "afileNames");

            }).catch((err) => {
                MessageToast.show("Error creating document entity: " + err.message);
            });
        },

        

        _onObjectMatched: function(oEvent) {
            this.sSavedPath = decodeURIComponent(oEvent.getParameter("arguments").path);
            var oModel = this.getView().getModel();

            var oBinding = oModel.bindContext(this.sSavedPath);
            oBinding.requestObject().then(function(oData) {
                // Update each field in the model with the retrieved data
                var oViewModel = this.getView().getModel("vendor");
                oViewModel.setData(oData);
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
        },

        openDialog: async function () {
            this.oDialog ??= await this.loadFragment({
                name: "vendor.view.fileUpload",
            });
            this.getView().addDependent(this.oDialog);
            this.oDialog.open();

        },

        _openFile: function (oEvent) {
            var items = oEvent.getParameter("files");
            var oModel = this.getView().getModel("FileModel");
            var oData = oModel.getData();
            oData.items = items;
            console.log(items);
            var files = []
            var aFileNames = [];

            for (var i = 0; i < items.length; i++) {
                aFileNames.push({
                    name: items[i].name,
                    status: "Pending" // Initial status of each file
                });
            }
            // Convert file list to string
            var fileListString = files.join(", ");
            oData.fileNames = fileListString
            oData.aFileNames = aFileNames;
            console.log(oData.aFileNames)

            var oFileModel = new JSONModel({
                item: oData.aFileNames
            });
            this.getView().setModel(oFileModel, "afileNames");

            this.getView().byId("fileUploader").setEnabled(false)
            // valueState = "Success"
            this.getView().byId("fileUploader").setValueState(sap.ui.core.ValueState.Success)
        }
    });
});
