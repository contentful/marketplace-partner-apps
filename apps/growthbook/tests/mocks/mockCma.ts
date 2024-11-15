const mockCma: any = {
  contentType: {
    get: jest.fn().mockResolvedValue({}),
    createWithId: jest.fn().mockResolvedValue({}),
    publish: jest.fn().mockResolvedValue({}),
  },
};

export { mockCma };
