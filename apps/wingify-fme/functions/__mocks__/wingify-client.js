const mockCreateFeatureFlag = jest.fn();
const mockGetFeatureFlagById = jest.fn();
const mockUpdateFeatureFlag = jest.fn();
const mockUpdateVariations = jest.fn();

function WingifyClient() {
  this.createFeatureFlag = mockCreateFeatureFlag;
  this.getFeatureFlagById = mockGetFeatureFlagById;
  this.updateFeatureFlag = mockUpdateFeatureFlag;
  this.updateVariations = mockUpdateVariations;
}

module.exports = {
  __esModule: true,
  default: WingifyClient,
  mockCreateFeatureFlag,
  mockGetFeatureFlagById,
  mockUpdateFeatureFlag,
  mockUpdateVariations,
};
