import axios from 'axios';
import { PassThrough, Readable } from 'stream';
import FormData from 'form-data';

class OnfidoError extends Error {
    constructor(message) {
        super(message);
        this.name = "OnfidoError";
    }
}

class OnfidoApiError extends OnfidoError {
    constructor(message, responseBody, statusCode, type, fields) {
        super(message);
        this.name = "OnfidoApiError";
        this.responseBody = responseBody;
        this.statusCode = statusCode;
        this.type = type;
        this.fields = fields;
    }
    static fromResponse(responseBody, statusCode) {
        const innerErrorData = responseBody instanceof Object ? responseBody.error : {};
        const innerError = innerErrorData instanceof Object ? innerErrorData : {};
        const type = `${innerError.type || "unknown"}`;
        const message = `${innerError.message || responseBody}`;
        const fields = innerError.fields;
        const fullMessage = `${message} (status code ${statusCode})` +
            (fields ? ` | ${JSON.stringify(fields)}` : "");
        return new OnfidoApiError(fullMessage, responseBody, statusCode, type, fields);
    }
    isClientError() {
        return this.statusCode < 500;
    }
}

const snakeCase = (s) => s.replace(/[A-Z]/g, char => `_${char.toLowerCase()}`);
const camelCase = (s) => s.replace(/_[a-z]/g, underscoreChar => underscoreChar[1].toUpperCase());
const deepMapObjectKeys = (value, f) => {
    if (!(value instanceof Object)) {
        return value;
    }
    else if (Array.isArray(value)) {
        return value.map(item => deepMapObjectKeys(item, f));
    }
    else {
        return Object.keys(value).reduce((acc, key) => {
            acc[f(key)] = deepMapObjectKeys(value[key], f);
            return acc;
        }, {});
    }
};
const convertObjectToSnakeCase = (requestBody) => {
    // Converting to JSON and back first handles things like dates, circular references etc.
    requestBody = JSON.parse(JSON.stringify(requestBody));
    return deepMapObjectKeys(requestBody, snakeCase);
};
const convertObjectToCamelCase = (responseBody) => deepMapObjectKeys(responseBody, camelCase);
const toFormData = (object) => {
    return Object.entries(object).reduce((formData, [key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(snakeCase(key), value);
        }
        return formData;
    }, new FormData());
};

class OnfidoDownload {
    constructor(incomingMessage) {
        this.incomingMessage = incomingMessage;
    }
    asStream() {
        // Use a PassThrough stream so the IncomingMessage isn't exposed.
        const passThroughStream = new PassThrough();
        this.incomingMessage.pipe(passThroughStream);
        return passThroughStream;
    }
    get contentType() {
        return this.incomingMessage.headers["content-type"];
    }
}

var Method;
(function (Method) {
    Method["GET"] = "get";
    Method["POST"] = "post";
    Method["PUT"] = "put";
    Method["DELETE"] = "delete";
})(Method || (Method = {}));
const isJson = (response) => (response.headers["content-type"] || "").includes("application/json");
const readFullStream = (stream) => new Promise((resolve) => {
    let all = "";
    stream.on("data", data => (all += data));
    stream.on("error", () => resolve("An error occurred reading the response"));
    stream.on("end", () => {
        // Try to parse as JSON, but fall back to just returning the raw text.
        try {
            resolve(JSON.parse(all));
        }
        catch (_a) {
            resolve(all);
        }
    });
});
const convertAxiosErrorToOnfidoError = async (error) => {
    if (!error.response) {
        return new OnfidoError(error.message || "An unknown error occurred making the request");
    }
    // Received a 4XX or 5XX response.
    const response = error.response;
    const data = response.data;
    // If we were downloading a file, we will have a stream instead of a string.
    const body = data instanceof Readable ? await readFullStream(data) : data;
    return OnfidoApiError.fromResponse(body, response.status);
};
const handleResponse = async (request) => {
    try {
        const response = await request;
        const data = response.data;
        return isJson(response) ? convertObjectToCamelCase(data) : data;
    }
    catch (error) {
        throw await convertAxiosErrorToOnfidoError(error);
    }
};
class Resource {
    constructor(name, axiosInstance) {
        this.name = name;
        this.axiosInstance = axiosInstance;
    }
    async request({ method, path = "", body, query }) {
        const request = this.axiosInstance({
            method,
            url: `${this.name}/${path}`,
            data: body && convertObjectToSnakeCase(body),
            params: query && convertObjectToSnakeCase(query)
        });
        return handleResponse(request);
    }
    async upload(body) {
        const formData = toFormData(body);
        const request = this.axiosInstance({
            method: Method.POST,
            url: `${this.name}/`,
            data: formData,
            headers: formData.getHeaders()
        });
        return handleResponse(request);
    }
    async download(path) {
        const request = this.axiosInstance({
            method: Method.GET,
            url: `${this.name}/${path}`,
            responseType: "stream",
            // Accept a response with any content type (e.g. image/png, application/pdf, video/mp4)
            headers: { Accept: "*/*" }
        });
        const stream = await handleResponse(request);
        return new OnfidoDownload(stream);
    }
}

