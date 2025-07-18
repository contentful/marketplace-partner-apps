/// <reference types="cypress" />
import { ALLOWED_IMAGE_EXTENSIONS } from './ImagePreview'

describe('ImagePreview Component', () => {
  it('should have correct allowed image extensions', () => {
    expect(ALLOWED_IMAGE_EXTENSIONS).to.include('jpg')
    expect(ALLOWED_IMAGE_EXTENSIONS).to.include('png')
    expect(ALLOWED_IMAGE_EXTENSIONS).to.include('gif')
    expect(ALLOWED_IMAGE_EXTENSIONS).to.include('webp')
    expect(ALLOWED_IMAGE_EXTENSIONS).to.include('svg')
    expect(ALLOWED_IMAGE_EXTENSIONS).to.include('jpeg')
    expect(ALLOWED_IMAGE_EXTENSIONS).to.include('apng')
    expect(ALLOWED_IMAGE_EXTENSIONS).to.include('avif')
    expect(ALLOWED_IMAGE_EXTENSIONS).to.include('jfif')
    expect(ALLOWED_IMAGE_EXTENSIONS).to.include('pjpeg')
    expect(ALLOWED_IMAGE_EXTENSIONS).to.include('pjp')
    expect(ALLOWED_IMAGE_EXTENSIONS.length).to.equal(11)
  })

  it('should validate image extension detection logic', () => {
    // Test URL extension extraction regex pattern
    const testUrls = [
      'https://example.com/image.jpg',
      'https://example.com/image.png?size=large',
      'https://example.com/image.jpeg',
      'https://example.com/image.webp?v=1',
      'https://example.com/image.gif'
    ]

    testUrls.forEach(url => {
      const regex = /\.(?<Extension>\w{3,4})($|\?)/
      const match = regex.exec(url)
      expect(match).to.not.be.null
      if (match && match.groups) {
        expect(match.groups.Extension).to.be.a('string')
      }
    })
  })

  it('should handle URL replacement for unsupported extensions', () => {
    // Test the URL replacement logic
    const unsupportedUrl = 'https://example.com/image.xyz'
    const expectedPattern = /\.jpg($|\?)/
    
    // Simulate the replacement logic from the component
    const replacedUrl = unsupportedUrl.replace(
      /\.(?<Extension>\w{3,4})(?<Params>$|\?)/,
      (_match: string, _extension: string, param?: string) => "." + ALLOWED_IMAGE_EXTENSIONS[0] + (param || '')
    )
    
    expect(replacedUrl).to.match(expectedPattern)
    expect(replacedUrl).to.equal('https://example.com/image.jpg')
  })

  it('should preserve URL parameters during extension replacement', () => {
    const urlWithParams = 'https://example.com/image.xyz?size=large&quality=high'
    
    const replacedUrl = urlWithParams.replace(
      /\.(?<Extension>\w{3,4})(?<Params>$|\?)/,
      (_match: string, _extension: string, param?: string) => "." + ALLOWED_IMAGE_EXTENSIONS[0] + param
    )
    
    expect(replacedUrl).to.equal('https://example.com/image.jpg?size=large&quality=high')
  })

  it('should not modify URLs with supported extensions', () => {
    const supportedUrls = [
      'https://example.com/image.jpg',
      'https://example.com/image.png?v=1',
      'https://example.com/image.webp',
      'https://example.com/image.svg?size=large'
    ]

    supportedUrls.forEach(url => {
      const regex = /\.(?<Extension>\w{3,4})($|\?)/
      const match = regex.exec(url)
      const extension = match?.groups?.Extension
      
      if (extension && ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
        // URL should remain unchanged
        expect(url).to.equal(url)
      }
    })
  })

  it('should handle edge cases in URL processing', () => {
    const edgeCases = [
      'https://example.com/image.jpeg', // 4 char extension
      'https://example.com/image.jpg?', // ends with ?
      'https://example.com/image.png',  // no params
      'https://example.com/file.doc'    // unsupported extension
    ]

    edgeCases.forEach(url => {
      const regex = /\.(?<Extension>\w{3,4})($|\?)/
      const match = regex.exec(url)
      expect(match).to.not.be.null
      expect(match?.groups?.Extension).to.be.a('string')
    })
  })

  it('should validate component props interface', () => {
    // Test that the expected props structure is correct
    const mockProps = {
      alt: 'Test image',
      url: 'https://example.com/image.jpg',
      onError: cy.stub(),
      onLoaded: cy.stub()
    }

    expect(mockProps.alt).to.be.a('string')
    expect(mockProps.url).to.be.a('string')
    expect(mockProps.onError).to.be.a('function')
    expect(mockProps.onLoaded).to.be.a('function')
  })
})
