import '@testing-library/jest-dom/extend-expect';

global.matchMedia =
  global.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  };

global.HTMLCanvasElement.prototype.getContext = () => null;

jest.mock('jspdf', () => {
  return {
    jsPDF: jest.fn().mockImplementation(() => ({
      addImage: jest.fn(),
      save: jest.fn(),
    })),
  };
});
