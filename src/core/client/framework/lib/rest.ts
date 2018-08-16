import merge from "lodash/merge";
import { Overwrite } from "talk-framework/types";

const buildOptions = (inputOptions: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
  };
  const options = merge({}, defaultOptions, inputOptions);
  if (options.method!.toLowerCase() !== "get") {
    options.body = JSON.stringify(options.body);
  }
  return options;
};

const handleResp = (res: Response) => {
  if (res.status > 399) {
    return res.text();
    // TODO (bc): sync error handling with server.
    // return res.json().then((err: any) => {
    //   const message = err.message || err.error || res.status;
    //   const error = new Error(message);
    //   throw error;
    // });
  } else if (res.status === 204) {
    return res.text();
  } else {
    return res.json();
  }
};

type PartialRequestInit = Overwrite<Partial<RequestInit>, { body?: any }>;

export class RestClient {
  public readonly uri: string;
  private tokenGetter?: () => string;

  constructor(uri: string, tokenGetter?: () => string) {
    this.uri = uri;
    this.tokenGetter = tokenGetter;
  }

  public fetch<T>(path: string, options: PartialRequestInit): Promise<T> {
    let opts = options;
    if (this.tokenGetter) {
      opts = merge({}, options, {
        headers: {
          Authorization: `Bearer ${this.tokenGetter()}`,
        },
      });
    }
    return fetch(`${this.uri}${path}`, buildOptions(opts)).then(handleResp);
  }
}
