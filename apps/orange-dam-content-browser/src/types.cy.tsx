/// <reference types="cypress" />
import { MediaType, DialogsInitiator } from './types'

describe('Types and Enums', () => {
  it('should have correct MediaType enum values', () => {
    // Execute and validate each enum value
    expect(MediaType.Album).to.equal('Album')
    expect(MediaType.Audio).to.equal('Audio')
    expect(MediaType.Image).to.equal('Image')
    expect(MediaType.Multimedia).to.equal('Multimedia')
    expect(MediaType.Story).to.equal('Story')
    expect(MediaType.Video).to.equal('Video')
    expect(MediaType.Widget).to.equal('Widget')
    
    // Execute enum as object and validate properties
    const mediaTypeKeys = Object.keys(MediaType)
    const mediaTypeValues = Object.values(MediaType)
    
    expect(mediaTypeKeys).to.have.length.greaterThan(0)
    expect(mediaTypeValues).to.have.length.greaterThan(0)
    expect(mediaTypeKeys).to.include('Album')
    expect(mediaTypeKeys).to.include('Video')
    expect(mediaTypeValues).to.include('Album')
    expect(mediaTypeValues).to.include('Video')
  })

  it('should have correct DialogsInitiator enum values', () => {
    // Execute and validate each enum value
    expect(DialogsInitiator.AssetCard).to.equal('asset-card')
    expect(DialogsInitiator.AssetImporter).to.equal('asset-importer')
    
    // Execute enum operations
    const initiatorKeys = Object.keys(DialogsInitiator)
    const initiatorValues = Object.values(DialogsInitiator)
    
    expect(initiatorKeys).to.have.length(2)
    expect(initiatorValues).to.have.length(2)
    expect(initiatorKeys).to.include('AssetCard')
    expect(initiatorKeys).to.include('AssetImporter')
    expect(initiatorValues).to.include('asset-card')
    expect(initiatorValues).to.include('asset-importer')
  })

  it('should validate MediaType string values', () => {
    const mediaTypes = Object.values(MediaType)
    expect(mediaTypes).to.include('Album')
    expect(mediaTypes).to.include('Audio')
    expect(mediaTypes).to.include('Image')
    expect(mediaTypes).to.include('Multimedia')
    expect(mediaTypes).to.include('Story')
    expect(mediaTypes).to.include('Video')
    expect(mediaTypes).to.include('Widget')
    expect(mediaTypes).to.have.length(7)
  })

  it('should validate DialogsInitiator string values', () => {
    const initiatorTypes = Object.values(DialogsInitiator)
    expect(initiatorTypes).to.include('asset-card')
    expect(initiatorTypes).to.include('asset-importer')
    expect(initiatorTypes).to.have.length(2)
  })

  it('should support type checking for MediaType', () => {
    const isValidMediaType = (value: string): value is MediaType => {
      return Object.values(MediaType).includes(value as MediaType)
    }

    expect(isValidMediaType('Image')).to.be.true
    expect(isValidMediaType('Video')).to.be.true
    expect(isValidMediaType('Audio')).to.be.true
    expect(isValidMediaType('InvalidType')).to.be.false
    expect(isValidMediaType('')).to.be.false
  })

  it('should support type checking for DialogsInitiator', () => {
    const isValidInitiator = (value: string): value is DialogsInitiator => {
      return Object.values(DialogsInitiator).includes(value as DialogsInitiator)
    }

    expect(isValidInitiator('asset-card')).to.be.true
    expect(isValidInitiator('asset-importer')).to.be.true
    expect(isValidInitiator('invalid-initiator')).to.be.false
    expect(isValidInitiator('')).to.be.false
  })

  it('should handle enum comparison operations', () => {
    // Test enum equality
    expect(MediaType.Image === 'Image').to.be.true
    expect(MediaType.Video === 'Video').to.be.true
    expect(DialogsInitiator.AssetCard === 'asset-card').to.be.true
    expect(DialogsInitiator.AssetImporter === 'asset-importer').to.be.true

    // Test enum inequality
    expect(MediaType.Image).to.not.equal(MediaType.Video)
    expect(DialogsInitiator.AssetCard).to.not.equal(DialogsInitiator.AssetImporter)
  })

  it('should support switch case scenarios', () => {
    const getMediaDescription = (mediaType: MediaType): string => {
      switch (mediaType) {
        case MediaType.Image:
          return 'Static image file'
        case MediaType.Video:
          return 'Video file with motion'
        case MediaType.Audio:
          return 'Audio file'
        case MediaType.Album:
          return 'Collection of media'
        case MediaType.Story:
          return 'Story content'
        case MediaType.Widget:
          return 'Interactive widget'
        case MediaType.Multimedia:
          return 'Mixed media content'
        default:
          return 'Unknown media type'
      }
    }

    expect(getMediaDescription(MediaType.Image)).to.equal('Static image file')
    expect(getMediaDescription(MediaType.Video)).to.equal('Video file with motion')
    expect(getMediaDescription(MediaType.Audio)).to.equal('Audio file')
    expect(getMediaDescription(MediaType.Album)).to.equal('Collection of media')
  })
})
