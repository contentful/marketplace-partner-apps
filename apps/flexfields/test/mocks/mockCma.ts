const mockCma: any = {
  contentType: {
    get: () => new Promise((resolve, reject) => resolve({ fields: [] })),
    getMany: () => new Promise((resolve, reject) => resolve({ items: [] })),
  },
};

export { mockCma };
