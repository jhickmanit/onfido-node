/// <reference types="node" />
import { AxiosInstance } from "axios";
import { ReadStream } from "fs";
import { OnfidoDownload } from "../OnfidoDownload";
import { Resource } from "../Resource";
export declare type DocumentRequest = {
    applicantId?: string | null;
    file: ReadStream;
    type: string;
    side?: string | null;
    issuingCountry?: string | null;
};
export declare type Document = {
    id: string;
    applicantId: string | null;
    createdAt: string;
    href: string;
    downloadHref: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    type: string;
    side: string | null;
    issuingCountry: string | null;
};
export declare class Documents extends Resource<DocumentRequest> {
    constructor(axiosInstance: AxiosInstance);
    upload(documentRequest: DocumentRequest): Promise<Document>;
    download(id: string): Promise<OnfidoDownload>;
    find(id: string): Promise<Document>;
    list(applicantId: string): Promise<Document[]>;
}
