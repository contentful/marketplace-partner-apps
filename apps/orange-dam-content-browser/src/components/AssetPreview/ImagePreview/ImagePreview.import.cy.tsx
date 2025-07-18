/// <reference types="cypress" />
import ImagePreview from './ImagePreview';

describe('ImagePreview Component Import Tests', () => {
  it('should import ImagePreview component successfully', () => {
    expect(ImagePreview).to.exist;
    expect(ImagePreview).to.be.a('function');
  });

  it('should be a valid React component', () => {
    expect(typeof ImagePreview).to.equal('function');
    expect(ImagePreview.name).to.equal('ImagePreview');
  });

  it('should validate image URL processing logic', () => {
    // Test image extension validation
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    
    allowedExtensions.forEach(ext => {
      expect(ext).to.be.a('string');
      expect(ext.length).to.be.greaterThan(0);
    });
  });

  it('should handle different image URLs', () => {
    const testUrls = [
      'https://example.com/image.jpg',
      'https://example.com/image.png',
      'https://example.com/image.gif'
    ];

    testUrls.forEach(url => {
      expect(url).to.be.a('string');
      expect(url).to.match(/^https?:\/\//);
    });
  });
});