class Addresses extends Resource {
    constructor(axiosInstance) {
        super("addresses", axiosInstance);
    }
    async pick(postcode) {
        const { addresses } = await this.request({
            method: Method.GET,
            path: "pick",
            query: { postcode }
        });
        return addresses;
    }
}

class Applicants extends Resource {
    constructor(axiosInstance) {
        super("applicants", axiosInstance);
    }
    async create(applicantRequest) {
        return this.request({ method: Method.POST, body: applicantRequest });
    }
    async find(id) {
        return this.request({ method: Method.GET, path: id });
    }
    async update(id, applicantRequest) {
        return this.request({
            method: Method.PUT,
            path: id,
            body: applicantRequest
        });
    }
    async delete(id) {
        await this.request({ method: Method.DELETE, path: id });
    }
    async restore(id) {
        await this.request({ method: Method.POST, path: `${id}/restore` });
    }
    async list({ page, perPage, includeDeleted } = {}) {
        const { applicants } = await this.request({
            method: Method.GET,
            query: { page, perPage, includeDeleted }
        });
        return applicants;
    }
}

class Checks extends Resource {
    constructor(axiosInstance) {
        super("checks", axiosInstance);
    }
    async create(checkRequest) {
        return this.request({ method: Method.POST, body: checkRequest });
    }
    async find(id) {
        return this.request({ method: Method.GET, path: id });
    }
    async list(applicantId) {
        const { checks } = await this.request({
            method: Method.GET,
            query: { applicantId }
        });
        return checks;
    }
    async resume(id) {
        await this.request({ method: Method.POST, path: `${id}/resume` });
    }
}

class Documents extends Resource {
    constructor(axiosInstance) {
        super("documents", axiosInstance);
    }
    async upload(documentRequest) {
        return super.upload(documentRequest);
    }
    async download(id) {
        return super.download(`${id}/download`);
    }
    async find(id) {
        return this.request({ method: Method.GET, path: id });
    }
    async list(applicantId) {
        const { documents } = await this.request({
            method: Method.GET,
            query: { applicantId }
        });
        return documents;
    }
}

class LivePhotos extends Resource {
    constructor(axiosInstance) {
        super("live_photos", axiosInstance);
    }
    async upload(livePhotoRequest) {
        return super.upload(livePhotoRequest);
    }
    async download(id) {
        return super.download(`${id}/download`);
    }
    async find(id) {
        return this.request({ method: Method.GET, path: id });
    }
    async list(applicantId) {
        const { livePhotos } = await this.request({
            method: Method.GET,
            query: { applicantId }
        });
        return livePhotos;
    }
}

class LiveVideos extends Resource {
    constructor(axiosInstance) {
        super("live_videos", axiosInstance);
    }
    async download(id) {
        return super.download(`${id}/download`);
    }
    async frame(id) {
        return super.download(`${id}/frame`);
    }
    async find(id) {
        return this.request({ method: Method.GET, path: id });
    }
    async list(applicantId) {
        const { liveVideos } = await this.request({
            method: Method.GET,
            query: { applicantId }
        });
        return liveVideos;
    }
}

