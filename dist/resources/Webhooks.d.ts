import { AxiosInstance } from "axios";
import { Resource } from "../Resource";
export declare type WebhookRequest = {
    url?: string | null;
    enabled?: boolean;
    environments?: string[];
    events?: string[] | null;
};
export declare type Webhook = {
    id: string;
    url: string;
    enabled: boolean;
    events: string[];
    token: string;
    href: string;
};
export declare class Webhooks extends Resource<WebhookRequest> {
    constructor(axiosInstance: AxiosInstance);
    create(webhookRequest: WebhookRequest): Promise<Webhook>;
    find(id: string): Promise<Webhook>;
    update(id: string, webhookRequest: WebhookRequest): Promise<Webhook>;
    delete(id: string): Promise<void>;
    list(): Promise<Webhook[]>;
}
