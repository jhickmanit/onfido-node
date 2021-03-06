import { AxiosInstance } from "axios";
import { Resource } from "../Resource";
export declare type SdkTokenRequest = {
    applicantId: string;
    applicationId?: string | null;
    referrer?: string | null;
};
export declare class SdkTokens extends Resource<SdkTokenRequest> {
    constructor(axiosInstance: AxiosInstance);
    generate(sdkTokenRequest: SdkTokenRequest): Promise<string>;
}
