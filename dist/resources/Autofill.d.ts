import { AxiosInstance } from "axios";
import { Resource } from "../Resource";
export declare type ExtractionRequest = {
    documentId?: string | null;
};
export declare type Extraction = {
    documentId?: string | null;
    documentClassification?: DocumentClassification | null;
    extractedData?: ExtractedData | null;
};
export declare type DocumentClassification = {
    issuingCountry?: string | null;
    documentType?: string | null;
    issuingState?: string | null;
};
export declare type ExtractedData = {
    firstName?: string | null;
    lastName?: string | null;
    middleName?: string | null;
    fullName?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    dateOfExpiry?: string | null;
    nationality?: string | null;
    mrzLine1?: string | null;
    mrzLine2?: string | null;
    mrzLine3?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    addressLine3?: string | null;
    addressLine4?: string | null;
    addressLine5?: string | null;
};
export declare class Extractions extends Resource<ExtractionRequest> {
    constructor(axiosInstance: AxiosInstance);
    extract(extractionRequest: ExtractionRequest): Promise<Extraction>;
}
