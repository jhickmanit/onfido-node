/// <reference types="node" />
import { AxiosInstance } from "axios";
import { ReadStream } from "fs";
import { OnfidoDownload } from "../OnfidoDownload";
import { Resource } from "../Resource";
export declare type LivePhotoRequest = {
    applicantId: string;
    file: ReadStream;
    advancedValidation?: boolean;
};
export declare type LivePhoto = {
    id: string;
    createdAt: string;
    href: string;
    downloadHref: string;
    fileName: string;
    fileType: string;
    fileSize: number;
};
export declare class LivePhotos extends Resource<LivePhotoRequest> {
    constructor(axiosInstance: AxiosInstance);
    upload(livePhotoRequest: LivePhotoRequest): Promise<LivePhoto>;
    download(id: string): Promise<OnfidoDownload>;
    find(id: string): Promise<LivePhoto>;
    list(applicantId: string): Promise<LivePhoto[]>;
}
