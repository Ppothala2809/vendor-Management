namespace sap.cap;

using {cuid , managed} from '@sap/cds/common';

entity Vendor : cuid ,managed{
    VendorNumber        : String(10);
    VendorFirstName     : String(100);
    VendorLastName      : String(100);
    VendorEmail         : String(100);
    VendorPhoneNumber   : String(20);
    PONumber      : String(20);
    PurchasingGrp : String(20);
    InvoiceNumber : String(30);
    PODescription : String(200);
    ComplaintDesc                : String(400);
    ComplaintCategory            : String enum {
            WrongTDS;
            DelayInPayments;
        };
    ComplaintNumber        : String(10);
    Status           : String enum {
            Completed;
            In_Progress;
        };
    Documents           : Association to many Document
                              on Documents.VendorNumber = VendorNumber;
}

entity Document : cuid {
    VendorNumber : String(10);

    @Core.MediaType  : FileType
    content      : LargeBinary;

    @Core.IsMediaType: true
    FileType     : String;
    FileName     : String;
    ItemNumber   : Integer;
}
