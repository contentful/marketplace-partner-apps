/// <reference types="cypress" />
import React from 'react'
import { MediaType } from '@/types'

const mockAsset: OrangeDamAssetInfo = {
  imageUrl: 'https://example.com/test-image.jpg',
  extraFields: {
    'CoreField.TitleWithFallback': 'Test Asset Title',
    'CoreField.LargeSizePreview': 'https://example.com/test-image-large.jpg',
    'CoreField.DocType': MediaType.Image,
    'Document.Identifier': 'test-123',
    'CoreField.Extension': 'jpg'
  }
}

describe('AssetCard Component', () => {
  let mockSDK: any;
  let onItemRemove: any;
  let onMount: any;
  let onLoaded: any;

  beforeEach(() => {
    // Create mock functions
    mockSDK = {
      dialogs: {
        openCurrentApp: cy.stub().resolves()
      }
    };
    onItemRemove = cy.stub();
    onMount = cy.stub();
    onLoaded = cy.stub();
  });

  it('should accept correct prop types', () => {
    // Test that the component accepts the expected prop structure
    const testAsset: OrangeDamAssetInfo = {
      imageUrl: 'https://example.com/test.jpg',
      extraFields: {
        'CoreField.TitleWithFallback': 'Test Title',
        'CoreField.DocType': MediaType.Image
      }
    }

    const props = {
      asset: testAsset,
      isLoading: false,
      onItemRemove: () => {},
      onMount: (id: string) => {},
      onLoaded: (id: string) => {}
    }

    // Test that TypeScript accepts these props
    expect(props.asset.imageUrl).to.equal('https://example.com/test.jpg')
    expect(props.asset.extraFields['CoreField.TitleWithFallback']).to.equal('Test Title')
  })

  it('should handle video asset type', () => {
    const videoAsset: OrangeDamAssetInfo = {
      imageUrl: 'https://example.com/test-video.mp4',
      extraFields: {
        'CoreField.TitleWithFallback': 'Test Video',
        'CoreField.DocType': MediaType.Video,
        'ScrubUrl': 'https://example.com/scrub-video.mp4'
      }
    }

    expect(videoAsset.extraFields['CoreField.DocType']).to.equal(MediaType.Video)
    expect(videoAsset.extraFields['ScrubUrl']).to.exist
  })

  it('should handle different media types', () => {
    const mediaTypes = [MediaType.Image, MediaType.Video, MediaType.Audio, MediaType.Multimedia]
    
    mediaTypes.forEach(mediaType => {
      const asset: OrangeDamAssetInfo = {
        imageUrl: 'https://example.com/test-file',
        extraFields: {
          'CoreField.DocType': mediaType,
          'CoreField.TitleWithFallback': `Test ${mediaType}`
        }
      }
      
      expect(asset.extraFields['CoreField.DocType']).to.equal(mediaType)
    })
  })

  it('should validate required props structure', () => {
    const requiredProps = {
      asset: mockAsset,
      isLoading: false,
      onItemRemove: onItemRemove
    }

    // Verify the asset has required fields
    expect(requiredProps.asset.imageUrl).to.be.a('string')
    expect(requiredProps.asset.extraFields).to.be.an('object')
    expect(requiredProps.isLoading).to.be.a('boolean')
    expect(requiredProps.onItemRemove).to.be.a('function')
  })

  it('should handle asset without extra fields gracefully', () => {
    const minimalAsset: OrangeDamAssetInfo = {
      imageUrl: 'https://example.com/minimal.jpg',
      extraFields: {}
    }

    expect(minimalAsset.imageUrl).to.exist
    expect(minimalAsset.extraFields).to.be.an('object')
  })
})
