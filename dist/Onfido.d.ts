import { AxiosInstance } from "axios";
import { Addresses } from "./resources/Addresses";
import { Applicants } from "./resources/Applicants";
import { Extractions } from "./resources/Autofill";
import { Checks } from "./resources/Checks";
import { Documents } from "./resources/Documents";
import { LivePhotos } from "./resources/LivePhotos";
import { LiveVideos } from "./resources/LiveVideos";
import { Reports } from "./resources/Reports";
import { SdkTokens } from "./resources/SdkTokens";
import { Webhooks } from "./resources/Webhooks";
export declare enum Region {
    EU = "EU",
    US = "US"
}
export declare type OnfidoOptions = {
    apiToken: string;
    region?: Region;
    timeout?: number;
    unknownApiUrl?: string;
};
export declare class Onfido {
    readonly axiosInstance: AxiosInstance;
    readonly applicant: Applicants;
    readonly document: Documents;
    readonly livePhoto: LivePhotos;
    readonly liveVideo: LiveVideos;
    readonly check: Checks;
    readonly report: Reports;
    readonly address: Addresses;
    readonly webhook: Webhooks;
    readonly sdkToken: SdkTokens;
    readonly extractions: Extractions;
    constructor({ apiToken, region, timeout, unknownApiUrl }: OnfidoOptions);
}
