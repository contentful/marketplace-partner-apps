import axios from "axios";
import { ApiClient } from "@/lib/ApiClients";
import { environment } from "@/lib/Constants";

jest.mock("axios");

describe("ApiClient", () => {
  it("should create an Axios instance with the default URL", () => {
    environment.NEXT_PUBLIC_API_ENDPOINT = "https://default-api.example.com";

    const axiosCreateMock = jest.spyOn(axios, "create");
    ApiClient();

    expect(axiosCreateMock).toHaveBeenCalledWith({
      baseURL: "https://default-api.example.com",
    });

    axiosCreateMock.mockRestore();
  });

  it("should create an Axios instance with a custom URL", () => {
    const customUrl = "https://custom-api.example.com";
    const axiosCreateMock = jest.spyOn(axios, "create");

    ApiClient(customUrl);

    expect(axiosCreateMock).toHaveBeenCalledWith({
      baseURL: customUrl,
    });

    axiosCreateMock.mockRestore();
  });

  it("should handle cases where the environment variable is not set", () => {
    // Clear the environment variable
    delete environment?.NEXT_PUBLIC_API_ENDPOINT;

    const axiosCreateMock = jest.spyOn(axios, "create");

    ApiClient();

    expect(axiosCreateMock).toHaveBeenCalledWith({
      baseURL: undefined,
    });

    environment.NEXT_PUBLIC_API_ENDPOINT = "https://default-api.example.com";

    axiosCreateMock.mockRestore();
  });
});