class Reports extends Resource {
    constructor(axiosInstance) {
        super("reports", axiosInstance);
    }
    async find(id) {
        return this.request({ method: Method.GET, path: id });
    }
    async list(checkId) {
        const { reports } = await this.request({
            method: Method.GET,
            query: { checkId }
        });
        return reports;
    }
    async resume(id) {
        await this.request({ method: Method.POST, path: `${id}/resume` });
    }
    async cancel(id) {
        await this.request({ method: Method.POST, path: `${id}/cancel` });
    }
}

class SdkTokens extends Resource {
    constructor(axiosInstance) {
        super("sdk_token", axiosInstance);
    }
    async generate(sdkTokenRequest) {
        const { token } = await this.request({
            method: Method.POST,
            body: sdkTokenRequest
        });
        return token;
    }
}

class Webhooks extends Resource {
    constructor(axiosInstance) {
        super("webhooks", axiosInstance);
    }
    async create(webhookRequest) {
        return this.request({ method: Method.POST, body: webhookRequest });
    }
    async find(id) {
        return this.request({ method: Method.GET, path: id });
    }
    async update(id, webhookRequest) {
        return this.request({
            method: Method.PUT,
            path: id,
            body: webhookRequest
        });
    }
    async delete(id) {
        await this.request({ method: Method.DELETE, path: id });
    }
    async list() {
        const { webhooks } = await this.request({ method: Method.GET });
        return webhooks;
    }
}

var Region;
(function (Region) {
    Region["EU"] = "EU";
    Region["US"] = "US";
})(Region || (Region = {}));
const apiUrls = {
    [Region.EU]: "https://api.onfido.com/v3/",
    [Region.US]: "https://api.us.onfido.com/v3/"
};
class Onfido {
    constructor({ apiToken, region = Region.EU, timeout = 30000, unknownApiUrl }) {
        if (!apiToken) {
            throw new Error("No apiToken provided");
        }
        const regionUrl = apiUrls[region];
        if (!regionUrl) {
            throw new Error("Unknown region " + region);
        }
        this.axiosInstance = axios.create({
            baseURL: unknownApiUrl || regionUrl,
            headers: {
                Authorization: `Token token=${apiToken}`,
                Accept: "application/json"
            },
            timeout
        });
        // Core resources
        this.applicant = new Applicants(this.axiosInstance);
        this.document = new Documents(this.axiosInstance);
        this.livePhoto = new LivePhotos(this.axiosInstance);
        this.liveVideo = new LiveVideos(this.axiosInstance);
        this.check = new Checks(this.axiosInstance);
        this.report = new Reports(this.axiosInstance);
        // Other endpoints
        this.address = new Addresses(this.axiosInstance);
        this.webhook = new Webhooks(this.axiosInstance);
        this.sdkToken = new SdkTokens(this.axiosInstance);
    }
}

// Require crypto instead of importing, because Node can be built without crypto support.
let crypto;
try {
    // tslint:disable-next-line: no-var-requires
    crypto = require("crypto");
}
catch (_a) {
    // We throw an error when verifying webhooks instead.
}
class WebhookEventVerifier {
    constructor(webhookToken) {
        this.webhookToken = webhookToken;
    }
    readPayload(rawEventBody, hexSignature) {
        if (!crypto) {
            throw new Error("Verifying webhook events requires crypto support");
        }
        const givenSignature = Buffer.from(hexSignature, "hex");
        // Compute the the actual HMAC signature from the raw request body.
        const hmac = crypto.createHmac("sha256", this.webhookToken);
        hmac.update(rawEventBody);
        const eventSignature = hmac.digest();
        // Use timingSafeEqual to prevent against timing attacks.
        if (!crypto.timingSafeEqual(givenSignature, eventSignature)) {
            throw new OnfidoError("Invalid signature for webhook event");
        }
        const { payload } = JSON.parse(rawEventBody.toString());
        return convertObjectToCamelCase(payload);
    }
}

export { Onfido, OnfidoApiError, OnfidoDownload, OnfidoError, Region, WebhookEventVerifier };
//# sourceMappingURL=index.es.js.map
