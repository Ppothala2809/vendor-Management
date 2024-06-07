using {sap.cap as my} from '../db/schema';


service VendorService  {
    entity Vendor as projection on my.Vendor;
    entity Document as projection on my.Document;
};