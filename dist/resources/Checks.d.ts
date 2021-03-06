import { AxiosInstance } from "axios";
import { Resource } from "../Resource";
export declare type CheckRequest = {
    applicantId: string;
    reportNames: string[];
    applicantProvidesData?: boolean;
    asynchronous?: boolean;
    tags?: string[] | null;
    suppressFormEmails?: boolean;
    redirectUri?: string | null;
};
export declare type Check = {
    id: string;
    reportIds: string[];
    createdAt: string;
    href: string;
    applicantId: string;
    applicantProvidesData: boolean;
    status: string;
    tags: string[];
    result: string | null;
    formUri: string | null;
    redirectUri: string | null;
    resultsUri: string;
};
export declare class Checks extends Resource<CheckRequest> {
    constructor(axiosInstance: AxiosInstance);
    create(checkRequest: CheckRequest): Promise<Check>;
    find(id: string): Promise<Check>;
    list(applicantId: string): Promise<Check[]>;
    resume(id: string): Promise<void>;
}
