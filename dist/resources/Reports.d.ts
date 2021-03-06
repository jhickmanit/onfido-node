import { AxiosInstance } from "axios";
import { Resource } from "../Resource";
export declare type Report = {
    id: string;
    createdAt: string;
    name: string;
    href: string;
    status: string;
    result: string | null;
    subResult: string | null;
    properties: object | null;
    breakdown: object | null;
    documents?: string[] | null;
};
export declare class Reports extends Resource<never> {
    constructor(axiosInstance: AxiosInstance);
    find(id: string): Promise<Report>;
    list(checkId: string): Promise<Report[]>;
    resume(id: string): Promise<void>;
    cancel(id: string): Promise<void>;
}
