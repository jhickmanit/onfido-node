import FormData from "form-data";
export declare type SimpleObject = {
    [key: string]: unknown;
};
export declare const convertObjectToSnakeCase: (requestBody: unknown) => unknown;
export declare const convertObjectToCamelCase: (responseBody: SimpleObject) => SimpleObject;
export declare const toFormData: (object: SimpleObject) => FormData;
